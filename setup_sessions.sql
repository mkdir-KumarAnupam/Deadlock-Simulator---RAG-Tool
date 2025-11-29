-- Create sessions table
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  host_id uuid references auth.users(id) not null,
  state jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.sessions enable row level security;

-- Policies
create policy "Anyone can read active sessions"
  on public.sessions for select
  using (true);

create policy "Authenticated users can create sessions"
  on public.sessions for insert
  with check (auth.uid() = host_id);

create policy "Host can update their session"
  on public.sessions for update
  using (auth.uid() = host_id);

-- Realtime
alter publication supabase_realtime add table public.sessions;
