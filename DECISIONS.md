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

## Open / unresolved
- RLS disabled on all 7 tables in the `Carousel-studio` Supabase project — flagged critical, not yet remediated. Needs policy design before enabling (blind enable will break app access).
- Unconfirmed whether Carousel Studio persists carousel/design content server-side anywhere, or is fully export-based/stateless — needs verification from actual source code.
- Vercel project/team name unconfirmed via API (403) — needs manual confirmation from the Vercel dashboard.
- SkyHighSoles scope not yet decided: queue/infrastructure-only vs. also generating captions/hashtags (non-explicit copy only if so).
- Exact sequencing/timing of HealthCode Performance / Build with Tav / SkyHighSoles rollout not yet finalized beyond the phase order in ROADMAP.md.
