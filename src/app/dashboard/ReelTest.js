"use client";

import { useState } from "react";
import { C, btn } from "./ui";

// Throwaway panel to test the open-source video + voice stack (LTX-2 +
// Kokoro, both via fal.ai) on one cheap sample before building the real
// Reels pipeline. Delete this tab once that decision is made either way.
//
// Video generation is polled from here (the browser) rather than the
// server holding one request open for it — a serverless function sitting
// on a single connection for 30-90s can get killed by the platform
// mid-request, which just shows up as a bare "Failed to fetch" with no
// useful detail. Short, repeated status checks avoid that entirely.
export function ReelTest({ api }) {
  const [state, setState] = useState("idle"); // idle | busy | polling | done
  const [video, setVideo] = useState(null);
  const [audio, setAudio] = useState(null);
  const [err, setErr] = useState("");

  const run = async () => {
    setState("busy"); setErr(""); setVideo(null); setAudio(null);
    let submitted;
    try {
      submitted = await api.post("/api/dev/test-reel", {});
    } catch (e) {
      setErr(e.message); setState("done"); return;
    }
    if (submitted.audio && typeof submitted.audio === "string") setAudio(submitted.audio);
    const errors = [...(submitted.errors || [])];

    if (submitted.statusUrl && submitted.responseUrl) {
      setState("polling");
      const started = Date.now();
      const timeoutMs = 120000;
      while (Date.now() - started < timeoutMs) {
        await new Promise((r) => setTimeout(r, 3000));
        let check;
        try {
          check = await api.post("/api/dev/test-reel/status", { statusUrl: submitted.statusUrl, responseUrl: submitted.responseUrl });
        } catch (e) {
          errors.push("video: " + e.message);
          break;
        }
        if (check.status === "COMPLETED") {
          if (typeof check.video === "string") setVideo(check.video);
          else errors.push("video: unexpected response shape — " + JSON.stringify(check.video).slice(0, 200));
          break;
        }
        if (check.status === "ERROR") { errors.push("video: " + check.error); break; }
        // still IN_QUEUE / IN_PROGRESS — keep polling
        if (Date.now() - started >= timeoutMs) errors.push("video: timed out waiting for it to finish");
      }
    } else {
      errors.push(...(submitted.errors || []).filter((e) => e.startsWith("video")));
    }

    if (errors.length) setErr(errors.join(" | "));
    setState("done");
  };

  const busy = state === "busy" || state === "polling";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
        One-off test of the open-source video + voice stack (LTX-2 for the visual, Kokoro for the voiceover) on a sample health/food clip — no pipeline, no stitching, just the raw output so you can judge quality before anything real gets built on it. Costs a few cents to run.
      </div>
      <button onClick={run} disabled={busy} style={btn("primary", { width: "100%", padding: 12, opacity: busy ? 0.6 : 1 })}>
        {state === "busy" ? "Starting…" : state === "polling" ? "Generating video… (can take up to ~2 min)" : "Generate test clip"}
      </button>
      {err && <div style={{ color: C.danger, fontSize: 12, marginTop: 10 }}>{err}</div>}
      {audio && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>VOICEOVER</div>
          <audio src={audio} controls style={{ width: "100%" }} />
        </div>
      )}
      {video && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>VIDEO</div>
          <video src={video} controls style={{ width: "100%", borderRadius: 10, background: "#000" }} />
        </div>
      )}
    </div>
  );
}
