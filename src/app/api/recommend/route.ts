import { handleRoute, ok, parseJson } from "@/lib/api/response";
import { preferencesSchema } from "@/lib/schemas";
import { getRecommendations } from "@/lib/services/recommendationService";

/**
 * POST /api/recommend
 * Body: Preferences. Returns a ranked, explained shortlist.
 */
export const POST = handleRoute(async (request: Request) => {
  const prefs = await parseJson(request, preferencesSchema);
  const results = getRecommendations(prefs);
  return ok({ count: results.length, results });
});
