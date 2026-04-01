import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const SECTIONS = [
  {
    label: 'For Everyone',
    items: [
      {
        q: 'What is RallyBro?',
        a: 'RallyBro is a free platform that connects sports fans who have an extra ticket ("Listers") with fans who want to attend ("Seekers"). Listers offer their spare seats at no cost, and Seekers claim them, creating a genuine game-day connection between two fans.',
      },
      {
        q: 'Is it really free?',
        a: 'Yes, completely. Tickets are always free on RallyBro. We will never charge Seekers for a ticket, and Listers cannot request payment. Creating an account and using all features is free.',
      },
      {
        q: 'Who can use RallyBro?',
        a: 'Anyone 18 or older with a valid email address and phone number. We verify age at signup. Minors are not permitted to create accounts.',
      },
      {
        q: 'Is my personal information safe?',
        a: 'Yes. Your email address and phone number are never shared with other users. All coordination happens through our in-app messaging system. We store your data securely and do not sell it to third parties.',
      },
      {
        q: 'What sports are supported?',
        a: 'Currently: Baseball, Soccer, Basketball, Football, and Hockey. We plan to expand to more sports as the community grows.',
      },
    ],
  },
  {
    label: 'For Seekers',
    items: [
      {
        q: 'How do I claim a ticket?',
        a: 'Browse the feed on the home page, filter by sport or zip code, and click "Claim Ticket" on any listing you\'re interested in. Claims are first come, first served. You\'ll be connected with the Lister immediately through in-app chat.',
      },
      {
        q: 'Can I claim more than one ticket at a time?',
        a: 'No. You can only hold one active claim at a time. Once the event date passes, you\'re free to claim another ticket.',
      },
      {
        q: 'What happens if the Lister doesn\'t show up?',
        a: 'If a Lister fails to confirm ticket transfer before the event, the meet is automatically cancelled. We recommend confirming all details in chat before game day. If you experience issues, contact us at partnerships@rallybro.com.',
      },
      {
        q: 'What if I can\'t make it after claiming?',
        a: 'Cancel the meet through the in-app chat as early as possible. The ticket will automatically be re-listed for other seekers. Repeated no-shows may result in account suspension.',
      },
      {
        q: 'Do I need to pay anything?',
        a: 'Never. Seeking a ticket on RallyBro is completely free. If anyone requests payment, inside or outside the app, please report it immediately.',
      },
    ],
  },
  {
    label: 'For Listers',
    items: [
      {
        q: 'How do I list my extra ticket?',
        a: 'Click "+ List My Ticket" from the home page or nav. Fill in the event name, sport, date, time, venue, and zip code. You can also add optional preferences about the type of fan you\'re looking for. Your listing goes live instantly.',
      },
      {
        q: 'Can I list multiple tickets?',
        a: 'You can have multiple listings active at once, but each listing is for one ticket (one companion). If you have several extra tickets for different events, list each one separately.',
      },
      {
        q: 'What if nobody claims my ticket?',
        a: 'Your listing stays open until someone claims it or you cancel it. There\'s no expiry. The ticket remains visible to seekers right up to the event.',
      },
      {
        q: 'What if the Seeker doesn\'t respond?',
        a: 'If a Seeker doesn\'t send their first message within 2 hours of claiming, the claim is automatically cancelled and your ticket is re-listed. You\'ll be notified and can wait for the next person to claim it.',
      },
      {
        q: 'Can I choose who gets my ticket?',
        a: 'Claims are first come, first served, but you can set preferences (preferred fan level and age range) in your listing to attract the right kind of fan. You can also cancel the meet if circumstances change, though repeated selective cancellations are discouraged.',
      },
    ],
  },
  {
    label: 'Stadium Partners',
    items: [
      {
        q: 'How does the discount work?',
        a: 'Partner stadiums offer exclusive discounts on concessions, merchandise, or future tickets to verified RallyBro members. Details vary by partner. Look for the partner badge on listings.',
      },
      {
        q: 'How do I become a partner stadium?',
        a: 'We\'d love to partner with you. Reach out to us at partnerships@rallybro.com with your venue name, location, and what you\'d like to offer the community.',
      },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const id = `faq-${q.replace(/\s+/g, '-').toLowerCase().slice(0, 40)}`;

  return (
    <div className={`faq-item${open ? ' faq-item-open' : ''}`}>
      <button
        className="faq-question"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={id}
      >
        <span>{q}</span>
        <span className="faq-chevron" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      <div
        id={id}
        className="faq-answer"
        role="region"
        aria-hidden={!open}
      >
        <p>{a}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const title = 'FAQ - RallyBro Frequently Asked Questions';
  const description = 'Got questions about RallyBro? Find answers about claiming tickets, listing extras, safety, and more.';

  return (
    <main className="faq-page container" id="main-content">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://rallybro.com/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://rallybro.com/og-image.png" />
      </Helmet>
      <div className="legal-header">
        <h1>Frequently Asked Questions</h1>
        <p className="legal-updated">Can't find what you're looking for? Email us at <a href="mailto:partnerships@rallybro.com" className="legal-link">partnerships@rallybro.com</a></p>
      </div>

      <div className="faq-body">
        {SECTIONS.map(section => (
          <section key={section.label} className="faq-section" aria-labelledby={`faq-section-${section.label.replace(/\s+/g, '-').toLowerCase()}`}>
            <h2 id={`faq-section-${section.label.replace(/\s+/g, '-').toLowerCase()}`} className="faq-section-title">
              {section.label}
            </h2>
            <div className="faq-list">
              {section.items.map(item => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
