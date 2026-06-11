import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarPicker — find the right car, confidently",
  description:
    "Answer a few questions and get a ranked, explained shortlist of cars that actually fit you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <NavBar />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-slate-500 sm:flex-row">
            <p>
              Car<span className="font-semibold text-ink">Picker</span> — a
              guided car finder.
            </p>
            <nav aria-label="Footer" className="flex gap-4">
              <Link href="/finder" className="hover:text-brand">
                Find my car
              </Link>
              <Link href="/browse" className="hover:text-brand">
                Browse
              </Link>
              <Link href="/saved" className="hover:text-brand">
                Saved
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
