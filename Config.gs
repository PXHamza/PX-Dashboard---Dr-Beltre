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
  //    Matching is case-insensitive and "contains-style", so 'Date' will
  //    match a header named 'Created Date', 'Lead Date', 'Date Submitted', etc.
  //    Set a value to '' (empty string) to disable that field for a client
  //    that doesn't capture it (e.g. no Page Variant column → set to '').
  //
  //    You can also pass an exact column letter ('A', 'F', 'AA') if your
  //    data sheet has duplicate header text and you need to disambiguate.
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
    fbclid:       'Fbclid'               // M
  },

  // ---------------------------------------------------------------------------
  // Lead-category vocabulary — raw values that map to each bucket.
  // Matching is case-insensitive "contains".
  // ---------------------------------------------------------------------------
  CATEGORIES: {
    Qualified:   ['qualified', 'qual'],
    Unqualified: ['unqualified', 'unqual'],
    Junk:        ['junk', 'spam', 'fake']
  },

  // ---------------------------------------------------------------------------
  // 3) Brand — appears in the dialog header and as the chart accent.
  // ---------------------------------------------------------------------------
  BRAND: {
    title:    'PX Lead Intelligence',
    subtitle: 'Funnel Quality & Ad Performance',
    logoUrl:  '',                                    // Optional: paste a public PNG/JPG URL
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
