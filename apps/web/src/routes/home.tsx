import { Link } from "react-router";

export function meta() {
  return [{ title: "Student Loans Solutions | Your path to financial freedom" }];
}

export default function HomePage() {
  return (
    <main className="app-page">
      <div className="app-brand"><Link to="/">Student Loans Solutions</Link><span>Your path to financial freedom</span></div>
      <section className="panel">
        <p className="eyebrow">INDEPENDENT GUIDANCE. REAL POSSIBILITIES.</p>
        <h1>Your path to financial freedom.</h1>
        <p className="muted">Educational guidance to help you understand student loan options, prepare your questions, and take your next step.</p>
        <p className="home-actions"><Link className="button" to="/document-preparation">Explore my options</Link><Link className="button secondary" to="/login">Advisor login</Link></p>
        <p className="small-note">Official federal resources: <a href="https://studentaid.gov/" target="_blank" rel="noreferrer">StudentAid.gov</a>.</p>
      </section>
    </main>
  );
}
