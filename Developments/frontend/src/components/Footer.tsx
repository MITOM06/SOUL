"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneIcon, BoltIcon, EnvelopeIcon, MapPinIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

export default function Footer() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  return (
    <footer className="border-t mt-12 footer-gradient">
      {/* Contact CTA band */}
      {!isAdmin && (
        <div className="px-4 full-bleed py-8">
          <div className="rounded-2xl p-6 bg-white/70 border grid gap-3 md:grid-cols-[1fr_auto] items-center">
            <div>
              <div className="text-xl font-semibold">Have questions? We’re here to help.</div>
              <div className="text-sm text-zinc-700">Contact our team for support, partnerships, or feedback.</div>
            </div>
            <Link href="/contact" className="px-5 py-2 rounded-xl text-white bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] text-center">
              Contact Us
            </Link>
          </div>
        </div>
      )}

      {/* Main footer */}
      <div className="px-4 full-bleed py-10 grid gap-8 md:grid-cols-5">
        <div className="col-span-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md text-white grid place-items-center font-bold shadow-sm bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500">S</div>
            <span className="font-semibold tracking-wide">SOUL</span>
          </div>
          <p className="mt-3 text-sm text-zinc-600 max-w-sm">Read and listen anywhere. Curated ebooks and podcasts with a clean, fast experience.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><PhoneIcon className="h-4 w-4" /> <span>+84 901 234 567</span></div>
            <div className="flex items-center gap-2"><PhoneIcon className="h-4 w-4" /> <span>+84 988 765 432</span></div>
            <div className="flex items-center gap-2"><BoltIcon className="h-4 w-4" /> <span>Hotline: 1900-1234</span></div>
            <div className="flex items-center gap-2"><EnvelopeIcon className="h-4 w-4" /> <span>hello@soul.app</span></div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Sitemap</h4>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li><Link href="/book" className="hover:underline">Books</Link></li>
            <li><Link href="/podcast" className="hover:underline">Podcasts</Link></li>
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
            <li><Link href="/sitemap" className="hover:underline font-medium">Full Site Map →</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Social</h4>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li><a href="#" className="flex items-center gap-2 hover:underline"><GlobeAltIcon className="h-4 w-4" /> Twitter</a></li>
            <li><a href="#" className="flex items-center gap-2 hover:underline"><GlobeAltIcon className="h-4 w-4" /> Facebook</a></li>
            <li><a href="#" className="flex items-center gap-2 hover:underline"><GlobeAltIcon className="h-4 w-4" /> Instagram</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Office</h4>
          <div className="text-sm text-zinc-700 flex items-start gap-2">
            <MapPinIcon className="h-4 w-4 mt-0.5" />
            <span>123 Library Ave, District 1, Ho Chi Minh City</span>
          </div>
        </div>
      </div>

      <div className="border-t bg-white/60">
        <div className="px-4 full-bleed py-4 text-xs text-zinc-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} SOUL. All rights reserved.</span>
          <span className="text-zinc-400">Made with ❤️</span>
        </div>
      </div>
    </footer>
  );
}
