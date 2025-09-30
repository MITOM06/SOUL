// frontend/src/app/terms/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';

const BRAND = 'SOUL — Stories Online, Unified Library';
const COMPANY = 'SOUL Team';
const CONTACT_EMAIL = 'support@soul.example'; // TODO: đổi email
const ADDRESS = '123 Nguyen Van Troi, Phu Nhuan, HCMC, Vietnam'; // TODO: đổi địa chỉ
const GOVERNING_LAW = 'the laws of Vietnam'; // TODO: đổi nơi áp dụng
const EFFECTIVE_DATE = 'September 30, 2025';

const sections = [
    { id: 'acceptance', label: '1. Acceptance of Terms' },
    { id: 'changes', label: '2. Changes to the Terms' },
    { id: 'eligibility', label: '3. Eligibility & Accounts' },
    { id: 'subscriptions', label: '4. Subscriptions, Billing & Pricing' },
    { id: 'content-license', label: '5. Content Access & License (Ebooks/Podcasts)' },
    { id: 'user-content', label: '6. User Content & Reviews' },
    { id: 'acceptable-use', label: '7. Acceptable Use & Prohibited Activities' },
    { id: 'ip', label: '8. Intellectual Property' },
    { id: 'dmca', label: '9. Copyright Complaints / DMCA' },
    { id: 'privacy', label: '10. Privacy & Data' },
    { id: 'third-party', label: '11. Third-Party Services' },
    { id: 'termination', label: '12. Suspension & Termination' },
    { id: 'disclaimer', label: '13. Disclaimers' },
    { id: 'liability', label: '14. Limitation of Liability' },
    { id: 'indemnity', label: '15. Indemnification' },
    { id: 'governing-law', label: '16. Governing Law & Dispute Resolution' },
    { id: 'general', label: '17. General' },
    { id: 'contact', label: '18. Contact Us' },
];

export default function TermsPage() {
    return (
        <div id="top" className="min-h-screen bg-white">
            {/* Top bar / breadcrumb */}
            <div className="border-b bg-gradient-to-b from-zinc-50 to-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
                    <nav className="text-sm text-zinc-500">
                        <Link href="/" className="hover:text-zinc-700">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-zinc-700 font-medium">Terms of Use</span>
                    </nav>

                    <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900">
                        Terms of Use
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">Last updated: {EFFECTIVE_DATE}</p>
                </div>
            </div>

            {/* Content layout */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 py-10">
                {/* TOC */}
                <aside className="lg:block">
                    <div className="sticky top-6 rounded-2xl border bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-semibold text-zinc-700">On this page</h2>
                        <ul className="mt-3 space-y-2">
                            {sections.map((s) => (
                                <li key={s.id}>
                                    <a
                                        href={`#${s.id}`}
                                        className="block text-sm text-zinc-600 hover:text-zinc-900"
                                    >
                                        {s.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Main */}
                <main className="space-y-10">
                    <Intro brand={BRAND} />

                    <Section id="acceptance" title="1. Acceptance of Terms">
                        <p>
                            By creating an account, accessing, or using the Service, you represent that you have
                            read, understood, and agree to these Terms. If you accept on behalf of an organization,
                            you have authority to bind that organization.
                        </p>
                    </Section>

                    <Section id="changes" title="2. Changes to the Terms">
                        <p>
                            We may update these Terms from time to time. When we do, we will revise the “Last
                            updated” date above and may provide additional notice (e.g., email or in-app notice).
                            Your continued use after changes become effective constitutes acceptance.
                        </p>
                    </Section>

                    <Section id="eligibility" title="3. Eligibility & Accounts">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>You must be at least the age of majority in your jurisdiction.</li>
                            <li>You’re responsible for safeguarding your credentials and all activities on your account.</li>
                            <li>Provide accurate, current, and complete information and update it as needed.</li>
                            <li>We may suspend or terminate accounts for violations or suspected abuse.</li>
                        </ul>
                    </Section>

                    <Section id="subscriptions" title="4. Subscriptions, Billing & Pricing">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Plans & Access:</strong> Free/Premium plans may differ in features and content.</li>
                            <li><strong>Billing:</strong> You authorize charges via supported methods (card/QR/OTP, etc.).</li>
                            <li><strong>Auto-Renewal:</strong> Renews unless canceled before renewal date.</li>
                            <li><strong>Trials & Promotions:</strong> Trials convert to paid unless canceled before end of trial.</li>
                            <li><strong>Pricing & Taxes:</strong> Prices may change with prior notice; taxes may apply.</li>
                            <li><strong>Refunds:</strong> Unless required by law or stated otherwise, fees are non-refundable.</li>
                        </ul>
                    </Section>

                    <Section id="content-license" title="5. Content Access & License (Ebooks/Podcasts)">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Content is licensed, not sold; your license is personal, limited, non-transferable, revocable.</li>
                            <li>Stream or download where permitted; access may depend on plan or purchase/ownership.</li>
                            <li>No redistribution, resale, reproduction, or public performance unless expressly authorized.</li>
                            <li>We may modify/remove/disable specific items for legal/licensing reasons without liability.</li>
                        </ul>
                    </Section>

                    <Section id="user-content" title="6. User Content & Reviews">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>You own your User Content but grant us a worldwide, royalty-free, sublicensable, transferable license to use it for the Service and our marketing.</li>
                            <li>You represent you have necessary rights and your content does not infringe laws or third-party rights.</li>
                            <li>We may remove or moderate content that violates these Terms or applicable law.</li>
                        </ul>
                    </Section>

                    <Section id="acceptable-use" title="7. Acceptable Use & Prohibited Activities">
                        <p>Do NOT:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Violate laws or regulations.</li>
                            <li>Copy/scrape/download content beyond the granted license.</li>
                            <li>Circumvent access controls/DRM or disrupt the Service.</li>
                            <li>Harass/abuse others; post hateful, illegal, or infringing content.</li>
                            <li>Use the Service to build a competing product without permission.</li>
                        </ul>
                    </Section>

                    <Section id="ip" title="8. Intellectual Property">
                        <p>
                            The Service (software, UI/UX, trademarks, and content) is owned by {COMPANY} or its licensors
                            and protected by IP laws. No rights are granted except as expressly stated.
                        </p>
                    </Section>

                    <Section id="dmca" title="9. Copyright Complaints / DMCA">
                        <p>
                            If you believe content infringes your copyright, email{' '}
                            <a className="text-blue-600 hover:text-blue-500" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
                            with:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Your contact information;</li>
                            <li>Identification of the copyrighted work and the allegedly infringing material (URL);</li>
                            <li>A good-faith statement that the use is not authorized;</li>
                            <li>A statement under penalty of perjury regarding accuracy and authority; and</li>
                            <li>Your physical or electronic signature.</li>
                        </ul>
                    </Section>

                    <Section id="privacy" title="10. Privacy & Data">
                        <p>
                            See our{' '}
                            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                                Privacy Policy
                            </Link>{' '}
                            for how we collect, use, and share personal data.
                        </p>
                    </Section>

                    <Section id="third-party" title="11. Third-Party Services">
                        <p>
                            The Service may link to or integrate third-party services (e.g., payment providers, content hosts).
                            We aren’t responsible for their content, terms, or practices. Use at your own risk.
                        </p>
                    </Section>

                    <Section id="termination" title="12. Suspension & Termination">
                        <p>
                            We may suspend/terminate access if you violate these Terms or engage in fraudulent/abusive behavior.
                            You may stop using the Service at any time. Certain provisions survive termination.
                        </p>
                    </Section>

                    <Section id="disclaimer" title="13. Disclaimers">
                        <p>
                            THE SERVICE AND ALL CONTENT ARE PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND,
                            EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                            WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE SERVICE.
                        </p>
                    </Section>

                    <Section id="liability" title="14. Limitation of Liability">
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY} AND ITS LICENSORS SHALL NOT BE LIABLE FOR INDIRECT,
                            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, DATA, USE, GOODWILL,
                            OR OTHER INTANGIBLE LOSSES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE 12 MONTHS
                            BEFORE THE CLAIM.
                        </p>
                    </Section>

                    <Section id="indemnity" title="15. Indemnification">
                        <p>
                            You agree to defend, indemnify, and hold harmless {COMPANY} and its affiliates, officers, employees,
                            and agents from claims, damages, losses, and expenses (including reasonable legal fees) arising from
                            your use of the Service or violation of these Terms.
                        </p>
                    </Section>

                    <Section id="governing-law" title="16. Governing Law & Dispute Resolution">
                        <p>
                            These Terms are governed by {GOVERNING_LAW}. You agree to the exclusive jurisdiction of the courts
                            in Ho Chi Minh City, Vietnam (or another specified venue) to resolve disputes.
                        </p>
                    </Section>

                    <Section id="general" title="17. General">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Entire Agreement:</strong> These Terms are the entire agreement regarding the Service.</li>
                            <li><strong>Severability:</strong> If any provision is invalid, the remainder stays effective.</li>
                            <li><strong>No Waiver:</strong> Failure to enforce is not a waiver.</li>
                            <li><strong>Assignment:</strong> You may not assign without our prior written consent.</li>
                            <li><strong>Headings:</strong> For convenience only; they do not affect interpretation.</li>
                        </ul>
                    </Section>

                    <Section id="contact" title="18. Contact Us">
                        <p>
                            Questions? Contact{' '}
                            <a className="text-blue-600 hover:text-blue-500" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                            <br />
                            {COMPANY}, {ADDRESS}
                        </p>
                        <p className="mt-4 text-xs text-zinc-500">
                            <em>Note:</em> This template is for general information only and is not legal advice.
                        </p>
                    </Section>

                    {/* Back to register */}
                    <div className="flex justify-end">
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            ← Back to register 
                        </Link>
                    </div>

                </main>
            </div>
        </div>
    );
}

function Intro({ brand }: { brand: string }) {
    return (
        <section className="rounded-2xl border p-6 shadow-sm">
            <p className="text-zinc-700">
                Welcome to <strong>{brand}</strong>. These Terms of Use govern your access to and use of our
                Service. By using our Service, you agree to these Terms. If you do not agree, please do not use the Service.
            </p>
        </section>
    );
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
        <section id={id} className="scroll-mt-24 rounded-2xl border p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
            <div className="mt-3 text-zinc-700 leading-relaxed">{children}</div>
        </section>
    );
}
