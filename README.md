# rxusage

แดชบอร์ดติดตามการใช้งาน (Usage dashboard) — Next.js (static export) + Firebase, deploy บน Cloudflare Pages

- **Stack:** Next.js 16 (App Router, `output: "export"`), React 19, Tailwind CSS 4, TypeScript
- **Firebase (client SDK):** Authentication, Cloud Firestore, Realtime Database, Cloud Storage, Analytics — ดู `src/lib/firebase.ts`
- **ภาษา:** ไทย / English (สลับได้ที่มุมขวาบน, จำค่าไว้ใน browser) — ข้อความอยู่ที่ `src/i18n/dictionaries.ts`
- **Design system:** `design-system/rxusage/MASTER.md` (สร้างด้วย ui-ux-pro-max)

## เริ่มต้นใช้งาน (Local)

```bash
npm install
cp .env.example .env.local   # ใส่ค่าจาก Firebase console
npm run dev                  # http://localhost:3000
```

ค่า Firebase หาได้ที่ Firebase console → Project settings → General → Your apps → Web app
ค่า `NEXT_PUBLIC_*` เป็น config สาธารณะ (ไม่ใช่ secret) — ข้อมูลต้องป้องกันด้วย **Firebase Security Rules** เสมอ เพราะหน้าเว็บเป็น static และการเช็คล็อกอินทำฝั่ง browser เท่านั้น

## Deploy บน Cloudflare Pages

1. Push repo นี้ขึ้น GitHub
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → เลือก repo
3. Build settings:
   - Framework preset: **Next.js (Static HTML Export)**
   - Build command: `npm run build`
   - Build output directory: `out`
4. Settings → Environment variables: ใส่ทุกตัวจาก `.env.example` (ทั้ง Production และ Preview) และ `NODE_VERSION` = `22`
5. Firebase console → Authentication → Settings → **Authorized domains**: เพิ่มโดเมน `*.pages.dev` ของโปรเจกต์ (และ custom domain ถ้ามี) เพื่อให้ Google Sign-In ใช้งานได้

ทุกครั้งที่ push ไป branch หลัก Cloudflare จะ build และ deploy ใหม่อัตโนมัติ

## คำสั่ง

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน dev server |
| `npm run build` | build static site ไปที่ `out/` |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |
