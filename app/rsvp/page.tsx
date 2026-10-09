import type { Metadata } from "next";
import Link from "next/link";
import { RSVPForm } from "./rsvp-form";

export const metadata: Metadata = {
  title: "RSVP | Olivia & Juliann",
  description: "Respond to your invitation for Olivia & Juliann's wedding.",
};

export default function RSVPPage() {
  return (
    <main className="rsvp-page">
      <header className="rsvp-header">
        <Link className="monogram" href="/" aria-label="Olivia & Juliann, home">
          O <span>&amp;</span> J
        </Link>
        <Link className="rsvp-back-link" href="/">
          <span aria-hidden="true">←</span> Back to our wedding
        </Link>
      </header>

      <section className="rsvp-hero" aria-labelledby="rsvp-page-title">
        <p className="eyebrow">November 7, 2027 · Austin, Texas</p>
        <h1 id="rsvp-page-title">Will you join us?</h1>
        <p>Enter the invitation code included with your invitation.</p>
      </section>

      <RSVPForm />

      <footer className="rsvp-footer">
        <p>Olivia &amp; Juliann</p>
        <p>We can&apos;t wait to celebrate with you.</p>
      </footer>
    </main>
  );
}
