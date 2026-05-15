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
 * LINCOLN INSTITUTE — column layout:
 *
 *   A  Date           K  Ad              U  Q8  Owner Time Away
 *   B  Name           L  Page Variant    V  Q9  Recent Issues
 *   C  Email          M  Fbclid          W  Q10 Rebooking Rate
 *   D  Phone          N  Q1  Role        X  Q11 Clinical Confidence
 *   E  Lead Category  O  Q2  12-mo Goal  Y  Q12 Top Outcome
 *   F  Sales notes    P  Q3  Challenge   Z  Q13 Leadership Rhythm
 *   G  Sale Revenue   Q  Q4  Rev Level   AA Q14 Growth Constraint
 *   H  Source         R  Q5  Cur Revenue AB Q15 Top Outcome (alt)
 *   I  Campaign       S  Q6  Team Size   AC Ad Preview Link
 *   J  Ad set         T  Q7  Practice    AD Creative Preview Link
 *                            Today        AE Ad Thumbnail (=IMAGE — unused)
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
  //      1. Column letter (1-3 ALL-CAPS letters) — used here for AC / AD.
  //      2. EXACT case-insensitive header match.
  //      3. Case-insensitive "contains" fallback.
  // ---------------------------------------------------------------------------
  COLUMNS: {
    date:         'Date',                // A
    name:         'Name',                // B
    email:        'Email',               // C
    phone:        'Phone Number',        // D
    leadCategory: 'Lead Category',       // E
    salesNotes:   'Sales team notes',    // F
    saleRevenue:  'Sale Revenue',        // G
    source:       'Source',              // H
    campaign:     'Campaign',            // I
    adSet:        'Ad set',              // J
    ad:           'Ad',                  // K
    pageVariant:  'Page Variant',        // L
    fbclid:       'Fbclid',              // M

    // ---- Creative-preview columns (used by the "Top Creatives" tab) ----
    // Column AC holds the clickable FB ad-preview URL.
    // Column AD holds the Creative Preview Link — a direct, full-resolution
    // image URL used as the thumbnail.
    // Column AE ("Ad Thumbnail") is the =IMAGE() rendering for humans
    // viewing the sheet — we don't read it because AD already gives us
    // the URL.
    adPreviewUrl:   'AC',                // AC — Ad Preview Link
    adThumbnailUrl: 'AD'                 // AD — Creative Preview Link (direct image URL)
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
    subtitle: 'Lincoln Institute — Funnel Quality & Ad Performance',
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
// FORM_QUESTIONS — Lincoln Institute has 15 questions in columns N → AB.
//
// Notes on the matching strategy:
//   - For questions whose header text is unique, we use a distinctive
//     substring (case-insensitive contains-match).
//   - Q12 and Q15 have IDENTICAL header text ("What outcome matters most
//     in the next 12 months?"). Header-text matching can't tell them
//     apart, so we use raw column letters ('Y' and 'AB') for those two.
//     resolveColumn in Code.gs treats a 1-3 ALL-CAPS spec as a literal
//     column letter, so this works without ambiguity.
// =============================================================================

const FORM_QUESTIONS = [
  { header: 'Practice Owner or Practice Manager',                  label: 'Role',                type: 'choice', topN:  6 },
  { header: '#1 goal',                                             label: '12-Month Goal',       type: 'choice', topN: 10 },
  { header: 'biggest challenge or constraint in your business',    label: 'Biggest Challenge',   type: 'choice', topN: 10 },
  { header: 'level of revenue',                                    label: 'Revenue Level',       type: 'choice', topN:  8 },
  { header: 'current practice revenue',                            label: 'Current Revenue',     type: 'choice', topN:  8 },
  { header: 'team members work in the practice',                   label: 'Team Size',           type: 'choice', topN:  8 },
  { header: 'statement feels most true',                           label: 'Practice Today',      type: 'choice', topN:  8 },
  { header: 'owner takes time away',                               label: 'Owner Time Away',     type: 'choice', topN:  6 },
  { header: 'shown up in the last 30 days',                        label: 'Recent Issues',       type: 'choice', topN: 10 },
  { header: 'patients book their next appointments',               label: 'Rebooking Rate',      type: 'choice', topN:  6 },
  { header: 'How confident is your clinical team',                 label: 'Clinical Confidence', type: 'choice', topN:  6 },
  { header: 'Y',                                                   label: 'Top Outcome',         type: 'choice', topN:  8 },
  { header: 'leadership rhythm',                                   label: 'Leadership Rhythm',   type: 'choice', topN:  6 },
  { header: 'biggest constraint to your next stage',               label: 'Growth Constraint',   type: 'choice', topN:  8 },
  { header: 'AB',                                                  label: 'Top Outcome (alt)',   type: 'choice', topN:  8 }
];
