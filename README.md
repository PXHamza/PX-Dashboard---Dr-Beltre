# PX Lead Intelligence — Popup Dashboard

A Google Apps Script project that adds a **PX Insights → 📊 Dashboard** menu to
any Google Sheet. Clicking it opens a modal popup with KPI cards, charts, and
tables — read-only, no extra tabs created in the spreadsheet.

## Files

| File | Purpose | Edit per client? |
|------|---------|------------------|
| `Code.gs` | Server-side logic: menu, data loading, KPI math, date presets. | Rarely |
| `dashboard.html` | Popup UI: tabs, KPI cards, Chart.js charts. | Rarely |
| `Config.gs` | Column mapping, form questions, brand. | **Yes** |
| `Qualification.gs` | The single rule that decides "is this lead qualified?". | **Yes** |
| `appsscript.json` | Manifest. | No |

## Install

1. Open the target Google Sheet (must contain a tab with raw lead data — by
   default named `Lead Data`).
2. **Extensions → Apps Script**.
3. Copy each file into the editor:
   - `Code.gs` (overwrite the default)
   - **+ → Script** → `Config` → paste `Config.gs`
   - **+ → HTML** → `dashboard` → paste `dashboard.html`
   - Project Settings → tick *"Show appsscript.json manifest"* → paste the manifest.
4. Save the project, reload the spreadsheet.
5. **PX Insights → 📊 Dashboard**.

## Deploying for a new client — 3-step config

Open `Config.gs`. Three blocks to look at:

### 1. Source sheet name

```js
DATA_SHEET: 'Lead Data',
```

### 2. Column mapping

Map each dashboard field to the **header text** in the client's data sheet
(case-insensitive contains-match). If the client renames a header — say
`Date` → `Created Date` — just update the value:

```js
COLUMNS: {
  date:         'Created Date',     // matches "Created Date"
  leadCategory: 'Status',           // matches "Lead Status"
  saleRevenue:  'Closed Amount',
  ...
}
```

You can also pass a column letter (`'A'`, `'F'`, `'AA'`) if a header is
ambiguous, or leave a value empty (`''`) if the client doesn't capture
that field.

### 3. Form questions

Add or remove entries in `FORM_QUESTIONS` to match the client's form:

```js
{
  header: 'How long have you been struggling with your weight?',  // Lookup key — header text
  label:  'Struggle Duration',                                    // Shown above the chart
  type:   'choice',                                               // 'choice' (bar chart) or 'text' (word cloud)
  topN:   8                                                       // Bars / words to display
}
```

That's it. No other file needs to change.

## Tabs in the dashboard

| Tab | Shows |
|-----|-------|
| 📊 Overview | 5 hero KPIs (Total Leads, Qualification Rate, Duplicate Rate, Close Rate, Revenue), daily lead-volume + qualification-rate combo chart, overall quality donut, quality-by-source stacked bar. |
| 🎯 Campaigns | Campaign rollup: leads, qual %, sales, close rate, revenue, rev/lead. |
| 🖼️ Ad Creatives | Same metrics rolled up by ad. |
| 🧪 Page Variants | A/B variant table + close-rate bar chart. |
| 🌐 Sources | Source rollup + fbclid coverage diagnostic. |
| 📝 Form Insights | One chart per question in `FORM_QUESTIONS`. |
| 🚨 Alerts | Sales-notes coverage, aging leads, underperforming campaigns. |

## Filters in the popup

- **From / To** date pickers, **Apply** button to refresh, **All Time** to clear the date range.
- **Source** and **Campaign** dropdowns (auto-populated from the data).

The footer at the bottom of the dialog always shows how many rows are in view,
when the data was last refreshed, and which header each Config field resolved
to — so a typo in `Config.gs` is immediately obvious.
