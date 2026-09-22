"use client";

import { useState } from "react";
import { C, btn } from "./ui";

// Throwaway panel to test the open-source video + voice stack (LTX-2 +
// Kokoro, both via fal.ai) on one cheap sample before building the real
// Reels pipeline. Delete this tab once that decision is made either way.
export function ReelTest({ api }) {
  const [state, setState] = useState("idle"); // idle | busy | done
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const run = async () => {
    setState("busy"); setErr(""); setResult(null);
    try {
      const d = await api.post("/api/dev/test-reel", {});
      setResult(d);
      if (d.errors?.length) setErr(d.errors.join(" | "));
    } catch (e) {
      setErr(e.message);
    }
    setState("done");
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
        One-off test of the open-source video + voice stack (LTX-2 for the visual, Kokoro for the voiceover) on a sample health/food clip — no pipeline, no stitching, just the raw output so you can judge quality before anything real gets built on it. Costs a few cents to run.
      </div>
      <button onClick={run} disabled={state === "busy"} style={btn("primary", { width: "100%", padding: 12, opacity: state === "busy" ? 0.6 : 1 })}>
        {state === "busy" ? "Generating… (can take up to ~2 min)" : "Generate test clip"}
      </button>
      {err && <div style={{ color: C.danger, fontSize: 12, marginTop: 10 }}>{err}</div>}
      {result?.video && typeof result.video === "string" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>VIDEO</div>
          <video src={result.video} controls style={{ width: "100%", borderRadius: 10, background: "#000" }} />
        </div>
      )}
      {result?.audio && typeof result.audio === "string" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>VOICEOVER</div>
          <audio src={result.audio} controls style={{ width: "100%" }} />
        </div>
      )}
      {result && (result.video || result.audio) && (typeof result.video !== "string" || typeof result.audio !== "string") && (
        <pre style={{ marginTop: 16, fontSize: 10, background: C.bg, padding: 10, borderRadius: 8, overflow: "auto", maxHeight: 240 }}>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
