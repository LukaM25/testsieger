import type { Metadata } from "next";
import { assertArbeitssicherheitAccess } from "@/lib/arbeitssicherheit/gate";
import DashNav from "./DashNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Arbeitssicherheit Kundenbereich | DPI",
  robots: { index: false, follow: false },
};

export default function ASDashboardLayout({ children }: { children: React.ReactNode }) {
  assertArbeitssicherheitAccess();
  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Arbeitssicherheit · Kundenbereich
        </p>
        <div className="mt-4">
          <DashNav />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
