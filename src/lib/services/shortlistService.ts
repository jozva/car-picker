import { ApiError } from "../api/response";
import { carRepository } from "../repository/carRepository";
import { shortlistRepository } from "../repository/shortlistRepository";
import type { Car, SavedShortlist } from "../types";
import type { SaveShortlistInput } from "../schemas";

/**
 * Owns shortlist business rules so they live in one place, independent of the
 * HTTP layer (a CLI, job, or other caller would reuse the same invariants).
 */
export const shortlistService = {
  list(): Promise<SavedShortlist[]> {
    return shortlistRepository.list();
  },

  async getWithCars(
    id: string
  ): Promise<{ shortlist: SavedShortlist; cars: Car[] }> {
    const shortlist = await shortlistRepository.findById(id);
    if (!shortlist) throw new ApiError(404, "Shortlist not found.");
    return { shortlist, cars: carRepository.findByIds(shortlist.carIds) };
  },

  create(input: SaveShortlistInput): Promise<SavedShortlist> {
    // Invariant: never persist a reference to a car that doesn't exist.
    const unknown = input.carIds.filter((cid) => !carRepository.findById(cid));
    if (unknown.length) {
      throw new ApiError(422, "Some car ids do not exist.", { unknown });
    }
    return shortlistRepository.create(input);
  },

  async remove(id: string): Promise<void> {
    const removed = await shortlistRepository.remove(id);
    if (!removed) throw new ApiError(404, "Shortlist not found.");
  },
};
