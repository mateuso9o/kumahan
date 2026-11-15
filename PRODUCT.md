# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: React 19 + TypeScript + Vite PWA (installable on iPhone and Android, no app store), Dexie/IndexedDB for on-device storage in phase 1, Supabase + Gemini planned for phase 3. Chosen because the household uses mixed phones and wants to start without accounts.

## Users

Two adults in one household, each on their own phone:
- Person 1: returning lifter with high body fat, goal = recomposition (gain muscle, lose fat). Trains at home (mat, weights, dumbbells, kettlebell), wants 4–6 days/week.
- Person 2: goal = weight loss, trains at home with little equipment, 3–4 days/week.

Daily jobs: weigh food in the kitchen and log it, weigh themselves each morning, check what is left for today, review the week. Logging happens both in the moment at the kitchen scale (one hand busy) and later in a sitting (a whole meal or day at once) — both must be fast.

## Product Purpose

A science-based food and training log that turns weighed food into complete nutrition (energy, macros, fibre, sodium, key minerals, vitamin D) and sets each person's targets from evidence, adjusting energy weekly from their real weight trend. Success = both people see real progress (waist down, lifts up for person 1; trend weight down for person 2) and keep using it daily. If it works, it may later be released to others.

## Positioning

Every number has a source and every recommendation says why. Energy targets self-correct from the person's own weight trend instead of trusting a formula or an AI guess. AI (phase 3) only helps estimate meals eaten out; it never invents nutrition numbers.

## Operating Context

- Kitchen scale in grams; food logged as raw or cooked (they differ 2–3x for rice).
- Morning weigh-in; weekly waist measurement; optional cycle log (explains water-weight swings).
- Thai food and Thai units (ทัพพี, จาน) matter; UI language is Thai.

## Capabilities and Constraints

- Phase 1: profiles, weighed food logging with favourites, body tracking with trend, daily targets + "what's left today", weekly auto-adjust.
- Later: training programme and set logging (phase 2), photo estimate + cloud sync (phase 3), full weekly review (phase 4).
- Safety: under-18, pregnant and kidney-disease users get no deficit, low protein, and a "consult a doctor" banner.
- Not medical advice; a disclaimer appears in profile setup.

## Brand Commitments

Working name: คุมอาหาร. No logo or brand assets yet.

## Evidence on Hand

Food data: USDA FoodData Central SR Legacy (70 foods, src/data/foods.seed.json). Micronutrient targets: Thai DRI 2020 (src/data/dri.ts). No testimonials or users beyond the household — do not fabricate any.

## Product Principles

1. Show the source and the reason; never a bare number or an unexplained instruction.
2. Trend over day: daily noise (water, cycle) must never read as failure.
3. Logging must take seconds, in the kitchen or after the meal.
4. Protect health first: no starvation targets, special groups handled explicitly.
5. Estimates are labelled as estimates.

## Accessibility & Inclusion

Thai script at comfortable sizes; large touch targets for one-handed kitchen use; must work at 360px width.
