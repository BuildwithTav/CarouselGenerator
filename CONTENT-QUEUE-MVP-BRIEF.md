# Content Queue & Library — MVP Build Brief (manual-post model)

## Objective
Extend the existing `BuildwithTav/CarouselGenerator` repository (do not rewrite or disrupt the working Carousel Studio / reel-generation pipeline — generalise and wrap it) into a mobile-friendly, multi-brand content queue and library.

No publishing automation. No OAuth with any platform. Tav posts manually 2-3x/day; the system's only job is to make that fast: everything generated, formatted per platform, and copy-paste ready.

## Brands
- **Build with Tav** — primary brand, highest quality bar. Content prepared automatically; Tav reviews/edits before it's "ready."
- **HealthCode Performance** — reviving, wants minimal ongoing time investment. Generate from approved content pillars, auto-mark ready once validated (no unverified medical claims), just needs Tav to post it.
- **SkyHighSoles** — source media uploaded by Tav from phone. Non-explicit captions/hashtags only, unless told otherwise. Stricter privacy on storage (see below). Scope (queue-only vs. also copywriting) to be confirmed before this brand's work starts.

## What it needs to centralise
- Raw photos/video/B-roll (per brand)
- Carousel + reel generation (existing pipeline)
- Platform-specific captions and metadata
- Human review/approval
- A daily "what's due" queue with copy-paste-ready packages
- Simple posted/not-posted history

## Explicitly NOT in this build
- No OAuth or API connection to Instagram/TikTok/YouTube
- No scheduler, no publisher adapter, no job/worker queue, no "worker online" status
- No Buffer, Ayrshare, or any paid scheduling subscription
- No auto-publish of any kind — that's a possible future phase only, not this one

## Main screens

**Today** — the default screen. Per brand, per platform: what's due, prepped and ready. For each item: a "copy caption" button (IG/TikTok: one block with hashtags inside, max 5; YouTube: separate title/description/tags/pinned-comment fields, each with its own copy button), a link/thumbnail to the asset (carousel PNGs or reel video file) to download or open on phone, and a "mark posted" button per platform once Tav's actually posted it.

**Content Library** — all photos/videos/B-roll/generated assets per brand and per content item, so nothing gets lost or reused without checking (cross-check against posted history — see the "stale local files" lesson already learned on the Our Truth project: verify before treating any local leftover as a ready backlog).

**Content Editor** — one record per content item: source idea, brand/pillar, carousel slides, reel preview, generated images, the three platform packages, approval status, posted history per platform. Allow approving all platforms at once or editing one individually; regenerating a single field without redoing everything.

**Brand config** — per brand: voice, content pillars, visual theme/Carousel Studio Theme Page, CTA rules, approved/prohibited subjects, daily target, automation mode (auto-ready vs. needs-review).

## Data model (adapt to existing schema, don't duplicate equivalent tables)
Reuse Codex's proposed model from the earlier full-dashboard brief for `brands`, `ideas`, `media_collections`, `media_assets`, `content_items`, `content_assets`, `platform_variants`. **Drop** `platform_accounts` (no OAuth), `publication_jobs` (no publishing to track), `jobs`/`worker_heartbeats` (no async publish workers needed) — these existed only to support auto-publish. `platform_variants.approval_status` plus a simple `posted_at` per platform on the content item covers what's needed instead.

## Media storage and security
Same requirements as the full spec: private Supabase Storage, no public original-media URLs, short-lived signed URLs for anything served to Tav's phone/browser, RLS on every table (note: currently disabled on all 7 tables in the existing `Carousel-studio` project — fix as part of this work, with real policies, not a blind enable), separate private bucket for SkyHighSoles with stricter access, consent/usage tracking for SkyHighSoles assets, never auto-delete phone originals.

## Implementation order
**Phase 0 — Audit.** Read-only pass over the repo, Vercel project, and Supabase schema. Confirm what's reusable, what conflicts, the RLS gap, and whether carousel content is actually persisted anywhere today. Report before building anything.
**Phase 1 — Foundation.** Multi-brand model, RLS fix, Today screen, content library, copy-paste packages.
**Phase 2 — HealthCode Performance** end to end (smallest scope, proves the model).
**Phase 3 — Build with Tav** end to end.
**Phase 4 — SkyHighSoles**, once scope is confirmed.

## MVP acceptance criteria
- Tav can log in from phone and laptop.
- Tav can upload photos/video from his phone into the library.
- One idea can generate a carousel, reel, and three platform packages (IG/TikTok/YouTube).
- Today screen shows what's due across all active brands in one place.
- Every platform package has a working one-tap copy button with correctly formatted text (hashtags inside caption, max 5; YouTube fields separate).
- Marking something posted updates its status and it drops off Today.
- Existing Carousel Studio functionality keeps working, unchanged.
- No secrets in client code, logs, commits, or browser-readable rows.
- Zero recurring subscription cost introduced by this build.
