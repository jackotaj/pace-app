// Log Activity bottom sheet — ported from rep-other.jsx

"use client";

import { useEffect, useState } from "react";
import { usePaceStore, useYourRep } from "@/lib/store";
import { Ic, Stepper } from "@/components/primitives";

export function LogActivitySheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const yourRep = useYourRep();
  const logActivity = usePaceStore((s) => s.logActivity);
  const showToast = usePaceStore((s) => s.showToast);
  const [delta, setDelta] = useState({ calls: 0, texts: 0, set: 0, shown: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setDelta({ calls: 0, texts: 0, set: 0, shown: 0 });
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const a = yourRep.activityToday;
  const total = delta.calls + delta.texts + delta.set + delta.shown;

  const save = async () => {
    // Optimistic local update.
    logActivity(yourRep.id, delta);
    setVisible(false);
    setTimeout(onClose, 220);
    // Persist to DB (best-effort — ignore silent failures for mock-id reps).
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rep_id: yourRep.id, delta }),
      });
      if (res.ok) {
        showToast(`Logged · ${total} items added`, "ok");
      } else {
        // Not authenticated (mock demo) — still OK locally.
        showToast(`Logged · ${total} items added`, "ok");
      }
    } catch {
      showToast(`Logged · ${total} items added`, "ok");
    }
  };

  const dismiss = () => {
    setVisible(false);
    setTimeout(onClose, 220);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: visible ? "rgba(13,14,16,.5)" : "rgba(13,14,16,0)",
        transition: "background .2s",
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "#ffffff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "12px 18px 32px",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform .25s cubic-bezier(.2,.8,.3,1)",
        }}
      >
        <div style={{ width: 36, height: 4, background: "#d8d4c7", borderRadius: 2, margin: "0 auto 18px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 22, color: "#0d0e10", letterSpacing: -0.5 }}>
            Log activity
          </div>
          <button
            onClick={dismiss}
            aria-label="close"
            style={{ border: "none", background: "transparent", color: "#6b6862", cursor: "pointer", padding: 6 }}
          >
            {Ic.close(16)}
          </button>
        </div>
        <div style={{ fontFamily: "var(--font-inter-tight)", fontSize: 13, color: "#6b6862", marginBottom: 16 }}>
          Add to today&apos;s count · {a.calls} calls · {a.texts} texts · {a.set} set · {a.shown} shown
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Stepper value={delta.calls} onChange={(v) => setDelta({ ...delta, calls: v })} label="Calls" icon={Ic.phone(18)} />
          <Stepper value={delta.texts} onChange={(v) => setDelta({ ...delta, texts: v })} label="Texts" icon={Ic.msg(18)} />
          <Stepper value={delta.set} onChange={(v) => setDelta({ ...delta, set: v })} label="Appointments set" icon={Ic.cal(18)} />
          <Stepper value={delta.shown} onChange={(v) => setDelta({ ...delta, shown: v })} label="Appts shown" icon={Ic.shake(18)} />
        </div>

        <button
          onClick={save}
          disabled={total === 0}
          style={{
            marginTop: 18,
            width: "100%",
            height: 54,
            background: total === 0 ? "#e6e3da" : "#0d0e10",
            color: total === 0 ? "#6b6862" : "#fff",
            border: "none",
            borderRadius: 14,
            fontFamily: "var(--font-archivo)",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            cursor: total === 0 ? "default" : "pointer",
          }}
        >
          Save {total > 0 && `· +${total}`}
        </button>
      </div>
    </div>
  );
}
