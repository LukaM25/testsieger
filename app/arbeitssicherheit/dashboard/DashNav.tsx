"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const BASE = "/arbeitssicherheit/dashboard";
const ITEMS = [
  { href: BASE, label: "Übersicht" },
  { href: `${BASE}/dokumente`, label: "Dokumente" },
  { href: `${BASE}/unterweisungen`, label: "Unterweisungen" },
  { href: `${BASE}/fristen`, label: "Fristen" },
];

function Inner() {
  const pathname = usePathname();
  const preview = useSearchParams().get("preview") === "1";
  return (
    <nav aria-label="Dashboard" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={preview ? `${item.href}?preview=1` : item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-[#16294d] !text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-[#2B4066]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashNav() {
  return (
    <Suspense fallback={<div className="h-10" />}>
      <Inner />
    </Suspense>
  );
}
