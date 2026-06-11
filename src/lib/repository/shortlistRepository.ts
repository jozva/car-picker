import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient, type VercelKV } from "@vercel/kv";
import { z } from "zod";
import { ApiError } from "../api/response";
import type { SavedShortlist } from "../types";
import { savedShortlistSchema } from "../schemas";
import type { SaveShortlistInput } from "../schemas";
import { getShortlistStorageMode } from "./shortlistStorage";

/**
 * Saved shortlists are persisted to Redis in production (Vercel KV or Upstash
 * Redis integration) and to a local `.data/` file otherwise. The async
 * interface mirrors a DB-backed implementation so callers stay unchanged.
 */
const KV_KEY = "carpicker:shortlists";
const kvUrl =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const kvToken =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const useKv = Boolean(kvUrl && kvToken);
const kv: VercelKV | null = useKv
  ? createClient({ url: kvUrl!, token: kvToken! })
  : null;
const DATA_DIR = path.join(process.cwd(), ".data");
const STORE = path.join(DATA_DIR, "shortlists.json");
const storeSchema = z.array(savedShortlistSchema);

function parseStore(raw: unknown): SavedShortlist[] {
  const parsed = storeSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

async function readStore(): Promise<SavedShortlist[]> {
  if (useKv) {
    return parseStore(await kv!.get(KV_KEY));
  }

  let raw: string;
  try {
    raw = await fs.readFile(STORE, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return parseStore(JSON.parse(raw));
}

/** Atomic write: write to a temp file then rename, so a crash never leaves a
 *  half-written store. */
async function writeStore(items: SavedShortlist[]): Promise<void> {
  if (useKv) {
    await kv!.set(KV_KEY, items);
    return;
  }

  if (getShortlistStorageMode() === "unavailable") {
    throw new ApiError(
      503,
      "Server storage is not configured. Connect Upstash Redis in Vercel Storage."
    );
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf-8");
  await fs.rename(tmp, STORE);
}

/** Serialise read-modify-write operations within this instance to avoid lost
 *  updates from concurrent requests. */
let writeChain: Promise<unknown> = Promise.resolve();
function serialize<T>(op: () => Promise<T>): Promise<T> {
  const next = writeChain.then(op, op);
  writeChain = next.catch(() => {});
  return next;
}

export const shortlistRepository = {
  async list(): Promise<SavedShortlist[]> {
    const items = await readStore();
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findById(id: string): Promise<SavedShortlist | undefined> {
    const items = await readStore();
    return items.find((s) => s.id === id);
  },

  /** Build + persist atomically inside the write lock, so the id, the label
   *  sequence number, and the file write can't race other creates. */
  create(input: SaveShortlistInput): Promise<SavedShortlist> {
    return serialize(async () => {
      const items = await readStore();
      const shortlist: SavedShortlist = {
        id: randomUUID(),
        label: input.label?.trim() || `Shortlist ${items.length + 1}`,
        carIds: input.carIds,
        createdAt: new Date().toISOString(),
      };
      items.push(shortlist);
      await writeStore(items);
      return shortlist;
    });
  },

  /** Returns true if a shortlist was removed, false if the id wasn't found. */
  remove(id: string): Promise<boolean> {
    return serialize(async () => {
      const items = await readStore();
      const next = items.filter((s) => s.id !== id);
      if (next.length === items.length) return false;
      await writeStore(next);
      return true;
    });
  },
};
