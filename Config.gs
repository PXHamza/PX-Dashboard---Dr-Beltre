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
 *
 * ----------------------------------------------------------------------------
 * BUILDERWELL — column layout (differs from the master / Dr Beltre layout
 * because Builderwell captures an "Address" column at E, which pushes every
 * field after it one column to the right):
 *
 *   A  Date                       L  Ad
 *   B  Name                       M  Page Variant
 *   C  Email                      N  Fbclid
 *   D  Phone Number               O  Q1 — Type of Project
 *   E  Address  *not used*        P  Q2 — Budget
 *   F  Lead Category              Q  Q3 — When to start
 *   G  Sales team notes           R  Q4 — Designs / floor plans?
 *   H  Sale Revenue               S  Q5 — Tell us more
 *   I  Source                     T  Q6 — Area
 *   J  Campaign                   U  Ad Preview Link
 *   K  Ad set                     V  Creative Preview Link
 *                                 W  Ad Thumbnail (=IMAGE rendering — not used)
 * ----------------------------------------------------------------------------
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
  //      2. Case-insensitive "contains" — fallback for renames.
  //      3. Column letter — if the value looks like 'A', 'AA' etc.
  //
  //    For Builderwell we use header text for the standard fields (so
  //    minor column shifts don't break anything) and column letters for
  //    the two creative-preview columns (which typically don't have a
  //    header row).
  //
  //    Note: column E (Address) is intentionally NOT mapped — the
  //    dashboard doesn't visualise it.
  // ---------------------------------------------------------------------------
  COLUMNS: {
    date:         'Date',                // A
    name:         'Name',                // B
    email:        'Email',               // C
    phone:        'Phone Number',        // D
    leadCategory: 'Lead Category',       // F  (Address sits at E and is unused)
    salesNotes:   'Sales team notes',    // G
    saleRevenue:  'Sale Revenue',        // H
    source:       'Source',              // I
    campaign:     'Campaign',            // J
    adSet:        'Ad set',              // K
    ad:           'Ad',                  // L
    pageVariant:  'Page Variant',        // M
    fbclid:       'Fbclid',              // N

    // ---- Creative-preview columns (used by the "Top Creatives" tab) ----
    // Column U holds the clickable Facebook ad-preview URL.
    // Column V holds the Creative Preview Link — a direct, full-resolution
    // image URL used as the thumbnail.
    // Column W ("Ad Thumbnail") is the =IMAGE() rendering for humans in
    // the sheet — we don't read it because V already gives us the URL.
    adPreviewUrl:   'U',                 // U — Ad Preview Link
    adThumbnailUrl: 'V'                  // V — Creative Preview Link (direct image URL)
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
    subtitle: 'Builderwell — Funnel Quality & Ad Performance',
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
// Builderwell has 6 form questions, in columns O → T.
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
    header: 'Please Select Your Type Of Project',
    label:  'Project Type',
    type:   'choice',
    topN:   10
  },
  {
    header: 'What is your budget for this project',
    label:  'Budget',
    type:   'choice',
    topN:   10
  },
  {
    header: 'When are you looking to start this building project',
    label:  'Start Timing',
    type:   'choice',
    topN:   8
  },
  {
    header: 'Do you have designs and floor plans already',
    label:  'Designs Ready?',
    type:   'choice',
    topN:   6
  },
  {
    header: 'Tell us a little bit more about your project',
    label:  'Project Detail',
    type:   'text',
    topN:   25
  },
  {
    header: 'Area',
    label:  'Area',
    type:   'choice',
    topN:   10
  }
];
