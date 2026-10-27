# 💬 FinanceChat — บันทึกรายรับรายจ่ายด้วยแชทบอท

Next.js 15 (App Router) · Supabase · Gemini · Cloudflare Pages (Edge Runtime)

## 1) Supabase
1. สร้างโปรเจกต์ → **SQL Editor** → วางไฟล์ `supabase/schema.sql` → Run
   (สร้างตาราง `transactions`, `envelopes`, เปิด RLS, ใส่ซองตั้งต้น)
2. **Project Settings → API** คัดลอก `Project URL` และ `anon public key`

## 2) รันในเครื่อง
```bash
cp .env.example .env.local   # ใส่ค่าจริง
npm install
npm run dev                  # http://localhost:3000
```
`/api/chat` ใช้ `GEMINI_API_KEY` (ขอฟรีที่ aistudio.google.com)

## 3) Deploy บน Cloudflare Pages (ผ่าน GitHub)
1. push โค้ดขึ้น GitHub
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git
3. ตั้งค่า build
   - Framework preset: `None`
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output directory: `.vercel/output/static`
4. Settings → Variables and Secrets (Production) เพิ่ม
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_FAMILY_USER_ID`,
   `GEMINI_API_KEY` (Secret), `NODE_VERSION=22`
5. Settings → Compatibility flags เพิ่ม `nodejs_compat` (Production)
6. Redeploy

## 4) Ping Supabase ทุก 3 วัน (GitHub Actions)
ไฟล์ `.github/workflows/keepalive.yml` ยิง REST query จริงทุก 3 วัน
GitHub → Settings → Secrets and variables → Actions → เพิ่ม `SUPABASE_URL`, `SUPABASE_ANON_KEY`
ทดสอบ: แท็บ Actions → "Supabase keep-alive" → Run workflow
หมายเหตุ: GitHub จะปิด schedule อัตโนมัติถ้า repo ไม่มี commit ~60 วัน (ต้องกด Enable ใหม่)

## ความปลอดภัย (ไม่มีระบบล็อกอิน)
ใช้ `FAMILY_USER_ID` คงที่ + RLS อนุญาต anon เฉพาะแถวของ id นี้
ใครมีลิงก์เว็บ/anon key จะอ่าน-เขียนได้ เหมาะกับใช้ในครอบครัว ไม่ควรเปิดสาธารณะ
ถ้าเปลี่ยน UUID ต้องแก้ทั้ง `schema.sql` และ `NEXT_PUBLIC_FAMILY_USER_ID`

## โครงสร้าง
- `src/app/api/chat/route.ts` Edge API: Gemini → JSON → insert Supabase → ตอบยืนยัน
- `src/lib/supabase.ts` Supabase client (อ่าน `NEXT_PUBLIC_*`)
- `src/lib/themes.ts` ธีม 150 แบบ (30 โทนสี × 5 สไตล์)
- `src/components/*` Chat, Charts, Envelopes, ThemePicker
