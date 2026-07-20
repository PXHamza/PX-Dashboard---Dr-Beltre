/**
 * Config.gs — the ONLY file you need to edit when deploying this dashboard
 * for a new client.
 *
 * Three things to look at:
 *   1) CONFIG.DATA_SHEET    — the tab that holds the raw lead rows.
 *   2) CONFIG.COLUMNS       — map dashboard fields to the client's column
 *                             headers (case-insensitive).
 *   3) FORM_QUESTIONS       — the open-ended form questions to chart in the
 *                             "Form Insights" tab.
 *
 * ----------------------------------------------------------------------------
 * PX MEDICAL — column layout. Extra CRM columns at F (Booked Call Time),
 * R (Funnel Type) and AL/AM/AN (bucket / gap / score) are ignored by the
 * dashboard. Creative columns sit mid-sheet at M/N/O with Page Variant
 * and Fbclid following at P/Q:
 *
 *   A  Date                       J  Campaign ID            S–AK  19 form questions
 *   B  Name                       K  Ad set ID              AL bucket (-)
 *   C  Email                      L  Ad ID                  AM gap (-)
 *   D  Phone Number               M  Preview Link           AN score (-)
 *   E  Lead Category              N  Creative Preview Link
 *   F  Booked Call Time (-)       O  Ad Thumbnail (=IMAGE)
 *   G  Sales team notes           P  Page Variant
 *   H  Sale Revenue               Q  Fbclid
 *   I  Source                     R  Funnel Type (-)
 *
 * Columns marked (-) are CRM-side computed / tracking fields the dashboard
 * doesn't visualise. Headers ending in "ID" (J, K, L) hold the raw
 * Facebook object IDs; the dashboard labels them as "Campaign ID" etc.
 * in tables and filters.
 * ----------------------------------------------------------------------------
 */

const CONFIG = {

  DATA_SHEET: 'Lead Data',

  COLUMNS: {
    date:         'Date',                // A
    name:         'Name',                // B
    email:        'Email',               // C
    phone:        'Phone Number',        // D
    leadCategory: 'Lead Category',       // E
    salesNotes:   'Sales team notes',    // G  (Booked Call Time at F — unused)
    saleRevenue:  'Sale Revenue',        // H
    source:       'Source',              // I
    campaign:     'Campaign ID',         // J
    adSet:        'Ad set ID',           // K
    ad:           'Ad ID',               // L
    pageVariant:  'Page Variant',        // P
    fbclid:       'Fbclid',              // Q

    // ---- Creative-preview columns (used by the "Top Creatives" tab) ----
    // Column M holds the clickable Facebook ad-preview URL.
    // Column N holds the Creative Preview Link — a direct image URL used
    // as the thumbnail. For VIDEO creatives that URL isn't an <img>-able
    // file, so we fall back to the =IMAGE rendering in column O.
    adPreviewUrl:        'M',            // M — Preview Link
    adThumbnailUrl:      'N',            // N — Creative Preview Link (direct image URL)
    adThumbnailFallback: 'O'             // O — Ad Thumbnail (=IMAGE — used for video creatives)
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs.
  // ---------------------------------------------------------------------------

  BRAND: {
    title:    'PX Insights',
    subtitle: 'PX Medical — Funnel Quality & Ad Performance',
    logoUrl:  'https://assets.cdn.filesafe.space/yCb00EnZcY7oJkJTUmkL/media/67cd73cd04d6597d4335ab4e.svg',
    linkUrl:  'https://persuasionexperience.com',
    linkText: 'APPLY FOR YOUR FREE STRATEGY SESSION',
    accent:   '#FF2BD6',
    accent2:  '#10B981',
    bg:       '#0A0F1F',
    card:     '#131B2E'
  }
};

// =============================================================================
// FORM_QUESTIONS — PX Medical practice-intake, 19 questions in cols S → AK.
//
// Two "Which best describes …" questions (S and T) share the same opening
// phrase; they use distinct substrings after "describes" so the dashboard
// charts them independently. Same for the two "How prepared" / "biggest
// frustration" style questions.
// =============================================================================

const FORM_QUESTIONS = [
  { header: 'describes your role',                                                     label: 'Role',                    type: 'choice', topN:  8 },
  { header: 'describes what your practice does',                                       label: 'Practice Type',           type: 'choice', topN: 10 },
  { header: 'typical value of the procedure',                                          label: 'Procedure Value',         type: 'choice', topN:  8 },
  { header: 'how your current marketing is performing',                                label: 'Marketing Performance',   type: 'choice', topN:  8 },
  { header: 'diagnosis_pain_line',                                                     label: 'Diagnosis / Pain Line',   type: 'text',   topN: 25 },
  { header: 'monthly_revenue_gap',                                                     label: 'Monthly Revenue Gap',     type: 'text',   topN: 25 },
  { header: 'primary_bottleneck',                                                      label: 'Primary Bottleneck',      type: 'text',   topN: 25 },
  { header: 'How many new patient consultations',                                      label: 'Consults / Month',        type: 'choice', topN:  8 },
  { header: 'biggest frustration with patient inquiries',                              label: 'Biggest Frustration',     type: 'text',   topN: 25 },
  { header: 'consultations become booked treatments',                                  label: 'Consult → Treatment %',   type: 'choice', topN:  8 },
  { header: 'anything else we should know about your practice',                        label: 'Anything Else',           type: 'text',   topN: 30 },
  { header: 'most useful for your practice right now',                                 label: 'Most Useful Right Now',   type: 'choice', topN:  8 },
  { header: 'rely on most for new patient demand',                                     label: 'Current Demand Source',   type: 'choice', topN:  8 },
  { header: 'biggest marketing goal for the next 12 months',                           label: '12-Mo Marketing Goal',    type: 'choice', topN:  8 },
  { header: 'additional high-value cases could your practice handle',                  label: 'Extra Cases / Month',     type: 'choice', topN:  8 },
  { header: 'what it costs to get a booked consult',                                   label: 'Knows CPL / CAC?',        type: 'choice', topN:  6 },
  { header: 'handles the first conversation with a new patient inquiry',               label: 'First-Contact Handler',   type: 'choice', topN:  8 },
  { header: 'shows interest but does not book right away',                             label: 'Follow-Up Behavior',      type: 'text',   topN: 25 },
  { header: 'how prepared are they for a serious consultation',                        label: 'Consultation Readiness',  type: 'choice', topN:  8 }
];
