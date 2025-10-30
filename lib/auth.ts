import 'server-only';
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS, SESSION_COOKIE } from "./cookies";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

export type Session = { userId: string; email: string; name: string };

// WRITE: must be a server action (or call from a route handler)
export async function setSession(session: Session) {
  'use server';

  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const store = await cookies();           // 👈 async in Next 14.2+/15
  store.set(SESSION_COOKIE, token, COOKIE_OPTIONS); // 👈 write is allowed here
}

// READ: safe anywhere on the server (SSR/server component/server action/route)
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as Session;
  } catch {
    return null;
  }
}

// DELETE: also needs a write-capable context
export async function clearSession() {
  'use server';
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
