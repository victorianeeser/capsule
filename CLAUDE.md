# Capsule — Project Context

*App name: **Capsule** (formerly working name "Tomorrow Fit"). Full source brief: `README.md`.*

## Repository
- GitHub: https://github.com/victorianeeser/capsule (**public**, default branch `main`)
- Because the repo is public: never commit `.env*` files, Supabase service-role keys, or any secrets. Only the Supabase anon key may be used client-side, and it lives in `.env.local` (gitignored).

## What it is
A mobile-first, installable web app (PWA) that puts the user's closet in their pocket. Two main moments:
- **At night:** plan tomorrow's outfit based on weather and what the day is (workday vs. off-day activities).
- **While shopping:** see what they already own and what they actually need (gaps).

This is a real, daily-use app, not just a class prototype: data must persist reliably, load fast on a phone, and work offline / on weak signal in stores. Multiple user accounts are supported (primary user plus classmates/friends).

## Problems it solves
- In stores, not knowing what's needed because the closet hasn't been reviewed → no purchase.
- Forgetting what's owned; rotating the same few pieces.
- Rushed mornings; weather not checked until outside.
- New 9–5 Mon–Fri job: wants work outfits planned ahead without repeating pieces in front of coworkers.

## Tech stack
- **Frontend:** React + Vite + TypeScript, Tailwind CSS
- **Backend:** Supabase — email auth, Postgres, Storage (private per-user bucket for photos)
- **PWA:** installable to iPhone home screen, full-screen; service worker + local cache for offline closet (items + images), sync when back online
- **Weather:** Open-Meteo (free, no API key); device location with saved home city as fallback
- **Background removal:** in-browser on upload (check library license before choosing)
- **Hosting:** Vercel or Netlify (shareable link)

## Core features (priority order)
1. **Closet** — add item (camera or upload → auto background removal → tag in a few taps, < 30 s per item); **batch-add via multi-photo upload**; tags: category (top, bottom, dress, outerwear, shoes, accessory), color, warmth (light/mid/warm), dress level (casual/work/going out), context (work/weekend/both); grid filtered by category; search ("black jeans"); item detail (photo, tags, times worn, last worn, edit, delete).
2. **Closet audit** (onboarding + anytime) — one category at a time; per item: Keep / Donate / Need to replace. "Need to replace" auto-adds to Gaps. Onboarding prompt: "Start with your 15 favorite pieces" — never force a full upload.
3. **Shopping mode** — quick view by category; "do I already have this?" search; Gaps list (manual / audit / nudge, e.g. no warm outerwear when forecast < 40°F); count check ("14 black tops"); "Would this go with…" (snap in-store photo, view next to owned pieces; not saved unless "I bought it"); Wishlist.
4. **Planner** (calendar flow modeled on the Fits app — updated 2026-11-11) — **Day view**: week strip (Sun–Sat), selected date with weather + day type chips, swipe left/right between days (neighbors peek); a day can hold **multiple outfits stacked vertically** — scroll down for the next one (e.g. Work day · 9–5, then Gym · 6 pm), each card with its own dark occasion tag (same style as the day-type chip), "Suggested" tag + one-line reason, "Add a note…", and "+ Add another outfit" at the bottom; **Month view**: calendar grid with outfit thumbnails or "+" per day. **Add outfit**: options (Suggested / Saved outfits / Outfit photo) + category-filtered grid with multi-select → **Canvas** (free-arrange collage; one toolbar action: Add clothes) → **Add clothes** bottom sheet → **Outfit details** (note, date, day type, weather, save to favorites; private — no public/social options) → Save. Weekly routine set once (default Mon–Fri = Work 9–5), any day overridable; off days: multi-select activities (brunch, errands, going out, gym, lounging, game day); optional Sunday "Plan the week" for 5 workdays.
5. **Home, worn log, favorites** — Home tab is the dashboard and **opens on the morning state by default** (changed 2026-11-12): "Good morning", today's weather, today's outfit card with "Change it" / "Wore it" (logs every piece with date), a "Tomorrow" peek card, then "For you" cards (Plan your work week, Going shopping?). Evening state: tomorrow's suggested outfit with weather/day type ("Change it" → Add outfit, "Looks good" → saves to Planner) + a "Today's outfit" peek card + the same For you cards. Favorite outfits for reuse; nudges for pieces not worn in a while, Sunday plan-the-week reminder, weather-driven gaps.

## Suggestion rules (rule-based, no AI in v1)
- Work day → only items with context work or both, dress level work or casual.
- < 50°F → include outerwear or a warm layer. < 40°F → warm outerwear required.
- Rain → include outerwear; skip items tagged "delicate" (optional tag).
- Avoid pieces worn in the last 3–5 days. On workdays, no repeating a piece within the same Mon–Fri week.
- Match dress level to activity (going out → going-out pieces, gym → athletic).
- Structure: (top + bottom) or dress, + shoes, + outerwear if needed, + optional accessory.
- If an outfit can't be built, say what's missing and offer to add it to Gaps.

## Data model (starting point)
- `profiles` — user id, home city, temperature unit, weekly routine (JSON per weekday)
- `items` — id, user_id, image_url, category, color, warmth, dress_level, context, tags[], status (active/donate/replace), times_worn, last_worn_at, created_at
- `outfits` — id, user_id, item_ids[], is_favorite, created_at
- `planned_days` — id, user_id, date, day_type (work/off), activities[]
- `planned_outfits` — id, user_id, date, outfit_id, occasion (e.g. work, gym, going out), position (order within the day), note — a day can have several (added 2026-11-11)
- `wear_log` — id, user_id, item_id, outfit_id, worn_on
- `gaps` — id, user_id, label, category, source (manual/audit/nudge), resolved
- `wishlist` — id, user_id, image_url, note, price, created_at
- Row-level security on every table: users see only their own data. Photos in a private per-user Storage bucket.

## Screens and navigation
Bottom tab bar: **Home · Planner · Closet** (2026-11-11: Home tab added; Shop and Settings tabs removed — Shop opens from a "Going shopping?" card on Home, Settings from a button in Home's top-right; "Planner" renamed from "Tonight" 2026-11-10). Clickable wireframes + prototype live on the Figma **Wireframes** page.
1. Sign in / sign up
2. Onboarding: weekly routine + home city → add first 15 pieces
3. Home — morning (default): today's outfit, "Wore it", tomorrow peek, For you cards — *Home tab*
4. Home — evening: tomorrow's suggestion + weather + For you cards — *Home tab*
4a. Planner Day / Month views, Add outfit, Canvas, Add clothes sheet, Outfit details, Off-day activities — *Planner tab*
5. Closet grid + filters + search — *Closet tab*
6. Add item (camera/upload → background removal → tags) — *Closet tab*
7. Item detail — *Closet tab*
8. Closet audit flow — *Closet tab*
9. Shopping mode (search, counts, gaps, "would this go with") — *opened from the Home card (back returns to Home)*
10. Wishlist — *inside Shopping mode*
11. Plan the week — *Planner tab*
12. Settings (routine, city, units, account) — *opened from the settings button on Home (back returns to Home)*

## Design direction
- Hi-fi screens and design system coming from Figma; match them once shared. Brand guidelines live on the Figma **Branding** page (mood board on the **Inspo** page).
- **Brand (updated Nov 10 2026 — browns & beiges, so the clothes bring the color):** calm, refined, a little romantic. Logo = script "C" that doubles as a hanger + light italic serif "apsule" + Inter tagline "outfit planner ⁘ closet tracker".
- **Palette:** Espresso `#3E372E` (primary, text, dark surfaces), Stone `#A5A099` (accent, secondary fills — too light for small text on Cloud), White `#FFFFFF` (**app background** — changed from Cloud on 2026-11-11; also raised/shadowed surfaces like outfit cards, sheets, the canvas), Card `#F6F4F1` (flat cards/tiles on white), Cloud `#EEEBE7` (chips, thumbnails, subtle fills), Black `#000000` (max-contrast text). Warning/error colors not chosen yet. (The Figma swatch for Espresso is still labeled "Forest" — old name.)
- **Type:** headings in SFT Schrifted Serif Light Italic (**trial font — needs a license before launch**; free stand-in used in Figma research slides: Instrument Serif Italic, OFL), body/labels/UI in **Inter**, Imperial Script for the C monogram only. Treatment (see Figma Concept page): small Inter caps eyebrow → large serif-italic headline → Inter body; section names in serif italic.
- Generous spacing, clear hierarchy, no busy UI, thumb-friendly tap targets.

## Build phases
1. **Setup** — scaffold, Supabase auth, design tokens, PWA manifest, deploy pipeline
2. **Closet** — add/edit/delete, photo upload (camera + multi-photo batch) with background removal, tags, grid, filters, search
3. **Audit + Gaps** — audit flow, gaps list
4. **Planner** — weather, weekly routine, activity picker, suggestion rules, outfit builder, save plan
5. **Morning + logging** — morning view, worn log, favorites, no-repeat logic
6. **Shopping mode** — search, counts, "would this go with," wishlist
7. **Offline + polish** — caching, loading/empty states, error handling, final match to Figma

## Out of scope (future roadmap)
- Calendar integration (decided 2026-11-10: not in v1). Preferred future approach: paste a private `.ics` calendar link in Settings; events add detail on top of the weekly routine (which stays the default), with keyword → dress-level mapping. Full Google/Apple OAuth sync is a later, heavier option.
- AI outfit suggestions and auto-tagging from photos
- Importing items from receipts or product links
- Sharing outfits with friends
- Packing lists for trips
- Native iOS app

## Definition of done (v1)
- Sign in on phone, add items in < 30 s each, see closet offline.
- Nightly: tomorrow's weather + sensible outfit for a workday or weekend activity.
- In store: check what's owned and see gaps list.
- Data persists across devices and sessions.
- UI clean, consistent, ready to swap to the Figma design system.

## Working rules
- **Finish one phase fully (working and tested) before starting the next.**
- **Mobile-first:** design and build for a 390px-wide phone screen; test at iPhone viewport throughout.
- **Desktop demo mode:** on wider screens, render the app in a centered phone-width column on a clean neutral background (for in-class laptop demos).
- **Adding items** must support both the phone camera and multi-photo upload (batch-add the closet).
- **Design tokens:** all colors, type, and spacing defined as tokens (CSS variables / Tailwind theme) — no hard-coded values in components — so the Figma system can be swapped in later. Token names should match the "15 Design tokens" board on the Figma Branding page (e.g. `--color-bg`, `--color-primary`, `--font-display`, `--text-body`, `--space-1…8`, `--radius-sm/md/lg/full`, `--shadow-card`, `--shadow-overlay`).
- **Ask before** adding any new dependency or changing the plan.
