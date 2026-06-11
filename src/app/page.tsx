import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-brand">
        For confused car buyers
      </span>
      <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Stop scrolling specs. Get a shortlist that actually fits you.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-600">
        Answer five quick questions. We score every car against what you care
        about and tell you—in plain English—why each one made the cut.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/finder"
          className="rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-dark"
        >
          Find my car →
        </Link>
        <Link
          href="/browse"
          className="rounded-lg border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-brand"
        >
          Browse all cars
        </Link>
      </div>

      <div className="mt-16 grid w-full gap-6 sm:grid-cols-3">
        {[
          {
            t: "1. Tell us about you",
            d: "Budget, body type, fuel, and what matters most—safety, mileage, space.",
          },
          {
            t: "2. We score the field",
            d: "A weighted engine ranks every car and adapts to how you'll actually use it.",
          },
          {
            t: "3. Compare with confidence",
            d: "See the top picks side by side with honest reasons and trade-offs.",
          },
        ].map((s) => (
          <div
            key={s.t}
            className="rounded-xl border border-slate-200 bg-white p-5 text-left"
          >
            <h3 className="font-semibold text-ink">{s.t}</h3>
            <p className="mt-2 text-sm text-slate-600">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
