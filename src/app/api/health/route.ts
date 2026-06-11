import { handleRoute, ok } from "@/lib/api/response";
import { carRepository } from "@/lib/repository/carRepository";

/** GET /api/health -> liveness + dataset sanity check. */
export const GET = handleRoute(async () => {
  return ok({
    status: "ok",
    carsLoaded: carRepository.findAll().length,
    timestamp: new Date().toISOString(),
  });
});
