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
 * PX OF FUNNEL — column layout. Extra CRM columns at E (Website URL?),
 * G (Owner) and H (Meeting Time) push the standard fields further right;
 * Funnel Type at T is also a CRM-only field. Standard fields land at:
 *
 *   A  Date                       K  Source                  U  Q1 Monthly revenue
 *   B  Name                       L  Campaign                V  Q2 12-month goal
 *   C  Email                      M  Ad set                  W  Q3 Biggest blocker
 *   D  Phone Number               N  Ad                      X  Q4 Anything else
 *   E  Website URL? (-)           O  Preview Link            Y  Q5 Willing to invest?
 *   F  Lead Category              P  Creative Preview Link   Z  Q6 Show-up agreement
 *   G  Owner (-)                  Q  Ad Thumbnail (=IMAGE)
 *   H  Meeting Time (-)           R  Page Variant
 *   I  Sales team notes           S  Fbclid
 *   J  Sale Revenue               T  Funnel Type (-)
 *
 * Columns marked (-) are CRM trackers the dashboard doesn't visualise.
 * ----------------------------------------------------------------------------
 */

const CONFIG = {

  DATA_SHEET: 'Lead Data',

  COLUMNS: {
    date:         'Date',                // A
    name:         'Name',                // B
    email:        'Email',               // C
    phone:        'Phone Number',        // D
    leadCategory: 'Lead Category',       // F  (Website URL? at E — unused)
    salesNotes:   'Sales team notes',    // I  (Owner at G, Meeting Time at H — unused)
    saleRevenue:  'Sale Revenue',        // J
    source:       'Source',              // K
    campaign:     'Campaign',            // L
    adSet:        'Ad set',              // M
    ad:           'Ad',                  // N
    pageVariant:  'Page Variant',        // R
    fbclid:       'Fbclid',              // S

    // ---- Creative-preview columns (used by the "Top Creatives" tab) ----
    // Column O holds the clickable Facebook ad-preview URL.
    // Column P holds the Creative Preview Link — a direct image URL used
    // as the thumbnail. For VIDEO creatives that URL isn't an <img>-able
    // file, so we fall back to the =IMAGE rendering in column Q.
    adPreviewUrl:        'O',            // O — Preview Link
    adThumbnailUrl:      'P',            // P — Creative Preview Link (direct image URL)
    adThumbnailFallback: 'Q'             // Q — Ad Thumbnail (=IMAGE — used for video creatives)
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs.
  // ---------------------------------------------------------------------------

  BRAND: {
    title:    'PX Insights',
    subtitle: 'PX OF Funnel — Funnel Quality & Ad Performance',
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
// FORM_QUESTIONS — PX OF Funnel intake, 6 questions in cols U → Z.
//
// Each header lookup uses a distinctive substring so nothing collides.
// Q6 (col Z) uses 'ship an old woman' — the funnel's memorable show-up
// commitment question.
// =============================================================================

const FORM_QUESTIONS = [
  { header: 'current monthly revenue',                                                 label: 'Monthly Revenue',       type: 'choice', topN: 10 },
  { header: '12 months from now in your business',                                     label: '12-Month Goal',         type: 'text',   topN: 30 },
  { header: 'biggest blocker',                                                          label: 'Biggest Blocker',       type: 'text',   topN: 25 },
  { header: 'important for me to understand about you or your agency',                  label: 'Anything Else',         type: 'text',   topN: 30 },
  { header: 'willing to invest in the program',                                         label: 'Willing to Invest?',    type: 'choice', topN:  6 },
  { header: 'ship an old woman',                                                        label: 'Show-Up Agreement',     type: 'choice', topN:  4 }
];
