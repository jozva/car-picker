import type { z } from "zod";
import type {
  bodyTypeSchema,
  fuelTypeSchema,
  transmissionSchema,
  Car,
} from "./schemas";

export type BodyType = z.infer<typeof bodyTypeSchema>;
export type FuelType = z.infer<typeof fuelTypeSchema>;
export type Transmission = z.infer<typeof transmissionSchema>;

/**
 * Domain entities and request payloads are defined as zod schemas in schemas.ts
 * and re-exported here as types, so validation and types can never drift.
 */
export type { Car, Preferences, SavedShortlist } from "./schemas";

/** The factors the recommendation engine scores on. */
export type FactorKey =
  | "budget"
  | "mileage"
  | "safety"
  | "space"
  | "comfort"
  | "value";

export interface ScoredCar {
  car: Car;
  /** 0-100 overall fit score. */
  score: number;
  /** 0-100 value-for-money, relative to the car's body-type segment. */
  valueScore: number;
  /** The segment the value score is measured against. */
  segment: BodyType;
  /** Per-factor contribution to the overall score. */
  breakdown: Record<FactorKey, number>;
  /** Plain-English reasons this car fits the buyer. */
  reasons: string[];
  /** Honest trade-offs / things to watch. */
  caveats: string[];
}
