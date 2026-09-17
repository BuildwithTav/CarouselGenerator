# Roadmap — Content Queue & Library (manual-post model)

**Pivot (2026-09-17):** dropped automated publishing entirely. Tav posts manually 2-3x/day per platform; the system's job is to have everything prepped, formatted, and copy-paste ready when he sits down to do it. This removes Buffer (or any paid scheduler) from the build, and removes the need to go through Meta App Review / TikTok's audit for auto-publish — the exact process that stalled before on the TikTok Cross-Poster attempt. No subscription cost, no platform review dependency.

Extends the proven Carousel Studio + local reel-builder pipeline (originally built for "Our Truth") across additional brands, wrapped in a lightweight queue/library dashboard — no publishing automation.

## Phase 1 — Foundation: content library + Today queue
- Multi-brand config (brand voice/pillars/visual theme/CTA rules — reuse Carousel Studio's Theme Page concept, generalized)
- Content record: idea → generated carousel/reel → per-platform package (IG/TikTok caption+hashtags, YouTube title/description/tags/pinned comment) → approved → posted
- Today screen: everything due across all brands, one list
- Copy-to-clipboard for each platform's ready text; direct links/thumbnails to grab the image/video assets
- "Mark as posted" per platform per item (manual — no API call, just a status update)
- No OAuth, no publisher integration, no job/worker infrastructure — not needed without auto-publish

## Phase 2 — HealthCode Performance live
Smallest brand, proves the queue/library model end to end. Needs: handles per platform, content niche/pillars, whether a Theme Page already exists or needs building.

## Phase 3 — Build with Tav live
Bring the main brand's daily content (currently fully manual, 2-3x/day) onto the same queue/library.

## Phase 4 — SkyHighSoles
Scope still pending: infrastructure/queue-only (content supplied separately) vs. also generating captions/hashtags (non-explicit copy only). Separate, stricter-privacy media handling regardless of scope.

## Phase 5 — Optional future: automation
Only revisit if/when cash flow supports a subscription (Buffer, ~£35-55/month for the eventual 7-9 channels) and/or Tav wants to personally clear Meta's Instagram App Review and TikTok's audit for a self-hosted option (Postiz, free; or Mixpost, one-time ~$299). Not needed for the MVP — the manual-post queue is the whole point of this phase of the build.

## Ongoing
- Keep `ARCHITECTURE.md` / `DECISIONS.md` / `OPERATIONS.md` current — source of truth lives in the repo, not chat history.
- Any Supabase schema change goes through a proper migration.
- RLS audit on the `Carousel-studio` project before new brands' data goes through it.
