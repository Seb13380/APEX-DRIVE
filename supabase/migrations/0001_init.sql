-- CAR AUTOPILOTE — schema initial
-- Tables: profil, clients, notes, taches, rendez_vous
-- Buckets: profil (logo/fond), notes-audio (notes vocales)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
create type statut_lead as enum ('chaud', 'tiede', 'froid');
create type priorite_tache as enum ('basse', 'normale', 'haute');
create type statut_tache as enum ('a_faire', 'en_cours', 'terminee');
create type type_rdv as enum ('appel', 'rdv', 'envoi');

-- ---------------------------------------------------------------------------
-- PROFIL (1 ligne par commercial/concession, lié à auth.users)
-- ---------------------------------------------------------------------------
create table profil (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nom_concession text not null default '',
  logo_url text,
  photo_fond_url text,
  objectif_mensuel integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profil_user_id_idx on profil (user_id);

-- ---------------------------------------------------------------------------
-- CLIENTS
-- ---------------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nom text not null,
  telephone text,
  vehicule_recherche text,
  budget numeric,
    financement text,
  reprise text,
  objections text,
  statut_lead statut_lead not null default 'tiede',
  prochaine_relance timestamptz,
  created_at timestamptz not null default now()
);
create index clients_user_id_idx on clients (user_id);
create index clients_statut_lead_idx on clients (statut_lead);
create index clients_prochaine_relance_idx on clients (prochaine_relance);

-- ---------------------------------------------------------------------------
-- NOTES (vocales, transcrites puis résumées par IA)
-- ---------------------------------------------------------------------------
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  audio_url text,
  transcription text,
  resume text,
  created_at timestamptz not null default now()
);
create index notes_user_id_idx on notes (user_id);
create index notes_client_id_idx on notes (client_id);

-- ---------------------------------------------------------------------------
-- TACHES
-- ---------------------------------------------------------------------------
create table taches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  note_id uuid references notes (id) on delete set null,
  titre text not null,
  priorite priorite_tache not null default 'normale',
  statut statut_tache not null default 'a_faire',
  echeance timestamptz,
  created_at timestamptz not null default now()
);
create index taches_user_id_idx on taches (user_id);
create index taches_client_id_idx on taches (client_id);
create index taches_echeance_idx on taches (echeance);
create index taches_statut_idx on taches (statut);

-- ---------------------------------------------------------------------------
-- RENDEZ-VOUS
-- ---------------------------------------------------------------------------
create table rendez_vous (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  titre text not null,
  date_heure timestamptz not null,
  type type_rdv not null default 'rdv',
  created_at timestamptz not null default now()
);
create index rendez_vous_user_id_idx on rendez_vous (user_id);
create index rendez_vous_date_heure_idx on rendez_vous (date_heure);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY — chaque commercial ne voit que ses propres données
-- ---------------------------------------------------------------------------
alter table profil enable row level security;
alter table clients enable row level security;
alter table notes enable row level security;
alter table taches enable row level security;
alter table rendez_vous enable row level security;

create policy "profil_owner_select" on profil for select using (auth.uid() = user_id);
create policy "profil_owner_insert" on profil for insert with check (auth.uid() = user_id);
create policy "profil_owner_update" on profil for update using (auth.uid() = user_id);
create policy "profil_owner_delete" on profil for delete using (auth.uid() = user_id);

create policy "clients_owner_all_select" on clients for select using (auth.uid() = user_id);
create policy "clients_owner_all_insert" on clients for insert with check (auth.uid() = user_id);
create policy "clients_owner_all_update" on clients for update using (auth.uid() = user_id);
create policy "clients_owner_all_delete" on clients for delete using (auth.uid() = user_id);

create policy "notes_owner_all_select" on notes for select using (auth.uid() = user_id);
create policy "notes_owner_all_insert" on notes for insert with check (auth.uid() = user_id);
create policy "notes_owner_all_update" on notes for update using (auth.uid() = user_id);
create policy "notes_owner_all_delete" on notes for delete using (auth.uid() = user_id);

create policy "taches_owner_all_select" on taches for select using (auth.uid() = user_id);
create policy "taches_owner_all_insert" on taches for insert with check (auth.uid() = user_id);
create policy "taches_owner_all_update" on taches for update using (auth.uid() = user_id);
create policy "taches_owner_all_delete" on taches for delete using (auth.uid() = user_id);

create policy "rdv_owner_all_select" on rendez_vous for select using (auth.uid() = user_id);
create policy "rdv_owner_all_insert" on rendez_vous for insert with check (auth.uid() = user_id);
create policy "rdv_owner_all_update" on rendez_vous for update using (auth.uid() = user_id);
create policy "rdv_owner_all_delete" on rendez_vous for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- STORAGE BUCKETS
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('profil', 'profil', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('notes-audio', 'notes-audio', false)
on conflict (id) do nothing;

-- profil bucket: chaque utilisateur gère ses fichiers sous logo/{user_id}/... et fond/{user_id}/...
create policy "profil_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'profil');

create policy "profil_bucket_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'profil' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "profil_bucket_owner_update"
  on storage.objects for update
  using (bucket_id = 'profil' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "profil_bucket_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'profil' and (storage.foldername(name))[2] = auth.uid()::text);

-- notes-audio bucket: privé, accessible uniquement au propriétaire (dossier {user_id}/...)
create policy "notes_audio_owner_select"
  on storage.objects for select
  using (bucket_id = 'notes-audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "notes_audio_owner_insert"
  on storage.objects for insert
  with check (bucket_id = 'notes-audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "notes_audio_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'notes-audio' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- updated_at auto pour profil
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profil_set_updated_at
  before update on profil
  for each row execute function set_updated_at();
