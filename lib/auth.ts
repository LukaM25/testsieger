// lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS, SESSION_COOKIE } from "./cookies";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

type Session = { userId: string; email: string; name: string };

export async function setSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();          // ⬅️ await
  cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();          // ⬅️ await
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as Session;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();          // ⬅️ await
  cookieStore.delete(SESSION_COOKIE);
}
