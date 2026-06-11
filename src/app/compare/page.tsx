"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { Car } from "@/lib/types";

const ROWS: { label: string; render: (c: Car) => string }[] = [
  { label: "Price (ex-showroom)", render: (c) => `₹${(c.price / 100000).toFixed(1)}L` },
  { label: "Body type", render: (c) => c.bodyType },
  { label: "Fuel", render: (c) => c.fuel },
  { label: "Transmission", render: (c) => c.transmission },
  { label: "Mileage", render: (c) => `${c.mileage} kmpl-eq` },
  { label: "Seating", render: (c) => `${c.seating}` },
  { label: "Safety", render: (c) => `${c.safety}/5 ★` },
  { label: "User rating", render: (c) => `${c.userRating}/5` },
  { label: "Boot space", render: (c) => `${c.bootSpace} L` },
];

function CompareTable() {
  const params = useSearchParams();
  const ids = params.get("ids") ?? "";
  const [cars, setCars] = useState<Car[] | null>(null);

  useEffect(() => {
    const url = ids ? `/api/cars?ids=${ids}` : "/api/cars";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setCars(d.ok ? d.data.cars ?? [] : []));
  }, [ids]);

  if (!cars) return <p className="text-center text-slate-500">Loading…</p>;
  if (cars.length === 0) {
    return (
      <p className="text-center text-slate-600">
        Nothing to compare yet.{" "}
        <Link href="/finder" className="font-semibold text-brand">
          Build a shortlist
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-3 text-left text-slate-400">Spec</th>
            {cars.map((c) => (
              <th key={c.id} className="p-3 text-left text-ink">
                {c.make} {c.model}
                <div className="text-xs font-normal text-slate-400">
                  {c.variant}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-t border-slate-200">
              <td className="p-3 font-medium text-slate-500">{row.label}</td>
              {cars.map((c) => (
                <td key={c.id} className="p-3 text-ink">
                  {row.render(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Compare() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Compare side by side</h1>
      <p className="mt-1 text-slate-600">The numbers that actually differ.</p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-2">
        <Suspense fallback={<p className="p-4 text-slate-500">Loading…</p>}>
          <CompareTable />
        </Suspense>
      </div>
    </div>
  );
}
