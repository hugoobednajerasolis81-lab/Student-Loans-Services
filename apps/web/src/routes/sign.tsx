import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { findAgreementByToken, pbServer } from "../lib/pocketbase.server";

type AgreementView = {
  id: string;
  title: string;
  body: string;
  status: string;
  leadName: string;
  leadEmail: string;
  signedAt: string;
  signerName: string;
};

type AgreementRecord = {
  id: string;
  title?: string;
  body?: string;
  status?: string;
  signed_at?: string;
  signer_name?: string;
  expand?: { lead?: { name?: string; email?: string } };
};

export async function loader({ params }: LoaderFunctionArgs) {
  const token = String(params.token || "");
  if (!/^[a-f0-9]{64}$/.test(token)) return { agreement: null as AgreementView | null };
  try {
    const raw = await findAgreementByToken(token) as AgreementRecord | null;
    if (!raw) return { agreement: null as AgreementView | null };
    const lead = raw.expand?.lead || {};
    return {
      agreement: {
        id: raw.id,
        title: String(raw.title || ""),
        body: String(raw.body || ""),
        status: String(raw.status || ""),
        leadName: String(lead.name || ""),
        leadEmail: String(lead.email || ""),
        signedAt: String(raw.signed_at || ""),
        signerName: String(raw.signer_name || "")
      } satisfies AgreementView
    };
  } catch {
    return { agreement: null as AgreementView | null };
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = String(params.token || "");
  if (!/^[a-f0-9]{64}$/.test(token)) return Response.json({ error: "This signing link is invalid." }, { status: 400 });
  const form = await request.formData();
  const signerName = String(form.get("signer_name") || "").trim().slice(0, 120);
  const consent = form.get("consent") === "on";
  if (!signerName || !consent) {
    return Response.json({ error: "Enter your full name and confirm electronic-signature consent." }, { status: 422 });
  }

  try {
    const raw = await findAgreementByToken(token) as AgreementRecord | null;
    if (!raw) return Response.json({ error: "This signing link could not be found." }, { status: 404 });
    if (raw.status === "signed") return Response.json({ error: "This document has already been signed." }, { status: 409 });
    if (raw.status !== "sent") return Response.json({ error: "This document is not available for signing." }, { status: 409 });

    const userAgent = (request.headers.get("user-agent") || "").slice(0, 500);
    await pbServer(`api/collections/agreements/records/${encodeURIComponent(raw.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "signed",
        signer_name: signerName,
        signer_consent: true,
        signer_ip: "Not captured by the application server",
        signer_user_agent: userAgent,
        signed_at: new Date().toISOString()
      })
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "We could not record your signature. Please contact the advisor who sent the agreement." }, { status: 503 });
  }
}

export function meta() {
  return [{ title: "Review and sign | Student Loans Solutions" }, { name: "robots", content: "noindex,nofollow" }];
}

export default function SignPage() {
  const { agreement } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as { error?: string; ok?: boolean } | undefined;
  const navigation = useNavigation();
  if (!agreement) return <main className="app-page"><section className="panel sign-panel"><h1>Signing link unavailable</h1><p>This link is invalid or the document is no longer available. Contact the advisor who provided it.</p></section></main>;

  return (
    <main className="app-page sign-page">
      <div className="app-brand"><Link to="/">Student Loans Solutions</Link><span>Document review and electronic acknowledgment</span></div>
      <section className="panel sign-panel">
        <p className="eyebrow">DOCUMENT FOR REVIEW</p><h1>{agreement.title}</h1>
        <div className="sign-meta"><div><span>Prepared for</span><strong>{agreement.leadName || agreement.leadEmail || "Client"}</strong></div><div><span>Status</span><strong>{agreement.status}</strong></div></div>
        <article className="agreement-document">{agreement.body}</article>
        {agreement.status === "signed" ? (
          <div className="notice success">Signed by {agreement.signerName} on {agreement.signedAt ? new Date(agreement.signedAt).toLocaleString() : "recorded date unavailable"}.</div>
        ) : agreement.status === "sent" ? (
          <Form method="post" className="sign-form">
            <p>By entering your name and checking the consent box, you intend to sign this document electronically.</p>
            <label>Full legal name<input name="signer_name" autoComplete="name" maxLength={120} required /></label>
            <label className="check-label"><input type="checkbox" name="consent" required /> I agree to use an electronic signature and intend my typed name to represent my signature on this document.</label>
            {actionData?.error && <p className="error" role="alert">{actionData.error}</p>}
            <button className="button" disabled={navigation.state !== "idle"}>{navigation.state !== "idle" ? "Recording…" : "Sign document"}</button>
          </Form>
        ) : <p className="notice">This document is not currently available for signature.</p>}
        <p className="small-note">This workflow records a typed name, electronic-signature consent, timestamp and browser user-agent metadata. The application cannot verify the source IP behind Hostinger's proxy. This is not a certificate-based digital-signature service.</p>
      </section>
    </main>
  );
}
