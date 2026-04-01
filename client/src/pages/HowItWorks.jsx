import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LISTER_STEPS = [
  { n: 1, title: 'Create your free account',        body: 'Sign up in under a minute with your name, email, and phone.' },
  { n: 2, title: 'List your extra ticket in 60 seconds', body: 'Add the event, date, venue, and zip. Optionally tell seekers what kind of fan you\'re looking for.' },
  { n: 3, title: 'A verified fan claims your ticket', body: 'When someone claims it, you\'ll get a notification and can start chatting immediately.' },
  { n: 4, title: 'Chat inside the app and make a plan', body: 'Coordinate meetup details through the in-app chat. No personal info shared.' },
  { n: 5, title: 'Meet at the game and enjoy it together', body: 'Show up, find your new sports buddy, and enjoy the game. That\'s it.' },
];

const SEEKER_STEPS = [
  { n: 1, title: 'Create your free account (18+ only)', body: 'Sign up with your real name, email, and phone. You must be 18 or older.' },
  { n: 2, title: 'Enter your zip code and find tickets near you', body: 'Browse open tickets filtered by sport and location. No subscription needed.' },
  { n: 3, title: 'Claim a ticket, first come, first served', body: 'Spot a game you want to attend? Claim it instantly. One active claim at a time.' },
  { n: 4, title: 'Say hello to your Lister in the chat', body: 'You have 2 hours to respond after claiming. Introduce yourself and confirm the plan.' },
  { n: 5, title: 'Show up, meet your new sports buddy, have fun', body: 'Get to the game, meet your Lister, and enjoy. Rate your experience when it\'s over.' },
];

const TRUST_ITEMS = [
  { title: 'Real identity required',       body: 'Every user registers with their real name, email, and phone number.' },
  { title: '18+ age verification',          body: 'Date of birth is verified on signup. Minors cannot create accounts.' },
  { title: 'In-app messaging only',         body: 'All coordination happens inside the app. No personal contact info is ever exchanged.' },
  { title: '2-hour response window',        body: 'Seekers must respond within 2 hours of claiming or the ticket is automatically re-listed.' },
  { title: 'Transfer confirmation required', body: 'Listers must confirm the ticket was sent before match day or the meet is cancelled.' },
];

export default function HowItWorks({ openAuth }) {
  const { user } = useAuth();

  return (
    <main id="main-content">
      {/* ─── Hero ─── */}
      <section className="hiw-hero" aria-label="How it works hero">
        <div className="container">
          <h1 className="hiw-hero-title">How <span>RallyBro</span> Works</h1>
          <p className="hiw-hero-sub">Two fans. One spare ticket. A game to remember.</p>
        </div>
      </section>

      {/* ─── Lister vs Seeker ─── */}
      <section className="hiw-roles container" aria-label="Lister or seeker">
        <h2 className="hiw-section-title">Are you a <span className="text-green">Lister</span> or a <span className="text-gold">Seeker</span>?</h2>
        <div className="hiw-roles-grid">
          <div className="hiw-role-card hiw-role-lister" role="region" aria-label="Lister description">
            <h3>Lister</h3>
            <p>You have an extra ticket and want a real fan to enjoy the game with you, not an empty seat.</p>
            <ul>
              <li>List your ticket for free</li>
              <li>Choose what kind of fan you want</li>
              <li>Make a new sports friend</li>
            </ul>
          </div>
          <div className="hiw-role-card hiw-role-seeker" role="region" aria-label="Seeker description">
            <h3>Seeker</h3>
            <p>You want to attend a game and meet fellow fans, without paying scalper prices.</p>
            <ul>
              <li>Browse free tickets near you</li>
              <li>Claim instantly, no payment ever</li>
              <li>Show up and have fun</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Lister Steps ─── */}
      <section className="hiw-steps-section hiw-steps-lister" aria-label="Steps for listers">
        <div className="container">
          <h2 className="hiw-section-title">For Listers</h2>
          <div className="hiw-steps-grid">
            {LISTER_STEPS.map(s => (
              <div key={s.n} className="hiw-step-card" role="listitem">
                <div className="hiw-step-num" aria-hidden="true">{s.n}</div>
                <h3 className="hiw-step-title">{s.title}</h3>
                <p className="hiw-step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Seeker Steps ─── */}
      <section className="hiw-steps-section hiw-steps-seeker" aria-label="Steps for seekers">
        <div className="container">
          <h2 className="hiw-section-title">For Seekers</h2>
          <div className="hiw-steps-grid">
            {SEEKER_STEPS.map(s => (
              <div key={s.n} className="hiw-step-card" role="listitem">
                <div className="hiw-step-num hiw-step-num-gold" aria-hidden="true">{s.n}</div>
                <h3 className="hiw-step-title">{s.title}</h3>
                <p className="hiw-step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust & Safety ─── */}
      <section className="hiw-trust" aria-label="Trust and safety">
        <div className="container">
          <h2 className="hiw-section-title">Trust &amp; Safety</h2>
          <p className="hiw-trust-sub">We take community safety seriously. Here's what protects every member.</p>
          <div className="hiw-trust-grid">
            {TRUST_ITEMS.map(item => (
              <div key={item.title} className="hiw-trust-card">
                <div>
                  <h3 className="hiw-trust-title">{item.title}</h3>
                  <p className="hiw-trust-body">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="hiw-cta" aria-label="Call to action">
        <div className="container">
          <h2 className="hiw-cta-title">Ready to Rally?</h2>
          <p className="hiw-cta-sub">Join thousands of fans sharing the stadium experience.</p>
          <div className="hiw-cta-btns">
            {!user && (
              <button className="btn btn-gold" onClick={() => openAuth('signup')} aria-label="Sign up">
                Sign Up Free
              </button>
            )}
            <Link to="/" className="btn btn-ghost-white" aria-label="Browse tickets">
              Browse Tickets
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
