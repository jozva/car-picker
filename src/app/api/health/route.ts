import { handleRoute, ok } from "@/lib/api/response";
import { carRepository } from "@/lib/repository/carRepository";
import { getShortlistStorageMode } from "@/lib/repository/shortlistStorage";

/** GET /api/health -> liveness + dataset sanity check. */
export const GET = handleRoute(async () => {
  return ok({
    status: "ok",
    carsLoaded: carRepository.findAll().length,
    shortlistStorage: getShortlistStorageMode(),
    timestamp: new Date().toISOString(),
  });
});
