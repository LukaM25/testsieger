// app/admin/page.tsx
import { cookies } from "next/headers";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminList from "./AdminList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies(); // Next 16: await is required
  const authed = cookieStore.get("admin_auth")?.value === process.env.ADMIN_SECRET;

  if (!authed) {
    return (
      <div className="max-w-md mx-auto">
        <AdminLogin />
      </div>
    );
  }
  return <AdminList />;
}
