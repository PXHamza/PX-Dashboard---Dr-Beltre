/**
 * Config.gs — Dr Athré.
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
    // Full Dr Athré Lead Data column map (from client screenshots):
    //   A Date            H Lead Value         O Creative Preview Link
    //   B Name            I Sale Revenue       P Ad Thumbnail
    //   C Email           J Source             Q Page Variant
    //   D Phone Number    K Campaign ID        R Fbclid
    //   E Lead Category   L Ad set ID          S Funnel Type
    //   F Booked Call     M Ad ID              T-Y Form questions
    //     Time            N Preview Link
    //   G Sales team notes
    //
    // Every column below is documented even when it's not consumed by
    // the shared dashboard yet — that way when a new tab or metric is
    // added later, the mapping is already in place.
    date:            'A',              // A — when the lead came in
    name:            'B',              // B
    email:           'C',              // C
    phone:           'D',              // D — Phone Number
    leadCategory:    'E',              // E — Lead Category
    bookedCallTime:  'F',              // F — Booked Call Time
                                        //     (present on the sheet; not yet
                                        //      surfaced in the shared dashboard)
    salesNotes:      'G',              // G — Sales team notes
    leadValue:       'H',              // H — Lead Value (estimated pipeline $)
                                        //     (present on the sheet; not yet
                                        //      surfaced in the shared dashboard —
                                        //      dashboard uses Sale Revenue below)
    saleRevenue:     'I',              // I — Sale Revenue (closed $)
    source:          'J',              // J — Source
    campaign:        'K',              // K — Campaign ID
    adSet:           'L',              // L — Ad set ID
    ad:              'M',              // M — Ad ID
    funnelType:      'S',              // S — Funnel Type
                                        //     (present on the sheet; not yet
                                        //      surfaced in the shared dashboard)
    pageVariant:     'Q',              // Q — Page Variant
    fbclid:          'R',              // R — Fbclid

    // ---- Creative-preview columns (Top Creatives tab) -----------------
    // N — Preview Link (clickable ad preview URL)
    // O — Creative Preview Link (direct image URL, primary thumbnail)
    // P — Ad Thumbnail (=IMAGE(...) formula, fallback for video creatives)
    adPreviewUrl:        'N',
    adThumbnailUrl:      'O',
    adThumbnailFallback: 'P',

    // ---- Secondary auto-routing category flag -------------------------
    // Dr Athré has no secondary auto-routing column (unlike Dr Beltre's
    // GLP-1 downsell in col X). Left blank so the funnel counts don't
    // try to filter on a non-existent column.
    glpDownsellFlag:     ''
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 3) Brand — dialog header + chart accent.
  // ---------------------------------------------------------------------------
  BRAND: {
    title:    'Dr Athré Insights',
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
  // T — What matters most to you when choosing a facial plastic surgeon?
  //     Free-text answer (respondents check multiple attributes) so use text.
  { header: 'matters most to you when choosing a facial plastic surgeon',
    label:  'What matters most',                       type: 'text',   topN: 25 },

  // U — When would you ideally like to have your facial rejuvenation completed?
  //     Bounded choice (Within 12 months, 3-6 months, etc.).
  { header: 'have your facial rejuvenation completed',
    label:  'Ideal Timing',                            type: 'choice', topN: 6 },

  // V — Financial readiness for the $35,000+ investment. Choice with
  //     "Yes" / "Yes, and I would like to explore financing options" / etc.
  { header: 'financially prepared to make an investment',
    label:  '$35k+ Financially Ready?',                type: 'choice', topN: 4 },

  // W — Consent: understands Dr Athré recommends the approach he thinks best.
  //     Yes / No confirmation.
  { header: 'analyze my entire face and recommend the approach',
    label:  'Accepts Recommendation Approach?',        type: 'choice', topN: 4 },

  // X — Consent: understands application ≠ guaranteed consultation ($200 fee).
  { header: 'completing this application does not guarantee a consultation',
    label:  'Understands $200 Consult Fee?',           type: 'choice', topN: 4 },

  // Y — What else would you like Dr Athré to understand? Free-text notes.
  { header: 'what else would you like dr',
    label:  'Additional Context',                      type: 'text',   topN: 25 }
];
