# PX Insights — Lead Generation Dashboard

A self-contained Google Apps Script dashboard for Persuasion Experience lead-gen
data. Drops onto any Google Sheet that follows the columns A → S below, adds a
**PX Insights** menu, and renders ten branded tabs of charts, tables, and KPIs.

## Source columns

| Col | Field |
|----|-------|
| A | Date |
| B | Name |
| C | Email |
| D | Phone Number |
| E | Lead Category (Qualified / Unqualified / Junk / Other) |
| F | Sales Team Notes |
| G | Sale Revenue |
| H | Source |
| I | Campaign |
| J | Ad Set |
| K | Ad |
| L | Page Variant |
| M | Fbclid |
| N | How long have you been struggling with your weight? |
| O | Are you currently diabetic? |
| P | How much weight are you looking to lose? |
| Q | What's your biggest motivation right now? |
| R | When would you look at getting started? |
| S | Anything else you would like to tell us? |

The sheet that holds these rows must be named **`Lead Data`** (configurable via
`CONFIG.DATA_SHEET_NAME` in `Config.gs`).

## Install

1. Open the target Google Sheet.
2. **Extensions → Apps Script** to open the script editor.
3. Copy every `.gs` file from this repo into the editor (one file each):
   `Code.gs`, `Config.gs`, `FormQuestions.gs`, `Utils.gs`, `Data.gs`,
   `Theme.gs`, `Email.gs`, and the nine `SheetXxx.gs` files.
4. Replace the contents of `appsscript.json` with the one from this repo
   (you may need to enable "Show appsscript.json" via Project Settings).
5. Save, close the editor, **reload the spreadsheet**.
6. The **PX Insights** menu now appears in the sheet header. Click
   **🚀 Build Dashboard** to create every tab.

## Daily use

| Menu item | What it does |
|-----------|--------------|
| 📊 Dashboard | Builds every tab on first run, refreshes them on subsequent runs. Lands you on Overview. |

## Tabs

1. **📊 Overview** — hero KPIs with ▲/▼ deltas, conversion funnel, daily volume, top combinations.
2. **🎯 Campaigns** — campaign / ad-set / ad rollups, lead-quality matrix.
3. **⭐ Lead Quality** — distribution donut, weekly category trend, weighted score per campaign.
4. **🔁 Duplicates** — new vs. dupe split, dupe rate by campaign / ad.
5. **🧪 A/B Testing** — page-variant performance with statistical significance.
6. **🌐 Sources** — source rollup, fbclid coverage diagnostic.
7. **📝 Form Insights** — distributions and word clouds for every question in `FormQuestions.gs`.
8. **⏱ Time Trends** — daily volume, day × hour heatmap, sale-time stats.
9. **🚨 Alerts** — leads missing notes, aging follow-ups, underperforming campaigns.
10. **⚙️ Settings** — logo URL, CTA link, date range, filters, alert thresholds, weighted-quality weights.

## Configuration cheatsheet

Everything reasonable to change is editable from the **⚙️ Settings** tab — no
code changes required. Anything more structural (column layout, brand colors)
lives in `Config.gs` near the top.

To **add a new form question**, open `FormQuestions.gs` and append a new entry
to `FORM_QUESTIONS`. The Form Insights tab picks it up automatically on the
next refresh.

## Brand

Colors and fonts are pulled from the Persuasion Experience site:
- Background `#0A0E27`
- Accent (pink) `#FF2BD6`
- Text `#FFFFFF` / `#C7C9D9`
- Font: Montserrat
