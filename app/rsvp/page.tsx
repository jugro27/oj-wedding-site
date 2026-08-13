import type { Metadata } from "next";
import Link from "next/link";
import { RSVPForm } from "./rsvp-form";

export const metadata: Metadata = {
  title: "RSVP | Juliann & Olivia",
  description: "Respond to your invitation for Juliann and Olivia's wedding.",
};

export default function RSVPPage() {
  return (
    <main className="rsvp-page">
      <header className="rsvp-header">
        <Link className="monogram" href="/" aria-label="Juliann and Olivia, home">
          J <span>&amp;</span> O
        </Link>
        <Link className="rsvp-back-link" href="/">
          <span aria-hidden="true">←</span> Back to our wedding
        </Link>
      </header>

      <section className="rsvp-hero" aria-labelledby="rsvp-page-title">
        <p className="eyebrow">November 5, 2027 · San Marcos, Texas</p>
        <h1 id="rsvp-page-title">Will you join us?</h1>
        <p>Enter the invitation code included with your invitation.</p>
      </section>

      <RSVPForm />

      <footer className="rsvp-footer">
        <p>Juliann &amp; Olivia</p>
        <p>We can&apos;t wait to celebrate with you.</p>
      </footer>
    </main>
  );
}
