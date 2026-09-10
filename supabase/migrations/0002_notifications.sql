-- Table de notifications utilisée par la fonction relance-quotidienne
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titre text not null,
  message text not null,
  lue boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on notifications (user_id);

alter table notifications enable row level security;

create policy "notifications_owner_select" on notifications for select using (auth.uid() = user_id);
create policy "notifications_owner_update" on notifications for update using (auth.uid() = user_id);

-- Realtime: permet au frontend d'écouter les nouvelles notes/tâches/notifications
alter publication supabase_realtime add table notes;
alter publication supabase_realtime add table taches;
alter publication supabase_realtime add table notifications;
