import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import type { RecordModel } from "pocketbase";
import { pb, pocketBaseSetupMessage } from "../lib/pocketbase.client";

const statuses = ["New", "Contacted", "In review", "Qualified", "Closed"];

export function meta() {
  return [{ title: "Advisor CRM | Student Loans Solutions" }, { name: "robots", content: "noindex,nofollow" }];
}

export default function CrmPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordModel[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", topic: "Federal", balance: "", message: "" });
  const [agreement, setAgreement] = useState({ title: "Engagement agreement", body: "Please review this agreement carefully. By typing your full name and accepting electronic records and signatures, you agree to sign this document electronically." });
  const [signingUrl, setSigningUrl] = useState("");

  const load = useCallback(async () => {
    if (!pb) { setError(pocketBaseSetupMessage()); setLoading(false); return; }
    const user = pb.authStore.record;
    if (!pb.authStore.isValid || !user || !["admin", "advisor"].includes(String(user.role || ""))) {
      navigate("/login");
      return;
    }
    try {
      const result = await pb.collection("leads").getFullList<RecordModel>({ sort: "-created" });
      setRecords(result);
      setError("");
    } catch {
      setError("Could not load CRM records. Confirm the PocketBase leads collection rules and fields.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { void load(); }, [load]);

  const selected = records.find(record => record.id === selectedId) || null;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(record =>
      [record.name, record.email, record.phone, record.loan_type, record.status]
        .some(value => String(value || "").toLowerCase().includes(q))
    );
  }, [records, search]);

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pb) return;
    setSaving(true);
    setError("");
    try {
      const record = await pb.collection("leads").create({
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        loan_type: draft.topic,
        balance: draft.balance,
        message: draft.message,
        status: "New",
        consent: true
      });
      setRecords(current => [record, ...current]);
      setSelectedId(record.id);
      setDraft({ name: "", email: "", phone: "", topic: "Federal", balance: "", message: "" });
    } catch {
      setError("Could not create this client. Verify the leads collection schema and advisor access rules.");
    } finally { setSaving(false); }
  }

  async function updateRecord(field: "status" | "notes" | "follow_up", value: string) {
    if (!pb || !selected) return;
    try {
      const updated = await pb.collection("leads").update(selected.id, { [field]: value });
      setRecords(current => current.map(record => record.id === updated.id ? updated : record));
    } catch {
      setError("This update was not saved. Check the leads collection permissions.");
    }
  }

  async function createSigningLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pb || !selected) return;
    setSaving(true);
    setError("");
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const token = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
      await pb.collection("agreements").create({
        lead: selected.id,
        title: agreement.title.trim(),
        body: agreement.body,
        status: "sent",
        token,
        sent_at: new Date().toISOString(),
        created_by: pb.authStore.record?.id || ""
      });
      const url = `${window.location.origin}/sign/${token}`;
      setSigningUrl(url);
      try { await navigator.clipboard?.writeText(url); } catch { /* Link stays visible for manual copying. */ }
    } catch {
      setError("Could not create the signing link. Verify the agreements collection fields and advisor permissions.");
    } finally { setSaving(false); }
  }

  function signOut() {
    pb?.authStore.clear();
    navigate("/login");
  }

  const newCount = records.filter(record => record.status === "New").length;
  const inReview = records.filter(record => record.status === "In review").length;

  return (
    <main className="app-page crm-page">
      <header className="app-topbar">
        <div className="app-brand"><Link to="/">Student Loans Solutions</Link><span>Advisor workspace</span></div>
        <div className="top-actions"><span>{pb?.authStore.record?.email}</span><button className="button secondary" onClick={signOut}>Sign out</button></div>
      </header>
      <section className="crm-heading"><div><p className="eyebrow">CLIENT MANAGEMENT</p><h1>Inquiry overview</h1><p className="muted">Review new inquiries, manage follow-ups and prepare client agreements.</p></div></section>
      <section className="stats-grid">
        <div className="stat-card"><span>Total clients</span><strong>{records.length}</strong></div>
        <div className="stat-card"><span>New inquiries</span><strong>{newCount}</strong></div>
        <div className="stat-card"><span>In review</span><strong>{inReview}</strong></div>
      </section>
      {error && <p className="error banner" role="alert">{error}</p>}
      <div className="crm-layout">
        <section className="panel client-list">
          <div className="section-title"><h2>Clients</h2><button className="button small" onClick={() => { setSelectedId(""); setSigningUrl(""); }}>New client</button></div>
          <input aria-label="Search clients" placeholder="Search name, email or status…" value={search} onChange={e => setSearch(e.target.value)} />
          {loading ? <p className="muted">Loading CRM records…</p> : filtered.length === 0 ? <p className="empty-state">No matching client records yet.</p> : (
            <div className="client-items">{filtered.map(record => (
              <button key={record.id} className={selectedId === record.id ? "client-item active" : "client-item"} onClick={() => { setSelectedId(record.id); setSigningUrl(""); }}>
                <strong>{String(record.name || "Unnamed client")}</strong><span>{String(record.email || "")}</span><small>{String(record.status || "New")}</small>
              </button>
            ))}</div>
          )}
        </section>
        <section className="panel client-detail">
          {!selected ? (
            <>
              <p className="eyebrow">NEW CLIENT</p><h2>Create client record</h2>
              <form onSubmit={createLead} className="form-grid">
                <label>Full name<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} required /></label>
                <label>Email<input type="email" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} required /></label>
                <label>Phone<input value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></label>
                <label>Loan type<select value={draft.topic} onChange={e => setDraft({ ...draft, topic: e.target.value })}><option>Federal</option><option>Private</option><option>Both</option><option>Not sure</option></select></label>
                <label>Estimated balance<input value={draft.balance} onChange={e => setDraft({ ...draft, balance: e.target.value })} /></label>
                <label className="wide">Initial notes<textarea value={draft.message} onChange={e => setDraft({ ...draft, message: e.target.value })} rows={4} /></label>
                <button className="button" disabled={saving}>{saving ? "Saving…" : "Save client"}</button>
              </form>
            </>
          ) : (
            <>
              <p className="eyebrow">CLIENT RECORD</p><h2>{String(selected.name || "Client")}</h2>
              <div className="detail-grid"><div><span>Email</span><strong>{String(selected.email || "—")}</strong></div><div><span>Phone</span><strong>{String(selected.phone || "—")}</strong></div><div><span>Loan type</span><strong>{String(selected.loan_type || "—")}</strong></div><div><span>Balance range</span><strong>{String(selected.balance || "—")}</strong></div></div>
              <label>Status<select value={String(selected.status || "New")} onChange={e => void updateRecord("status", e.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
              <label>Follow-up date<input type="date" value={String(selected.follow_up || "")} onChange={e => void updateRecord("follow_up", e.target.value)} /></label>
              <label>Advisor notes<textarea rows={5} defaultValue={String(selected.notes || "")} onBlur={e => void updateRecord("notes", e.target.value)} /></label>
              <p className="small-note">Do not store Social Security numbers, FSA IDs, passwords, payment credentials or full loan account numbers in notes.</p>
              <div className="agreement-box">
                <p className="eyebrow">ELECTRONIC AGREEMENT</p><h3>Prepare a signing link</h3>
                <form onSubmit={createSigningLink}>
                  <label>Document title<input value={agreement.title} onChange={e => setAgreement({ ...agreement, title: e.target.value })} required /></label>
                  <label>Agreement text<textarea rows={6} value={agreement.body} onChange={e => setAgreement({ ...agreement, body: e.target.value })} required /></label>
                  <button className="button" disabled={saving}>{saving ? "Creating…" : "Create signing link & copy"}</button>
                </form>
                {signingUrl && <p className="success">Signing link created: <a href={signingUrl} target="_blank" rel="noreferrer">{signingUrl}</a></p>}
                <p className="small-note">This captures a typed-name electronic acknowledgment and consent, with a timestamp and request metadata. It is not represented as a qualified digital-signature certificate.</p>
              </div>
            </>
          )}
        </section>
      </div>
      <p className="small-note privacy-reminder">Private workspace · Student Loans Solutions is an independent educational service, not a government agency or loan servicer.</p>
    </main>
  );
}
