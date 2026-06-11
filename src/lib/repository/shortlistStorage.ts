/** Where saved shortlists are persisted for the current runtime. */
export type ShortlistStorageMode = "redis" | "file" | "unavailable";

export function getShortlistStorageMode(): ShortlistStorageMode {
  const hasRedis = Boolean(
    (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL) &&
      (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)
  );
  if (hasRedis) return "redis";
  if (process.env.VERCEL) return "unavailable";
  return "file";
}
