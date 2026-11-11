# Capsule

## What this is
A mobile-first web app (installable PWA) that puts my closet in my pocket. I use it at night to plan tomorrow's outfit, and while shopping to see what I already own and what I actually need.

This is a real app I will use every day, not just a class prototype. It needs to save data reliably, load fast on my phone, and work in a store with bad signal.

## The problem
- I stand in stores saying "I don't know what I need because I haven't gone through my closet," and then I don't buy anything.
- I forget what I own and rotate the same few pieces.
- Mornings are rushed, and I don't check the weather until I'm outside.
- Starting soon, I work 9–5 Monday–Friday. I want work outfits planned ahead and don't want to repeat pieces in front of coworkers.

## Who it's for
- Primary: me, a college student and designer with a full closet and a 9–5 work week.
- Secondary: classmates and friends with the same problem. The app should support multiple user accounts.

## Platform and stack
- **App type:** Mobile web app / PWA (installable to the iPhone home screen, opens full screen). Not native iOS.
- **Frontend:** React + Vite + TypeScript, Tailwind CSS.
- **Backend:** Supabase (email auth, Postgres database, Storage for clothing photos).
- **Offline:** Cache the closet (items + images) so it loads with no or weak signal. Use a service worker plus a local cache, and sync when back online.
- **Weather:** Open-Meteo API (free, no key). Use the device location, with a saved city as a fallback.
- **Background removal:** Done in the browser on upload so items look clean on a neutral background. Check the library license before choosing one.
- **Hosting:** Vercel or Netlify, so I can share a link.

## Design direction
- I'm designing the hi-fi screens and design system in Figma. Build to match those once they're shared.
- Until then, use a clean placeholder system: calm, editorial, neutral (warm browns, black, off-white), generous spacing, clear type hierarchy. No busy UI.
- Mobile first (390px wide), with thumb-friendly tap targets.
- Keep all colors, type, and spacing as design tokens (CSS variables or Tailwind theme) so I can swap in my Figma system easily.

## Core features (priority order)

### 1. Closet
- Add an item: open the camera or upload, auto-remove the background, then tag it in a few taps.
- Tags: category (top, bottom, dress, outerwear, shoes, accessory), color, season/warmth (light, mid, warm), dress level (casual, work, going out), and context (work, weekend, both).
- Grid view filtered by category, plus search ("black jeans").
- Item detail: photo, tags, times worn, last worn date, edit, delete.
- Adding an item should take under 30 seconds.

### 2. Closet audit (onboarding + anytime)
- Go through the closet one category at a time.
- For each item: Keep, Donate, or Need to replace.
- "Need to replace" adds the item to the Gaps list automatically.
- Onboarding prompt: "Start with your 15 favorite pieces." Don't force a full closet upload.

### 3. Shopping mode
- Quick view of everything I own by category.
- Search: "do I already have this?"
- **Gaps list:** things I actually need, added manually, from the audit, or from app nudges (for example, no warm outerwear when the forecast drops below 40°F).
- **Count check:** show how many I own of something (for example, "14 black tops").
- **"Would this go with…":** snap a photo of an item in the store and see it next to my pieces to picture outfits. It doesn't get saved to the closet unless I tap "I bought it."
- **Wishlist:** things I saw but didn't buy.

### 4. Planner (nightly outfit)
- Shows tomorrow's weather (high/low, rain) and what tomorrow is.
- **Weekly routine:** set once in settings. Default: Monday–Friday = Work (9–5). Any single day can be overridden.
- **Weekends / off days:** tap what I'm doing in the moment (brunch, errands, going out, gym, lounging, game day). Multi-select allowed.
- Get a suggested outfit, or build my own by swiping through pieces per category.
- Swap one piece at a time without regenerating the whole outfit.
- Save the outfit for tomorrow.
- **Plan the week (optional):** on Sunday, plan all five workdays at once.

### 5. Morning view, worn log, favorites
- Opening the app in the morning shows today's planned outfit first.
- "Wore it" marks every piece as worn with the date.
- Favorites: save outfits to reuse.
- Nudges for pieces not worn in a while.

## Suggestion rules (no AI in v1)
Rule-based, simple and predictable:
- Work day → only items tagged work or both, at work/casual dress level.
- Below 50°F → include outerwear or a warm layer. Below 40°F → warm outerwear required.
- Rain → include outerwear, skip items tagged "delicate" (optional tag).
- Avoid any piece worn in the last 3–5 days. On workdays, avoid repeating a piece within the same Mon–Fri week.
- Match the dress level to the activity (going out → going-out pieces, gym → athletic).
- Outfit structure: (top + bottom) or dress, + shoes, + outerwear if needed, + optional accessory.
- If the rules can't build an outfit, say what's missing and offer to add it to Gaps.

## Data model (starting point)
- `profiles` — user id, home city, temperature unit, weekly routine (JSON per weekday).
- `items` — id, user_id, image_url, category, color, warmth, dress_level, context, tags[], status (active / donate / replace), times_worn, last_worn_at, created_at.
- `outfits` — id, user_id, item_ids[], is_favorite, created_at.
- `planned_days` — id, user_id, date, outfit_id, day_type (work/off), activities[].
- `wear_log` — id, user_id, item_id, outfit_id, worn_on.
- `gaps` — id, user_id, label, category, source (manual / audit / nudge), resolved.
- `wishlist` — id, user_id, image_url, note, price, created_at.
- Row-level security: users only see their own data. Photos are stored in a private bucket per user.

## Screens
1. Sign in / sign up
2. Onboarding: set the weekly routine and home city, then add your first 15 pieces
3. Home / Planner (tomorrow's weather + day type + outfit)
4. Morning view (today's outfit, "Wore it")
5. Closet grid + filters + search
6. Add item (camera → background removal → tags)
7. Item detail
8. Closet audit flow
9. Shopping mode (search, counts, gaps, "would this go with")
10. Wishlist
11. Plan the week
12. Settings (routine, city, units, account)

Bottom tab bar: **Home · Planner · Closet** (Shopping mode opens from a card on Home; Settings from a button on Home)

## Build phases
1. **Setup:** project scaffold, Supabase auth, design tokens, PWA manifest, deploy pipeline.
2. **Closet:** add/edit/delete items, photo upload with background removal, tags, grid, filters, search.
3. **Audit + Gaps:** audit flow and gaps list.
4. **Planner:** weather, weekly routine, activity picker, suggestion rules, outfit builder, save plan.
5. **Morning + logging:** morning view, worn log, favorites, no-repeat logic.
6. **Shopping mode:** search, counts, "would this go with," wishlist.
7. **Offline + polish:** caching, loading and empty states, error handling, final match to the Figma design.

Finish each phase fully working before moving on. Test on an iPhone-sized viewport throughout.

## Out of scope for now (future roadmap)
- Google/Apple calendar sync (replace the manual routine with real events).
- AI outfit suggestions and auto-tagging from photos.
- Importing items from receipts or product links.
- Sharing outfits with friends.
- Packing lists for trips.
- Native iOS app.

## Definition of done (v1)
- I can sign in on my phone, add items in under 30 seconds each, and see my closet offline.
- Each night I can see tomorrow's weather and get a sensible outfit for a workday or a weekend activity.
- In a store, I can check what I own and see my gaps list.
- Data persists across devices and sessions.
- The UI is clean and consistent and ready to swap to my Figma design system.
