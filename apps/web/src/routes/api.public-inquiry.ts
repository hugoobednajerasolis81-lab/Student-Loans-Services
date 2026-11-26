import type { ActionFunctionArgs } from "react-router";
import { createPublicLead } from "../lib/pocketbase.server";
import { cleanText, validEmail } from "../lib/validation";

const recentRequests = new Map<string, number[]>();

function allowedByRateLimit(key: string) {
  const now = Date.now();
  const recent = (recentRequests.get(key) || []).filter(time => now - time < 60_000);
  if (recent.length >= 5) return false;
  recent.push(now);
  recentRequests.set(key, recent);
  return true;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ ok: false, message: "Method not allowed." }, { status: 405 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8_192) {
    return Response.json({ ok: false, message: "The request is too large." }, { status: 413 });
  }

  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "shared-client";
  if (!allowedByRateLimit(ip.slice(0, 80))) {
    return Response.json({ ok: false, message: "Please wait before submitting another inquiry." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }
  if (cleanText(body.website, 200)) {
    return Response.json({ ok: true, message: "Thank you." });
  }

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 254).toLowerCase();
  const phone = cleanText(body.phone, 40);
  const topic = cleanText(body.topic, 100);
  const message = cleanText(body.message, 3000);
  const consent = body.consent === true;

  if (!name || !validEmail(email) || !topic || !message || !consent) {
    return Response.json({ ok: false, message: "Please complete the required fields and consent." }, { status: 422 });
  }
  if (/(fsa\s*id|studentaid\.gov password|one[- ]time code|mfa code|social security number|\bssn\b|\b\d{3}-\d{2}-\d{4}\b)/i.test(message)) {
    return Response.json({ ok: false, message: "Please remove sensitive account or identity information and submit only a general inquiry." }, { status: 422 });
  }

  try {
    await createPublicLead({ name, email, phone, topic, message, consent });
    return Response.json({ ok: true, message: "Thank you. Your inquiry has been received." }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return Response.json({ ok: false, message: "We could not save the inquiry. The intake system may not yet be connected. Please try again later." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
