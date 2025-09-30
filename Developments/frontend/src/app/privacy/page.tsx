// frontend/src/app/privacy/page.tsx
'use client';

import Link from 'next/link';
import React from 'react';

const BRAND = 'SOUL — Stories Online, Unified Library';
const COMPANY = 'SOUL Team';
const CONTACT_EMAIL = 'privacy@soul.example'; // TODO: đổi email
const ADDRESS = '123 Nguyen Van Troi, Phu Nhuan, HCMC, Vietnam'; // TODO
const EFFECTIVE_DATE = 'September 30, 2025';
const JURISDICTION = 'Vietnam'; // TODO: đổi nếu cần

const sections = [
  { id: 'intro', label: '1. Introduction' },
  { id: 'data-we-collect', label: '2. Data We Collect' },
  { id: 'how-we-use', label: '3. How We Use Your Data' },
  { id: 'legal-bases', label: '4. Legal Bases' },
  { id: 'cookies', label: '5. Cookies & Tracking' },
  { id: 'analytics', label: '6. Analytics & Measurement' },
  { id: 'payments', label: '7. Payments' },
  { id: 'sharing', label: '8. Sharing & Disclosure' },
  { id: 'international', label: '9. International Transfers' },
  { id: 'retention', label: '10. Data Retention' },
  { id: 'your-rights', label: '11. Your Rights' },
  { id: 'children', label: '12. Children’s Privacy' },
  { id: 'security', label: '13. Security' },
  { id: 'third-party', label: '14. Third-Party Links' },
  { id: 'changes', label: '15. Changes to This Policy' },
  { id: 'contact', label: '16. Contact Us' },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b bg-gradient-to-b from-zinc-50 to-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
          <nav className="text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-700">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-700 font-medium">Privacy Policy</span>
          </nav>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900">
            Privacy Policy
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Last updated: {EFFECTIVE_DATE}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 py-10">
        {/* TOC */}
        <aside className="lg:block">
          <div className="sticky top-6 rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-700">On this page</h2>
            <ul className="mt-3 space-y-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block text-sm text-zinc-600 hover:text-zinc-900">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-10">
          <Card>
            <p className="text-zinc-700">
              This Privacy Policy explains how <strong>{COMPANY}</strong> (“we,” “us,” or “our”) collects,
              uses, discloses, and safeguards personal data when you use <strong>{BRAND}</strong> (the “Service”).
              By using the Service, you acknowledge this Policy. If you do not agree, please do not use the Service.
            </p>
          </Card>

          <Section id="intro" title="1. Introduction">
            <p>
              We are committed to protecting your privacy. This Policy covers data collected via our
              website, apps, and related services. For Terms governing your use, see our{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500">Terms of Use</Link>.
            </p>
          </Section>

          <Section id="data-we-collect" title="2. Data We Collect">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Data:</strong> name, email, password hash, plan type.</li>
              <li><strong>Profile & Preferences:</strong> favorites, reading/listening progress, categories you follow.</li>
              <li><strong>Transaction Data:</strong> order details, timestamps, payment status; limited payment identifiers provided by processors.</li>
              <li><strong>Usage Data:</strong> device info, IP, approximate location, pages viewed, actions (e.g., add to cart), referral URLs.</li>
              <li><strong>Content Interactions:</strong> ebooks/podcasts accessed, previews vs. owned items, time spent (where enabled).</li>
              <li><strong>Support:</strong> messages you send to support and related metadata.</li>
            </ul>
          </Section>

          <Section id="how-we-use" title="3. How We Use Your Data">
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide and maintain the Service, including authentication and account management.</li>
              <li>Process orders, subscriptions, and enable QR/OTP confirmations.</li>
              <li>Personalize content and recommendations (e.g., favorites, progress, similar items).</li>
              <li>Analyze usage to improve stability, performance, and UX.</li>
              <li>Communicate with you about updates, security, and support.</li>
              <li>Comply with legal obligations and enforce Terms.</li>
            </ul>
          </Section>

          <Section id="legal-bases" title="4. Legal Bases">
            <p>
              Depending on your jurisdiction, we may rely on one or more legal bases such as consent,
              contract performance, legitimate interests (e.g., securing and improving the Service),
              legal obligations, or vital interests.
            </p>
          </Section>

          <Section id="cookies" title="5. Cookies & Tracking">
            <ul className="list-disc pl-5 space-y-2">
              <li>We use cookies/local storage for login sessions, preferences, and analytics.</li>
              <li>You can control cookies in your browser, but disabling may affect functionality.</li>
              <li>Where required, we present a consent banner for non-essential cookies.</li>
            </ul>
          </Section>

          <Section id="analytics" title="6. Analytics & Measurement">
            <p>
              We may use privacy-friendly analytics to understand aggregated usage trends (e.g., page
              views, conversion funnels) without tracking you across sites. Some third-party tools
              may set their own cookies—refer to their policies for details.
            </p>
          </Section>

          <Section id="payments" title="7. Payments">
            <p>
              Payments are processed by third-party providers (e.g., wallet/QR/OTP providers). We do
              not store full card numbers or sensitive payment credentials on our servers. We receive
              limited confirmation data (e.g., transaction IDs) to activate access.
            </p>
          </Section>

          <Section id="sharing" title="8. Sharing & Disclosure">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Vendors:</strong> hosting, analytics, email delivery, payment processors—bound by contracts.</li>
              <li><strong>Legal:</strong> to comply with law, enforce Terms, protect rights, safety, and security.</li>
              <li><strong>Business Transfers:</strong> in mergers/acquisitions, data may be transferred under similar protections.</li>
              <li><strong>With Your Consent:</strong> where you direct us to share.</li>
            </ul>
          </Section>

          <Section id="international" title="9. International Transfers">
            <p>
              Your data may be transferred to and processed in countries outside {JURISDICTION}. We
              implement appropriate safeguards consistent with applicable laws.
            </p>
          </Section>

          <Section id="retention" title="10. Data Retention">
            <p>
              We retain personal data for as long as necessary to provide the Service, comply with
              legal obligations, resolve disputes, and enforce agreements. Retention periods vary
              depending on the type of data and purpose.
            </p>
          </Section>

          <Section id="your-rights" title="11. Your Rights">
            <ul className="list-disc pl-5 space-y-2">
              <li>Access, correct, or delete your personal data (subject to legal limits).</li>
              <li>Object to or restrict certain processing; withdraw consent where applicable.</li>
              <li>Portability of data where applicable.</li>
              <li>To exercise rights, contact us at{' '}
                <a className="text-blue-600 hover:text-blue-500" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </li>
            </ul>
          </Section>

          <Section id="children" title="12. Children’s Privacy">
            <p>
              The Service is not directed to children under the age of majority. We do not knowingly
              collect personal data from such individuals. If you believe a child provided data, please
              contact us to remove it.
            </p>
          </Section>

          <Section id="security" title="13. Security">
            <p>
              We use administrative, technical, and organizational measures designed to protect
              personal data. However, no method of transmission or storage is 100% secure.
            </p>
          </Section>

          <Section id="third-party" title="14. Third-Party Links">
            <p>
              The Service may link to third-party sites or services. We are not responsible for their
              privacy practices. Review their policies before providing personal data.
            </p>
          </Section>

          <Section id="changes" title="15. Changes to This Policy">
            <p>
              We may update this Policy from time to time. We will update the “Last updated” date and,
              where appropriate, provide additional notice. Continued use signifies acceptance.
            </p>
          </Section>

          <Section id="contact" title="16. Contact Us">
            <p>
              Questions about this Policy? Contact{' '}
              <a className="text-blue-600 hover:text-blue-500" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              <br />
              {COMPANY}, {ADDRESS}
            </p>
            <p className="mt-4 text-xs text-zinc-500">
              <em>Note:</em> This Privacy Policy is provided for general information and is not legal advice.
            </p>
          </Section>

          {/* Back actions */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/terms"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              ← Terms of Use
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Continue to Register
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

/* --- Shared small components --- */

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl border p-6 shadow-sm bg-white">{children}</section>;
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border p-6 shadow-sm bg-white">
      <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
      <div className="mt-3 text-zinc-700 leading-relaxed">{children}</div>
    </section>
  );
}
