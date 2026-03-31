import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VALUES = [
  { icon: '🤝', title: 'Community First',        body: 'Every feature we build is designed to bring fans closer together, not to maximize revenue.' },
  { icon: '🎟️', title: 'Accessibility',           body: 'Sports should be for everyone — not just those who can afford last-minute markup prices.' },
  { icon: '🛡️', title: 'Trust & Safety',          body: 'Real identities, age verification, and in-app communication keep our community safe.' },
  { icon: '🚫💰', title: 'No profit from tickets', body: 'Tickets are always free on our platform. We will never take a cut of a ticket\'s value.' },
];

export default function OurStory({ openAuth }) {
  const { user } = useAuth();

  return (
    <main id="main-content">
      {/* ─── Hero ─── */}
      <section className="hiw-hero" aria-label="Our story hero">
        <div className="container">
          <h1 className="hiw-hero-title">Our <span>Story</span></h1>
          <p className="hiw-hero-sub">Born in Portland. Built for fans everywhere.</p>
        </div>
      </section>

      {/* ─── The Problem ─── */}
      <section className="story-section" aria-label="The problem we solve">
        <div className="container story-content">
          <div className="story-eyebrow">The Problem</div>
          <h2 className="story-heading">Thousands of empty seats. Thousands of fans who should be in them.</h2>
          <p className="story-body">
            Every week, sports fans miss games they already paid for. Life happens — work, travel, family.
            Their seats sit empty while other fans who would love to be there never get the chance.
            We thought that was wrong.
          </p>
          <p className="story-body">
            Meanwhile, the only alternatives were overpriced resale apps where tickets get marked up 200%
            the night before a game. Real fans were being priced out of live sports, one scalped ticket at a time.
          </p>
        </div>
      </section>

      {/* ─── The Idea ─── */}
      <section className="story-section story-section-alt" aria-label="The idea">
        <div className="container story-content">
          <div className="story-eyebrow">The Idea</div>
          <h2 className="story-heading">What if unused tickets became connections?</h2>
          <p className="story-body">
            UWannaGoBro started with a simple question — what if the fan who can't make it could give another
            fan the experience of a lifetime? No scalping. No resale. No profit. Just two sports fans going
            to a game together.
          </p>
          <p className="story-body">
            We built a platform where ticket holders list their extra seats for free, and fans who want to
            attend claim them at no cost. The only requirement: show up, be real, and enjoy the game.
          </p>
          <blockquote className="story-quote">
            "Sports are better shared. Every fan deserves a seat."
          </blockquote>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="story-section" aria-label="Our values">
        <div className="container">
          <div className="story-eyebrow" style={{ textAlign: 'center' }}>What We Stand For</div>
          <h2 className="story-heading" style={{ textAlign: 'center' }}>Our Values</h2>
          <div className="story-values-grid">
            {VALUES.map(v => (
              <div key={v.title} className="story-value-card">
                <span className="story-value-icon" aria-hidden="true">{v.icon}</span>
                <h3 className="story-value-title">{v.title}</h3>
                <p className="story-value-body">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Portland section ─── */}
      <section className="story-section story-section-portland" aria-label="Based in Portland">
        <div className="container story-content">
          <div className="story-eyebrow">Where We're From</div>
          <h2 className="story-heading">Rooted in Portland sports culture</h2>
          <p className="story-body">
            We built UWannaGoBro in Portland, Oregon — home of the Timbers Army, Rip City, and some of the
            most passionate sports fans in the country. The culture here is different. Fans don't just watch
            games, they live them. They share scarves, chants, and postgame beers with strangers who
            become friends.
          </p>
          <p className="story-body">
            That spirit — of community, of generosity, of showing up for each other — is what UWannaGoBro
            is built on. We started here, but the idea belongs to every city, every stadium, every fan
            who's ever wished they had someone to go to a game with.
          </p>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="hiw-cta" aria-label="Join the community">
        <div className="container">
          <h2 className="hiw-cta-title">Join the community</h2>
          <p className="hiw-cta-sub">Be part of something bigger than a ticket.</p>
          <div className="hiw-cta-btns">
            {!user ? (
              <button className="btn btn-gold" onClick={() => openAuth('signup')} aria-label="Sign up free">
                Sign Up Free
              </button>
            ) : (
              <Link to="/" className="btn btn-gold" aria-label="Browse tickets">
                Browse Tickets
              </Link>
            )}
            <Link to="/how-it-works" className="btn btn-ghost-white" aria-label="How it works">
              How It Works
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
