// src/lib/utils.ts

/* ----------------------------- Class Utilities ----------------------------- */

/**
 * Kiểu giá trị className đầu vào cho `cn`.
 * - string: "px-3 py-2"
 * - string[]: ["px-3", cond && "bg-black"]
 * - object: { "px-3": true, "hidden": isHidden }
 */
export type ClassValue =
  | string
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

/**
 * Gộp className “kiểu Tailwind” một cách linh hoạt (không dùng thư viện ngoài).
 * - Bỏ qua falsy (false/null/undefined/"").
 * - Hỗ trợ mảng lồng nhau và object { class: condition }.
 * @example cn("px-3", isActive && "bg-zinc-900", ["rounded", { hidden: !show }])
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const walk = (v: ClassValue): void => {
    if (!v) return;
    if (typeof v === "string") {
      if (v.trim()) out.push(v.trim());
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) walk(item);
      return;
    }
    if (typeof v === "object") {
      for (const [k, cond] of Object.entries(v)) {
        if (cond) out.push(k);
      }
    }
  };

  for (const i of inputs) walk(i);

  // NOTE: Đây không phải "tailwind-merge" full.
  // Nếu muốn merge “thông minh” hơn, có thể thay bằng clsx + tailwind-merge sau này.
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/* ------------------------------ Env & Runtime ------------------------------ */

export const __DEV__ = process.env.NODE_ENV !== "production";

/** Đang chạy trên browser? */
export const isBrowser = typeof window !== "undefined";

/** Đang chạy trên server (Next.js RSC)? */
export const isServer = !isBrowser;

/**
 * Lấy biến môi trường (ưu tiên NEXT_PUBLIC_* khi chạy client).
 * @param key Tên biến, ví dụ: "NEXT_PUBLIC_API_URL"
 * @param fallback Giá trị mặc định nếu không có
 */
export function env(key: string, fallback?: string): string | undefined {
  // Trong Next.js, process.env.* được inlined khi build — dùng được cả client
  const v = (process.env as Record<string, string | undefined>)[key];
  return v ?? fallback;
}

/* --------------------------------- Strings -------------------------------- */

export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Cắt chuỗi kèm suffix (…); không cắt nếu ngắn hơn max. */
export function truncate(text: string, max = 80, suffix = "…"): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max)).trimEnd() + suffix;
}

/** Thêm dấu phân cách hàng nghìn cho số. */
export function numberWithCommas(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* --------------------------------- Numbers -------------------------------- */

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function percent(n: number, total: number, digits = 0): string {
  if (total === 0) return `0%`;
  const p = (n / total) * 100;
  return `${p.toFixed(digits)}%`;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return Math.round((cents / 100) * 100) / 100;
}

/* -------------------------------- Currency -------------------------------- */

export function formatCurrency(
  amount: number,
  locale = "vi-VN",
  currency: string = "VND"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(amount);
  } catch {
    // fallback: không ném lỗi render UI
    return `${amount} ${currency}`;
  }
}

/* ---------------------------------- Date ---------------------------------- */

export function formatDate(
  input: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  },
  locale = "vi-VN"
): string {
  const d = input instanceof Date ? input : new Date(input);
  try {
    return new Intl.DateTimeFormat(locale, opts).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/* --------------------------------- Async ---------------------------------- */

export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/** Không làm gì (placeholder cho callback bắt buộc). */
export function noop(): void {
  /* noop */
}

/* ------------------------------- Collections ------------------------------ */

export function range(n: number, startAt = 0): number[] {
  return Array.from({ length: n }, (_, i) => i + startAt);
}

/**
 * Merge nông (shallow) cho object (last-wins).
 * Tránh dùng cho nested deep object phức tạp.
 */
export function shallowMerge<T extends object, U extends object>(
  a: T,
  b: U
): T & U {
  return Object.assign({}, a, b);
}

/* ------------------------------ Query Helpers ----------------------------- */

/** 
 * Chuyển object sang query string. Bỏ qua undefined/null.
 * @example toQuery({ q: "abc", page: 2 }) => "q=abc&page=2"
 */
export function toQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    usp.append(k, String(v));
  }
  return usp.toString();
}

/** Ghép URL gọn gàng, loại bỏ trùng "/" giữa các đoạn. */
export function joinURL(base: string, ...parts: string[]): string {
  const s = [base, ...parts]
    .map((p) => String(p).trim().replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  // giữ slash của protocol nếu base có http(s)://
  return s.replace(/^https?:\//, (m) => m + "/");
}

/* --------------------------------- Guards --------------------------------- */

export function assertUnreachable(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`);
}
