import type { Car, FactorKey, Preferences, ScoredCar } from "./types";

/**
 * Recommendation engine. It is pure: it depends only on the preferences and the
 * catalogue it is given, never on a global data source. That keeps it reusable
 * (different datasets, test fixtures) and trivially unit-testable.
 */

/** Merit = price-independent "goodness", used for the value-for-money factor. */
const MERIT_WEIGHTS = {
  mileage: 0.25,
  safety: 0.25,
  rating: 0.2,
  boot: 0.15,
  seating: 0.15,
} as const;

const VALUE_THRESHOLDS = {
  /** >= this segment-relative value gets a "strong value" reason. */
  strong: 0.75,
  /** <= this gets a "you pay a premium" caveat. */
  weak: 0.2,
} as const;

/** A car priced at/under this fraction of the ceiling is "comfortably" in budget. */
const COMFORTABLE_BUDGET_FRACTION = 0.9;

/**
 * Usage presets nudge the weighting so the same preferences produce sensible
 * results for different buyers. These multiply the user's sliders.
 */
const USAGE_BIAS: Record<Preferences["usage"], Partial<Record<FactorKey, number>>> = {
  City: { mileage: 1.3, budget: 1.2, space: 0.8, value: 1.2 },
  Highway: { comfort: 1.3, safety: 1.2, mileage: 1.1 },
  Family: { space: 1.4, safety: 1.3, comfort: 1.1 },
  Mixed: {},
};

const FACTOR_KEYS: FactorKey[] = [
  "budget",
  "mileage",
  "safety",
  "space",
  "comfort",
  "value",
];

function clamp(n: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, n));
}

function minMax(value: number, min: number, max: number, fallback = 0.5): number {
  return max > min ? clamp((value - min) / (max - min)) : fallback;
}

/** Dataset-wide stats the scorer needs; computed once per catalogue and cached. */
interface CatalogueStats {
  maxMileage: number;
  maxBoot: number;
  maxSeat: number;
  minPrice: number;
  /** Segment-relative value-for-money (0-1) per car id. */
  valueByCar: Map<string, number>;
}

const statsCache = new WeakMap<readonly Car[], CatalogueStats>();

function getStats(catalogue: readonly Car[]): CatalogueStats {
  const cached = statsCache.get(catalogue);
  if (cached) return cached;

  const maxMileage = Math.max(...catalogue.map((c) => c.mileage));
  const maxBoot = Math.max(...catalogue.map((c) => c.bootSpace));
  const maxSeat = Math.max(...catalogue.map((c) => c.seating));
  const minPrice = Math.min(...catalogue.map((c) => c.price));

  const stats: CatalogueStats = {
    maxMileage,
    maxBoot,
    maxSeat,
    minPrice,
    valueByCar: computeValueScores(catalogue, { maxMileage, maxBoot, maxSeat }),
  };
  statsCache.set(catalogue, stats);
  return stats;
}

/**
 * Value-for-money:
 * 1. Build an objective "merit" index from price-independent attributes.
 * 2. value-per-rupee = merit / price.
 * 3. Normalise that ratio *within each body-type segment*, so value is judged
 *    against true rivals. Single-car segments fall back to a dataset-wide range.
 */
function computeValueScores(
  catalogue: readonly Car[],
  maxes: { maxMileage: number; maxBoot: number; maxSeat: number }
): Map<string, number> {
  const ratio = new Map<string, number>();
  for (const c of catalogue) {
    const merit =
      MERIT_WEIGHTS.mileage * (c.mileage / maxes.maxMileage) +
      MERIT_WEIGHTS.safety * (c.safety / 5) +
      MERIT_WEIGHTS.rating * (c.userRating / 5) +
      MERIT_WEIGHTS.boot * (c.bootSpace / maxes.maxBoot) +
      MERIT_WEIGHTS.seating * (c.seating / maxes.maxSeat);
    ratio.set(c.id, merit / (c.price / 100000)); // merit per ₹lakh
  }

  const segments = new Map<string, number[]>();
  for (const c of catalogue) {
    const arr = segments.get(c.bodyType) ?? [];
    arr.push(ratio.get(c.id)!);
    segments.set(c.bodyType, arr);
  }

  const globalVals = [...ratio.values()];
  const gMin = Math.min(...globalVals);
  const gMax = Math.max(...globalVals);

  const value = new Map<string, number>();
  for (const c of catalogue) {
    const seg = segments.get(c.bodyType)!;
    const r = ratio.get(c.id)!;
    value.set(
      c.id,
      seg.length > 1 ? minMax(r, Math.min(...seg), Math.max(...seg)) : minMax(r, gMin, gMax)
    );
  }
  return value;
}

/** Hard filters — a car that fails these is not a candidate at all. */
function passesHardFilters(car: Car, prefs: Preferences): boolean {
  if (car.price > prefs.budgetMax) return false;
  if (car.seating < prefs.minSeating) return false;
  if (prefs.bodyTypes.length && !prefs.bodyTypes.includes(car.bodyType)) return false;
  if (prefs.fuels.length && !prefs.fuels.includes(car.fuel)) return false;
  if (prefs.transmission !== "Any" && car.transmission !== prefs.transmission) {
    return false;
  }
  return true;
}

/** 0-1 scores for each soft factor, normalised against the catalogue. */
function factorScores(
  car: Car,
  prefs: Preferences,
  stats: CatalogueStats
): Record<FactorKey, number> {
  // Budget: reward staying near the middle of the buyer's range.
  const mid = (prefs.budgetMin + prefs.budgetMax) / 2;
  const span = Math.max(prefs.budgetMax - stats.minPrice, 1);

  return {
    budget: clamp(1 - Math.abs(car.price - mid) / span),
    mileage: clamp(car.mileage / stats.maxMileage),
    safety: clamp(car.safety / 5),
    space: clamp(
      (car.seating / stats.maxSeat) * 0.5 + (car.bootSpace / stats.maxBoot) * 0.5
    ),
    comfort: clamp(car.userRating / 5),
    value: stats.valueByCar.get(car.id) ?? 0,
  };
}

function buildReasons(
  car: Car,
  prefs: Preferences,
  f: Record<FactorKey, number>
): { reasons: string[]; caveats: string[] } {
  const reasons: string[] = [];
  const caveats: string[] = [];

  if (f.value >= VALUE_THRESHOLDS.strong) {
    reasons.push(`Strong value for money among ${car.bodyType}s.`);
  } else if (f.value <= VALUE_THRESHOLDS.weak) {
    caveats.push(`You pay a premium for the badge versus other ${car.bodyType}s.`);
  }

  if (car.price <= prefs.budgetMax * COMFORTABLE_BUDGET_FRACTION) {
    reasons.push(`Comfortably within budget at ₹${(car.price / 100000).toFixed(1)}L ex-showroom.`);
  }
  if (car.safety >= 5) reasons.push("Top 5-star safety rating.");
  else if (car.safety <= 3) caveats.push("Safety rating is average for the segment.");

  if (f.mileage > 0.8) reasons.push(`Excellent efficiency at ${car.mileage} kmpl-equivalent.`);
  if (car.seating >= 7 && prefs.minSeating >= 6) reasons.push("Genuine 7-seat capacity for the family.");
  if (car.fuel === "Electric") caveats.push("Needs home/AC charging access to be practical.");
  if (car.fuel === "CNG") caveats.push("Smaller boot once the CNG tank is fitted.");
  if (car.userRating >= 4.4) reasons.push(`Owners rate it ${car.userRating}/5.`);

  if (!reasons.length) reasons.push(car.blurb);
  return { reasons, caveats };
}

/** Resolve weights from the buyer's sliders + usage bias. Falls back to equal
 *  weighting if the buyer zeroed everything, so ranking stays meaningful. */
function resolveWeights(prefs: Preferences): Record<FactorKey, number> {
  const bias = USAGE_BIAS[prefs.usage] ?? {};
  const weights = Object.fromEntries(
    FACTOR_KEYS.map((k) => [k, prefs.priorities[k] * (bias[k] ?? 1)])
  ) as Record<FactorKey, number>;

  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (sum === 0) {
    return Object.fromEntries(FACTOR_KEYS.map((k) => [k, 1])) as Record<FactorKey, number>;
  }
  return weights;
}

export function recommend(
  prefs: Preferences,
  catalogue: readonly Car[],
  limit = 5
): ScoredCar[] {
  const stats = getStats(catalogue);
  const weights = resolveWeights(prefs);
  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const candidates = catalogue.filter((car) => passesHardFilters(car, prefs));

  const scored: ScoredCar[] = candidates.map((car) => {
    const f = factorScores(car, prefs, stats);
    const breakdown = {} as Record<FactorKey, number>;
    let total = 0;
    for (const k of FACTOR_KEYS) {
      const contribution = (f[k] * weights[k]) / weightSum;
      breakdown[k] = Math.round(contribution * 100);
      total += contribution;
    }
    const { reasons, caveats } = buildReasons(car, prefs, f);
    return {
      car,
      score: Math.round(clamp(total) * 100),
      valueScore: Math.round(f.value * 100),
      segment: car.bodyType,
      breakdown,
      reasons,
      caveats,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
