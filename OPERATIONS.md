# Operations

## Generation workflow (Carousel Studio)
Theme Page → batch generate → review → approve → export (slide PNGs + caption.txt per topic). Passwordless login: first name + email → 6-digit emailed code. Login session is per-browser — does not carry over between devices/automation contexts; request a fresh code where needed.

## Reel-building workflow (local, separate from the Carousel Studio app)
- PIL letterbox to 1080×1920 (9:16) — blurred/darkened background fills bars, not a full-bleed crop
- ffmpeg Ken Burns zoom-in (gain 0.06) + crossfade between slides (~6s/slide, 0.5s crossfade)
- Color grade: contrast 1.03, saturation 1.06
- Audio: loudnorm (I=-14:TP=-1.5:LRA=11) + 0.6s fade-in
- **No fade-in from black at the very start of the video** — a start fade-in was added Aug 25 2026 and caused every reel's Instagram profile-grid thumbnail to render solid black (IG grabs an early frame inside the fade window). Removed permanently Aug 27 2026. Do not reintroduce a start fade-in without checking IG grid-thumbnail impact.
- Music: synthesized locally (10-track pool, real instrumentation variety), rotate through the set
- Keep individual reels under ~9MB for upload-tooling size limits
- Default reel slide selection: (1,3,5,7) of 7 — hook, two beats, CTA

## Scheduling (Buffer)
- `schedulingType` must always be `automatic` — never `notification`
- Free plan caps total scheduled queue at 10 posts across the account — check Queue/Sent status before topping up, don't assume fixed free slots
- To change an existing post's scheduling type: delete + recreate from scratch with fresh asset uploads (`editPost` silently no-ops on `schedulingType`, and a deleted post's own asset records become unqueryable — don't reuse old asset URLs)
- Instagram carousels use Buffer's `PostType.post` with multiple image assets (Buffer auto-detects the carousel) — `PostType.carousel` throws `InvalidInputError`

## Daily scheduled automation
- Runs automatically each day: generates the day's carousel + reels, schedules via Buffer
- Requires the desktop/browser session to be available for the steps that depend on real browser automation (Carousel Studio automation runs through an actual Chrome session) — if the machine is asleep/disconnected, the routine stops cleanly and reports back rather than failing silently
- Manual "Run Now" trigger available if a day is missed

## Known failure modes and fixes
- **"Media problem" Instagram rejection** (400, "Only photo or video can be accepted...") with asset URLs that verify as reachable/correct — treat as a one-off Instagram/Cloudinary-fetch glitch: delete the post, re-upload fresh copies of the original images to Cloudinary, recreate with the same caption at a new time. If it recurs on a freshly-created (not retried) post, treat as systemic and investigate further.
- **Brand-badge rendering defect**: some Carousel Studio export batches render a flat placeholder circle instead of the brand logo badge on some slides. QA every fresh export before use: crop the badge region, compute RGB variance — low variance (~200) = broken, high (>1000) = real logo. Fix without regenerating by compositing a known-good badge crop over the bad slide with a circular alpha mask.
- **Video upload hangs at 0% in Buffer's compose UI** with no network activity — likely the browser's local video decode/preview pipeline stalling on an otherwise-valid file. Bypass via the `s3PreSignedURL` query → PUT raw file bytes directly → use the returned asset URL in `createPost`/`editPost`.
- **Buffer GraphQL gotchas**: union return types cause validation errors on wrong fragment names — introspect before guessing. Asset URL field is `source`, not `url`. `posts` query is a paginated `{edges{node}}` connection requiring `organizationId` (get via the `channel` query).

## Credentials
- Currently stored only in a local `secrets.env` file on Tav's machine — not in the repo, not reproduced in these docs. Read fresh each time rather than assuming values are current.

## Security
- RLS is disabled on all tables in the `Carousel-studio` Supabase project. Unresolved as of this doc — see `DECISIONS.md`.
