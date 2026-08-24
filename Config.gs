/**
 * Config.gs — PX Medical DTO.
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
  //    resolveColumn matching order:
  //      1. Column letter (1-3 uppercase letters) — checked first so a
  //         value like 'T' doesn't accidentally contains-match a header
  //         containing the letter 't'.
  //      2. Exact case-insensitive header match.
  //      3. Case-insensitive contains match.
  //
  //    Set a value to '' to disable that field entirely.
  // ---------------------------------------------------------------------------
  COLUMNS: {
    date:         'A',                 // A — when the lead came in
    name:         'B',                 // B
    email:        'C',                 // C
    phone:        'D',                 // D — Phone Number
    leadCategory: 'E',                 // E — Lead Category
    salesNotes:   'G',                 // G — Sales team notes
    saleRevenue:  'I',                 // I — Sale Revenue
    source:       'J',                 // J — Source
    campaign:     'K',                 // K — Campaign ID
    adSet:        'L',                 // L — Ad Set ID
    ad:           'M',                 // M — Ad ID
    pageVariant:  'Q',                 // Q — Page Variant
    fbclid:       'R',                 // R — Fbclid

    // ---- Creative-preview columns (Top Creatives tab) -----------------
    // N — Preview Link (clickable ad preview URL)
    // O — Creative Preview Link (direct image URL, primary thumbnail)
    // P — Ad Thumbnail (=IMAGE(...) formula, fallback for video creatives)
    adPreviewUrl:        'N',
    adThumbnailUrl:      'O',
    adThumbnailFallback: 'P',

    // ---- Secondary auto-routing category flag -------------------------
    // DTO has no secondary auto-routing column (unlike Dr Beltre's GLP-1
    // downsell in col X). Left blank so the funnel counts don't try to
    // filter on a non-existent column.
    glpDownsellFlag:     ''
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 3) Brand — dialog header + chart accent.
  // ---------------------------------------------------------------------------
  BRAND: {
    title:    'PX Medical DTO',
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
  { header: 'typical value of the procedure',
    label:  'Case Value',                             type: 'choice', topN: 8 },
  { header: 'how many additional surgeries',
    label:  'Extra Surgeries / Month',                type: 'choice', topN: 8 },
  { header: 'what marketing are you doing right now',
    label:  'Current Marketing',                      type: 'choice', topN: 10 },
  { header: 'what marketing are you doing right now? (other)',
    label:  'Current Marketing (Other)',              type: 'text',   topN: 25 },
  { header: 'problem you need solved',
    label:  'Problem to Solve',                       type: 'text',   topN: 25 },
  { header: 'when do you need more qualified leads',
    label:  'Timing',                                 type: 'choice', topN: 6 },
  { header: 'best describes your role in the practice',
    label:  'Role',                                   type: 'choice', topN: 8 },
  { header: 'best describes your role in your practice ? (other)',
    label:  'Role (Other)',                           type: 'text',   topN: 20 },
  { header: 'anything else we should know',
    label:  'Additional Context',                     type: 'text',   topN: 25 },
  { header: 'invest this level of ad spend',
    label:  '$5k/mo Ad Spend Ready?',                 type: 'choice', topN: 4 },
  { header: 'practice url',
    label:  'Practice URL',                           type: 'text',   topN: 20 }
];
