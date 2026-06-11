import { z } from "zod";
import carsData from "../../../data/cars.json";
import type { Car } from "../types";
import { carSchema } from "../schemas";
import type { CarQuery } from "../schemas";

/**
 * The only place that knows how cars are stored. Today it's a typed JSON seed;
 * swapping in Postgres/Prisma later means changing only this file, not callers.
 *
 * The seed is validated through carSchema at load: this is the data-at-rest
 * trust boundary, so a malformed record fails loudly at startup rather than
 * silently flowing into rankings.
 */
const all: Car[] = z.array(carSchema).parse(carsData);

export const carRepository = {
  findAll(): Car[] {
    return all;
  },

  findById(id: string): Car | undefined {
    return all.find((c) => c.id === id);
  },

  findByIds(ids: string[]): Car[] {
    const set = new Set(ids);
    // Preserve the caller's id order so compare columns stay predictable.
    return ids
      .map((id) => all.find((c) => c.id === id))
      .filter((c): c is Car => Boolean(c) && set.has(c!.id));
  },

  /** Apply optional catalogue filters. */
  query(filters: CarQuery): Car[] {
    return all.filter((c) => {
      if (filters.maxPrice !== undefined && c.price > filters.maxPrice) return false;
      if (filters.minPrice !== undefined && c.price < filters.minPrice) return false;
      if (filters.bodyType && c.bodyType !== filters.bodyType) return false;
      if (filters.fuel && c.fuel !== filters.fuel) return false;
      if (filters.minSeating !== undefined && c.seating < filters.minSeating) {
        return false;
      }
      return true;
    });
  },
};
