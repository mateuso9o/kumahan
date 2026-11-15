---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/ui"]
---

Scope: the whole phase-1 app shell (Today, Food log, Body, Profile setup). Mode: Operate.
Audience/job: two household members log weighed food, weigh in, and check what is left today, often one-handed in the kitchen.

## Direction contract

THESIS: Today is the person's own Thai food-guide flag (ธงโภชนาการ): an inverted triangle of nutrient bands that fill as food is logged, sized from their own targets. Refuses the category default of a calorie ring over a stack of rounded cards.

OWN-WORLD: White flag ground under a deep leaf-green shell header (#173A24). Bands are flat, unmodulated colour fields from the Department of Health flag: rice gold, vegetable green, protein brick red, oil brown, salt slate blue; ink near-black green. Sarabun (the Thai government face) for all text, tabular figures. Action colour (#2F7D3A) appears only on things you can press.

STORY: Open the app and see in one glance how much is left and which band is short; log a food in seconds; tap any number to see its source and the reason behind it.

FIRST VIEWPORT: Green header: profile name, date with prev/next. Under it a giant "เหลือ 820 kcal" with eaten/target small beside it. The flag: 5 trapezoid bands narrowing downward (คาร์บ, ผักผลไม้=ใยอาหาร, โปรตีน, ไขมัน, โซเดียม), label left, eaten/target right, fill length exactly proportional. One "ยังขาด…" suggestion line. Floating primary "+ บันทึกอาหาร". Bottom tabs: วันนี้ / อาหาร / ร่างกาย.

FORM: grounded candidate 4 of 7 (ธงโภชนาการ). seed:e160eca427cebba4. Raises: scale-contrast hierarchy (from variable-font specimen); fill length = exact proportion (from labanotation); flat colour fields own their regions (from zoo guide map); a changed weekly target stays highlighted until acknowledged (from boarding pass/gate board); action colour only on actionable things (from warm consumer app).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
