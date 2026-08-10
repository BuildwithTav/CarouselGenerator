# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Carousel Studio (package name `carousel-generator`) — a SaaS tool that generates Instagram carousel image posts. Users describe a topic (or pick a template), Claude (via the Anthropic SDK) writes the slide copy, and the app renders each slide as an HTML/CSS card that gets screenshotted into a PNG via headless Chromium. Built and run solo by "Tav" (BuildWithTav); production is `studio.buildwithtav.co`, deployed on Vercel from the `main` branch.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build (Next.js). **There is no lint or test script** — `npm run build` is the only automated correctness check available. A clean build (look for `✓ Compiled successfully` in the output) is the bar for "this doesn't have syntax/type errors."
- `npm run start` — run a production build locally

### Build caveat in sandboxed/CI environments without secrets

`npm run build` will compile successfully but then fail during Next.js's "Collecting page data" step with errors like `supabaseUrl is required` or `Neither apiKey nor config.authenticator provided`. This happens because several API routes construct Supabase/Stripe clients at module load time, and page-data collection imports those route modules without the real env vars present. This failure is expected in any environment without production secrets and is unrelated to code changes — treat `✓ Compiled successfully` as the signal that matters, not the later page-data-collection errors.

## Architecture

### Frontend is one large component

Almost the entire app UI — all seven tabs (Generate, Brand, Templates, Quotes, History, Help, Account) — lives in `src/components/CarouselGenerator.jsx`, a single ~5,500-line client component rendered from `src/app/page.js`. There is no component-per-feature split; tabs are conditionally rendered blocks (`nav==="generate" && (...)`, etc.) inside one big return. When editing a tab, search for `nav==="<tabname>"` to find its block, and double-check `<div>` nesting carefully — this file has no lint/test net, and mismatched JSX tags only surface as an opaque webpack parse error pointing at the wrong line. Always run `npm run build` after edits here.

The nav tab order and contents are driven by the `NAV_ITEMS` array near the top of the tab-rendering logic — check this directly rather than assuming order from memory or from a task description, it has drifted from spec before.

### Plans, credits, and access gating

Users have a `plan` (`free` / `starter` / `pro` / `agency`, plus licence-style plans `affiliate_licence` / `white_label`) stored in Supabase, each with a `credits_limit` and running `credits_used` counter that resets on renewal. `isPexelsUser` (Pexels stock-photo search) and similar feature gates are computed client-side from plan tier, e.g. `["pro","agency","affiliate_licence","white_label"].includes(planLabel)`. `is_admin` users bypass credit/plan limits in generation routes.

### Two-tier affiliate/commission system

Users can refer other users via `affiliate_ref`; commissions are logged in a `commissions` table with `tier` 1 (direct referral) or 2 (referral's referral, capped at 15%). Commission rates depend on the referring user's own plan (`getPlanRate` in the Stripe webhook) and can vary mid-month via `monthly_rate_snapshots` (`getEffectiveRate` takes the lower of month-start/month-end snapshot rates). This logic is duplicated conceptually between `src/app/api/webhook/stripe/route.js` and elsewhere — check both `checkout.session.completed` and `invoice.payment_succeeded` handlers when touching billing/commission behavior.

### Stripe webhook is the source of truth for billing state

`src/app/api/webhook/stripe/route.js` handles three events:
- `checkout.session.completed` — new subscription, licence purchase, or one-time top-up/boost credit purchase (branches on which Stripe Price ID matched). Sends the "payment confirmed" or "upgrade confirmed" email.
- `invoice.payment_succeeded` — subscription renewals (skips the first invoice, `billing_reason === "subscription_create"`, since that's covered by `checkout.session.completed`). Resets `credits_used` and sends the "credits reset" email. Looks up the user by `stripe_customer_id` first, falling back to matching by `invoice.customer_email` and re-syncing `stripe_customer_id` if it was stale — this fallback exists because a cancelled-and-repurchased subscription gets a new Stripe customer ID, and without the fallback the renewal silently no-ops (no email, no credit reset, no error) if the stored ID drifts.
- `customer.subscription.deleted` — downgrades to `free`.

One-time top-up/boost credit purchases (`isTopup || isBoost` branch in `checkout.session.completed`) currently send **no email at all** — this is a known gap, not a bug to "fix" without asking first since it may be intentional.

### Email sending is gated by `marketing_consent` — including transactional email

`sendEmail()` in both `src/app/api/webhook/stripe/route.js` and `src/app/api/cron/email-sequence/route.js` checks the user's `marketing_consent` column and silently returns (no error, no log visible outside `console.error`) if it's `false`. This applies even to payment-confirmation and credits-reset emails, not just marketing content — a user who ever clicked "unsubscribe" (or was created with consent off) stops receiving *all* future emails, including receipts. `src/app/api/auth/route.js` has its own `sendEmail()` with a `skipConsentCheck` param used for OTP/login emails specifically, so those aren't affected. When debugging "customer didn't get an email," check `marketing_consent` on their `users` row before assuming a code bug.

### Image generation pipeline

1. `src/app/api/generate/route.js` calls the Anthropic SDK to produce slide copy (JSON), gating on plan/credits via Supabase first.
2. The client renders each slide as HTML/CSS (see `SlidePreview` and the `slideOpts`/HTML-building logic in `CarouselGenerator.jsx`).
3. `src/app/api/render-slide/route.js` and `src/app/api/screenshot/route.js` take that HTML and screenshot it via `puppeteer-core` + `@sparticuz/chromium` (serverless-compatible Chromium build) to produce the final PNG, inlining Google Fonts as base64 first so they render correctly in the headless browser.

### Cron jobs (`vercel.json`)

- `/api/cron/snapshot` — runs on the 1st of the month and again on the 28th–31st (covers month-end regardless of month length) — takes the `monthly_rate_snapshots` used for affiliate commission-rate calculation.
- `/api/cron/email-sequence` — daily at 09:00 UTC, drives a day-2/4/5/7 onboarding email drip, respecting the same `marketing_consent` gate.

### Auth

Passwordless, OTP-based (`src/app/api/auth/route.js`) — no passwords stored. New user rows are created on first successful OTP verification, with `marketing_consent` set from an explicit checkbox in the sign-up UI (defaults to `false` if not passed).

## Environment variables

Required at runtime (not present in this sandbox, hence the build caveat above): `ANTHROPIC_API_KEY`, `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` and the `NEXT_PUBLIC_STRIPE_*_PRICE_ID` vars (one per plan/licence/top-up tier), `RESEND_API_KEY`, `SYSTEME_API_KEY`, `PEXELS_API_KEY`, `UNSUBSCRIBE_SECRET`, `CRON_SECRET`, `FAL_API_KEY`.

## Workflow notes

- Production deploys from `main` on Vercel; other branches get their own Vercel preview URL.
- For small, low-risk fixes, pushing straight to `main` is the established, accepted workflow here. For anything touching payments, user data, or larger structural changes, prefer a branch first so it can be checked via its Vercel preview before merging to `main`.
- The repo owner is non-technical — prefer doing git operations (commit/push) directly rather than handing back diffs or patches to apply manually, and verify changes build successfully before considering a task done.
