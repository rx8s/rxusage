# Deploy rxusage ของคุณเอง

คู่มือนี้พาตั้งเว็บ rxusage ของคุณเองตั้งแต่ศูนย์ ใช้เวลาประมาณ 20–30 นาที ทุกบริการใช้แพ็กเกจฟรีได้

```
Mac ของคุณ ──(ทุก 5 นาที)──▶ Cloudflare Pages Function /api/limits ──▶ Cloudflare KV
 collector อ่าน limit                                                     │
 จาก Claude Code / Codex                                                  ▼
                              เบราว์เซอร์ ◀── หน้าเว็บ static (Next.js) ── ล็อกอินด้วย Google ผ่าน Firebase
```

- **Firebase:** ใช้ล็อกอินด้วย Google (Gmail) และเก็บค่าที่กรอกเองใน Firestore
- **Cloudflare Pages:** โฮสต์หน้าเว็บและ Functions (`/api/me`, `/api/limits`, `/api/usage`) ส่วน KV เก็บค่าลิมิตล่าสุด
- **Collector บน Mac:** อ่านลิมิตจาก Claude Code และ Codex ที่ล็อกอินอยู่ แล้วส่งขึ้นเว็บเฉพาะตัวเลข

## สิ่งที่ต้องมี

- บัญชี GitHub, Google (สำหรับ Firebase) และ Cloudflare
- Node.js 22 ขึ้นไป และ git
- Mac ที่ล็อกอิน [Claude Code](https://claude.com/claude-code) และ/หรือ [Codex CLI](https://github.com/openai/codex) ด้วยแพ็กเกจที่ต้องการติดตาม (Claude Pro/Max/Team, ChatGPT Plus/Pro)

## 1. Fork และ clone

1. กด **Fork** repo นี้บน GitHub (repo ของคุณจะเป็น public หรือ private ก็ได้)
2. Clone ลงเครื่อง:

```bash
git clone https://github.com/<your-user>/rxusage.git
```

```bash
cd rxusage && npm install
```

## 2. Firebase

1. ไปที่ [Firebase console](https://console.firebase.google.com) → **Add project** (ปิด Google Analytics ได้)
2. **Authentication** → Get started → Sign-in method → เปิด **Google** → ใส่ support email → Save
   - ไม่ต้องเปิด Email/Password เพราะหน้าล็อกอินมีแค่ปุ่ม Google
3. **Firestore Database** → Create database → Production mode → เลือก location ใกล้คุณ (เช่น `asia-southeast1`)
4. **Firestore Database → Rules:** วางเนื้อหาทั้งไฟล์ [`firebase/firestore.rules`](firebase/firestore.rules) แล้ว **Publish**
   - ถ้าใช้ Firebase project เดียวกับแอปอื่น ให้คัดลอกเฉพาะบล็อก `rxusage` ไปรวมกับ rules เดิม **ห้ามวางทับ**
   - ถ้าอยากล็อกให้เฉพาะอีเมลของคุณเขียนข้อมูลได้ ใช้บรรทัด optional ในไฟล์ (แก้อีเมลก่อน) รายการอีเมลตรงนี้ต้องตรงกับ `ALLOWED_EMAIL` ในขั้นที่ 4 ดู[เพิ่มหรือเปลี่ยนบัญชีที่เข้าได้](#เพิ่มหรือเปลี่ยนบัญชีที่เข้าได้)
5. **Project settings** (รูปเฟือง) → General → Your apps → ไอคอน **Web `</>`** → ตั้งชื่อ → Register
   - คัดลอกค่าใน `firebaseConfig` ไว้ใช้ในขั้นที่ 3 และ 4
6. **Authentication → Settings → Authorized domains:** มี `localhost` อยู่แล้ว ส่วนโดเมน `*.pages.dev` จะเพิ่มในขั้นที่ 5

## 3. ทดลองในเครื่อง (ข้ามได้)

```bash
cp .env.example .env.local
```

ใส่ค่าจาก `firebaseConfig` ลงใน `.env.local`:

| ตัวแปร | ค่าใน firebaseConfig |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `measurementId` (ว่างได้) |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | ว่างได้ (ไม่ได้ใช้ Realtime Database) |

```bash
npm run dev
```

เปิด http://localhost:3000 แล้วล็อกอินด้วย Google ได้ แต่ส่วนที่ใช้ Functions (ลิมิตอัตโนมัติ, API usage) จะขึ้นว่าใช้ไม่ได้ ถ้าจะทดสอบส่วนนี้ด้วย:

```bash
cp .dev.vars.example .dev.vars
```

```bash
npm run preview
```

แล้วเปิด http://localhost:8788

## 4. Cloudflare Pages

1. [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → Create → แท็บ **Pages** → **Connect to Git** → เลือก repo ที่ fork ไว้
2. Build settings:

| ช่อง | ค่า |
|---|---|
| Production branch | `master` (หรือ branch หลักของคุณ) |
| Framework preset | **Next.js (Static HTML Export)** |
| Build command | `npm run build` |
| Build output directory | `out` |

3. **Environment variables** (ใส่ก่อนกด Save and Deploy):

| ตัวแปร | ค่า | ชนิด |
|---|---|---|
| `NODE_VERSION` | `22` | Text |
| `NEXT_PUBLIC_FIREBASE_*` ทั้ง 8 ตัว | ค่าเดียวกับ `.env.local` | Text |
| `FIREBASE_PROJECT_ID` | ค่าเดียวกับ `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Text |
| `ALLOWED_EMAIL` | Gmail ที่ให้เข้าเว็บได้ คั่นหลายบัญชีด้วย `,` (ถ้าล็อกอีเมลใน Firestore rules ต้องใส่ให้ตรงกัน) | Text |
| `ANTHROPIC_ADMIN_KEY` | (ไม่บังคับ) Admin key ของ Anthropic API | **Secret** |
| `OPENAI_ADMIN_KEY` | (ไม่บังคับ) Admin key ของ OpenAI API | **Secret** |

4. กด **Save and Deploy** เมื่อเสร็จจะได้ URL เช่น `https://<project>.pages.dev`
5. **KV สำหรับลิมิตอัตโนมัติ:**
   - Workers & Pages → **KV** (หรือ Storage & Databases → KV) → Create namespace เช่น `rxusage-limits`
   - Pages project → **Settings → Bindings → Add → KV namespace:** Variable name `LIMITS` แล้วเลือก namespace ข้างบน

> ค่าใน Variables และ Bindings มีผลกับ deploy ถัดไปเท่านั้น เพิ่มหรือแก้แล้วให้ไปที่ **Deployments → ⋯ → Retry deployment**

## 5. เพิ่มโดเมนใน Firebase

Firebase console → **Authentication → Settings → Authorized domains → Add domain** → ใส่ `<project>.pages.dev` (และ custom domain ถ้ามี)

ถ้าไม่เพิ่ม ตอนล็อกอินจะขึ้นข้อความว่าโดเมนยังไม่ได้รับอนุญาต

## 6. ติดตั้ง collector บน Mac

```bash
collector/install.sh https://<project>.pages.dev
```

สคริปต์จะ:
- สร้าง token สุ่มเก็บไว้ที่ `~/.config/rxusage/collector.json` (สิทธิ์ 600)
- ติดตั้ง LaunchAgent `com.rxusage.collector` รันทุก 5 นาที
- พิมพ์ค่า `LIMITS_INGEST_TOKEN_SHA256` ออกมา

นำค่านั้นไปใส่ใน Cloudflare Pages → Settings → **Variables and Secrets** → `LIMITS_INGEST_TOKEN_SHA256` (Text) แล้ว **Retry deployment**

ค่านี้เป็นแค่ hash ของ token ไม่ใช่ความลับ ส่วน token จริงอยู่ในเครื่องคุณเท่านั้น

ตรวจผล:

```bash
tail -f ~/Library/Logs/rxusage-collector.log
```

ต้องเห็น `sent 200 {"ok":true,...}` ภายใน 5 นาที หรือสั่งให้รันทันที:

```bash
launchctl kickstart -k gui/$(id -u)/com.rxusage.collector
```

ครั้งแรกที่อ่าน Keychain macOS อาจถามสิทธิ์ ให้กด **Always Allow**

## 7. ใช้งาน

เปิด `https://<project>.pages.dev` → **เข้าสู่ระบบด้วย Google** → แดชบอร์ดจะแสดงลิมิตของ Claude และ ChatGPT

- บัญชี Google ที่ไม่อยู่ใน `ALLOWED_EMAIL` จะเห็นหน้า "บัญชีนี้ไม่ได้รับอนุญาต"
- ทุกครั้งที่ push ไป branch หลัก Cloudflare จะ build และ deploy ใหม่เอง

## เพิ่มหรือเปลี่ยนบัญชีที่เข้าได้

รายชื่ออีเมลอยู่ 2 ที่ ต้องแก้ให้ตรงกันทั้งคู่:

1. **Cloudflare Pages → Settings → Variables and Secrets → `ALLOWED_EMAIL`:** คั่นหลายบัญชีด้วย `,` เช่น `you@gmail.com,partner@gmail.com` แล้วไปที่ **Deployments → ⋯ → Retry deployment** เพราะค่าจะมีผลกับ deploy ใหม่เท่านั้น
2. **Firebase console → Firestore Database → Rules:** ถ้าใช้บรรทัด optional ที่ล็อกอีเมล ให้เพิ่มอีเมลเดียวกันในรายการ แล้ว **Publish**

```
&& request.auth.token.email in ['you@gmail.com', 'partner@gmail.com'];
```

| แก้แค่ที่เดียว | อาการ |
|---|---|
| เพิ่มใน `ALLOWED_EMAIL` แต่ไม่เพิ่มใน rules | เข้าเว็บได้ แต่ส่วน "โควต้าที่กรอกเอง" โหลดหรือบันทึกไม่ได้ |
| เพิ่มใน rules แต่ไม่เพิ่มใน `ALLOWED_EMAIL` | ล็อกอินแล้วเจอหน้า "บัญชีนี้ไม่ได้รับอนุญาต" |

ถ้า Firebase project ใช้ร่วมกับแอปอื่น ให้แก้เฉพาะบล็อก `rxusage` ใน Rules **ห้ามวางไฟล์ทับทั้งหมด** เพราะ rules ของแอปอื่นจะหายและแอปเหล่านั้นจะอ่านหรือเขียนข้อมูลไม่ได้ ถ้าพลาดไปแล้ว Rules มีประวัติทุกเวอร์ชันให้ดูแล้วนำกลับมาได้

## แก้ปัญหา

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| หน้าล็อกอินขึ้น "ยังไม่ได้ตั้งค่า Firebase" | ยังไม่ได้ใส่ `NEXT_PUBLIC_FIREBASE_*` ใน Cloudflare หรือใส่หลัง build ให้ Retry deployment |
| ล็อกอินแล้วขึ้นว่าโดเมนไม่ได้รับอนุญาต | ทำขั้นที่ 5 |
| ล็อกอินได้แต่ขึ้น "บัญชีนี้ไม่ได้รับอนุญาต" | อีเมลไม่ตรงกับ `ALLOWED_EMAIL` หรือ `FIREBASE_PROJECT_ID` ผิด แก้แล้ว Retry deployment |
| เข้าเว็บได้แต่ "โควต้าที่กรอกเอง" ขึ้น "โหลดข้อมูลไม่สำเร็จ" | ยังไม่ได้ Publish Firestore rules หรืออีเมลไม่อยู่ในรายการของบรรทัดที่ล็อกอีเมล ดู[เพิ่มหรือเปลี่ยนบัญชีที่เข้าได้](#เพิ่มหรือเปลี่ยนบัญชีที่เข้าได้) |
| การ์ดลิมิตขึ้น "ยังไม่ได้ผูก KV" | ทำขั้นที่ 4 ข้อ 5 แล้ว Retry deployment |
| Log ของ collector ขึ้น `sent 401` | `LIMITS_INGEST_TOKEN_SHA256` ไม่ตรงหรือยังไม่ได้ deploy ใหม่ รัน `collector/install.sh` อีกครั้งเพื่อดู hash |
| Log ขึ้น `sent 405` | เว็บยังเป็น build เก่าที่ไม่มี `/api/limits` |
| Log ขึ้น `Claude Code sign-in expired` | เปิด Claude Code สักครั้งเพื่อให้ต่ออายุ token |
| Log ขึ้น `Codex is not signed in` | รัน `codex login` ด้วยบัญชี ChatGPT |
| การ์ดเตือนว่าไม่มีข้อมูลใหม่เกิน 15 นาที | Mac ปิดหรือหลับอยู่ หรือ LaunchAgent หยุด ดู log ข้างบน |

## ถอนการติดตั้ง collector

```bash
collector/install.sh --uninstall
```

ลบ config ด้วย (ถ้าต้องการ):

```bash
rm -r ~/.config/rxusage
```

## ข้อควรรู้

- **Endpoint ไม่ใช่ API ทางการ:** collector ใช้ endpoint เดียวกับที่ Claude Code (`/usage`) และ Codex (`/status`) ใช้ ซึ่งอาจเปลี่ยนได้โดยไม่แจ้ง
- **Token อยู่ในเครื่องเท่านั้น:** token ของ Claude Code และ Codex ไม่ถูกส่งขึ้นเว็บ ส่งแค่ % ที่ใช้ไปและเวลารีเซ็ต
- **ค่า `NEXT_PUBLIC_FIREBASE_*` ไม่ใช่ความลับ:** ข้อมูลถูกป้องกันด้วย Firebase rules และการตรวจ token ใน Functions
