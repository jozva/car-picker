"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BodyType, FuelType, Preferences } from "@/lib/types";

const BODY_TYPES: BodyType[] = ["Hatchback", "Sedan", "Compact SUV", "SUV", "MUV"];
const FUELS: FuelType[] = ["Petrol", "Diesel", "CNG", "Hybrid", "Electric"];
const USAGES: Preferences["usage"][] = ["City", "Highway", "Family", "Mixed"];
const PRIORITY_KEYS = [
  "budget",
  "value",
  "mileage",
  "safety",
  "space",
  "comfort",
] as const;

const PRIORITY_LABELS: Record<(typeof PRIORITY_KEYS)[number], string> = {
  budget: "budget",
  value: "value for money",
  mileage: "mileage",
  safety: "safety",
  space: "space",
  comfort: "comfort",
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export default function Finder() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Preferences>({
    budgetMin: 700000,
    budgetMax: 2000000,
    bodyTypes: [],
    fuels: [],
    transmission: "Any",
    minSeating: 5,
    usage: "Mixed",
    priorities: { budget: 2, value: 2, mileage: 2, safety: 2, space: 1, comfort: 1 },
  });

  function submit() {
    sessionStorage.setItem("carpicker:prefs", JSON.stringify(prefs));
    router.push("/results");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink">Tell us what you need</h1>
      <p className="mt-1 text-slate-600">
        Skip anything you don&apos;t care about—the engine handles the rest.
      </p>

      <section className="mt-8 space-y-8">
        <div>
          <label className="block text-sm font-semibold text-ink">
            Budget ceiling: ₹{(prefs.budgetMax / 100000).toFixed(1)}L
          </label>
          <input
            type="range"
            min={500000}
            max={3500000}
            step={50000}
            value={prefs.budgetMax}
            onChange={(e) =>
              setPrefs({ ...prefs, budgetMax: Number(e.target.value) })
            }
            className="mt-2 w-full accent-brand"
          />
        </div>

        <Field label="Body type (optional)">
          <Chips
            options={BODY_TYPES}
            selected={prefs.bodyTypes}
            onToggle={(v) =>
              setPrefs({ ...prefs, bodyTypes: toggle(prefs.bodyTypes, v) })
            }
          />
        </Field>

        <Field label="Fuel (optional)">
          <Chips
            options={FUELS}
            selected={prefs.fuels}
            onToggle={(v) =>
              setPrefs({ ...prefs, fuels: toggle(prefs.fuels, v) })
            }
          />
        </Field>

        <Field label="How will you mostly use it?">
          <Chips
            options={USAGES}
            selected={[prefs.usage]}
            onToggle={(v) => setPrefs({ ...prefs, usage: v })}
          />
        </Field>

        <Field label="Minimum seats">
          <Chips
            options={[5, 6, 7]}
            selected={[prefs.minSeating]}
            onToggle={(v) => setPrefs({ ...prefs, minSeating: v })}
          />
        </Field>

        <div>
          <p className="text-sm font-semibold text-ink">
            What matters most? (0 = don&apos;t care, 3 = critical)
          </p>
          <div className="mt-3 space-y-3">
            {PRIORITY_KEYS.map((k) => (
              <div key={k} className="flex items-center gap-4">
                <span className="w-28 text-sm capitalize text-slate-600">
                  {PRIORITY_LABELS[k]}
                </span>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={prefs.priorities[k]}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      priorities: {
                        ...prefs.priorities,
                        [k]: Number(e.target.value),
                      },
                    })
                  }
                  className="flex-1 accent-brand"
                />
                <span className="w-4 text-sm font-medium text-ink">
                  {prefs.priorities[k]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          className="w-full rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
        >
          Show my shortlist →
        </button>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">{label}</p>
      {children}
    </div>
  );
}

function Chips<T extends string | number>({
  options,
  selected,
  onToggle,
}: {
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={String(opt)}
            onClick={() => onToggle(opt)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              active
                ? "border-brand bg-brand text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-brand"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
