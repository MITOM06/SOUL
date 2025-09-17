import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-8">
      <div className="container-max py-8 grid gap-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-blue-600 text-white grid place-items-center font-bold">S</div>
            <span className="font-semibold">SOUL</span>
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            Nền tảng Ebook & Podcast. Học tập mỗi ngày.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Sản phẩm</h4>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li><Link href="/library" className="hover:underline">Thư viện</Link></li>
            <li><Link href="/podcasts" className="hover:underline">Podcasts</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Công ty</h4>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li><Link href="/about" className="hover:underline">Giới thiệu</Link></li>
            <li><Link href="/contact" className="hover:underline">Liên hệ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Pháp lý</h4>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li><Link href="/terms" className="hover:underline">Điều khoản</Link></li>
            <li><Link href="/privacy" className="hover:underline">Chính sách</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container-max py-4 text-xs text-zinc-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} SOUL. All rights reserved.</span>
          <span>Made with ❤️</span>
        </div>
      </div>
    </footer>
  );
}
