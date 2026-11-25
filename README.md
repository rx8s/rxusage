# rxusage

แดชบอร์ดดู limit ของ Claude และ ChatGPT — Next.js (static export) + Firebase, deploy บน Cloudflare Pages

## ฟีเจอร์

- **โควต้าแพ็กเกจ (claude.ai / ChatGPT):** ทั้งสองแอปไม่มี API ให้อ่านโควต้า จึงกรอกเอง (ใช้ไปกี่ % และรีเซ็ตเมื่อไหร่) เก็บใน Firestore `rxusage/{uid}/quotas` แล้วหน้าเว็บนับถอยหลังเวลารีเซ็ตให้
- **การใช้ API เดือนนี้ (Anthropic / OpenAI):** Cloudflare Pages Function `functions/api/usage.ts` ใช้ Admin API key ฝั่ง server ดึงค่าใช้จ่ายและ token ตั้งแต่ต้นเดือน (UTC) แล้วเทียบกับงบที่ตั้งไว้ใน Firestore `rxusage/{uid}/settings/budgets`
  - Anthropic: Usage and Cost Analytics API (`/v1/organizations/analytics/usage` และ `/cost`) — ข้อมูลช้าได้ถึง 4–24 ชั่วโมง
  - OpenAI: `/v1/organization/costs` และ `/v1/organization/usage/completions`
  - Function ยอมรับเฉพาะ Firebase ID token ของอีเมลใน `ALLOWED_EMAIL`

- **Stack:** Next.js 16 (App Router, `output: "export"`), React 19, Tailwind CSS 4, TypeScript
- **Firebase (client SDK):** Authentication, Cloud Firestore, Realtime Database, Cloud Storage, Analytics — ดู `src/lib/firebase.ts`

## Firebase ใช้ร่วมกับโปรเจกต์อื่น

Firebase project นี้ใช้ร่วมกับแอปอื่น ข้อมูลทุกอย่างของ rxusage จึงอยู่ใต้ prefix `rxusage` (`FIREBASE_PREFIX` ใน `src/lib/firebase.ts`):

| บริการ | ที่อยู่ | วิธีใช้ในโค้ด |
|---|---|---|
| Firestore | collection `rxusage/{uid}/...` | `collection(firestore(), FIREBASE_PREFIX, uid, ...)` |
| Realtime Database | `rxusage/...` | `rtdbRef("path")` |
| Storage | `rxusage/...` | `storageRef("path")` |
| Analytics | event `rxusage_<name>` | `logAppEvent("name")` |

Rules ในโฟลเดอร์ `firebase/` เป็น **ส่วนที่ต้องนำไปรวม** กับ rules เดิมของโปรเจกต์ — ห้ามวางทับทั้งไฟล์ เพราะจะลบ rules ของแอปอื่น
Authentication ใช้ผู้ใช้ชุดเดียวกับแอปอื่น (prefix ไม่ได้) แต่ละคนเห็นเฉพาะข้อมูล `rxusage/{uid}` ของตัวเอง และส่วน API usage อ่านได้เฉพาะ `ALLOWED_EMAIL`
- **ภาษา:** ไทย / English (สลับได้ที่มุมขวาบน, จำค่าไว้ใน browser) — ข้อความอยู่ที่ `src/i18n/dictionaries.ts`
- **Design system:** `design-system/rxusage/MASTER.md` (สร้างด้วย ui-ux-pro-max)

## เริ่มต้นใช้งาน (Local)

```bash
npm install
cp .env.example .env.local   # ใส่ค่าจาก Firebase console
npm run dev                  # http://localhost:3000
```

`npm run dev` ไม่มี Pages Function ส่วน "การใช้ API" จะขึ้นว่าใช้ไม่ได้ ถ้าจะทดสอบส่วนนี้:

```bash
cp .dev.vars.example .dev.vars   # ใส่ ALLOWED_EMAIL และ Admin keys
npm run preview                  # build แล้วรันด้วย wrangler ที่ http://localhost:8788
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
4. Settings → Variables and Secrets:
   - ทุกตัวจาก `.env.example` (ทั้ง Production และ Preview) และ `NODE_VERSION` = `22`
   - ทุกตัวจาก `.dev.vars.example` — ตั้ง `ANTHROPIC_ADMIN_KEY` และ `OPENAI_ADMIN_KEY` เป็นแบบ **Secret (encrypted)**
5. Firebase console → Authentication → Settings → **Authorized domains**: เพิ่มโดเมน `*.pages.dev` ของโปรเจกต์ (และ custom domain ถ้ามี) เพื่อให้ Google Sign-In ใช้งานได้
6. Firebase rules: คัดลอกเฉพาะบล็อก `rxusage` จาก `firebase/firestore.rules` (และ `firebase/database.rules.json`, `firebase/storage.rules` ถ้าจะใช้) ไปรวมกับ rules เดิมใน console แล้ว Publish — **ห้ามวางทับทั้งไฟล์**

ทุกครั้งที่ push ไป branch หลัก Cloudflare จะ build และ deploy ใหม่อัตโนมัติ

## คำสั่ง

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน dev server |
| `npm run build` | build static site ไปที่ `out/` |
| `npm run preview` | build แล้วรันพร้อม Pages Function ด้วย wrangler |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |
