-- Registre des promesses de dons (Birkat Hachana)
create table public.promise_pledges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  honoree text,
  phone text,
  email text,
  schedule text,
  intention text,
  status text not null default 'nouvelle',
  created_at timestamptz not null default now()
);

-- Table admin-only : insertion et lecture uniquement via le code serveur
GRANT ALL ON public.promise_pledges TO service_role;

alter table public.promise_pledges enable row level security;

-- Aucune policy : ni les visiteurs anonymes ni les comptes connectés ne lisent la table.
-- Le registre est écrit et lu uniquement par le code serveur (service_role).