import { carRepository } from "../repository/carRepository";
import { recommend } from "../recommend";
import type { Preferences, ScoredCar } from "../types";

/**
 * Wires the data source to the pure engine. Routes and any other entry point
 * call this rather than reaching into the repository + engine themselves.
 */
export function getRecommendations(prefs: Preferences, limit?: number): ScoredCar[] {
  return recommend(prefs, carRepository.findAll(), limit);
}
