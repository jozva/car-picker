import type { SavedShortlist } from "../types";

const STORAGE_KEY = "carpicker:shortlists";

function read(): SavedShortlist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedShortlist[]) : [];
  } catch {
    return [];
  }
}

function write(items: SavedShortlist[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listLocalShortlists(): SavedShortlist[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveLocalShortlist(input: {
  carIds: string[];
  label?: string;
}): SavedShortlist {
  const items = read();
  const shortlist: SavedShortlist = {
    id: crypto.randomUUID(),
    label: input.label?.trim() || `Shortlist ${items.length + 1}`,
    carIds: input.carIds,
    createdAt: new Date().toISOString(),
  };
  items.push(shortlist);
  write(items);
  return shortlist;
}

export function removeLocalShortlist(id: string): boolean {
  const items = read();
  const next = items.filter((s) => s.id !== id);
  if (next.length === items.length) return false;
  write(next);
  return true;
}

export function isLocalShortlistId(id: string): boolean {
  return read().some((s) => s.id === id);
}
