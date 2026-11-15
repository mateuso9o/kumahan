---
name: คุมอาหาร
description: Your own Thai food-guide flag, filled by weighed food.
colors:
  shell-leaf: "#173a24"
  shell-ink: "#eef6ef"
  page-mist: "#f3f6f1"
  flag-ground: "#ffffff"
  ink: "#18221b"
  ink-muted: "#4b5c4f"
  line: "#d9e2d6"
  action-leaf: "#2f7d3a"
  action-leaf-press: "#24642d"
  focus-blue: "#1f6fd1"
  warn: "#b3261e"
  warn-bg: "#fdecea"
  notice-bg: "#fff3c4"
  notice-line: "#e3b21b"
  band-rice: "#e3a81b"
  band-rice-track: "#fbefcf"
  band-vegetable: "#3f8f31"
  band-vegetable-track: "#dcefd6"
  band-protein: "#bf4434"
  band-protein-track: "#f6dcd8"
  band-oil: "#8a5a2b"
  band-oil-track: "#eedfd0"
  band-salt: "#3e6e9e"
  band-salt-track: "#dbe6f1"
typography:
  remaining:
    fontFamily: "Sarabun, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "clamp(3.6rem, 18vw, 5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  trend:
    fontFamily: "Sarabun, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "3.4rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Sarabun, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Sarabun, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Sarabun, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.5
  fine:
    fontFamily: "Sarabun, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "10px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.action-leaf}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.action-leaf-press}"
  button-secondary:
    backgroundColor: "{colors.flag-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "48px"
  fab:
    backgroundColor: "{colors.action-leaf}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "56px"
  input:
    backgroundColor: "{colors.flag-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "48px"
  chip:
    backgroundColor: "{colors.flag-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
  shell:
    backgroundColor: "{colors.shell-leaf}"
    textColor: "{colors.shell-ink}"
---

# Design System: คุมอาหาร

## Overview

**Creative North Star: "The flag you fill"**

The app borrows the Thai Department of Health food-guide flag (ธงโภชนาการ): an inverted triangle of food groups, widest at the top. Here the flag is personal. Its bands are nutrients sized from the person's own targets, and they fill as weighed food is logged. Everything else is a calm, standard mobile tool, so the flag is the one place the world speaks.

Light ground, chosen for the scene: a kitchen counter in daylight and a bathroom scale in the morning, phone in one hand.

**Key Characteristics:**
- One signature: the inverted-triangle flag on Today; every other screen is plain, familiar mobile UI.
- Flat, unmodulated band colours from the food-guide flag; no gradients, no glass.
- Scale contrast carries hierarchy: one giant number per screen (kcal left, trend weight), small labels.
- Every number can be traced: a "ที่มาของตัวเลข" disclosure and a source line on every food.

## Colors

### Primary
- **Leaf Shell** (`#173a24`): the header band on every screen.
- **Action Leaf** (`#2f7d3a`): primary buttons, the floating add button, the active tab, checked choices. Nothing else.

### Neutral
- **Page Mist** (`#f3f6f1`) ground, **Flag Ground** (`#ffffff`) for panels, lists and inputs, **Ink** (`#18221b`), **Ink Muted** (`#4b5c4f`), **Line** (`#d9e2d6`).

### Flag bands
Rice gold (คาร์บ), vegetable green (ใยอาหาร), protein brick (โปรตีน), oil brown (ไขมัน), salt slate (โซเดียม). Each has a pale track tint and a solid fill.

### Named Rules
**The Pressable Colour Rule.** Action Leaf appears only on things you can press or the current selection.
**The Band Colour Rule.** Band colours belong to the flag and its nutrients; they never decorate other components (the one exception is the raw/cooked tag tints, which reuse protein and rice tracks to mean raw and cooked).
**The Held Change Rule.** A changed weekly target sits in a notice-yellow strip until the person taps “รับทราบ”.

## Typography

Sarabun (the Thai government face), self-hosted, Thai and Latin subsets, weights 400–800. One family for everything; tabular figures wherever numbers sit in a column.

### Hierarchy
- **Remaining** (800, up to 5rem): the kcal left on Today.
- **Trend** (800, 3.4rem): trend weight on Body.
- **Heading** (700, 1.15rem), **Label** (600, 0.95rem), **Body** (400, 17px), **Fine** (400, 0.85rem) for sources and explanations.

## Layout

Single column, max 560px, 16px gutters. Sticky Leaf Shell header (title, person switcher, date nav), content, fixed three-tab bar at the bottom (วันนี้ / อาหาร / ร่างกาย). The floating add button sits above the tab bar on Today. Works at 360px; the flag's narrowest band was tuned to fit its text there.

## Elevation & Depth

Flat. Panels are separated by 1px Line borders, not shadows. The only shadow is under the floating add button (`0 6px 18px -4px` leaf at 40%) because it floats over content.

## Shapes

10px radius on controls and panels; full pills for chips, choice options, the person switcher and the floating button. Flag bands are trapezoids (12px taper each side), stacked with 6px gaps and inset 4.5% more per band.

## Components

### Buttons
Primary: Action Leaf, white, 48px high (56px for the wide add button). Secondary: white with a Line border. Quiet: text-only, muted. Press scales to 0.98 over 150ms.

### Chips
Favourite meals: white pills with a rice-gold star, 44px.

### Inputs / Fields
Label above in Ink Muted, 48px white field, Action Leaf border on focus, warn border when invalid. The grams field is 64px with a 1.8rem bold number.

### Navigation
Bottom tab bar, icon over label, active tab in Action Leaf bold. Date nav with chevrons in the header; the next-day chevron disables on today.

### The Flag (signature)
Five trapezoid bands. Fill width is exactly eaten ÷ target. The label is drawn twice, ink over the track and white over the fill, the white copy clipped at the fill edge, so text stays legible on both. Sodium turns warn red when over its maximum.

## Do's and Don'ts

### Do:
- **Do** keep one giant number per screen and let labels stay small.
- **Do** show where a number comes from, in plain Thai, next to it or one tap away.
- **Do** label estimates as ประมาณ.

### Don't:
- **Don't** add calorie rings, progress rings or stacks of same-size cards.
- **Don't** use band colours for decoration.
- **Don't** use a modal where an inline panel works (adding food is an inline panel).
