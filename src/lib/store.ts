// Zustand store — port of DDProvider from design_files/data.jsx.
// Keeps the same shape: reps[], you, toast, confetti + logActivity / addSale / showToast.

"use client";

import { create } from "zustand";
import { INITIAL_REPS, type Rep, type RepId, type ActivityToday } from "./pace";

export type ToastKind = "ok" | "sale" | "warn" | "error";
export interface Toast {
  kind: ToastKind;
  msg: string;
}

interface PaceStore {
  reps: Rep[];
  you: RepId;
  toast: Toast | null;
  confetti: boolean;

  setYou: (id: RepId) => void;
  setReps: (reps: Rep[]) => void;

  patchRep: (id: RepId, patch: Partial<Rep>) => void;
  logActivity: (id: RepId, delta: Partial<ActivityToday>) => void;
  addSale: (id: RepId, gross?: number, kind?: "new" | "used") => void;
  showToast: (msg: string, kind?: ToastKind) => void;
  clearToast: () => void;
  clearConfetti: () => void;
}

export const usePaceStore = create<PaceStore>((set, get) => ({
  reps: INITIAL_REPS,
  you: "you",
  toast: null,
  confetti: false,

  setYou: (id) => set({ you: id }),
  setReps: (reps) => set({ reps }),

  patchRep: (id, patch) =>
    set((s) => ({
      reps: s.reps.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),

  logActivity: (id, delta) =>
    set((s) => ({
      reps: s.reps.map((r) => {
        if (r.id !== id) return r;
        const a = r.activityToday;
        return {
          ...r,
          activityToday: {
            calls: Math.max(0, a.calls + (delta.calls ?? 0)),
            texts: Math.max(0, a.texts + (delta.texts ?? 0)),
            set: Math.max(0, a.set + (delta.set ?? 0)),
            shown: Math.max(0, a.shown + (delta.shown ?? 0)),
          },
          lastActivity: "today",
        };
      }),
    })),

  addSale: (id, gross = 2100, kind = "used") => {
    set((s) => ({
      reps: s.reps.map((r) =>
        r.id === id
          ? {
              ...r,
              sold: r.sold + 1,
              newSold: kind === "new" ? r.newSold + 1 : r.newSold,
              usedSold: kind === "used" ? r.usedSold + 1 : r.usedSold,
              gross: r.gross + gross,
              daysSinceSale: 0,
              streak: r.streak + 1,
            }
          : r,
      ),
      confetti: true,
      toast: { kind: "sale", msg: "Deal logged · +1 unit" },
    }));
    setTimeout(() => set({ confetti: false }), 2600);
    setTimeout(() => {
      if (get().toast?.kind === "sale") set({ toast: null });
    }, 2800);
  },

  showToast: (msg, kind = "ok") => {
    set({ toast: { kind, msg } });
    setTimeout(() => {
      if (get().toast?.msg === msg) set({ toast: null });
    }, 2400);
  },
  clearToast: () => set({ toast: null }),
  clearConfetti: () => set({ confetti: false }),
}));

export const useYourRep = () => {
  const reps = usePaceStore((s) => s.reps);
  const you = usePaceStore((s) => s.you);
  return reps.find((r) => r.id === you) ?? reps[0];
};
