import type { Car } from "@/lib/types";

interface Props {
  car: Car;
  selected?: boolean;
  onToggle?: (id: string) => void;
}

/** Catalogue card. Optionally selectable for building a compare set. */
export function CarCard({ car, selected, onToggle }: Props) {
  const specs: { label: string; value: string }[] = [
    { label: "Price", value: `₹${(car.price / 100000).toFixed(1)}L` },
    { label: "Mileage", value: `${car.mileage} kmpl-eq` },
    { label: "Safety", value: `${car.safety}/5 ★` },
    { label: "Seats", value: `${car.seating}` },
  ];

  return (
    <article
      className={`flex flex-col rounded-xl border bg-white p-5 transition ${
        selected ? "border-brand ring-1 ring-brand" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink">
            {car.make} {car.model}
          </h3>
          <p className="text-xs text-slate-500">
            {car.variant} · {car.bodyType}
          </p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {car.fuel}
        </span>
      </div>

      <p className="mt-3 flex-1 text-sm text-slate-600">{car.blurb}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {specs.map((s) => (
          <div key={s.label} className="rounded-md bg-slate-50 px-2 py-1">
            <dt className="text-xs text-slate-400">{s.label}</dt>
            <dd className="font-medium text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      {onToggle && (
        <button
          type="button"
          onClick={() => onToggle(car.id)}
          aria-pressed={selected}
          className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            selected
              ? "bg-brand text-white hover:bg-brand-dark"
              : "border border-slate-300 text-slate-700 hover:border-brand"
          }`}
        >
          {selected ? "Selected for compare ✓" : "Add to compare"}
        </button>
      )}
    </article>
  );
}
