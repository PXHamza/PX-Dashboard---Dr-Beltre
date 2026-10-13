/**
 * Config.gs — Ploome (PLOOME 28-Day Method).
 *
 * The ONLY file you edit when deploying this dashboard for a new client:
 *   1) CONFIG.DATA_SHEET    — the tab that holds the raw lead rows.
 *   2) CONFIG.COLUMNS       — map dashboard fields to the client's column
 *                             headers (case-insensitive) or column letters.
 *   3) FORM_QUESTIONS       — the intake questions to chart on Form Insights.
 */

const CONFIG = {

  // ---------------------------------------------------------------------------
  // 1) Source sheet.
  // ---------------------------------------------------------------------------
  DATA_SHEET: 'Lead Data',

  // ---------------------------------------------------------------------------
  // 2) Column mapping — field key → column letter.
  //
  //    Ploome Lead Data layout (for reference — only fields the shared
  //    dashboard consumes are declared below):
  //      A  Date                 H  Fathom Link         O  Creative Preview Link
  //      B  Name                 I  Sale Revenue        P  Ad Thumbnail (=IMAGE)
  //      C  Email                J  Source              Q  Page Variant
  //      D  Phone Number         K  Campaign ID         R  Fbclid
  //      E  Lead Category        L  Ad set ID           S  Funnel Type
  //      F  Booked Call Time     M  Ad ID               T  Close Date
  //      G  Sales team notes     N  Preview Link        U-AC form questions
  //
  //    Ploome-specific note: col H holds the Fathom call-recording link
  //    (not Lead Value like other clients). Declared only when a feature
  //    actually uses it.
  // ---------------------------------------------------------------------------
  COLUMNS: {
    date:         'A',                // A — when the lead came in
    name:         'B',                // B
    email:        'C',                // C
    phone:        'D',                // D — Phone Number
    leadCategory: 'E',                // E — Lead Category
    salesNotes:   'G',                // G — Sales team notes
    saleRevenue:  'I',                // I — Sale Revenue (closed $)
    source:       'J',                // J — Source
    campaign:     'K',                // K — Campaign ID
    adSet:        'L',                // L — Ad set ID
    ad:           'M',                // M — Ad ID
    pageVariant:  'Q',                // Q — Page Variant
    fbclid:       'R',                // R — Fbclid

    // ---- Creative-preview columns (Top Creatives tab) -----------------
    // N — Preview Link (clickable ad preview URL)
    // O — Creative Preview Link (direct image URL, primary thumbnail)
    // P — Ad Thumbnail (=IMAGE(...) formula, fallback for video creatives)
    adPreviewUrl:        'N',
    adThumbnailUrl:      'O',
    adThumbnailFallback: 'P'

    // Secondary auto-routing flag (glpDownsellFlag): not used by Ploome —
    // the client has no downsell / secondary auto-routing column.
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 3) Brand — dialog header + chart accent.
  // ---------------------------------------------------------------------------
  BRAND: {
    title:    'Ploome Insights',
    subtitle: 'PLOOME 28-Day Method — Funnel Quality & Ad Performance',
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
// FORM_QUESTIONS — questions to chart on the Form Insights tab.
//
// Each object:
//   header  Header text in the data sheet (case-insensitive contains).
//   label   Short label above the chart.
//   type    'choice' → bar chart of the most common answers
//           'text'   → top words list (mini word cloud)
//   topN    How many bars/words to render (default 10).
// =============================================================================

const FORM_QUESTIONS = [
  // U — Why applying for PLOOME 28-Day Method?
  { header: 'applying for the ploome 28-day method',
    label:  'Why Applying',                              type: 'text',   topN: 25 },

  // V — What have you already tried to improve your leaking?
  { header: 'already tried to improve your leaking',
    label:  'Prior Attempts',                            type: 'text',   topN: 25 },

  // W — When does leaking usually happen?
  { header: 'when does leaking usually happen',
    label:  'When Leaking Happens',                      type: 'choice', topN: 8 },

  // X — How long have you been dealing with leaking?
  { header: 'how long have you been dealing with leaking',
    label:  'Duration of Leaking',                       type: 'choice', topN: 8 },

  // Y — What would you be able to do again if leaking wasn't holding you back?
  { header: "if leaking wasn't holding you back",
    label:  'Life Without Leaking',                      type: 'text',   topN: 25 },

  // Z — Ready to commit to 28 days of doing the work?
  { header: '28 days of doing the work',
    label:  'Ready to Commit 28 Days?',                  type: 'choice', topN: 4 },

  // AA — Prepared to invest in getting this problem solved? (generic)
  { header: 'prepared to invest in getting this problem solved',
    label:  'Prepared to Invest (General)?',             type: 'choice', topN: 4 },

  // AB — Additional context the applicant wants Christina to know.
  { header: 'what else would you like christina to understand',
    label:  'Additional Context',                        type: 'text',   topN: 25 },

  // AC — Prepared to invest from $125/week? (specific pricing confirmation)
  { header: 'prepared to invest in a solution to stop your leaking',
    label:  '$125/week Investment Ready?',               type: 'choice', topN: 4 }
];
