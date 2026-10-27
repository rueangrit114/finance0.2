/** @type {import('next').NextConfig} */

// ค่า NEXT_PUBLIC_* ถูกฝังลงในโค้ดตอน "build" เท่านั้น
// ปกติให้ตั้งใน Cloudflare Pages (ชนิด Text ไม่ใช่ Secret) แล้ว build ใหม่
// ถ้าตั้งใน Cloudflare ไม่ติด ให้ใส่ค่าตรงนี้แทนได้เลย (URL และ anon key เป็นค่า public
// ปลอดภัยที่จะ commit เพราะข้อมูลถูกป้องกันด้วย RLS ใน Supabase)
const FALLBACK = {
  NEXT_PUBLIC_SUPABASE_URL: "",       // เช่น "https://xxxx.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",  // anon public key (ห้ามใส่ service_role!)
  NEXT_PUBLIC_FAMILY_USER_ID: "00000000-0000-0000-0000-000000000001",
};

const nextConfig = {
  reactStrictMode: true,
  env: Object.fromEntries(
    Object.entries(FALLBACK).map(([k, v]) => [k, process.env[k] || v])
  ),
};
export default nextConfig;
