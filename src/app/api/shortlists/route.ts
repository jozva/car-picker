import { handleRoute, ok, parseJson } from "@/lib/api/response";
import { saveShortlistSchema } from "@/lib/schemas";
import { shortlistService } from "@/lib/services/shortlistService";

/** GET /api/shortlists -> all saved shortlists (newest first). */
export const GET = handleRoute(async () => {
  const shortlists = await shortlistService.list();
  return ok({ count: shortlists.length, shortlists });
});

/** POST /api/shortlists -> persist a new shortlist. */
export const POST = handleRoute(async (request: Request) => {
  const input = await parseJson(request, saveShortlistSchema);
  const shortlist = await shortlistService.create(input);
  return ok({ shortlist }, 201);
});
