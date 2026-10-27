-- =====================================================================
--  FinanceChat : รันทั้งไฟล์ใน Supabase > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- 1) ตาราง transactions ----------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  type        text not null check (type in ('income', 'expense')),
  amount      numeric(14,2) not null check (amount > 0),
  category    text not null default 'อื่นๆ',
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc);

-- ---------- 2) ตาราง envelopes (ซองงบประมาณ) ----------
create table if not exists public.envelopes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  name        text not null,          -- ต้องตรงกับ category ของรายจ่าย
  budget      numeric(14,2) not null default 0 check (budget >= 0),
  icon        text not null default '💰',
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------- 3) RLS ----------
-- ไม่มีระบบล็อกอิน (ใช้ในครอบครัว) จึงอนุญาต role anon เฉพาะแถวที่ user_id
-- เท่ากับ "family id" ด้านล่างเท่านั้น  ** ถ้าเปลี่ยน id ต้องเปลี่ยนใน .env ด้วย **
alter table public.transactions enable row level security;
alter table public.envelopes    enable row level security;

drop policy if exists "family all transactions" on public.transactions;
create policy "family all transactions" on public.transactions
  for all to anon, authenticated
  using      (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

drop policy if exists "family all envelopes" on public.envelopes;
create policy "family all envelopes" on public.envelopes
  for all to anon, authenticated
  using      (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- ---------- 4) ข้อมูลตั้งต้นของซองงบ ----------
insert into public.envelopes (user_id, name, budget, icon) values
  ('00000000-0000-0000-0000-000000000001', 'อาหาร',     5000,  '🍜'),
  ('00000000-0000-0000-0000-000000000001', 'ค่าเช่า',    8000,  '🏠'),
  ('00000000-0000-0000-0000-000000000001', 'เดินทาง',    2000,  '🚌'),
  ('00000000-0000-0000-0000-000000000001', 'ฉุกเฉิน',    10000, '🛟'),
  ('00000000-0000-0000-0000-000000000001', 'ท่องเที่ยว',  7500,  '🏝️')
on conflict (user_id, name) do nothing;
