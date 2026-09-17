# Decisions Log

## Multi-agent workflow (2026-09-17)
- Claude Code is sole code writer / primary implementer on this repo — it already has push access and deployment context.
- Codex acts as architecture/spec input and independent PR/diff reviewer — does not write directly to implementation branches.
- Manus is restricted to competitor research and browser-heavy research automation — kept out of the production codebase entirely.
- GitHub is the permanent source of truth. Operational knowledge (architecture, roadmap, decisions, ops) lives in repo docs, not in AI chat history, which degrades and becomes inaccessible over time.
- Workflow: define requirement/architecture in chat (with Claude and/or Codex) → Claude Code implements on a feature branch → Codex reviews the resulting PR/diff → Claude Code applies accepted feedback and merges. Two agents never edit the same branch simultaneously.

## Content automation strategy (2026-09-17)
- Decided to extend/generalize the existing proven pipeline (Carousel Studio → local reel-builder, originally built for "Our Truth") across new brands, rather than building a separate system per brand or starting fresh.
- "Our Truth" (@ourtruthtime) is being wound down as a brand, but its content-generation pipeline is retained and reused — the system worked, no reason to discard it.

## Publishing model changed: manual-post, no Buffer (2026-09-17)
- **Superseded decision**: earlier plan assumed Buffer for scheduling with `schedulingType: "automatic"`. This is dropped.
- New model: the system prepares and formats everything (carousel, reel, per-platform captions/hashtags/tags/pinned comment) into a Today queue with copy-to-clipboard packages; Tav posts manually 2-3x/day by opening each platform's app himself and pasting in the prepped content, then marks the item posted.
- Reasoning: removes ongoing subscription cost entirely (no Buffer/Ayrshare/etc.), and removes dependency on Meta's Instagram App Review and TikTok's Direct Post audit — both are required for auto-publish regardless of which tool sits on top (confirmed: unaudited TikTok apps are restricted to private-only visibility; Meta requires App Review even for an app's own connected accounts). Going the automated route again would mean re-attempting the same review process that previously stalled on the TikTok Cross-Poster project.
- No OAuth, publisher adapter, job queue, or worker-heartbeat infrastructure needed for v1 as a result — meaningfully smaller build than the original "Content Operations Dashboard" spec.
- Auto-publish is not ruled out forever — revisit only if there's budget for a scheduler subscription and/or appetite to personally clear Instagram App Review / TikTok's audit. Not a blocker for anything in the current roadmap.

## Phase 0 audit findings (2026-09-17)
- **RLS — fixed.** Enabled on all 7 tables in `Carousel-studio` with no policies (`supabase/migrations/20260917134505_enable_rls_public_tables.sql`). Verified safe first: every server route that touches these tables uses `SUPABASE_SERVICE_KEY` (bypasses RLS regardless of policies); the only client-side Supabase call is `auth.refreshSession()`, which operates on Supabase's internal auth schema, not these tables. So a zero-policy enable blocks the anon-key hole without touching app behavior.
- **Confirmed: no carousel/design content is persisted server-side.** `/api/generate` only touches `users` (credits). History and the template/brand-preset library live entirely in browser `localStorage`, capped at 10 items, per-browser only — doesn't sync across devices. This is real Phase 1 work, not a fix: needs actual tables.
- **Media storage conflicts with the brief's private-storage plan.** `/api/upload-photo` writes to public Vercel Blob (`access: 'public'`); Supabase Storage isn't used anywhere in the codebase. SkyHighSoles' "stricter privacy" requirement is dropped (Tav: content can be as explicit as needed, no special privacy tier) — but the public-URL pattern still needs revisiting in Phase 1 for the content library generally.
- **Stale branch claim resolved — nothing to reconcile.** The `fd57ec5` commit referenced in `ARCHITECTURE.md` doesn't exist anywhere reachable (not on `main`, not on any remote branch, not fetchable). `main` does have an orphaned `/api/generate-bg` route (fal.ai `flux/schnell`, not "nano-banana") that isn't wired to any UI button — dead code, not a landed feature.
- Vercel project/team name still unconfirmed via API (403 on both `list_projects` and `get_project` for `tav-s-projects`) — needs manual confirmation from the Vercel dashboard, can't be fixed from this session.
- SkyHighSoles scope: privacy tier dropped per above; queue-only vs. also-copywriting still undecided.
- Exact sequencing/timing of HealthCode Performance / Build with Tav / SkyHighSoles rollout not yet finalized beyond the phase order in ROADMAP.md.
