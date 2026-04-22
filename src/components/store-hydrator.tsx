// Hydrates the client Zustand store from a server-loaded snapshot on mount.
// Runs once per navigation; server owns the truth, store is a view cache.

"use client";

import { useEffect } from "react";
import { usePaceStore } from "@/lib/store";
import type { Rep } from "@/lib/pace";

export interface StoreCtx {
  storeId: string;
  storeName: string;
  storeTimezone: string;
  storeCity: string | null;
  storeState: string | null;
  yourRole: "admin" | "manager" | "rep" | null;
  repCount: number;
}

export function StoreHydrator({
  reps,
  yourRepId,
  ctx,
}: {
  reps: Rep[];
  yourRepId: string | null;
  ctx?: StoreCtx;
}) {
  const setReps = usePaceStore((s) => s.setReps);
  const setYou = usePaceStore((s) => s.setYou);
  const setCtx = usePaceStore((s) => s.setCtx);

  useEffect(() => {
    setReps(reps);
    if (yourRepId) setYou(yourRepId);
    else if (reps.length > 0) setYou(reps[0].id);
    if (ctx) setCtx(ctx);
  }, [reps, yourRepId, ctx, setReps, setYou, setCtx]);

  return null;
}
