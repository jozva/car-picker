"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  isLocalShortlistId,
  listLocalShortlists,
  removeLocalShortlist,
} from "@/lib/client/localShortlists";
import type { SavedShortlist } from "@/lib/types";

export default function Saved() {
  const [serverShortlists, setServerShortlists] = useState<
    SavedShortlist[] | null
  >(null);
  const [localShortlists, setLocalShortlists] = useState<SavedShortlist[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setLocalShortlists(listLocalShortlists());
    fetch("/api/shortlists")
      .then((r) => r.json())
      .then((d) => setServerShortlists(d.ok ? d.data.shortlists : []));
  }, []);

  const shortlists = useMemo(() => {
    const byId = new Map<string, SavedShortlist>();
    for (const s of serverShortlists ?? []) byId.set(s.id, s);
    for (const s of localShortlists) byId.set(s.id, s);
    return [...byId.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }, [serverShortlists, localShortlists]);

  const hasLocalOnly = localShortlists.length > 0;

  async function remove(id: string) {
    setRemovingId(id);
    const prevServer = serverShortlists;
    const prevLocal = localShortlists;

    setServerShortlists((cur) => cur?.filter((s) => s.id !== id) ?? cur);
    setLocalShortlists((cur) => cur.filter((s) => s.id !== id));

    try {
      if (isLocalShortlistId(id)) {
        if (!removeLocalShortlist(id)) {
          setLocalShortlists(prevLocal);
        }
        return;
      }

      const res = await fetch(`/api/shortlists/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) setServerShortlists(prevServer ?? null);
    } catch {
      setServerShortlists(prevServer ?? null);
      setLocalShortlists(prevLocal);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Saved shortlists</h1>
      <p className="mt-1 text-slate-600">
        Shortlists you saved are listed here.
        {hasLocalOnly &&
          " Some are stored in this browser only until Redis is connected on Vercel."}
      </p>

      {!serverShortlists ? (
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
                  {isLocalShortlistId(s.id) && " · this browser only"}
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
