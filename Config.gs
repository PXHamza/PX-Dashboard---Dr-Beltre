/**
 * Config.gs — Dr Bensoussan.
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
    // Full Dr Bensoussan Lead Data column map (from client spec, for
    // reference — not all columns feed the dashboard yet):
    //   A Date            H Lead Value         O Creative Preview Link
    //   B Name            I Sale Revenue       P Ad Thumbnail
    //   C Email           J Source             Q Page Variant
    //   D Phone Number    K Campaign ID        R Fbclid
    //   E Lead Category   L Ad set ID          S Funnel Type
    //   F Booked Call     M Ad ID              T Close Date
    //     Time            N Preview Link       U-AB Form questions
    //   G Sales team notes
    //
    // Only the fields the shared dashboard consumes are declared below —
    // adding e.g. `closeDate: 'T'` would just clutter the mapping footer
    // without feeding any current chart. Introduce them (and the matching
    // Code.gs/dashboard.html features) when a new metric needs them.
    date:            'A',              // A — when the lead came in
    name:            'B',              // B
    email:           'C',              // C
    phone:           'D',              // D — Phone Number
    leadCategory:    'E',              // E — Lead Category
    salesNotes:      'G',              // G — Sales team notes
    saleRevenue:     'I',              // I — Sale Revenue (closed $)
    source:          'J',              // J — Source
    campaign:        'K',              // K — Campaign ID
    adSet:           'L',              // L — Ad set ID
    ad:              'M',              // M — Ad ID
    pageVariant:     'Q',              // Q — Page Variant
    fbclid:          'R',              // R — Fbclid

    // ---- Creative-preview columns (Top Creatives tab) -----------------
    // N — Preview Link (clickable ad preview URL)
    // O — Creative Preview Link (direct image URL, primary thumbnail)
    // P — Ad Thumbnail (=IMAGE(...) formula, fallback for video creatives)
    adPreviewUrl:        'N',
    adThumbnailUrl:      'O',
    adThumbnailFallback: 'P'

    // Secondary auto-routing flag (glpDownsellFlag): not used by Dr
    // Bensoussan — the client has no GLP-1 downsell path, so no column
    // is declared. The shared Code.gs treats a missing key as disabled.
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 3) Brand — dialog header + chart accent.
  // ---------------------------------------------------------------------------
  BRAND: {
    title:    'Dr Bensoussan Insights',
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
  // U — What matters most to you when choosing a dentist to restore your teeth?
  //     Free-text; respondents list multiple attributes.
  { header: 'matters most to you when choosing a dentist',
    label:  'What matters most',                       type: 'text',   topN: 25 },

  // V — How long have you been dealing with your current dental concerns?
  //     Bounded choice (buckets of time).
  { header: 'dealing with your current dental concerns',
    label:  'Duration of Concerns',                    type: 'choice', topN: 8 },

  // W — What have you already tried to improve your teeth?
  //     Free-text; captures prior treatments.
  { header: 'already tried to improve your teeth',
    label:  'Prior Attempts',                          type: 'text',   topN: 25 },

  // X — When would you ideally like to have your treatment completed?
  //     Bounded choice (Within 3 months, Within 6 months, etc.).
  { header: 'ideally like to have your treatment completed',
    label:  'Ideal Timing',                            type: 'choice', topN: 6 },

  // Y — Full-arch treatment typically starts $20-30k+. Within budget?
  //     Yes / Yes with financing / No.
  { header: 'investment in this range within your current budget',
    label: '$20-30k+ Within Budget?',                  type: 'choice', topN: 4 },

  // Z — Consent: understands Dr Bensoussan recommends the approach he
  //     thinks is right.
  { header: 'evaluate my whole mouth and recommend the approach',
    label:  'Accepts Recommendation Approach?',        type: 'choice', topN: 4 },

  // AA — Consent: understands application ≠ guaranteed appointment.
  { header: 'completing this application does not guarantee an appointment',
    label:  'Understands Application Flow?',           type: 'choice', topN: 4 },

  // AB — Additional context: free text the patient wants Dr Bensoussan
  //      to know.
  { header: 'what else would you like dr',
    label:  'Additional Context',                      type: 'text',   topN: 25 }
];
