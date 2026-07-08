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
 * DR SHIM CHING — column layout. Two extra CRM-status columns (F and G) push
 * the standard fields after Lead Category down by 2:
 *
 *   A  Date                       L  Ad set                  V  Q7 Weight range
 *   B  Name                       M  Ad                      W  Q8 Tried methods (alt)
 *   C  Email                      N  Page Variant            X  Q9 Start timing
 *   D  Phone Number               O  Fbclid                  Y  Q10 16-week commit
 *   E  Lead Category              P  Q1 Primary goal         Z  Q11 How heard
 *   F  Booked Call (-)            Q  Q2 Tried other methods  AA Ad Preview Link
 *   G  Active in LLP (-)          R  Q3 Other methods (free) AB Creative Preview Link
 *   H  Sales team notes           S  Q4 Ready in 30 days     AC Ad Thumbnail (=IMAGE)
 *   I  Sale Revenue               T  Q5 6-month goal
 *   J  Source                     U  Q6 Weight to lose
 *   K  Campaign
 *
 * Columns marked (-) are CRM flags the dashboard ignores. Q2 (col Q) and Q8
 * (col W) share the exact same header text ("Have you tried other weight
 * loss methods in the past?") — both use raw column letters so each chart
 * pulls from its own column.
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
    salesNotes:   'Sales team notes',    // H  (Booked Call at F, Active in LLP at G — unused)
    saleRevenue:  'Sale Revenue',        // I
    source:       'Source',              // J
    campaign:     'Campaign',            // K
    adSet:        'Ad set',              // L
    ad:           'Ad',                  // M
    pageVariant:  'Page Variant',        // N
    fbclid:       'Fbclid',              // O

    // ---- Creative-preview columns (used by the "Top Creatives" tab) ----
    // Column AA holds the clickable Facebook ad-preview URL.
    // Column AB holds the Creative Preview Link — a direct image URL used
    // as the thumbnail. For VIDEO creatives that URL isn't an <img>-able
    // file, so we fall back to the =IMAGE rendering in column AC.
    adPreviewUrl:        'AA',           // AA — Ad Preview Link
    adThumbnailUrl:      'AB',           // AB — Creative Preview Link (direct image URL)
    adThumbnailFallback: 'AC'            // AC — Ad Thumbnail (=IMAGE — used for video creatives)
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs.
  // ---------------------------------------------------------------------------

  BRAND: {
    title:    'PX Insights',
    subtitle: 'Dr Shim Ching — Funnel Quality & Ad Performance',
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
// FORM_QUESTIONS — Dr Shim Ching applicant intake, 11 questions in cols P → Z.
//
// Q2 (col Q) and Q8 (col W) have IDENTICAL header text — both use raw column
// letters so resolveColumn maps them directly to their respective columns.
// =============================================================================

const FORM_QUESTIONS = [
  { header: 'primary goal for weight loss',                                            label: 'Primary Goal',              type: 'choice', topN:  8 },
  { header: 'Q',                                                                        label: 'Tried Other Methods',       type: 'choice', topN: 10 },
  { header: 'not listed above',                                                         label: 'Other Methods (Specify)',   type: 'text',   topN: 25 },
  { header: 'professional medical guidance in the next 30 days',                       label: 'Ready in 30 Days?',         type: 'choice', topN:  6 },
  { header: '#1 weight and health goal',                                                label: '6-Month Goal',              type: 'text',   topN: 25 },
  { header: 'How much weight are you hoping to lose',                                   label: 'Weight to Lose',            type: 'choice', topN:  8 },
  { header: 'What is your current weight range',                                        label: 'Current Weight Range',      type: 'choice', topN:  8 },
  { header: 'W',                                                                        label: 'Tried Other Methods (alt)', type: 'choice', topN: 10 },
  { header: 'How soon are you looking to get started',                                  label: 'Start Timing',              type: 'choice', topN:  8 },
  { header: '16-week program',                                                          label: '16-Week Commitment',        type: 'choice', topN:  6 },
  { header: 'How did you hear about us',                                                label: 'How Heard About Us',        type: 'choice', topN: 10 }
];
