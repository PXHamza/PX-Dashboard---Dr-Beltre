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
 * MMT — column layout:
 *
 *   A  Date            K  Ad                 U  Q8 Cash Collected
 *   B  Name            L  Page Variant       V  Q9 Patients / week
 *   C  Email           M  Fbclid             W  Q10 Existing certs
 *   D  Phone Number    N  Q1 Therapist tenure X  Q11 Money spent (alt)
 *   E  Lead Category   O  Q2 Skill interest   Y  Ad Preview Link
 *   F  Sales notes     P  Q3 Why MMT          Z  Creative Preview Link
 *   G  Sale Revenue    Q  Q4 Money spent      AA Ad Thumbnail (=IMAGE)
 *   H  Source          R  Q5 Cert path
 *   I  Campaign        S  Q6 Scholarship help
 *   J  Ad set          T  Q7 30-day start
 *
 * Q4 (col Q) and Q11 (col X) have identical header text ("How much money have
 * you already spent trying to improve your skills?"). Both use raw column
 * letters in FORM_QUESTIONS to disambiguate.
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
    salesNotes:   'Sales team notes',    // F
    saleRevenue:  'Sale Revenue',        // G
    source:       'Source',              // H
    campaign:     'Campaign',            // I
    adSet:        'Ad set',              // J
    ad:           'Ad',                  // K
    pageVariant:  'Page Variant',        // L
    fbclid:       'Fbclid',              // M

    // ---- Creative-preview columns (used by the "Top Creatives" tab) ----
    // Column Y holds the clickable Facebook ad-preview URL.
    // Column Z holds the Creative Preview Link — a direct image URL used
    // as the thumbnail. For VIDEO creatives that URL isn't an <img>-able
    // file, so we fall back to the =IMAGE rendering in column AA.
    adPreviewUrl:        'Y',            // Y  — Ad Preview Link
    adThumbnailUrl:      'Z',            // Z  — Creative Preview Link (direct image URL)
    adThumbnailFallback: 'AA'            // AA — Ad Thumbnail (=IMAGE — used for video creatives)
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs.
  // ---------------------------------------------------------------------------

  BRAND: {
    title:    'PX Insights',
    subtitle: 'MMT — Funnel Quality & Ad Performance',
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
// FORM_QUESTIONS — MMT applicant intake, 11 questions in columns N → X.
//
// Q4 (col Q) and Q11 (col X) share the same header text — both use raw column
// letters so resolveColumn picks the right column directly.
// =============================================================================

const FORM_QUESTIONS = [
  { header: 'How long have you been a therapist',                                      label: 'Therapist Tenure',          type: 'choice', topN:  8 },
  { header: 'actively looking to enhance your skills',                                  label: 'Skill Enhancement',         type: 'choice', topN:  6 },
  { header: 'Why do you want to learn bodywork',                                        label: 'Why MMT',                   type: 'text',   topN: 25 },
  { header: 'Q',                                                                        label: 'Money Spent on Skills',     type: 'choice', topN:  8 },
  { header: 'How would you like to get your MMT Certification',                         label: 'Certification Path',        type: 'choice', topN:  8 },
  { header: '$1,000 scholarship',                                                       label: 'Scholarship Impact',        type: 'text',   topN: 25 },
  { header: 'ability to join the program in the next 30 days',                         label: '30-Day Start Readiness',    type: 'choice', topN:  6 },
  { header: 'Cash Collected',                                                           label: 'Cash Collected',            type: 'choice', topN: 10 },
  { header: 'How many patients are you currently seeing per week',                     label: 'Patients Per Week',         type: 'choice', topN:  8 },
  { header: 'currently have any qualification and certifications',                     label: 'Existing Certifications',   type: 'choice', topN:  8 },
  { header: 'X',                                                                        label: 'Money Spent on Skills (alt)', type: 'choice', topN:  8 }
];
