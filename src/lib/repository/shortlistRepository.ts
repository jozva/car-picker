import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { SavedShortlist } from "../types";
import { savedShortlistSchema } from "../schemas";
import type { SaveShortlistInput } from "../schemas";

/**
 * Lightweight file-based persistence for saved shortlists. The async interface
 * mirrors a DB-backed implementation so it can be swapped without touching
 * callers.
 *
 * NOTE: a local file is durable for local/single-instance runs only. On a
 * serverless/multi-instance deploy the filesystem is ephemeral and per-instance;
 * production would swap this module for a hosted DB (the seam makes it a
 * one-file change).
 */
const DATA_DIR = path.join(process.cwd(), ".data");
const STORE = path.join(DATA_DIR, "shortlists.json");
const storeSchema = z.array(savedShortlistSchema);

async function readStore(): Promise<SavedShortlist[]> {
  let raw: string;
  try {
    raw = await fs.readFile(STORE, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  // Validate data at rest; tolerate a corrupt/partial file by starting fresh.
  const parsed = storeSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : [];
}

/** Atomic write: write to a temp file then rename, so a crash never leaves a
 *  half-written store. */
async function writeStore(items: SavedShortlist[]): Promise<void> {
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
