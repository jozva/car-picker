"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SavedShortlist } from "@/lib/types";

export default function Saved() {
  const [shortlists, setShortlists] = useState<SavedShortlist[] | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/shortlists")
      .then((r) => r.json())
      .then((d) => setShortlists(d.ok ? d.data.shortlists : []));
  }, []);

  async function remove(id: string) {
    setRemovingId(id);
    const prev = shortlists;
    // Optimistic removal; restore on failure.
    setShortlists((cur) => cur?.filter((s) => s.id !== id) ?? cur);
    try {
      const res = await fetch(`/api/shortlists/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) setShortlists(prev ?? null);
    } catch {
      setShortlists(prev ?? null);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Saved shortlists</h1>
      <p className="mt-1 text-slate-600">
        Shortlists you saved are stored on the server and listed here.
      </p>

      {!shortlists ? (
        <p className="mt-8 text-center text-slate-500">Loading…</p>
      ) : shortlists.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">No saved shortlists yet.</p>
          <Link
            href="/finder"
            className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
          >
            Build one with the finder →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {shortlists.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <h2 className="font-semibold text-ink">{s.label}</h2>
                <p className="text-sm text-slate-500">
                  {s.carIds.length} cars · saved{" "}
                  {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/compare?ids=${s.carIds.join(",")}`}
                  className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-blue-50"
                >
                  Compare
                </Link>
                <button
                  onClick={() => remove(s.id)}
                  disabled={removingId === s.id}
                  aria-label={`Remove ${s.label}`}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-400 hover:text-red-600 disabled:opacity-60"
                >
                  {removingId === s.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
