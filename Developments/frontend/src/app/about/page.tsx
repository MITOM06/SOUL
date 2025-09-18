// Simple about page describing the project. You can expand this
// section with team bios, mission statements or contact details.

export default function AboutPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">About SOUL</h1>
      <p className="text-zinc-700 max-w-2xl">
        SOUL (Stories Online, Unified Library) is a demonstration platform
        designed to showcase how a modern web application can deliver
        ebooks and podcasts in a single unified experience. Built with
        Laravel on the backend and Next.js on the frontend, SOUL
        demonstrates best practices for building scalable, maintainable
        applications. This site is currently running on demo data. Once
        the backend APIs are fully implemented, all content and user
        actions will be persisted to the database.
      </p>
      <p className="text-zinc-700 max-w-2xl">
        This project was created for educational purposes. It provides
        students with an opportunity to practice full‑stack development
        using technologies such as PHP, MySQL, Laravel, React and
        Tailwind CSS. Feel free to explore the codebase and adapt it
        to your own learning journey.
      </p>
    </section>
  );
}