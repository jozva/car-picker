import { handleRoute, ok } from "@/lib/api/response";
import { shortlistService } from "@/lib/services/shortlistService";

/** GET /api/shortlists/:id -> a saved shortlist with its cars hydrated. */
export const GET = handleRoute(
  async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const result = await shortlistService.getWithCars(id);
    return ok(result);
  }
);

/** DELETE /api/shortlists/:id -> remove a saved shortlist. */
export const DELETE = handleRoute(
  async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    await shortlistService.remove(id);
    return ok({ id, deleted: true });
  }
);
