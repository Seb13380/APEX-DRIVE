// supabase/functions/webhook-note-entrante/index.ts
//
// Flux : audio -> transcription (Whisper) -> GPT (résumé + tâche) -> écriture Supabase -> callback UI
//
// Déclenchement : appelé par le frontend juste après l'upload d'un fichier audio
// dans le bucket privé "notes-audio" (chemin: {user_id}/{uuid}.webm).
//
// Body attendu (JSON):
// {
//   "audio_path": "user_id/xxxx.webm",   // chemin dans le bucket notes-audio
//   "client_id": "uuid" | null            // client concerné, optionnel
// }
//
// La réponse contient la note créée + la tâche générée (le "callback UI" est la
// réponse HTTP elle-même, complétée par un événement Realtime Postgres sur la
// table `notes` que le frontend écoute déjà).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

interface ExtractionGPT {
  resume: string;
  tache: {
    titre: string;
    priorite: "basse" | "normale" | "haute";
    echeance: string | null; // ISO 8601 ou null
  } | null;
  fiche_client: {
    statut_lead: "chaud" | "tiede" | "froid" | null;
    objections: string | null;
    budget: number | null;
  } | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Non authentifié" }, 401);
    }

    const { audio_path, client_id } = await req.json();
    if (!audio_path) {
      return json({ error: "audio_path manquant" }, 400);
    }

    // Client Supabase avec le token de l'utilisateur (respecte les policies RLS)
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    // Client admin pour les opérations qui nécessitent le service role (download storage)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return json({ error: "Utilisateur invalide" }, 401);
    }

    // 1. Télécharger l'audio depuis le bucket privé
    const { data: audioBlob, error: downloadError } = await supabaseAdmin.storage
      .from("notes-audio")
      .download(audio_path);
    if (downloadError || !audioBlob) {
      return json({ error: `Téléchargement audio impossible: ${downloadError?.message}` }, 500);
    }

    // 2. Transcription via Whisper (OpenAI)
    const transcription = await transcrireAudio(audioBlob);

    // 3. Résumé + extraction structurée via GPT
    const extraction = await analyserTranscription(transcription);

    // 4. Écriture en base (respecte RLS car on utilise le client "user")
    const { data: note, error: noteError } = await supabaseUser
      .from("notes")
      .insert({
        user_id: user.id,
        client_id: client_id ?? null,
        audio_url: audio_path,
        transcription,
        resume: extraction.resume,
      })
      .select()
      .single();
    if (noteError) {
      return json({ error: `Écriture note impossible: ${noteError.message}` }, 500);
    }

    let tache = null;
    if (extraction.tache) {
      const { data: tacheData, error: tacheError } = await supabaseUser
        .from("taches")
        .insert({
          user_id: user.id,
          client_id: client_id ?? null,
          note_id: note.id,
          titre: extraction.tache.titre,
          priorite: extraction.tache.priorite,
          echeance: extraction.tache.echeance,
        })
        .select()
        .single();
      if (!tacheError) tache = tacheData;
    }

    if (client_id && extraction.fiche_client) {
      const updates: Record<string, unknown> = {};
      if (extraction.fiche_client.statut_lead) updates.statut_lead = extraction.fiche_client.statut_lead;
      if (extraction.fiche_client.objections) updates.objections = extraction.fiche_client.objections;
      if (extraction.fiche_client.budget) updates.budget = extraction.fiche_client.budget;
      if (Object.keys(updates).length > 0) {
        await supabaseUser.from("clients").update(updates).eq("id", client_id);
      }
    }

    // Le frontend, abonné aux changements Realtime sur `notes`/`taches`, est notifié
    // automatiquement en plus de la réponse HTTP ci-dessous.
    return json({ note, tache }, 200);
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message ?? "Erreur inconnue" }, 500);
  }
});

async function transcrireAudio(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", audio, "note.webm");
  form.append("model", "whisper-1");
  form.append("language", "fr");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Whisper a échoué: ${await res.text()}`);
  }
  const data = await res.json();
  return data.text as string;
}

async function analyserTranscription(transcription: string): Promise<ExtractionGPT> {
  const systemPrompt = `Tu es l'assistant d'un commercial automobile. À partir de la
transcription d'une note vocale, produis un JSON strict avec:
- resume: résumé court (2-3 phrases) de la note
- tache: une tâche à créer si pertinent ({titre, priorite: basse|normale|haute, echeance: ISO8601 ou null}), sinon null
- fiche_client: mise à jour de fiche client si pertinent ({statut_lead: chaud|tiede|froid|null, objections: string|null, budget: number|null}), sinon null
Réponds uniquement avec le JSON, sans texte autour.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcription },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    throw new Error(`GPT a échoué: ${await res.text()}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content) as ExtractionGPT;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
