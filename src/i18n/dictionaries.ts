export const locales = ["th", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "th";

const th = {
  appName: "rxusage",
  tagline: "แดชบอร์ดติดตามการใช้งาน",
  language: "ภาษา",
  theme: { toggle: "สลับธีม", light: "โหมดสว่าง", dark: "โหมดมืด" },
  login: {
    title: "เข้าสู่ระบบ",
    subtitle: "ลงชื่อเข้าใช้เพื่อดูแดชบอร์ดการใช้งาน",
    email: "อีเมล",
    password: "รหัสผ่าน",
    submit: "เข้าสู่ระบบ",
    submitting: "กำลังเข้าสู่ระบบ…",
    google: "เข้าสู่ระบบด้วย Google",
    or: "หรือ",
    error: "เข้าสู่ระบบไม่สำเร็จ ตรวจสอบอีเมลและรหัสผ่านอีกครั้ง",
  },
  setup: {
    title: "ยังไม่ได้ตั้งค่า Firebase",
    body: "คัดลอก .env.example เป็น .env.local แล้วใส่ค่าจาก Firebase console จากนั้นรีสตาร์ท dev server",
  },
  nav: { overview: "ภาพรวม", signOut: "ออกจากระบบ", menu: "เมนู", close: "ปิดเมนู" },
  dashboard: {
    title: "ภาพรวม",
    welcome: "ยินดีต้อนรับ",
    emptyTitle: "ยังไม่มีข้อมูลการใช้งาน",
    emptyBody: "เมื่อกำหนดแหล่งข้อมูลการใช้งานแล้ว ตัวชี้วัดและกราฟจะแสดงที่นี่",
    servicesTitle: "สถานะบริการ Firebase",
    configured: "ตั้งค่าแล้ว",
    missing: "ยังไม่ได้ตั้งค่า",
  },
  services: {
    auth: "Authentication",
    firestore: "Cloud Firestore",
    database: "Realtime Database",
    storage: "Cloud Storage",
    analytics: "Analytics",
  },
  loading: "กำลังโหลด…",
};

export type Dictionary = typeof th;

const en: Dictionary = {
  appName: "rxusage",
  tagline: "Usage dashboard",
  language: "Language",
  theme: { toggle: "Toggle theme", light: "Light mode", dark: "Dark mode" },
  login: {
    title: "Sign in",
    subtitle: "Sign in to view the usage dashboard",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
    google: "Continue with Google",
    or: "or",
    error: "Sign-in failed. Check your email and password and try again.",
  },
  setup: {
    title: "Firebase is not configured",
    body: "Copy .env.example to .env.local, fill in the values from the Firebase console, then restart the dev server.",
  },
  nav: { overview: "Overview", signOut: "Sign out", menu: "Menu", close: "Close menu" },
  dashboard: {
    title: "Overview",
    welcome: "Welcome",
    emptyTitle: "No usage data yet",
    emptyBody: "Metrics and charts will appear here once a usage data source is defined.",
    servicesTitle: "Firebase services",
    configured: "Configured",
    missing: "Not configured",
  },
  services: {
    auth: "Authentication",
    firestore: "Cloud Firestore",
    database: "Realtime Database",
    storage: "Cloud Storage",
    analytics: "Analytics",
  },
  loading: "Loading…",
};

export const dictionaries: Record<Locale, Dictionary> = { th, en };
