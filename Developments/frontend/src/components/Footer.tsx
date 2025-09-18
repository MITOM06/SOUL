import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-8 footer-gradient">
      <div className="container-max py-10 grid gap-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-blue-600 text-white grid place-items-center font-bold shadow-sm">S</div>
            <span className="font-semibold tracking-wide">SOUL</span>
          </div>
          <p className="mt-3 text-sm text-zinc-600 max-w-xs">
            Ebook & Podcast platform. Learn every day.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Products</h4>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li><Link href="/library" className="hover:text-[color:var(--brand-600)] transition">Library</Link></li>
            <li><Link href="/podcasts" className="hover:text-[color:var(--brand-600)] transition">Podcasts</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li><Link href="/about" className="hover:text-[color:var(--brand-600)] transition">About</Link></li>
            <li><Link href="/contact" className="hover:text-[color:var(--brand-600)] transition">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li><Link href="/terms" className="hover:text-[color:var(--brand-600)] transition">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-[color:var(--brand-600)] transition">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t bg-white/50">
        <div className="container-max py-4 text-xs text-zinc-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} SOUL. All rights reserved.</span>
          <span className="text-zinc-400">Made with ❤️</span>
        </div>
      </div>
    </footer>
  );
}