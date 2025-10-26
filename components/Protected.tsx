
import { getSession } from "@/lib/auth";

export async function Protected({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return <p>Bitte <a className="underline" href="/login">einloggen</a>.</p>;
  return <>{children}</>;
}
