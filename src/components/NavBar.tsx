"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/finder", label: "Find my car" },
  { href: "/browse", label: "Browse" },
  { href: "/compare", label: "Compare" },
  { href: "/saved", label: "Saved" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="rounded text-lg font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Car<span className="text-brand">Picker</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  active
                    ? "bg-blue-50 text-brand"
                    : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
