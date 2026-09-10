# Car AutoPilote

Copilote commercial pour concessionnaires automobiles — Next.js (App Router) + Supabase + OpenAI.

## Stack

- **Frontend** : Next.js 16 (App Router, TypeScript, Tailwind v4)
- **Backend** : Supabase (Postgres + Auth + Storage + Edge Functions)
- **IA** : OpenAI Whisper (transcription) + GPT-4o-mini (résumé / extraction)

## Structure

```
src/app/(app)/        pages protégées (Accueil, Clients, To-do, Calendrier, Statistiques, Assistant IA)
src/app/login/         connexion par lien magique (email OTP)
src/app/auth/callback/ échange du code OAuth Supabase
src/components/        Sidebar, TodoCheck (client components)
src/lib/supabase/      clients Supabase (browser / server / middleware) + types DB
supabase/migrations/   schéma SQL (tables, RLS, buckets, realtime)
supabase/functions/    Edge Functions Deno
  webhook-note-entrante   audio → transcription (Whisper) → résumé/tâche (GPT) → écriture DB
  relance-quotidienne     cron quotidien : notifie tâches + RDV du jour
```

## Mise en route

### 1. Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → *New project*.
2. Récupérer dans **Project Settings → API** : `Project URL`, `anon public key`, `service_role key`.
3. Copier `.env.local.example` en `.env.local` et renseigner :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   OPENAI_API_KEY=...
   ```
   (jamais commité — déjà dans `.gitignore`)

### 2. Appliquer le schéma

Avec la [CLI Supabase](https://supabase.com/docs/guides/cli) :

```bash
npx supabase login
npx supabase link --project-ref <ref-du-projet>
npx supabase db push
```

Cela crée les tables (`profil`, `clients`, `notes`, `taches`, `rendez_vous`, `notifications`),
les policies RLS (chaque commercial ne voit que ses données) et les buckets Storage
(`profil` public pour logo/fond, `notes-audio` privé pour les notes vocales).

### 3. Déployer les Edge Functions

```bash
npx supabase functions deploy webhook-note-entrante
npx supabase functions deploy relance-quotidienne
npx supabase secrets set OPENAI_API_KEY=sk-...
```

`relance-quotidienne` est planifiée via `supabase/config.toml` (cron `0 7 * * *`,
tous les jours à 7h). Adapter l'horaire si besoin.

### 4. Lancer le frontend

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). La première connexion se fait
par lien magique envoyé par email (Supabase Auth). Après connexion, créer une ligne
dans `profil` (nom de concession, objectif mensuel) — soit via Supabase Studio, soit
en ajoutant plus tard un écran de paramétrage.

## Notes

- Toutes les requêtes (clients, tâches, RDV...) sont scoped à l'utilisateur connecté
  via Row Level Security — pas de filtrage manuel côté client nécessaire.
- L'assistant IA utilise `MediaRecorder` (nécessite HTTPS ou localhost) pour enregistrer
  une note vocale, l'upload dans le bucket `notes-audio`, puis appelle la fonction
  `webhook-note-entrante` qui transcrit, résume et écrit en base.
- Le "callback UI" de la note entrante est la réponse HTTP de la fonction + les
  tables `notes`/`taches` ajoutées à la publication Realtime (pour un abonnement live
  si besoin plus tard).

