# Oodle Creator Platform

## Project Overview
This is the Oodle Creator Platform — a standalone web app for IP creators to share and monetize their character designs. It is the SISTER APP to the Oodle pixel pet game (oodle.vercel.app).

## Relationship to Oodle Game
- Same Supabase project (shared database)
- Same Google OAuth (shared user accounts)
- Oodle Game: https://oodle.vercel.app (pixel pet mini-game)
- Oodle Creator Platform: this app (IP sharing community)
- Users who create IP here can bring their character into the Oodle game as a pixel pet

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (shared with Oodle game)
- Vercel deployment
- GitHub: Sam8998o0o/oodle-creators

## Supabase Tables (shared with Oodle game)
- pets — character designs (pixel_data, coords, name, creator_name, talent, talent_drawing, is_dead, is_public)
- likes — who liked which pet
- like_balance — running total of likes per user
- subscriptions — Stripe Pro subscribers

## Design System
- Background: #07070d (near black)
- Accent: #FFE600 (yellow)
- Font heading: Press Start 2P (pixel font) → CSS var --font-pixel, class pixel-font
- Font body: Noto Sans → CSS var --font-body, class body-font
- Border: rgba(255,255,255,0.07) → CSS var --border
- Card bg: rgba(255,255,255,0.03) → CSS var --card

## File Structure
- app/page.tsx — Landing page
- app/gallery/page.tsx — Full gallery (filter: newest/liked/talent)
- app/p/[name]/page.tsx — Individual IP public page
- components/PixelArt.tsx — Canvas pixel art renderer (client)
- components/CopyLinkButton.tsx — Clipboard copy button (client)
- lib/supabase.ts — Supabase client

## Key Rules
- Do NOT modify the Supabase schema without asking
- Do NOT touch the Oodle game repo (Sam8998o0o/oodle)
- All pages must be responsive
- Dark theme only
- Server components fetch from Supabase directly (no API routes needed)
