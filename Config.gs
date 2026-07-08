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
 * ATTIC CONSTRUCTION — column layout. Attic's sheet has no form questions
 * but does carry several extra CRM-tracking columns (Location, Funnel Type,
 * Score, Category, verified/confirmed, Booking Requested) which the
 * dashboard doesn't visualise directly. The standard fields are interleaved
 * with these extras:
 *
 *   A  Date                       J  Source                   R  Verified / Confirmed (-)
 *   B  Name                       K  Campaign                 S  Booking Requested (-)
 *   C  Email                      L  Ad set                   T  Ad Preview Link
 *   D  Phone Number               M  Ad                       U  Creative Preview Link
 *   E  Lead Category              N  Page Variant             V  Ad Thumbnail (=IMAGE)
 *   F  Location (-)               O  Fbclid
 *   G  Funnel Type (-)            P  Score (-)
 *   H  Sales team notes           Q  Category (-)
 *   I  Sale Revenue
 *
 * Columns marked (-) are CRM-side trackers the dashboard ignores. R counts
 * bookings confirmed and S counts call bookings — both are derived metrics
 * the sales team uses, not fields the dashboard visualises.
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
    salesNotes:   'Sales team notes',    // H  (Location at F, Funnel Type at G — unused)
    saleRevenue:  'Sale Revenue',        // I
    source:       'Source',              // J
    campaign:     'Campaign',            // K
    adSet:        'Ad set',              // L
    ad:           'Ad',                  // M
    pageVariant:  'Page Variant',        // N
    fbclid:       'Fbclid',              // O

    // ---- Creative-preview columns (used by the "Top Creatives" tab) ----
    // Column T holds the clickable Facebook ad-preview URL.
    // Column U holds the Creative Preview Link — a direct image URL used
    // as the thumbnail. For VIDEO creatives that URL isn't an <img>-able
    // file, so we fall back to the =IMAGE rendering in column V.
    adPreviewUrl:        'T',            // T — Ad Preview Link
    adThumbnailUrl:      'U',            // U — Creative Preview Link (direct image URL)
    adThumbnailFallback: 'V'             // V — Ad Thumbnail (=IMAGE — used for video creatives)
  },

  // ---------------------------------------------------------------------------
  // Lead-qualification rule lives in Qualification.gs.
  // ---------------------------------------------------------------------------

  BRAND: {
    title:    'PX Insights',
    subtitle: 'Attic Construction — Funnel Quality & Ad Performance',
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
// FORM_QUESTIONS — Attic Construction's intake has no open-ended form
// questions to chart, so this list is empty. The Form Insights tab will
// render its own "No form questions configured" empty state.
//
// If Attic adds form questions later, append entries here in the standard
// shape — see other client branches for examples.
// =============================================================================

const FORM_QUESTIONS = [];
