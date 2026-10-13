/**
 * Config.gs — Obesity Control Centre (OCC).
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
  //    OCC Lead Data layout (for reference — only fields the shared
  //    dashboard consumes are declared below):
  //      A  Date                 H  Lead Value          O  Creative Preview Link
  //      B  Name                 I  Sale Revenue        P  Ad Thumbnail (=IMAGE)
  //      C  Email                J  Source              Q  Page Variant
  //      D  Phone Number         K  Campaign ID         R  Fbclid
  //      E  Lead Category        L  Ad set ID           S  Funnel Type
  //      F  Booked Call Time     M  Ad ID               T-AC form questions
  //      G  Sales team notes     N  Close Date
  //
  //    Note: OCC's sheet has NO separate "Preview Link" (clickable ad
  //    URL) column — only the direct image URL in col O and the =IMAGE
  //    fallback in col P. adPreviewUrl is left disabled below.
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
    // OCC's sheet has NO clickable Preview Link column — set adPreviewUrl
    // to '' so the Top Creatives cards still show thumbnails but omit the
    // "open ad" button.
    // O — Creative Preview Link (direct image URL, primary thumbnail)
    // P — Ad Thumbnail (=IMAGE(...) formula, fallback for video creatives)
    adPreviewUrl:        '',
    adThumbnailUrl:      'O',
    adThumbnailFallback: 'P'

    // Secondary auto-routing flag (glpDownsellFlag): not used by OCC —
    // the client has no GLP-1 or similar downsell path.
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 3) Brand — dialog header + chart accent.
  // ---------------------------------------------------------------------------
  BRAND: {
    title:    'OCC Insights',
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
  // T — What matters most when choosing where to have bariatric surgery?
  { header: 'matters most to you when choosing where to have bariatric surgery',
    label:  'What matters most',                           type: 'text',   topN: 25 },

  // U — How long have you been dealing with your weight concerns?
  { header: 'dealing with your weight concerns',
    label:  'Duration of Weight Concerns',                 type: 'choice', topN: 8 },

  // V — What have you already tried to help with your weight loss?
  //     (This exact text contains col W's substring too, so match on the
  //      full question without the "(Other)" tail.)
  { header: 'already tried to help with your weight loss?',
    label:  'Prior Weight-Loss Attempts',                  type: 'choice', topN: 10 },

  // W — Same question, free-text "Other" field.
  { header: 'already tried to help with your weight loss? (other)',
    label:  'Prior Attempts (Other)',                      type: 'text',   topN: 25 },

  // X — When would you ideally like to have your surgery?
  { header: 'ideally like to have your surgery',
    label:  'Ideal Timing',                                type: 'choice', topN: 6 },

  // Y — Are you prepared to travel to Tijuana, Mexico?
  { header: 'prepared to travel to tijuana',
    label:  'Willing to Travel to Tijuana?',               type: 'choice', topN: 4 },

  // Z — $5-7k investment comfort?
  { header: 'comfortable with this level of investment',
    label:  '$5-7k Investment Comfortable?',               type: 'choice', topN: 4 },

  // AA — Consent: OCC doesn't recommend based on request alone.
  { header: 'occ does not recommend a procedure simply',
    label:  'Accepts Recommendation Approach?',            type: 'choice', topN: 4 },

  // AB — Consent: application doesn't guarantee surgery.
  { header: 'application does not guarantee surgery',
    label:  'Understands Application Flow?',               type: 'choice', topN: 4 },

  // AC — Additional context the patient wants OCC to know.
  { header: 'what else would you like the occ team to know',
    label:  'Additional Context',                          type: 'text',   topN: 25 }
];
