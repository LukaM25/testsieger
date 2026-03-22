import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";

import {
  sendContactAutoReplyEmail,
  sendContactInquiryEmail,
} from "@/lib/email";

export const runtime = "nodejs";

const CATEGORY_LABELS: Record<string, string> = {
  business: "Frage zum Unternehmen",
  services: "Frage zu unseren Leistungen",
  process: "Frage zum Prozess",
};

function redirectWithState(req: Request, state: "sent" | "error") {
  const url = new URL("/kontakt", req.url);
  url.searchParams.set(state, "1");
  return NextResponse.redirect(url, 303);
}

function normalizeField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return redirectWithState(req, "error");

  const name = normalizeField(formData.get("name"));
  const email = normalizeField(formData.get("email")).toLowerCase();
  const categoryKey = normalizeField(formData.get("category"));
  const message = normalizeField(formData.get("message"));
  const category = CATEGORY_LABELS[categoryKey] ?? categoryKey;

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !validEmail || !category || !message) {
    return redirectWithState(req, "error");
  }

  const inquiryNumber = String(randomInt(1000, 10000));

  try {
    await sendContactInquiryEmail({
      inquiryNumber,
      name,
      email,
      category,
      message,
    });

    await sendContactAutoReplyEmail({
      inquiryNumber,
      to: email,
      name,
      category,
      message,
    });

    return redirectWithState(req, "sent");
  } catch (err) {
    console.error("CONTACT_FORM_SEND_ERROR", err);
    return redirectWithState(req, "error");
  }
}
