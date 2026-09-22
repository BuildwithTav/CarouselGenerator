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
// mid-request, which just shows up as a bare "Failed to fetch"/504 with no
// useful detail. Short, repeated status checks avoid that entirely.
//
// A candidate model can fail two ways: the submit call itself can error
// (the server already falls back to the next candidate for that), or the
// job gets accepted fine and then dies during actual processing — only
// visible once polling reports status ERROR. This loop handles the second
// case itself, by asking the server for the next untried model each time.
const MAX_MODEL_ATTEMPTS = 3;

export function ReelTest({ api }) {
  const [state, setState] = useState("idle"); // idle | busy | polling | done
  const [video, setVideo] = useState(null);
  const [audio, setAudio] = useState(null);
  const [model, setModel] = useState(null);
  const [err, setErr] = useState("");

  const pollOne = async (statusUrl, responseUrl, timeoutMs = 120000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      await new Promise((r) => setTimeout(r, 3000));
      const check = await api.post("/api/dev/test-reel/status", { statusUrl, responseUrl });
      if (check.status === "COMPLETED") return { ok: true, video: check.video };
      if (check.status === "ERROR") return { ok: false, error: check.error };
    }
    return { ok: false, error: "timed out waiting for it to finish" };
  };

  const run = async () => {
    setState("busy"); setErr(""); setVideo(null); setAudio(null); setModel(null);

    let submitted;
    try {
      submitted = await api.post("/api/dev/test-reel", {});
    } catch (e) {
      setErr(e.message); setState("done"); return;
    }
    if (submitted.audio && typeof submitted.audio === "string") setAudio(submitted.audio);
    const errors = [...(submitted.errors || [])];

    const triedModels = [];
    let statusUrl = submitted.statusUrl, responseUrl = submitted.responseUrl, currentModel = submitted.model;
    let gotVideo = false;

    for (let attempt = 0; attempt < MAX_MODEL_ATTEMPTS && statusUrl && responseUrl; attempt++) {
      triedModels.push(currentModel);
      setModel(currentModel);
      setState("polling");
      let result;
      try {
        result = await pollOne(statusUrl, responseUrl);
      } catch (e) {
        result = { ok: false, error: e.message };
      }
      if (result.ok && typeof result.video === "string") {
        setVideo(result.video);
        gotVideo = true;
        break;
      }
      errors.push(`video (${currentModel}): ${result.error || "unexpected response"}`);

      // That model's job died mid-processing — ask the server for the next
      // untried candidate rather than giving up on the first failure.
      let next;
      try {
        next = await api.post("/api/dev/test-reel", { skipModels: triedModels });
      } catch (e) {
        errors.push("video: " + e.message);
        break;
      }
      if (!next.statusUrl || !next.responseUrl) {
        errors.push(...(next.errors || []));
        break;
      }
      statusUrl = next.statusUrl; responseUrl = next.responseUrl; currentModel = next.model;
    }

    if (!gotVideo && errors.every((e) => !e.startsWith("video"))) errors.push("video: no candidate models available");
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
        {state === "busy" ? "Starting…" : state === "polling" ? `Generating video (${model})… up to ~2 min` : "Generate test clip"}
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
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>VIDEO{model ? ` — ${model}` : ""}</div>
          <video src={video} controls style={{ width: "100%", borderRadius: 10, background: "#000" }} />
        </div>
      )}
    </div>
  );
}
