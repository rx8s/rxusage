# rxusage

แดชบอร์ดดู limit ของ Claude และ ChatGPT — Next.js (static export) + Firebase, deploy บน Cloudflare Pages

## ฟีเจอร์

- **ลิมิตแพ็กเกจอัตโนมัติ (Claude / ChatGPT):** ตัวเก็บข้อมูลบน Mac (`collector/`) อ่าน % ที่ใช้ไปของรอบ 5 ชั่วโมงและรายสัปดาห์ทุก 5 นาที แล้วส่งขึ้น `functions/api/limits.ts` ซึ่งเก็บไว้ใน Cloudflare KV
  - Claude: ใช้การล็อกอินของ Claude Code ใน Keychain เรียก `api.anthropic.com/api/oauth/usage` (ค่าเดียวกับ `/usage` ใน Claude Code และใช้ร่วมกับ claude.ai)
  - ChatGPT: ใช้การล็อกอินของ Codex CLI ใน `~/.codex/auth.json` เรียก `chatgpt.com/backend-api/wham/usage` (ค่าเดียวกับ `/status` ใน Codex)
  - ทั้งสองไม่ใช่ API ทางการ อาจเปลี่ยนได้โดยไม่แจ้ง token อยู่ในเครื่องเท่านั้น ส่งขึ้นเว็บแค่ตัวเลข % และเวลารีเซ็ต
  - ตัวเก็บข้อมูลไม่ refresh token เอง ถ้าไม่ได้เปิด Claude Code / Codex นานจน token หมดอายุ การ์ดจะขึ้นคำเตือนและแสดงค่าล่าสุดที่มี
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

7. ลิมิตแพ็กเกจอัตโนมัติ:
   - Workers & Pages → KV → สร้าง namespace (เช่น `rxusage-limits`)
   - Pages project → Settings → Bindings → Add → KV namespace: Variable name `LIMITS` → เลือก namespace ข้างบน
   - บน Mac รัน `collector/install.sh https://<โปรเจกต์>.pages.dev` แล้วนำค่า `LIMITS_INGEST_TOKEN_SHA256` ที่พิมพ์ออกมาไปใส่ใน Variables and Secrets
   - Redeploy เพื่อให้ binding และตัวแปรมีผล

ทุกครั้งที่ push ไป branch หลัก Cloudflare จะ build และ deploy ใหม่อัตโนมัติ

## ตัวเก็บข้อมูลบน Mac (`collector/`)

```bash
collector/install.sh https://rxusage.pages.dev   # ติดตั้ง LaunchAgent รันทุก 5 นาที
node collector/rxusage-collector.mjs --dry-run   # ดูค่าที่อ่านได้โดยไม่ส่ง
collector/install.sh --uninstall                 # ถอนการติดตั้ง
```

- ตั้งค่าอยู่ที่ `~/.config/rxusage/collector.json` (url + token, สิทธิ์ 600) ฝั่ง server เก็บแค่ SHA-256 ของ token
- Log: `~/Library/Logs/rxusage-collector.log`
- ครั้งแรกที่ LaunchAgent อ่าน Keychain macOS อาจถามสิทธิ์ ให้กด **Always Allow**
- แก้ `collector/rxusage-collector.mjs` แล้วต้องรัน `install.sh` ใหม่ เพราะ LaunchAgent ใช้สำเนาใน `~/Library/Application Support/rxusage`

## คำสั่ง

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน dev server |
| `npm run build` | build static site ไปที่ `out/` |
| `npm run preview` | build แล้วรันพร้อม Pages Function ด้วย wrangler |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |
