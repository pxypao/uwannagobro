import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <main className="legal-page container" id="main-content">
      <div className="legal-header">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: March 2026</p>
      </div>

      <div className="legal-body">

        <section aria-labelledby="tos-1">
          <h2 id="tos-1">1. Introduction &amp; Acceptance of Terms</h2>
          <p>
            Welcome to UWannaGoBro ("we," "us," or "our"). By accessing or using our platform at
            uwannagobro.com (the "Service"), you agree to be bound by these Terms of Service.
            Please read them carefully. If you do not agree to these terms, do not use the Service.
          </p>
          <p>
            UWannaGoBro is a community platform that connects sports fans who have extra tickets
            ("Listers") with fans who would like to attend events ("Seekers"). No money changes
            hands through our platform for tickets.
          </p>
        </section>

        <section aria-labelledby="tos-2">
          <h2 id="tos-2">2. Eligibility</h2>
          <p>To use UWannaGoBro, you must:</p>
          <ul>
            <li>Be at least <strong>18 years of age</strong>. We verify your date of birth at signup.</li>
            <li>Have only <strong>one account</strong>. Creating multiple accounts is prohibited.</li>
            <li>Be a <strong>real person</strong> — bots, automated accounts, and fake profiles are not permitted.</li>
            <li>Provide accurate and truthful information during registration.</li>
          </ul>
          <p>
            We reserve the right to terminate accounts that do not meet these requirements at any time.
          </p>
        </section>

        <section aria-labelledby="tos-3">
          <h2 id="tos-3">3. User Accounts</h2>
          <p>
            You are required to register with your <strong>real name, email address, and phone number</strong>.
            Only one account is permitted per email address and per phone number.
          </p>
          <p>
            You are responsible for maintaining the confidentiality of your password and for all
            activity that occurs under your account. Notify us immediately at
            partnerships@uwannagobro.com if you suspect unauthorized access.
          </p>
        </section>

        <section aria-labelledby="tos-4">
          <h2 id="tos-4">4. Ticket Listings</h2>
          <ul>
            <li>All ticket listings must be for <strong>real events</strong> at valid venues.</li>
            <li>Tickets must be offered <strong>free of charge</strong>. No monetary exchange for tickets is permitted on or off the platform.</li>
            <li>Ticket claims are <strong>first come, first served</strong>. Listers cannot selectively approve or reject seekers on the basis of protected characteristics.</li>
            <li>Listers are responsible for ensuring the ticket they list is valid and transferable.</li>
            <li>A Lister may only have one active listing per event.</li>
          </ul>
        </section>

        <section aria-labelledby="tos-5">
          <h2 id="tos-5">5. Prohibited Conduct</h2>
          <p>Users may not:</p>
          <ul>
            <li><strong>Scalp or resell tickets</strong> — any request for payment, compensation, or "expenses" in connection with a ticket is strictly prohibited.</li>
            <li>Create <strong>fake or duplicate accounts</strong>.</li>
            <li>Harass, threaten, or demean other users.</li>
            <li>Request or offer <strong>off-platform payment</strong> of any kind in exchange for tickets.</li>
            <li>Use the platform to collect personal data from other users for purposes unrelated to the Service.</li>
            <li>Post fraudulent listings or claim tickets with no intent to attend.</li>
            <li>Engage in any conduct that violates applicable law.</li>
          </ul>
          <p>Violations may result in immediate account termination.</p>
        </section>

        <section aria-labelledby="tos-6">
          <h2 id="tos-6">6. Cancellations</h2>
          <ul>
            <li>
              <strong>2-hour response window:</strong> After claiming a ticket, Seekers must send their
              first message within 2 hours. If no response is received, the claim is automatically
              cancelled and the ticket is re-listed.
            </li>
            <li>
              <strong>24-hour transfer confirmation:</strong> Listers must confirm the ticket has been
              sent to the Seeker within 24 hours of the event date. If not confirmed, the meet is
              automatically cancelled.
            </li>
            <li>Either party may cancel a meet at any time through the in-app chat interface.</li>
            <li>Seekers may only hold one active claim at a time. Once the event passes, a new claim may be made.</li>
          </ul>
        </section>

        <section aria-labelledby="tos-7">
          <h2 id="tos-7">7. Limitation of Liability</h2>
          <p>
            UWannaGoBro is a platform that facilitates connections between users. We do not sell,
            broker, or guarantee any tickets. We are not responsible for:
          </p>
          <ul>
            <li>The validity, authenticity, or transferability of any listed ticket.</li>
            <li>The conduct of any user before, during, or after a meet-up.</li>
            <li>Any loss, injury, or damage arising from use of the Service.</li>
          </ul>
          <p>
            To the fullest extent permitted by law, UWannaGoBro's liability is limited to the amount
            you paid to use the Service (which is zero for most users).
          </p>
        </section>

        <section aria-labelledby="tos-8">
          <h2 id="tos-8">8. Privacy</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. We do not share your
            personal contact information (email, phone) with other users. All communication occurs
            through our in-app messaging system.
          </p>
        </section>

        <section aria-labelledby="tos-9">
          <h2 id="tos-9">9. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. When we do, we will update the "Last updated"
            date at the top of this page. Continued use of the Service after changes constitutes
            acceptance of the updated Terms.
          </p>
        </section>

        <section aria-labelledby="tos-10">
          <h2 id="tos-10">10. Contact</h2>
          <p>
            Questions about these Terms? Reach us at{' '}
            <a href="mailto:partnerships@uwannagobro.com" className="legal-link">
              partnerships@uwannagobro.com
            </a>.
          </p>
          <p>
            For partnership or stadium inquiries, use the same address.
          </p>
        </section>

      </div>
    </main>
  );
}
