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
 * PX — column layout. Note the creative-preview columns (N–P) sit in the
 * MIDDLE of the sheet, before Page Variant and Fbclid:
 *
 *   A  Date                       L  Ad set            U  Q2 Current marketing
 *   B  Name                       M  Ad                V  Q3 Marketing — other
 *   C  Email                      N  Ad Preview Link   W  Q4 Problem to solve
 *   D  Phone Number               O  Creative Prev URL X  Q5 Service area
 *   E  Company URL  *not used*    P  Ad Thumbnail (-)  Y  Q6 Service area (other)
 *   F  Lead Category              Q  Page Variant      Z  Q7 When need leads
 *   G  Strategy Session Time (-)  R  Fbclid            AA Q8 Anything else
 *   H  Sales team notes           S  Funnel Type (-)
 *   I  Sale Revenue               T  Q1 Extra projects /yr
 *   J  Source
 *   K  Campaign
 *
 * Columns marked (-) aren't currently visualised. The dashboard ignores them
 * but they're documented here for context.
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
  //      1. Column letter (1-3 ALL-CAPS letters).
  //      2. EXACT case-insensitive header match.
  //      3. Case-insensitive "contains" fallback.
  // ---------------------------------------------------------------------------
  COLUMNS: {
    date:         'Date',                // A
    name:         'Name',                // B
    email:        'Email',               // C
    phone:        'Phone Number',        // D
    leadCategory: 'Lead Category',       // F  (Company URL sits at E, not used)
    salesNotes:   'Sales team notes',    // H  (Strategy Session Time at G, not used)
    saleRevenue:  'Sale Revenue',        // I
    source:       'Source',              // J
    campaign:     'Campaign',            // K
    adSet:        'Ad set',              // L
    ad:           'Ad',                  // M
    pageVariant:  'Page Variant',        // Q
    fbclid:       'Fbclid',              // R

    // ---- Creative-preview columns (used by the "Top Creatives" tab) ----
    // Column N holds the clickable FB ad-preview URL.
    // Column O holds the Creative Preview Link — a direct, full-resolution
    // image URL used as the thumbnail. For VIDEO creatives this URL isn't
    // an image the browser can show in an <img>, so the dashboard falls
    // back to the =IMAGE rendering in column P (Ad Thumbnail).
    adPreviewUrl:        'N',            // N — Preview Link
    adThumbnailUrl:      'O',            // O — Creative Preview Link (direct image URL)
    adThumbnailFallback: 'P'             // P — Ad Thumbnail (=IMAGE — used for video creatives)
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
    subtitle: 'PX — Funnel Quality & Ad Performance',
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
// FORM_QUESTIONS — PX strategy-session form, 8 questions in columns T → AA.
//
// Two questions have an "(Other)" free-text companion column right next to
// them (U/V and X/Y). Both pairs match on distinct header substrings so
// the dashboard charts them separately.
// =============================================================================

const FORM_QUESTIONS = [
  { header: 'How many extra projects could you handle',                                label: 'Extra Projects / Year',  type: 'choice', topN: 10 },
  { header: 'What marketing are you doing right now?',                                 label: 'Current Marketing',      type: 'choice', topN: 10 },
  { header: 'What other marketing are you doing right now? - other',                   label: 'Marketing — Other',      type: 'text',   topN: 20 },
  { header: 'problem you need solved',                                                 label: 'Problem to Solve',       type: 'text',   topN: 25 },
  { header: 'Where can you service?',                                                  label: 'Service Area',           type: 'choice', topN: 12 },
  { header: 'Where can you service? (Other)',                                          label: 'Service Area — Other',   type: 'text',   topN: 20 },
  { header: 'When do you need more qualified leads?',                                  label: 'Lead Urgency',           type: 'choice', topN:  8 },
  { header: 'what else do i need to know about your business',                         label: 'Anything Else',          type: 'text',   topN: 30 }
];
