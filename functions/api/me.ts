/**
 * Cloudflare Pages Function: GET /api/me
 * Tells the dashboard whether the signed-in Google account is in ALLOWED_EMAIL.
 */
import { json, verifyUser, type AuthEnv } from "../_lib/auth";

export async function onRequestGet({ request, env }: { request: Request; env: AuthEnv }) {
  return json({ allowed: await verifyUser(request, env) });
}
