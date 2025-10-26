
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS, SESSION_COOKIE } from "./cookies";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

type Session = { userId: string; email: string; name: string };

export async function setSession(session: Session) {
  const token = await new SignJWT(session).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(SECRET);
  cookies().set(SESSION_COOKIE, token, COOKIE_OPTIONS);
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}
