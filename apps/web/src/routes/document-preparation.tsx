import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";

export function meta() {
  return [{ title: "Document preparation | Student Loans Solutions" }, { name: "robots", content: "noindex,nofollow" }];
}

export default function DocumentPreparationPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      topic: form.get("topic"),
      message: form.get("message"),
      consent: form.get("consent") === "on",
      website: form.get("website")
    };
    try {
      const response = await fetch("/api/public-inquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Submission failed.");
      setResult("Your request has been received. An advisor can follow up using the contact information you provided.");
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not submit your request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-page public-intake">
      <div className="app-brand"><Link to="/">Student Loans Solutions</Link><span>Your path to financial freedom</span></div>
      <section className="panel intake-panel">
        <p className="eyebrow">DOCUMENT PREPARATION</p><h1>Prepare your case with confidence.</h1>
        <p className="muted">Share your contact details and the type of assistance you are exploring. An advisor will follow up about next steps.</p>
        <div className="notice"><strong>Protect your information:</strong> Never enter your FSA ID, password, MFA code, Social Security number or full loan account number. Government sign-in must happen directly on StudentAid.gov.</div>
        <form className="form-grid" onSubmit={submit}>
          <label>Full name<input name="name" autoComplete="name" maxLength={120} required /></label>
          <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          <label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
          <label>Service requested<select name="topic"><option>Forgiveness program review</option><option>Repayment documentation</option><option>General document preparation</option><option>Other question</option></select></label>
          <label className="wide">What assistance are you looking for?<textarea name="message" rows={5} maxLength={3000} required /></label>
          <label className="wide check-label"><input type="checkbox" name="consent" required /> I consent to being contacted about this inquiry and understand this is an independent service, not a government agency or loan servicer.</label>
          <label className="honeypot">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <button className="button" disabled={busy}>{busy ? "Submitting…" : "Submit request"}</button>
          {error && <p className="error wide" role="alert">{error}</p>}
          {result && <p className="success wide" role="status">{result}</p>}
        </form>
      </section>
      <p className="small-note"><Link to="/">← Back to Student Loans Solutions</Link> · Official federal resources: <a href="https://studentaid.gov/" target="_blank" rel="noreferrer">StudentAid.gov</a></p>
    </main>
  );
}
