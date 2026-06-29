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
 * MAIZE RESTORATION AND REMODELING — column layout. Extra CRM column at F
 * (Booked Call Time) plus the creative columns M-O sit BEFORE Page Variant
 * and Fbclid, with Funnel Type at R:
 *
 *   A  Date                       J  Campaign ID            S  Q1 Project type
 *   B  Name                       K  Ad set ID              T  Q2 Project type (other)
 *   C  Email                      L  Ad ID                  U  Q3 Current space
 *   D  Phone Number               M  Preview Link           V  Q4 Current space (other)
 *   E  Lead Category              N  Creative Preview Link  W  Q5 Property location
 *   F  Booked Call Time (-)       O  Ad Thumbnail (=IMAGE)  X  Q6 Investment level
 *   G  Sales team notes           P  Page Variant           Y  Q7 Start timing
 *   H  Sale Revenue               Q  Fbclid                 Z  Q8 Planning started?
 *   I  Source                     R  Funnel Type (-)        AA Q9 About the project
 *
 * Columns marked (-) are CRM trackers the dashboard ignores.
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
    subtitle: 'Maize Restoration and Remodeling — Funnel Quality & Ad Performance',
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
// FORM_QUESTIONS — Maize Restoration intake, 9 questions in cols S → AA.
//
// Two pairs have an "(Other)" free-text companion right next to them:
//   S "type of project" / T "type of project (Other)"
//   U "current space"   / V "current space (other)"
// Distinct header substrings keep them charted independently.
// =============================================================================

const FORM_QUESTIONS = [
  { header: 'type of project are you interested in?',                  label: 'Project Type',          type: 'choice', topN: 10 },
  { header: 'type of project are you interested in?  (Other)',         label: 'Project Type — Other',  type: 'text',   topN: 20 },
  { header: 'about your current space',                                label: 'Current Space',         type: 'choice', topN: 10 },
  { header: 'about your current space (other)',                        label: 'Current Space — Other', type: 'text',   topN: 20 },
  { header: 'Where is the property located',                           label: 'Property Location',     type: 'choice', topN: 12 },
  { header: 'level of investment',                                     label: 'Investment Level',      type: 'choice', topN:  8 },
  { header: 'When Are You Looking To Start',                           label: 'Start Timing',          type: 'choice', topN:  8 },
  { header: 'Have you started planning',                               label: 'Planning Started?',     type: 'choice', topN:  6 },
  { header: 'about your project and what you',                         label: 'About the Project',     type: 'text',   topN: 30 }
];
