"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Etat = "idle" | "recording" | "envoi" | "succes" | "erreur";

export default function AssistantPage() {
    const [etat, setEtat] = useState<Etat>("idle");
    const [message, setMessage] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    async function demarrerEnregistrement() {
        setMessage(null);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorder.onstop = () => envoyerNote(new Blob(chunksRef.current, { type: "audio/webm" }));
        recorder.start();
        mediaRecorderRef.current = recorder;
        setEtat("recording");
    }

    function arreterEnregistrement() {
        mediaRecorderRef.current?.stop();
        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    }

    async function envoyerNote(audio: Blob) {
        setEtat("envoi");
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setEtat("erreur");
            setMessage("Utilisateur non connecté.");
            return;
        }

        const chemin = `${user.id}/${crypto.randomUUID()}.webm`;
        const { error: uploadError } = await supabase.storage
            .from("notes-audio")
            .upload(chemin, audio, { contentType: "audio/webm" });

        if (uploadError) {
            setEtat("erreur");
            setMessage(`Échec de l'upload : ${uploadError.message}`);
            return;
        }

        // Le bucket est privé : on génère une URL signée temporaire pour que n8n
        // puisse télécharger l'audio sans avoir besoin des clés Supabase.
        const { data: urlSignee, error: urlError } = await supabase.storage
            .from("notes-audio")
            .createSignedUrl(chemin, 600);

        if (urlError || !urlSignee) {
            setEtat("erreur");
            setMessage(`Échec de génération de l'URL audio : ${urlError?.message}`);
            return;
        }

        const res = await fetch("https://ton-n8n.exemple.com/webhook/note-entrante", {
            method: "POST",
            body: JSON.stringify({ audio_url: urlSignee.signedUrl, client_id: null, user_id: user.id }),
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
            setEtat("erreur");
            setMessage("Échec du traitement IA.");
            return;
        }
        const data = await res.json();

        setEtat("succes");
        setMessage(data?.note?.resume ?? "Note traitée avec succès.");
    }

    return (
        <div className="content" style={{ paddingTop: 26 }}>
            <div className="panel" style={{ maxWidth: 520 }}>
                <div className="panel-head"><h3>Assistant IA</h3><span className="new-tag">Nouveau</span></div>

                <button
                    type="button"
                    className={`ai-mic${etat === "recording" ? " recording" : ""}`}
                    onClick={etat === "recording" ? arreterEnregistrement : demarrerEnregistrement}
                    disabled={etat === "envoi"}
                >
                    <div className="dot3" />
                    <span>
                        {etat === "idle" && "Dicte ta note vocale, je m'occupe du reste…"}
                        {etat === "recording" && "Enregistrement en cours… clique pour arrêter"}
                        {etat === "envoi" && "Transcription et analyse en cours…"}
                        {etat === "succes" && "Terminé — clique pour recommencer"}
                        {etat === "erreur" && "Erreur — clique pour réessayer"}
                    </span>
                </button>

                {message && (
                    <p className="empty-hint" style={{ color: etat === "erreur" ? "#e0715a" : "var(--good)" }}>
                        {message}
                    </p>
                )}

                <div className="ai-actions">
                    <div className="a">▤ Résumer un RDV</div>
                    <div className="a">✓ Créer une tâche</div>
                    <div className="a">✉ Rédiger un email</div>
                    <div className="a">◔ Analyser un lead</div>
                </div>
            </div>
        </div>
    );
}
