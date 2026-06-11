"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScoreBar } from "@/components/ScoreBar";
import type { Preferences, ScoredCar } from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function Results() {
  const [results, setResults] = useState<ScoredCar[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function saveShortlist(ids: string[]) {
    setSaveState("saving");
    try {
      const res = await fetch("/api/shortlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carIds: ids, label: "My shortlist" }),
      });
      const data = await res.json();
      setSaveState(data.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }

  useEffect(() => {
    const raw = sessionStorage.getItem("carpicker:prefs");
    if (!raw) {
      setError("No preferences found. Start from the finder.");
      return;
    }
    const prefs = JSON.parse(raw) as Preferences;
    fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error?.message ?? "Request failed");
        setResults(d.data.results ?? []);
      })
      .catch(() => setError("Something went wrong generating your shortlist."));
  }, []);

  if (error) {
    return (
      <div className="text-center">
        <p className="text-slate-600">{error}</p>
        <Link href="/finder" className="mt-4 inline-block font-semibold text-brand">
          ← Back to finder
        </Link>
      </div>
    );
  }

  if (!results) {
    return <p className="text-center text-slate-500">Scoring the field…</p>;
  }

  if (results.length === 0) {
    return (
      <div className="text-center">
        <p className="text-slate-600">
          No cars matched your hard filters. Try widening your budget or fuel
          options.
        </p>
        <Link href="/finder" className="mt-4 inline-block font-semibold text-brand">
          ← Adjust preferences
        </Link>
      </div>
    );
  }

  const topIds = results.slice(0, 3).map((r) => r.car.id);
  const compareHref = `/compare?ids=${topIds.join(",")}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Your shortlist</h1>
          <p className="text-slate-600">
            {results.length} cars, ranked by fit. Top match first.
          </p>
        </div>
        <div className="flex gap-2">
          {saveState === "saved" ? (
            <Link
              href="/saved"
              className="rounded-lg border border-green-500 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              Saved ✓ View
            </Link>
          ) : (
            <button
              onClick={() => saveShortlist(topIds)}
              disabled={saveState === "saving"}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand disabled:opacity-60"
            >
              {saveState === "saving" ? "Saving…" : "Save shortlist"}
            </button>
          )}
          <Link
            href={compareHref}
            className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-blue-50"
          >
            Compare top 3
          </Link>
        </div>
      </div>
      {saveState === "error" && (
        <p className="mt-2 text-sm text-red-600">
          Couldn&apos;t save the shortlist. Please try again.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {results.map((r, i) => (
          <article
            key={r.car.id}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {i === 0 && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Best fit
                    </span>
                  )}
                  <h2 className="text-lg font-semibold text-ink">
                    {r.car.make} {r.car.model}
                  </h2>
                </div>
                <p className="text-sm text-slate-500">
                  {r.car.variant} · {r.car.fuel} · {r.car.transmission} · ₹
                  {(r.car.price / 100000).toFixed(1)}L
                </p>
                <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Value {r.valueScore}/100 in {r.segment}s
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-brand">{r.score}</div>
                <div className="text-xs text-slate-400">fit score</div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ul className="space-y-1 text-sm text-slate-700">
                {r.reasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <span className="text-green-600">✓</span> {reason}
                  </li>
                ))}
                {r.caveats.map((c) => (
                  <li key={c} className="flex gap-2 text-slate-500">
                    <span className="text-amber-500">!</span> {c}
                  </li>
                ))}
              </ul>
              <div className="space-y-1.5">
                {Object.entries(r.breakdown).map(([k, v]) => (
                  <ScoreBar key={k} label={k} value={v} />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <Link href="/finder" className="mt-6 inline-block text-sm font-semibold text-brand">
        ← Tweak my answers
      </Link>
    </div>
  );
}
