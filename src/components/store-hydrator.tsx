// Hydrates the client Zustand store from a server-loaded snapshot on mount.
// Runs once per navigation; server owns the truth, store is a view cache.

"use client";

import { useEffect } from "react";
import { usePaceStore } from "@/lib/store";
import type { Rep } from "@/lib/pace";

export function StoreHydrator({
  reps,
  yourRepId,
}: {
  reps: Rep[];
  yourRepId: string | null;
}) {
  const setReps = usePaceStore((s) => s.setReps);
  const setYou = usePaceStore((s) => s.setYou);

  useEffect(() => {
    setReps(reps);
    if (yourRepId) setYou(yourRepId);
    else if (reps.length > 0) setYou(reps[0].id);
  }, [reps, yourRepId, setReps, setYou]);

  return null;
}
