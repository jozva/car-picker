import { handleRoute, ok } from "@/lib/api/response";
import { carQuerySchema } from "@/lib/schemas";
import { carRepository } from "@/lib/repository/carRepository";

/**
 * GET /api/cars                         -> full catalogue
 * GET /api/cars?ids=a,b,c               -> subset (used by the compare view)
 * GET /api/cars?maxPrice=&fuel=&...     -> filtered catalogue
 */
export const GET = handleRoute(async (request: Request) => {
  const { searchParams } = new URL(request.url);

  const ids = searchParams.get("ids");
  if (ids) {
    const subset = carRepository.findByIds(
      ids.split(",").map((s) => s.trim()).filter(Boolean)
    );
    return ok({ count: subset.length, cars: subset });
  }

  const filters = carQuerySchema.parse(Object.fromEntries(searchParams));
  const cars = carRepository.query(filters);
  return ok({ count: cars.length, cars });
});
