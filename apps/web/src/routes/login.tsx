import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { pb, pocketBaseSetupMessage } from "../lib/pocketbase.client";

export function meta() {
  return [{ title: "Advisor sign in | Student Loans Solutions" }, { name: "robots", content: "noindex,nofollow" }];
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!pb) { setError(pocketBaseSetupMessage()); return; }
    setBusy(true);
    try {
      await pb.collection("users").authWithPassword(email.trim(), password);
      const role = String(pb.authStore.record?.role || "");
      if (!["admin", "advisor"].includes(role)) {
        pb.authStore.clear();
        setError("This account is not authorized for the advisor workspace.");
        return;
      }
      navigate("/crm");
    } catch {
      setError("Sign-in failed. Check your email and password or contact the site administrator.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    setError("");
    if (!pb) { setError(pocketBaseSetupMessage()); return; }
    if (!email.trim()) { setError("Enter your advisor email address first."); return; }
    try {
      await pb.collection("users").requestPasswordReset(email.trim());
      setError("When the account is eligible, PocketBase will send a password-reset email. Check your inbox and spam folder.");
    } catch {
      setError("We could not request a reset. Check the email address or contact the site administrator.");
    }
  }

  return (
    <main className="app-page login-page">
      <div className="app-brand"><Link to="/">Student Loans Solutions</Link><span>Your path to financial freedom</span></div>
      <section className="panel login-panel">
        <p className="eyebrow">PRIVATE ADVISOR WORKSPACE</p>
        <h1>Welcome back.</h1>
        <p className="muted">Sign in to manage inquiries, cases and client agreements.</p>
        <form onSubmit={submit}>
          <label>Email address<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
          {error && <p className="error" role="status">{error}</p>}
          <button className="button" disabled={busy}>{busy ? "Signing in…" : "Sign in to workspace"}</button>
        </form>
        <button className="text-button" type="button" onClick={resetPassword}>Forgot password?</button>
        <p className="small-note">Access is by invitation only. <Link to="/">Return to the public website</Link>.</p>
      </section>
    </main>
  );
}
