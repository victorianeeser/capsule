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
1. **Closet** — add item (camera or upload → auto background removal → tag in a few taps, < 30 s per item); **batch-add via multi-photo upload**; tags: category (top, sweater, bottom, dress, lounge, outerwear, shoes, accessory — sweater/lounge added 2026-11-15), brand (optional, filled in from the photo filename — no brand box on the tag screen; shown under the name on item detail; searchable), size (optional — S/M/L for clothing, plus 0/2/4/6/8/10/12 for bottoms like jeans, 8/9/10 for shoes, none for accessories; added 2026-11-15, numbers 2026-11-16), color — **multi-select** (e.g. Denim + Black, 2026-11-16), quantity ("how many do you own" — log 10 identical leggings once; counts in totals and lets the piece repeat that many times; 2026-11-16), warmth (light/mid/warm), dress level — **multi-select** (casual/work/going out/athletic), context (work/weekend/both); grid filtered by category, a **dress-level chip row** (Casual / Work / Going out / Athletic — same filter as the panel; 2026-11-24), a floating **+** bottom-right to add items, plus a **Filter & sort** panel (color, dress level, warmth, size; sort newest/oldest/most worn/least worn/color/A–Z — 2026-11-16); search ("black jeans"); item detail (photo, tags, times worn, last worn, edit, delete).
2. **Closet audit** (onboarding + anytime) — one category at a time; per item: Keep / Donate / Need to replace. "Need to replace" auto-adds to Gaps. Onboarding prompt: "Start with your 15 favorite pieces" — never force a full upload.
3. **Shopping mode** — quick view by category; "do I already have this?" search; Gaps list (manual / audit / nudge, e.g. no warm outerwear when forecast < 40°F); count check ("14 black tops"); "Would this go with…" (snap in-store photo, view next to owned pieces; not saved unless "I bought it"); Wishlist.
4. **Planner** (calendar flow modeled on the Fits app — updated 2026-11-11) — **Day view**: week strip (Sun–Sat), selected date with weather + day type chips, swipe left/right between days (neighbors peek); a day can hold **multiple outfits stacked vertically** — scroll down for the next one (e.g. Work day · 9–5, then Gym · 6 pm), each card with its own dark occasion tag (same style as the day-type chip), "Suggested" tag + one-line reason, "Add a note…", and "+ Add another outfit" at the bottom; **Month view**: calendar grid with an **Outfits | Colors** toggle (remembered on the device; 2026-11-24): Outfits shows a small version of that day's outfit arrangement, Colors shows a strip of color blocks (one row per piece, outer layer on top, shoes at the bottom). Each piece's block is its **real color pulled from the photo** (`src/lib/color.ts`, stored as `item.swatch`); pieces without a photo use their tag colors (`SWATCH` map in `types.ts`, "Pattern" striped). In Colors mode, tapping a planned day opens **Outfit colors** (`/planner/colors?id=`): the outfit on the left, its palette on the right — tap the photo to pull a color (eyedropper), tap a block to replace/remove it, "+ Add color" picker, "Reset to photo colors". Edits are saved per day (`planned.palette`). Empty days show "+". Month has a floating + bottom-right that starts an outfit for tomorrow (date changeable on Outfit details); the Day view keeps its dashed "+ Add another outfit" button (2026-11-24). **Add outfit**: options (Suggested / Saved outfits / Outfit photo) + category-filtered grid with multi-select → **Canvas** (free-arrange collage; tap a piece to get Smaller / Bigger / Flip / Duplicate / Remove / Done plus a drag-to-resize dot — duplicates allow layering or a pair of shoes; heart button saves the outfit to Favorites; toolbar action otherwise: Add clothes — 2026-11-16) → **Add clothes** bottom sheet → **Outfit details** (note, date, day type, weather, save to favorites; private — no public/social options) → Save. Weekly routine set once (default Mon–Fri = Work 9–5), any day overridable; off days: multi-select activities (brunch, errands, going out, gym, lounging, game day); optional Sunday "Plan the week" for 5 workdays.
5. **Home, worn log, favorites** — Home tab is the dashboard and **opens on the morning state by default** (changed 2026-11-12): "Good morning", today's weather, today's outfit card with "Change it" / "Wore it" (logs every piece with date) and a "No outfit needed today" link (marks the day skipped, with Undo), then "For you" cards (Plan your work week, Favorites, Going shopping?). The Tomorrow/Today peek cards were removed 2026-11-16. **Favorites** page (`/favorites`) lists hearted outfits with "Plan it" and remove. Evening state: tomorrow's suggested outfit with weather/day type ("Change it" → Add outfit, "Looks good" → saves to Planner, "No outfit needed tomorrow") + the same For you cards. **Outfits are suggested automatically only on work days or off days with activities picked** — weekends/off days show "Nothing planned" with "Suggest one" / "Build my own" (2026-11-16). Favorite outfits for reuse; nudges for pieces not worn in a while, Sunday plan-the-week reminder, weather-driven gaps.

## Suggestion rules (rule-based, no AI in v1)
- Work day → only items with context work or both, dress level work or casual.
- < 50°F → include outerwear or a warm layer. < 40°F → warm outerwear required.
- Rain → include outerwear; skip items tagged "delicate" (optional tag).
- Only suggest on its own on work days or off days with activities; never on a "No outfit needed" day.
- Avoid pieces worn in the last 3–5 days (a piece with quantity N can be used N times in that window). On workdays, no repeating a piece within the same Mon–Fri week.
- Match dress level to activity (going out → going-out pieces, gym → athletic).
- Structure: (top + bottom) or dress, + shoes, + outerwear if needed, + optional accessory.
- If an outfit can't be built, say what's missing and offer to add it to Gaps.

## Data model (starting point)
- `profiles` — user id, home city, temperature unit, weekly routine (JSON per weekday)
- `items` — id, user_id, image_url, name, brand, size, quantity, category, colors[], swatch (photo color hex), warmth, dress_levels[], context, delicate, tags[], status (active/donate/replace), times_worn, last_worn_at, source_filename, created_at
- `outfits` — id, user_id, item_ids[], layout (JSON: per placed piece item_id, key, x, y, size, flip — the same piece can appear twice), is_favorite, created_at
- `planned_days` — id, user_id, date, day_type (work/off), activities[], no_outfit_needed (on-device: `skipped` dates)
- `planned_outfits` — id, user_id, date, outfit_id, occasion (e.g. work, gym, going out), position (order within the day), note, palette[] (hand-edited day colors, optional) — a day can have several (added 2026-11-11)
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
- **Palette:** Espresso `#3E372E` (primary, text, dark surfaces), Stone `#A5A099` (accent, secondary fills — too light for small text on Cloud), White `#FFFFFF` (**app background** — changed from Cloud on 2026-11-11; also raised/shadowed surfaces like outfit cards, sheets, the canvas), Card `#F6F4F1` (flat cards/tiles on white), Cloud `#EEEBE7` (chips, subtle fills), Tile `#EAE5DF` (backdrop behind clothing photos — dark enough that white/cream pieces show; `bg-tile`, added 2026-11-24), Black `#000000` (max-contrast text). Warning/error colors not chosen yet. (The Figma swatch for Espresso is still labeled "Forest" — old name.)
- **Type:** headings in SFT Schrifted Serif Light Italic (**trial font — needs a license before launch**; free stand-in used in Figma research slides: Instrument Serif Italic, OFL), body/labels/UI in **DM Mono** (Google Fonts, OFL — switched from Inter on 2026-11-24 after critique feedback that the brand felt familiar; it has weights 300/400/500 only, so `semibold`/`bold` map to 500), Imperial Script for the C monogram only. Treatment (see Figma Concept page): small mono caps eyebrow → large serif-italic headline → mono body; section names in serif italic.
- Generous spacing, clear hierarchy, no busy UI, thumb-friendly tap targets.

## Current build status (2026-11-16)
The app is **fully functional on-device** (no backend yet). Decisions made with the user:
- **Storage:** everything saves in the browser's IndexedDB via `idb-keyval` (`src/lib/db.ts`: one JSON state record + photos as Blobs). No accounts yet — the Welcome screen replaces Sign in. **Supabase (auth + sync) comes later**; swap `src/lib/db.ts` + the store's save/load for Supabase without touching screens.
- **Photos:** the user's own, added via multi-photo upload or camera. **Background removal** runs in the browser with `@imgly/background-removal` (AGPL-3.0 — OK because the repo is public; uses the graphics chip via WebGPU when available — model `isnet_fp16` — and falls back to the CPU with `isnet_quint8`; models download on first use and are cached by the service worker; 2026-11-16). Photos are shrunk to ≤900 px WebP, cut out, speck-cleaned and cropped (`src/lib/images.ts`).
- **Weather:** Open-Meteo forecast + geocoding (`src/lib/weather.ts`), cached 30 min and reused offline.
- **Outfit rules:** `src/lib/suggest.ts` implements the Suggestion rules above (work/off day, activities → dress level, <50°/<40°/rain layers, delicate skipped in rain, no repeats within `repeatDays` (default 4) and none Mon–Fri on workdays, explains each pick, lists what's missing → Gaps). Dress level now includes **Athletic** (for Gym) and is multi-select (an item fits a day if any of its levels match). **Sweaters** count as tops (preferred under 50°, avoided at 75°+). **Lounge** pieces are only used on Lounging-only off days. Uploads that already have a transparent background (your own cut-outs) skip background removal and are only cropped; full photos are cut out. Uploads keep the photo filename and prefill name/brand from it ("Brand - Name.jpg" → brand + name; camera names like IMG_1234 are ignored).
- **State/actions:** `src/lib/store.tsx` (React context). Types in `src/lib/types.ts`. Home greeting follows the time of day; `/home` = today, `/home/evening` = plan tomorrow.
- **Add outfit options** are Suggested / Favorites / Recent (the wireframe's "Outfit photo" option was replaced so every option works).
- **PWA:** `vite-plugin-pwa` — installable, offline app shell, runtime caching for weather, model files and fonts. Icons in `public/` (192/512/apple-touch).
- **Motion** (2026-11-17, CSS only, no library): `src/lib/motion.tsx` picks each screen's entrance — going deeper slides in from the right, Back slides in from the left, tab/view switches (Home, Planner Day↔Month, Closet) cross-fade, Add clothes rises as a sheet. Classes and timing tokens (`--ease-out`, `--dur-screen`, `--dur-fast`) live in `src/index.css`; `.press` gives tap feedback, `.unfold`/`.pop-in` for panels and swapped cards. Turned off when the phone asks to reduce motion.
- **Dark mode** (2026-11-24): Settings → Appearance → Light (default) / Dark / Match my phone, saved as `profile.theme`. `src/lib/theme.ts` sets `<html data-theme>`; `index.html` applies it before first paint (from `localStorage` `capsule:theme`). Dark values override the same tokens in `src/index.css` (`:root[data-theme="dark"]`), so screens need no changes — just use tokens. Clothing always sits on a light backdrop in both modes (`bg-tile` behind photos and every outfit collage, `bg-board` for the canvas) so dark and white pieces both show. Always-dark surfaces (canvas frame/toolbar) use `ink`, `ink-2`, `on-ink`.
- **Toasts** (2026-11-24): `toast('Outfit saved')` from `src/lib/toast.tsx`; `<Toaster />` in `App.tsx` shows a small dark pill at the top for ~2 s. Used after saves, adds, removes and status changes (outfit saved/removed, added to plan, wore it, favorites, photos added, piece tagged/deleted, gaps, wishlist, colors saved, settings saved). Keep quick or obvious steps (Undo, audit Keep) silent. New actions that change data should toast too.
- **Demo:** Settings → "Load demo closet" adds silhouette pieces; Settings → "Erase everything" resets the device.
- Still to do for v1: Supabase accounts + cross-device sync, deploy (Vercel/Netlify), warning/error colors.

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
