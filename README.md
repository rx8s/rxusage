# rxusage

แดชบอร์ดดูลิมิตแพ็กเกจของ **Claude** และ **ChatGPT** แบบอัปเดตอัตโนมัติ (รอบ 5 ชั่วโมงและรายสัปดาห์ พร้อมนับถอยหลังเวลารีเซ็ต) ล็อกอินด้วย Google และ deploy ฟรีบน Cloudflare Pages + Firebase

**ตั้งเว็บของคุณเอง → [DEPLOY.md](DEPLOY.md)**

## ฟีเจอร์

- **ลิมิตแพ็กเกจอัตโนมัติ:** ตัวเก็บข้อมูลบน Mac (`collector/`) อ่าน % ที่ใช้ไปทุก 5 นาทีแล้วส่งขึ้น `functions/api/limits.ts` ซึ่งเก็บไว้ใน Cloudflare KV
  - Claude: จากการล็อกอินของ Claude Code (ค่าเดียวกับ `/usage` และใช้ร่วมกับ claude.ai)
  - ChatGPT: จากการล็อกอินของ Codex CLI (ค่าเดียวกับ `/status`)
  - token อยู่ในเครื่องเท่านั้น ส่งขึ้นเว็บแค่ % และเวลารีเซ็ต ทั้งสอง endpoint ไม่ใช่ API ทางการ อาจเปลี่ยนได้โดยไม่แจ้ง
- **ล็อกอินด้วย Google (Gmail) อย่างเดียว:** เข้าได้เฉพาะบัญชีใน `ALLOWED_EMAIL` บัญชีอื่นจะเห็นหน้า "ไม่ได้รับอนุญาต"
- **การใช้ API เดือนนี้ (ไม่บังคับ):** ค่าใช้จ่ายและ token ของ Anthropic / OpenAI API จาก Admin API พร้อมตั้งงบรายเดือน
- **โควต้าที่กรอกเอง:** สำหรับลิมิตอื่นที่ตัวเก็บข้อมูลอ่านไม่ได้ เก็บใน Firestore
- **ภาษาและธีม:** ไทย / English และโหมดมืด / สว่าง

## โครงสร้าง

| ส่วน | ที่อยู่ |
|---|---|
| หน้าเว็บ (Next.js 16 static export, React 19, Tailwind CSS 4) | `src/` |
| Pages Functions: `/api/me`, `/api/limits`, `/api/usage` | `functions/` |
| ตัวเก็บข้อมูลบน Mac + ตัวติดตั้ง LaunchAgent | `collector/` |
| Firebase rules | `firebase/` |
| ข้อความไทย / อังกฤษ | `src/i18n/dictionaries.ts` |
| Design system | `design-system/rxusage/MASTER.md` |

ข้อมูลทุกอย่างใน Firebase อยู่ใต้ prefix `rxusage` (`FIREBASE_PREFIX` ใน `src/lib/firebase.ts`) จึงใช้ร่วมกับ Firebase project ของแอปอื่นได้

## คำสั่ง

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน dev server ที่ http://localhost:3000 (ไม่มี Functions) |
| `npm run build` | build static site ไปที่ `out/` |
| `npm run preview` | build แล้วรันพร้อม Functions และ KV จำลองด้วย wrangler ที่ http://localhost:8788 |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |
| `collector/install.sh <url>` | ติดตั้งตัวเก็บข้อมูลบน Mac (รันทุก 5 นาที) |
| `node collector/rxusage-collector.mjs --dry-run` | ดูค่าที่อ่านได้โดยไม่ส่ง |

## License

[MIT](LICENSE)
