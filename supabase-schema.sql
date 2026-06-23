create table if not exists public.invitations (
  id text primary key,
  invitation jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists invitations_set_updated_at on public.invitations;

create trigger invitations_set_updated_at
before update on public.invitations
for each row
execute function public.set_updated_at();
