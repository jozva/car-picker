"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CarCard } from "@/components/CarCard";
import type { BodyType, Car, FuelType } from "@/lib/types";

const BODY_TYPES: BodyType[] = ["Hatchback", "Sedan", "Compact SUV", "SUV", "MUV"];
const FUELS: FuelType[] = ["Petrol", "Diesel", "CNG", "Hybrid", "Electric"];
const MAX_COMPARE = 4;

export default function Browse() {
  const [cars, setCars] = useState<Car[] | null>(null);
  const [maxPrice, setMaxPrice] = useState(3500000);
  const [bodyType, setBodyType] = useState("");
  const [fuel, setFuel] = useState("");
  const [minSeating, setMinSeating] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("maxPrice", String(maxPrice));
    if (bodyType) p.set("bodyType", bodyType);
    if (fuel) p.set("fuel", fuel);
    if (minSeating) p.set("minSeating", minSeating);
    return p.toString();
  }, [maxPrice, bodyType, fuel, minSeating]);

  useEffect(() => {
    let active = true;
    fetch(`/api/cars?${queryString}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setCars(d.ok ? d.data.cars : []);
      });
    return () => {
      active = false;
    };
  }, [queryString]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_COMPARE
          ? [...prev, id]
          : prev
    );
  }

  return (
    <div className="pb-20">
      <h1 className="text-2xl font-bold text-ink">Browse the catalogue</h1>
      <p className="mt-1 text-slate-600">
        Filter the field and pick up to {MAX_COMPARE} cars to compare.
      </p>

      <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <label className="text-sm">
          <span className="font-medium text-ink">
            Max price: ₹{(maxPrice / 100000).toFixed(1)}L
          </span>
          <input
            type="range"
            min={500000}
            max={3500000}
            step={50000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="mt-2 w-full accent-brand"
          />
        </label>

        <Select label="Body type" value={bodyType} onChange={setBodyType} options={BODY_TYPES} />
        <Select label="Fuel" value={fuel} onChange={setFuel} options={FUELS} />
        <Select
          label="Min seats"
          value={minSeating}
          onChange={setMinSeating}
          options={["5", "6", "7"]}
        />
      </div>

      {!cars ? (
        <p className="mt-8 text-center text-slate-500">Loading cars…</p>
      ) : cars.length === 0 ? (
        <p className="mt-8 text-center text-slate-600">
          No cars match these filters. Try loosening them.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              selected={selected.includes(car.id)}
              onToggle={toggle}
            />
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm text-slate-600">
              {selected.length} selected
              {selected.length >= MAX_COMPARE && " (max)"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected([])}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Clear
              </button>
              <Link
                href={`/compare?ids=${selected.join(",")}`}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Compare {selected.length} →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-ink">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-ink"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
