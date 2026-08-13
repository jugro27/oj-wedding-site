import Link from "next/link";

const scheduleItems = [
  { time: "Afternoon", title: "Ceremony", note: "Time to be announced" },
  { time: "Afterward", title: "Cocktail hour", note: "Details coming soon" },
  { time: "Evening", title: "Dinner & dancing", note: "Stay awhile" },
];

const travelCards = [
  {
    number: "01",
    title: "Getting here",
    copy: "Flight and airport recommendations will be shared here.",
  },
  {
    number: "02",
    title: "Where to stay",
    copy: "Hotel blocks and nearby stays are being gathered for you.",
  },
  {
    number: "03",
    title: "Getting around",
    copy: "Transportation details to and from the venue are coming soon.",
  },
];

const faqItems = [
  "What should I wear?",
  "Can I bring a guest?",
  "Will the celebration be indoors or outdoors?",
  "When should I RSVP?",
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="monogram" href="#top" aria-label="Olivia and Juliann, home">
          O <span>&amp;</span> J
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#details">Details</a>
          <a href="#travel">Travel</a>
          <a href="#faq">FAQ</a>
          <Link className="nav-rsvp" href="/rsvp">
            RSVP
          </Link>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-flourish hero-flourish-left" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">We&apos;re getting married</p>
          <h1>
            <span>Olivia</span>
            <em>&amp;</em>
            <span>Juliann</span>
          </h1>
          <div className="hero-rule" aria-hidden="true">
            <span />
            <svg viewBox="0 0 42 22" role="img">
              <path d="M1 20C10 20 13 2 21 2s11 18 20 18" />
            </svg>
            <span />
          </div>
          <p className="hero-date">November 5, 2027</p>
          <p className="hero-place">San Marcos, Texas</p>
          <Link className="button button-primary" href="/rsvp">
            RSVP to celebrate
          </Link>
        </div>
        <div className="hero-flourish hero-flourish-right" aria-hidden="true" />
        <div className="scroll-note" aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </section>

      <section className="intro section-shell" aria-labelledby="welcome-title">
        <div className="image-placeholder portrait-placeholder" role="img" aria-label="Placeholder for a portrait of Olivia and Juliann">
          <span>Our photo</span>
          <small>Coming soon</small>
        </div>
        <div className="intro-copy">
          <p className="eyebrow">Together with our favorite people</p>
          <h2 id="welcome-title">Meet us under the Texas sky</h2>
          <p>
            We can&apos;t wait to gather with the people we love most for an
            autumn evening full of good food, happy tears, and dancing.
          </p>
          <p className="script-note">See you in San Marcos</p>
        </div>
      </section>

      <section className="details" id="details" aria-labelledby="details-title">
        <div className="section-heading">
          <p className="eyebrow">The celebration</p>
          <h2 id="details-title">Save the date</h2>
        </div>
        <div className="detail-grid section-shell">
          <article className="venue-card">
            <p className="detail-kicker">Friday</p>
            <p className="date-number">05</p>
            <p className="detail-kicker">November 2027</p>
          </article>
          <article className="venue-copy">
            <p className="eyebrow">The venue</p>
            <h3>Windemere Farms</h3>
            <address>
              200 Windermere Rd<br />
              San Marcos, TX 78666
            </address>
            <a
              className="text-link"
              href="https://www.google.com/maps/search/?api=1&query=200+Windermere+Rd+San+Marcos+TX+78666"
              target="_blank"
              rel="noreferrer"
            >
              View on map <span aria-hidden="true">↗</span>
            </a>
          </article>
          <div className="image-placeholder landscape-placeholder" role="img" aria-label="Placeholder for a photograph of Windemere Farms">
            <span>Venue photograph</span>
            <small>Coming soon</small>
          </div>
        </div>
      </section>

      <section className="schedule section-shell" aria-labelledby="schedule-title">
        <div className="section-heading align-left">
          <p className="eyebrow">What to expect</p>
          <h2 id="schedule-title">The day</h2>
          <p>We&apos;re still putting the finishing touches on the timeline.</p>
        </div>
        <ol className="timeline">
          {scheduleItems.map((item) => (
            <li key={item.title}>
              <span className="timeline-dot" aria-hidden="true" />
              <p>{item.time}</p>
              <h3>{item.title}</h3>
              <small>{item.note}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="travel" id="travel" aria-labelledby="travel-title">
        <div className="section-heading">
          <p className="eyebrow">Plan your visit</p>
          <h2 id="travel-title">Travel &amp; stay</h2>
          <p>Everything you need for a lovely weekend in the Hill Country.</p>
        </div>
        <div className="travel-grid section-shell">
          {travelCards.map((card) => (
            <article key={card.title}>
              <span>{card.number}</span>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
              <small>Details to come</small>
            </article>
          ))}
        </div>
      </section>

      <section className="faq section-shell" id="faq" aria-labelledby="faq-title">
        <div className="section-heading align-left">
          <p className="eyebrow">Good to know</p>
          <h2 id="faq-title">Questions</h2>
          <p>We&apos;ll add answers as the celebration gets closer.</p>
        </div>
        <ul className="faq-list">
          {faqItems.map((item) => (
            <li key={item}>
              <span>{item}</span>
              <small>Answer coming soon</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="rsvp-banner" aria-labelledby="rsvp-title">
        <p className="eyebrow">We hope you&apos;ll join us</p>
        <h2 id="rsvp-title">Let&apos;s celebrate together</h2>
        <p>Find your invitation and let us know if you can make it.</p>
        <Link className="button button-light" href="/rsvp">
          RSVP now
        </Link>
      </section>

      <footer>
        <p className="monogram">O <span>&amp;</span> J</p>
        <p>November 5, 2027 · San Marcos, Texas</p>
      </footer>
    </main>
  );
}
