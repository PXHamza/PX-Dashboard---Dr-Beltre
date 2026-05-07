/**
 * Config.gs
 * ----------------------------------------------------------------------------
 * Central configuration for the PX Insights dashboard.
 *
 * Anything that would reasonably change over time lives here:
 *   - Brand colors / fonts (matches Persuasion Experience site styling)
 *   - Default logo URL and click-through link (the user can override these
 *     from the "⚙️ Settings" sheet without touching code)
 *   - Tab names, source-data column layout (A–S)
 *   - Alert thresholds, weighted-quality-score weights, lead-aging window
 *
 * IMPORTANT: When you change a value here that lives in Settings (logo URL,
 * link URL, thresholds), the Settings sheet wins at runtime. CONFIG provides
 * the *defaults* used the first time the dashboard is built.
 * ----------------------------------------------------------------------------
 */

const CONFIG = {
  // -------------------------------------------------------------------------
  // Source data layout — columns A through S of the leads sheet.
  // Index is 1-based (A = 1) so it lines up with getRange() calls.
  // -------------------------------------------------------------------------
  DATA_SHEET_NAME: 'Lead Data',      // The tab that holds raw lead rows.
  DATA_HEADER_ROW: 1,                // Row that contains the column headers.
  DATA_FIRST_ROW: 2,                 // First row of actual data.

  COLS: {
    DATE: 1,            // A — Date (timestamp)
    NAME: 2,            // B — Name
    EMAIL: 3,           // C — Email
    PHONE: 4,           // D — Phone Number
    LEAD_CATEGORY: 5,   // E — Qualified / Unqualified / Junk / etc.
    SALES_NOTES: 6,     // F — Sales Team Notes (free text)
    SALE_REVENUE: 7,    // G — Sale Revenue (number, blank/0 = not closed)
    SOURCE: 8,          // H — Traffic source (Facebook, Google, etc.)
    CAMPAIGN: 9,        // I — Campaign name
    AD_SET: 10,         // J — Ad Set name
    AD: 11,             // K — Ad name
    PAGE_VARIANT: 12,   // L — Landing-page variant (A/B test bucket)
    FBCLID: 13,         // M — Facebook click ID (used for CAPI / pixel health)

    // Form-question columns (N–S). Defined once here, then consumed by
    // FormQuestions.gs so a non-engineer can add Q7, Q8, Q9 without touching
    // any of the dashboard tabs.
    FORM_FIRST: 14,     // N
    FORM_LAST: 19       // S
  },

  // -------------------------------------------------------------------------
  // Brand — Persuasion Experience.
  // Pulled from the hero screenshot: dark navy bg, hot-pink accent.
  // -------------------------------------------------------------------------
  BRAND: {
    BG_DEEP:        '#0A0E27',  // Page background.
    BG_CARD:        '#13162E',  // Card / panel background.
    BG_CARD_ALT:    '#1A1E3A',  // Alternating card row.
    ACCENT:         '#FF2BD6',  // Pink CTA / highlights.
    ACCENT_SOFT:    '#7A1A66',  // Muted pink for subtle fills.
    TEXT_PRIMARY:   '#FFFFFF',  // Main copy.
    TEXT_SECONDARY: '#C7C9D9',  // Body / secondary copy.
    TEXT_MUTED:     '#7A7E96',  // Captions, axis labels.
    POSITIVE:       '#3DDC97',  // ▲ delta / good.
    NEGATIVE:       '#FF5C7A',  // ▼ delta / bad.
    GRID:           '#2A2E4A',  // Chart gridlines, table borders.
    FONT:           'Montserrat'
  },

  // -------------------------------------------------------------------------
  // Dashboard tab names. Centralised so we never have a typo mismatch.
  // -------------------------------------------------------------------------
  TABS: {
    OVERVIEW:    '📊 Overview',
    CAMPAIGNS:   '🎯 Campaigns',
    QUALITY:     '⭐ Lead Quality',
    DUPES:       '🔁 Duplicates',
    AB:          '🧪 A/B Testing',
    SOURCES:     '🌐 Sources',
    FORMS:       '📝 Form Insights',
    TIME:        '⏱ Time Trends',
    ALERTS:      '🚨 Alerts',
    SETTINGS:    '⚙️ Settings'
  },

  // -------------------------------------------------------------------------
  // Defaults that the user can override from the Settings sheet.
  // -------------------------------------------------------------------------
  DEFAULTS: {
    LOGO_URL:   'https://via.placeholder.com/300x80/0A0E27/FF2BD6?text=YOUR+LOGO',
    LINK_URL:   'https://persuasionexperience.com',
    LINK_LABEL: 'APPLY FOR YOUR FREE STRATEGY SESSION',

    DATE_RANGE: 'Last 30',     // Today | Yesterday | Last 7 | Last 30 | MTD | Last Month | Custom
    CUSTOM_FROM: '',           // Used only when DATE_RANGE = Custom (yyyy-mm-dd).
    CUSTOM_TO:   '',

    // Global filters — empty string = no filter, otherwise exact match.
    FILTER_SOURCE: '',
    FILTER_CAMPAIGN: '',
    FILTER_LEAD_CATEGORY: '',
    FILTER_PAGE_VARIANT: '',

    // Alert thresholds.
    LEAD_AGING_DAYS: 3,            // Lead with no notes after N days → flagged.
    QUALIFIED_PCT_FLOOR: 30,       // Campaign flagged if Qualified% < this.
    REV_PER_LEAD_FLOOR: 50,        // Campaign flagged if Rev/Lead < this.
    DAILY_EMAIL_RECIPIENTS: '',    // Comma-separated emails for daily summary.

    // Weighted quality score — points per lead category. Positive = good lead.
    QS_WEIGHT_QUALIFIED:   1.0,
    QS_WEIGHT_UNQUALIFIED: 0.2,
    QS_WEIGHT_JUNK:       -0.5
  },

  // -------------------------------------------------------------------------
  // Lead categories. We use loose matching (case-insensitive, contains)
  // so the rows don't all have to be perfectly normalized.
  // -------------------------------------------------------------------------
  CATEGORIES: {
    QUALIFIED:   ['qualified', 'qual'],
    UNQUALIFIED: ['unqualified', 'unqual'],
    JUNK:        ['junk', 'spam', 'fake']
  }
};

/**
 * Read a Settings value, falling back to the CONFIG.DEFAULTS entry.
 * The Settings sheet is built by SheetSettings.gs as a 2-column key/value
 * table; this is the single accessor everywhere else uses.
 */
function getSetting(key) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.TABS.SETTINGS);
  if (!sheet) return CONFIG.DEFAULTS[key];

  // Find the row whose column A matches the key.
  const last = sheet.getLastRow();
  if (last < 2) return CONFIG.DEFAULTS[key];
  const values = sheet.getRange(2, 1, last - 1, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === key) {
      const v = values[i][1];
      return (v === '' || v === null || v === undefined) ? CONFIG.DEFAULTS[key] : v;
    }
  }
  return CONFIG.DEFAULTS[key];
}
