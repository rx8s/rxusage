/** Shared helpers for the Pages Functions (files under `_lib` are not routes). */
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AuthEnv {
  FIREBASE_PROJECT_ID?: string;
  ALLOWED_EMAIL?: string;
}

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });

export const bearer = (request: Request) => request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;

/** True when the request carries a valid Firebase ID token for the verified ALLOWED_EMAIL. */
export async function verifyUser(request: Request, env: AuthEnv): Promise<boolean> {
  const token = bearer(request);
  if (!token || !env.FIREBASE_PROJECT_ID || !env.ALLOWED_EMAIL) return false;
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    });
    return (
      payload.email_verified === true &&
      typeof payload.email === "string" &&
      payload.email.toLowerCase() === env.ALLOWED_EMAIL.toLowerCase()
    );
  } catch {
    return false;
  }
}

export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
