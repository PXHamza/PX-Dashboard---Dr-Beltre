/**
 * Config.gs — the ONLY file you need to edit when deploying this dashboard
 * for a new client.
 *
 * Three things to look at:
 *   1) CONFIG.DATA_SHEET    — the tab that holds the raw lead rows.
 *   2) CONFIG.COLUMNS       — map dashboard fields to the client's column
 *                             headers (case-insensitive). If a header is
 *                             renamed or moves, just update the mapping —
 *                             you never need to touch column letters.
 *   3) FORM_QUESTIONS       — the open-ended form questions to chart in the
 *                             "Form Insights" tab. Add / remove / reword
 *                             freely, then re-open the dashboard.
 *
 * Everything else (KPI math, charts, layout) reads from this file via
 * field keys, so a column move or a rename never breaks the dashboard.
 */

const CONFIG = {

  // ---------------------------------------------------------------------------
  // 1) Source sheet — must exist in the spreadsheet.
  // ---------------------------------------------------------------------------
  DATA_SHEET: 'Lead Data',

  // ---------------------------------------------------------------------------
  // 2) Column mapping — field key → header text in row 1 of DATA_SHEET.
  //
  //    Matching order (resolveColumn in Code.gs):
  //      1. EXACT case-insensitive match — the value here matches a header
  //         character-for-character. Use this when headers are clean.
  //      2. Case-insensitive "contains" — used as a fallback when no exact
  //         match exists (e.g. value 'Date' matches header 'Created Date').
  //      3. Column letter — if the value looks like 'A', 'AA' etc and no
  //         header matched, treated as a literal column letter.
  //
  //    IMPORTANT: ambiguous short values like 'Ad' will EXACT-match a header
  //    called "Ad" (column K) before falling back to contains-match. If your
  //    header is actually "Ad Name", set `ad: 'Ad Name'` so it doesn't
  //    contains-match "Ad Set" by accident.
  //
  //    Set a value to '' (empty string) to disable that field entirely.
  // ---------------------------------------------------------------------------
  COLUMNS: {
    date:         'Date',                // A — when the lead came in
    name:         'Name',                // B
    email:        'Email',               // C
    phone:        'Phone',               // D
    leadCategory: 'Lead Category',       // E — Qualified / Unqualified / Junk
    salesNotes:   'Sales Team Notes',    // F
    saleRevenue:  'Sale Revenue',        // G — numeric, blank/0 = not closed
    source:       'Source',              // H — Facebook, Google, IG, etc.
    campaign:     'Campaign',            // I
    adSet:        'Ad Set',              // J
    ad:           'Ad',                  // K
    pageVariant:  'Page Variant',        // L
    fbclid:       'Fbclid',              // M

    // ---- Creative-preview columns (used by the "Top Creatives" tab) ----
    // Column T holds the Facebook ad-preview URL.
    // Column U is an =IMAGE("...") formula whose URL we extract at runtime
    // and display as a thumbnail in the popup. Both default to column
    // letters so they work even if those columns don't have headers.
    adPreviewUrl:   'T',                 // T — Ad Preview Link
    adThumbnailUrl: 'U'                  // U — =IMAGE(thumbnail_url)
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs (separate file so each
  // client's "what counts as qualified?" logic is editable in one place).
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 3) Brand — appears in the dialog header and as the chart accent.
  // ---------------------------------------------------------------------------
  BRAND: {
    title:    'PX Insights',
    subtitle: 'Funnel Quality & Ad Performance',
    logoUrl:  'https://assets.cdn.filesafe.space/yCb00EnZcY7oJkJTUmkL/media/67cd73cd04d6597d4335ab4e.svg',
    linkUrl:  'https://persuasionexperience.com',
    linkText: 'APPLY FOR YOUR FREE STRATEGY SESSION',
    accent:   '#FF2BD6',                             // Hot pink (PX brand)
    accent2:  '#10B981',                             // Action green
    bg:       '#0A0F1F',                             // Dialog background
    card:     '#131B2E'                              // KPI card background
  }
};

// =============================================================================
// FORM_QUESTIONS — the open-ended questions to chart on the Form Insights tab.
//
// Each object:
//   header  (string)  Header text in the data sheet (case-insensitive contains).
//                     Leave alone if you don't know — Code.gs will look up the
//                     exact column at runtime.
//   label   (string)  Short label shown above the chart.
//   type    'choice' | 'text'
//                     'choice' → bar chart of the most common answers
//                     'text'   → top words list (mini word cloud)
//   topN    (number)  How many bars/words to render. Default 10.
//
// To add a question for a new client: append a new object. To remove one:
// delete its entry. No other file needs to change.
// =============================================================================

const FORM_QUESTIONS = [
  {
    header: 'How long have you been struggling with your weight?',
    label:  'Struggle Duration',
    type:   'choice',
    topN:   8
  },
  {
    header: 'Are you currently diabetic?',
    label:  'Diabetic',
    type:   'choice',
    topN:   6
  },
  {
    header: 'How much weight are you looking to lose?',
    label:  'Weight to Lose',
    type:   'choice',
    topN:   8
  },
  {
    header: 'biggest motivation',
    label:  'Motivation',
    type:   'text',
    topN:   20
  },
  {
    header: 'When would you look at getting started?',
    label:  'Start Timing',
    type:   'choice',
    topN:   8
  },
  {
    header: 'Anything else you would like to tell us',
    label:  'Other Notes',
    type:   'text',
    topN:   25
  }
];
