'use client';

import { useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { MAX_QUANTITY_PER_LINE } from '@/lib/checkout/pricing';
import type { CartLine } from '@/lib/cart/types';

/**
 * Cart persistence — §1, §26.
 *
 * A module-level store read through `useSyncExternalStore`, not a plain
 * `useState` hydrated in an effect: React's own guidance for "state backed by
 * a browser API that does not exist during SSR" is this hook specifically —
 * it renders `getServerSnapshot()` (`[]`) for the server and the very first
 * client paint, then synchronises to the real, hydrated value with no
 * `setState`-in-an-effect cascade. Eleven products and one cart is not a
 * problem Redux or Zustand earns its weight solving either (§1 "Do not
 * introduce Redux/Zustand unless the project genuinely needs it") — this is a
 * few dozen lines with no dependency.
 *
 * The stored value is versioned (`STORAGE_KEY` includes `v1`) and parsed
 * defensively — a shape from a future revision, or garbage from a browser
 * extension, resets to an empty cart rather than throwing. That mirrors how
 * `parseCatalogueQuery` treats an unrecognised query: fail safe to the
 * default, never crash the page over untrusted stored state.
 */

const STORAGE_KEY = 'renvura-cart-v1';
const MAX_LINES = 30;

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.slug === 'string' &&
    line.slug !== '' &&
    typeof line.quantity === 'number' &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    typeof line.name === 'string' &&
    typeof line.priceMinor === 'number' &&
    line.priceMinor > 0
  );
}

function readStoredLines(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isCartLine).slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

function writeStoredLines(next: CartLine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable (private browsing): the cart still works
    // for this page load, it just will not survive a refresh. Not worth
    // surfacing to the customer over.
  }
}

/** The exact reference `getServerSnapshot` always returns — see `isReady` below. */
const SERVER_SNAPSHOT: readonly CartLine[] = [];

let lines: CartLine[] = SERVER_SNAPSHOT as CartLine[];
let hydrated = false;
const listeners = new Set<() => void>();

function hydrateOnce(): void {
  if (hydrated) return;
  hydrated = true;
  lines = readStoredLines();
}

function setLines(next: CartLine[]): void {
  lines = next;
  writeStoredLines(next);
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);

  // Cross-tab sync: a cart change in one tab is reflected in another on its
  // next interaction, so a customer with two tabs open never sees a stale
  // count in one of them.
  function onStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) return;
    lines = readStoredLines();
    callback();
  }
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): CartLine[] {
  hydrateOnce();
  return lines;
}

function getServerSnapshot(): CartLine[] {
  return SERVER_SNAPSHOT as CartLine[];
}

const lineKey = (slug: string, variantId?: string) => `${slug}::${variantId ?? ''}`;

export type AddLineInput = {
  slug: string;
  variantId?: string;
  quantity: number;
  name: string;
  priceMinor: number;
  imageUrl?: string;
  imageAlt?: string;
  isDemo?: boolean;
};

function addLine(input: AddLineInput): void {
  const key = lineKey(input.slug, input.variantId);
  const existing = lines.find((line) => lineKey(line.slug, line.variantId) === key);

  if (existing) {
    const nextQuantity = Math.min(existing.quantity + input.quantity, MAX_QUANTITY_PER_LINE);
    setLines(
      lines.map((line) => (lineKey(line.slug, line.variantId) === key ? { ...line, quantity: nextQuantity } : line)),
    );
    return;
  }

  if (lines.length >= MAX_LINES) return;

  setLines([
    ...lines,
    {
      slug: input.slug,
      variantId: input.variantId,
      quantity: Math.min(Math.max(1, input.quantity), MAX_QUANTITY_PER_LINE),
      name: input.name,
      priceMinor: input.priceMinor,
      imageUrl: input.imageUrl,
      imageAlt: input.imageAlt,
      isDemo: input.isDemo,
    },
  ]);
}

function updateQuantity(slug: string, quantity: number, variantId?: string): void {
  const key = lineKey(slug, variantId);
  if (quantity < 1) {
    setLines(lines.filter((line) => lineKey(line.slug, line.variantId) !== key));
    return;
  }

  const clamped = Math.min(quantity, MAX_QUANTITY_PER_LINE);
  setLines(lines.map((line) => (lineKey(line.slug, line.variantId) === key ? { ...line, quantity: clamped } : line)));
}

function removeLine(slug: string, variantId?: string): void {
  const key = lineKey(slug, variantId);
  setLines(lines.filter((line) => lineKey(line.slug, line.variantId) !== key));
}

function clear(): void {
  setLines([]);
}

export type CartContextValue = {
  lines: CartLine[];
  /** Total item count across all lines — the header badge number. */
  count: number;
  /** Display-only, from cached prices. The order total is always server-computed (§9). */
  subtotalMinor: number;
  /** True once the client has hydrated from `localStorage` — guards the first paint from a flash of "0". */
  isReady: boolean;
  addLine: (input: AddLineInput) => void;
  updateQuantity: (slug: string, quantity: number, variantId?: string) => void;
  removeLine: (slug: string, variantId?: string) => void;
  clear: () => void;
};

/**
 * A pure passthrough — the cart lives in module state, not in a React tree —
 * kept so the app has one clear place cart state is "installed" and so
 * `useCart()` reads naturally as "part of a provided system" wherever it is
 * called, matching the rest of the app's provider-based conventions.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useCart(): CartContextValue {
  const currentLines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // `addLine`/`updateQuantity`/`removeLine`/`clear` are module-level
  // functions, not closures created per render — they are already stable
  // across renders with no `useCallback` needed.
  return useMemo<CartContextValue>(() => {
    const count = currentLines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotalMinor = currentLines.reduce((sum, line) => sum + line.priceMinor * line.quantity, 0);
    return {
      lines: currentLines,
      count,
      subtotalMinor,
      isReady: currentLines !== SERVER_SNAPSHOT,
      addLine,
      updateQuantity,
      removeLine,
      clear,
    };
  }, [currentLines]);
}
