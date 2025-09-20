// app/about/page.tsx
// Professional About page for SOUL (English version)

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
      {/* Header */}
      <header className="mb-10 text-center">
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide">
          About SOUL
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
          SOUL — Stories Online, Unified Library
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 sm:text-base">
          A demo platform that unifies <strong>ebooks</strong> and <strong>podcasts</strong> into one seamless experience,
          showcasing best practices for building modern, scalable, and maintainable web applications.
        </p>
      </header>

      {/* Mission & Vision */}
      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border bg-white/50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Mission</h2>
          <p className="mt-2 text-zinc-700">
            Empower students and teams to practice full-stack development with a complete reference product:
            from backend architecture (Laravel, MySQL) to frontend experience (Next.js, React, Tailwind).
          </p>
        </article>
        <article className="rounded-2xl border bg-white/50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Vision</h2>
          <p className="mt-2 text-zinc-700">
            Become a clear, reusable scaffold for academic and competition projects—so teams can focus on product value
            instead of reinventing the wheel.
          </p>
        </article>
      </section>

      {/* Value Props */}
      <section className="mt-10">
        <h3 className="text-lg font-semibold">Why SOUL stands out</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Clean Architecture",
              desc: "Well-defined layers, separation of concerns, easy to maintain and extend.",
            },
            {
              title: "Unified Experience",
              desc: "Ebooks & Podcasts in one place with synced library and user history.",
            },
            {
              title: "Best Practices",
              desc: "Auth, roles, APIs, caching, patterns & conventions are first-class citizens.",
            },
            {
              title: "Learning-Friendly",
              desc: "Commented codebase suited for reports, demos, and presentations.",
            },
            {
              title: "Modern Design",
              desc: "Clutter-free UI, scan-friendly, responsive for mobile and desktop.",
            },
            {
              title: "Rich Sample Data",
              desc: "Seeders & fixtures to quickly test many real-world scenarios.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border p-5 shadow-sm">
              <h4 className="font-medium">{item.title}</h4>
              <p className="mt-1 text-sm text-zinc-700">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mt-10">
        <div className="grid gap-4 rounded-2xl border bg-white/50 p-6 shadow-sm sm:grid-cols-3">
          {[
            { k: "Stack", v: "Laravel • Next.js • MySQL • Tailwind" },
            { k: "Goal", v: "Learning & best-practice demonstration" },
            { k: "Status", v: "Demo data • API integration in progress" },
          ].map((s) => (
            <div key={s.k} className="text-center sm:text-left">
              <div className="text-xs uppercase tracking-wide text-zinc-500">{s.k}</div>
              <div className="mt-1 font-semibold">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mt-10">
        <h3 className="text-lg font-semibold">Tech & Practices</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ul className="space-y-2 rounded-2xl border p-5 shadow-sm">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900" />
              <div>
                <p className="font-medium">Backend — Laravel</p>
                <p className="text-sm text-zinc-700">RESTful routing, Eloquent ORM, Policies, Queues, Seeder/Migration.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900" />
              <div>
                <p className="font-medium">Database — MySQL</p>
                <p className="text-sm text-zinc-700">Relational design, basic indexing, normalized demo schema.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900" />
              <div>
                <p className="font-medium">Auth & Roles</p>
                <p className="text-sm text-zinc-700">JWT/Sanctum, admin/user permissions, guards & middleware.</p>
              </div>
            </li>
          </ul>
          <ul className="space-y-2 rounded-2xl border p-5 shadow-sm">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900" />
              <div>
                <p className="font-medium">Frontend — Next.js + React</p>
                <p className="text-sm text-zinc-700">App Router, server/client components, SEO/UX optimizations.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900" />
              <div>
                <p className="font-medium">UI — Tailwind CSS</p>
                <p className="text-sm text-zinc-700">Design tokens, responsive layout, dark-mode ready.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900" />
              <div>
                <p className="font-medium">Quality</p>
                <p className="text-sm text-zinc-700">Conventions, lint/prettier, componentization, testable modules.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Educational Note */}
      <section className="mt-10 rounded-2xl border bg-zinc-50 p-6">
        <h3 className="text-lg font-semibold">Educational Notice</h3>
        <p className="mt-2 text-zinc-700">
          The website currently runs on demo data. Once the backend API is fully integrated, all content and user actions
          will be persisted to the database. Feel free to explore the codebase and adapt the structure for coursework or competitions.
        </p>
      </section>

      {/* Team (optional placeholders) */}
      <section className="mt-10">
        <h3 className="text-lg font-semibold">Team</h3>
        <p className="mt-2 text-sm text-zinc-600">
          (Optional) Add photos, roles, and GitHub/LinkedIn links for each member here.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border p-5 shadow-sm">
              <div className="h-28 w-full rounded-xl bg-zinc-100" />
              <div className="mt-3">
                <p className="font-medium">Member Name</p>
                <p className="text-sm text-zinc-600">Role / Responsibility</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12">
        <div className="rounded-2xl border bg-gradient-to-b from-white to-zinc-50 p-6 text-center shadow-sm">
          <h3 className="text-lg font-semibold">Want to dive deeper?</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-700">
            Browse the source code, read the setup docs, or contact the team for guidance on integrating SOUL into your course project.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Read the docs
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              View the repo
            </a>
          </div>
        </div>
      </section>

      {/* Footer meta */}
      <footer className="mt-10 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} SOUL — Demo for educational purposes.
      </footer>
    </main>
  );
}
