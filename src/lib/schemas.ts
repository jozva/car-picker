import { z } from "zod";

/**
 * Zod schemas are the single source of truth for request payloads.
 * Domain types are inferred from them so validation and types never drift.
 */

export const bodyTypeSchema = z.enum([
  "Hatchback",
  "Sedan",
  "SUV",
  "MUV",
  "Compact SUV",
]);

export const fuelTypeSchema = z.enum([
  "Petrol",
  "Diesel",
  "CNG",
  "Hybrid",
  "Electric",
]);

export const transmissionSchema = z.enum(["Manual", "Automatic"]);

/**
 * The car entity. This is the validation boundary for data at rest: the seed
 * dataset is parsed through this on load so malformed records fail loudly
 * instead of silently corrupting rankings.
 */
export const carSchema = z.object({
  id: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  variant: z.string().min(1),
  bodyType: bodyTypeSchema,
  fuel: fuelTypeSchema,
  transmission: transmissionSchema,
  /** Ex-showroom price in INR. */
  price: z.number().positive(),
  /** km/l for ICE, km/charge for EV (kmpl-equivalent). */
  mileage: z.number().positive(),
  seating: z.number().int().min(2).max(9),
  /** Safety rating out of 5. */
  safety: z.number().min(0).max(5),
  /** Aggregated user review score out of 5. */
  userRating: z.number().min(0).max(5),
  bootSpace: z.number().nonnegative(),
  blurb: z.string(),
});

/** A saved shortlist as persisted on disk (validated when read back). */
export const savedShortlistSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  carIds: z.array(z.string().min(1)),
  createdAt: z.string(),
});

export const prioritiesSchema = z.object({
  budget: z.number().int().min(0).max(3),
  mileage: z.number().int().min(0).max(3),
  safety: z.number().int().min(0).max(3),
  space: z.number().int().min(0).max(3),
  comfort: z.number().int().min(0).max(3),
  // Value-for-money. Defaulted so older payloads stay valid.
  value: z.number().int().min(0).max(3).default(2),
});

export const preferencesSchema = z
  .object({
    budgetMin: z.number().nonnegative(),
    budgetMax: z.number().positive(),
    bodyTypes: z.array(bodyTypeSchema).default([]),
    fuels: z.array(fuelTypeSchema).default([]),
    transmission: z.union([transmissionSchema, z.literal("Any")]).default("Any"),
    minSeating: z.number().int().min(2).max(9).default(5),
    usage: z.enum(["City", "Highway", "Family", "Mixed"]).default("Mixed"),
    priorities: prioritiesSchema,
  })
  .refine((p) => p.budgetMax >= p.budgetMin, {
    message: "budgetMax must be greater than or equal to budgetMin.",
    path: ["budgetMax"],
  });

/** Payload for saving a shortlist. */
export const saveShortlistSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  carIds: z.array(z.string().min(1)).min(1).max(10),
  preferences: preferencesSchema.optional(),
});

/** Optional filters for the catalogue endpoint. */
export const carQuerySchema = z.object({
  maxPrice: z.coerce.number().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  bodyType: bodyTypeSchema.optional(),
  fuel: fuelTypeSchema.optional(),
  minSeating: z.coerce.number().int().optional(),
});

export type Car = z.infer<typeof carSchema>;
export type SavedShortlist = z.infer<typeof savedShortlistSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type SaveShortlistInput = z.infer<typeof saveShortlistSchema>;
export type CarQuery = z.infer<typeof carQuerySchema>;
