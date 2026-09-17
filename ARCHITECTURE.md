# Carousel Studio — Architecture

## Overview
Carousel Studio (studio.buildwithtav.co) — Next.js 14 SaaS app, freemium with paid tiers, built by Tav.

## Repository
- `BuildwithTav/CarouselGenerator`
- Production branch: `main`
- Primary working file: `src/components/CarouselGenerator.jsx`
- Known stale branch: `claude/carousel-production-mode-p1j3gn` — has one local commit (`fd57ec5`, fal.ai AI-photo-gen button on the Listicle template) that was never pushed to GitHub. Verify whether this landed before treating `main` as complete.

## Stack
- Next.js 14, hosted on Vercel
- Supabase (see below)
- Stripe (payments)
- Anthropic API (claude-sonnet-4-6) — content generation
- Resend — email
- fal.ai (nano-banana model) via `/api/generate-bg` — AI background image generation

## Deployment
- Domain: studio.buildwithtav.co
- Vercel team slug is believed to be `tav-s-projects` (seen in a deployment alias: `carousel-generator-3au8qi0f6-tav-s-projects.vercel.app`) — **unconfirmed, verify against the actual Vercel dashboard**, API lookup failed with 403 from the automation session that compiled this doc.

## Database — Supabase project "Carousel-studio"
- Project ref: `ixjyxfwjyksbqdymyany`, region eu-west-2
- Tables: `users`, `referrals`, `commissions`, `payout_requests`, `licence_purchases`, `monthly_rate_snapshots`, `pending_affiliate_refs`
- This appears to cover: user accounts (passwordless login — first name + email + emailed code), paid-tier purchases (`licence_purchases`), and Carousel Studio's own internal affiliate/referral program (refer other users, earn commission, request payout)
- **No table currently stores carousel/design content itself.** Either generation is fully stateless (renders from a Theme Page + AI copy, exports directly to PNG/zip with nothing persisted server-side), or that data lives somewhere not yet identified. Verify against the actual source code rather than assuming.
- **Security gap — fixed 2026-09-17**: Row Level Security was disabled on all 7 tables (anyone with the anon key could read/write every row, including commissions and payout requests). Enabled with no policies — verified safe first since all app access to these tables goes through server routes using the service-role key, which bypasses RLS regardless of policies. See `DECISIONS.md` and `supabase/migrations/`.

## Explicitly NOT part of Carousel Studio
- Supabase project `pdf-product-generator` (ref `zgztarprkysdtigkkcbh`) is a **separate, unrelated tool** — tables (`business_profiles`, `leads`, `teaser_usage`, `free_access_codes`, `project_payments`, `sections`, `trend_scan_cache`) look like the local-business outreach/PDF-demo generator, not Carousel Studio. Don't let similar naming pull this into Carousel Studio work.

## Downstream automation pattern (separate repo/system, not part of this app)
Carousel Studio is consumed by a proven external pipeline (built for the "Our Truth" Instagram page, now being generalized to other brands):
Carousel Studio (Theme Page → batch generate → review → approve → export) → Buffer (scheduling) → local reel-builder (PIL + ffmpeg) → daily scheduled automation task.
See `OPERATIONS.md` for details.
