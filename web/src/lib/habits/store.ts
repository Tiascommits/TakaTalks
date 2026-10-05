"use client";

/**
 * Browser-local persistence for the habit tracker.
 *
 * Every other tool on the site is a pure calculator: you fill it in, read the answer and
 * leave. A habit tracker is only useful if the list is still there next month, so this
 * one keeps state — and keeps it in the browser, because the trust position in
 * docs/product-notes.md is that income and spending data does not reach a server.
 *
 * Shaped as an external store rather than component state in an effect, the same way
 * src/lib/i18n.tsx handles the saved language: useSyncExternalStore renders the server
 * snapshot during hydration and swaps in the stored one immediately after, with no
 * setState-in-effect and no hydration mismatch.
 */

import { HABIT_CATEGORIES, defaultHabitEntries, type HabitEntry } from "./habits";

const STORAGE_KEY = "takatalks_habits_v1";

export interface HabitState {
  entries: HabitEntry[];
  monthlyIncome: number;
  horizonYears: number;
}

/** Stable reference: returning a fresh object every call would re-render forever. */
const DEFAULT_STATE: HabitState = Object.freeze({
  entries: defaultHabitEntries(),
  monthlyIncome: 0,
  horizonYears: 5,
});

function parse(raw: string | null): HabitState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<HabitState>;
    if (!Array.isArray(candidate.entries)) return null;
    // A saved habit whose category no longer exists is dropped rather than crashing
    // the page — categories can be renamed between releases.
    const entries = candidate.entries.filter(
      (e): e is HabitEntry => !!e && typeof e === "object" && !!HABIT_CATEGORIES[e.category]
    );
    return {
      entries,
      monthlyIncome: Number(candidate.monthlyIncome) || 0,
      horizonYears: Number(candidate.horizonYears) || 5,
    };
  } catch {
    return null;
  }
}

// Cached so getSnapshot returns the identical object until the stored string actually
// changes, which is what useSyncExternalStore requires.
let cachedRaw: string | null = null;
let cachedState: HabitState = DEFAULT_STATE;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeToHabits(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function getHabitSnapshot(): HabitState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode or blocked storage: the tracker still works for this visit.
    return cachedState;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parse(raw) ?? DEFAULT_STATE;
  }
  return cachedState;
}

export function getHabitServerSnapshot(): HabitState {
  return DEFAULT_STATE;
}

export function writeHabitState(next: HabitState): void {
  cachedState = next;
  try {
    cachedRaw = JSON.stringify(next);
    window.localStorage.setItem(STORAGE_KEY, cachedRaw);
  } catch {
    // Quota full or storage blocked — the change still applies for this session, it
    // just will not survive a reload.
    cachedRaw = null;
  }
  notify();
}
