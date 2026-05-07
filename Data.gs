/**
 * Data.gs
 * ----------------------------------------------------------------------------
 * Reads raw lead rows from the source sheet, normalises them into
 * plain JS objects, and applies the active filters from Settings.
 *
 * Every dashboard tab calls getFilteredLeads() — they never touch the raw
 * sheet directly. That keeps filter logic in exactly one place.
 * ----------------------------------------------------------------------------
 */

/**
 * Load all leads from the source sheet, return an array of objects keyed
 * by the human field names (date, name, email, ..., q14, q15, ...).
 *
 * Form-question values are exposed as q<col> (e.g. q14, q15) so we can
 * iterate FORM_QUESTIONS without re-hardcoding column letters.
 */
function loadAllLeads() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.DATA_SHEET_NAME);
  if (!sheet) {
    throw new Error('Source sheet "' + CONFIG.DATA_SHEET_NAME + '" not found. Rename your raw-data tab to that, or update CONFIG.DATA_SHEET_NAME.');
  }
  const last = sheet.getLastRow();
  if (last < CONFIG.DATA_FIRST_ROW) return [];

  // Always read columns A → S (19 cols) regardless of how many extra cols
  // the user has appended; FormQuestions can request specific cols >= 14.
  const numCols = Math.max(19, sheet.getLastColumn());
  const values = sheet.getRange(CONFIG.DATA_FIRST_ROW, 1, last - 1, numCols).getValues();

  const rows = [];
  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    if (!r[CONFIG.COLS.DATE - 1] && !r[CONFIG.COLS.EMAIL - 1] && !r[CONFIG.COLS.NAME - 1]) {
      continue; // skip blank rows
    }
    const obj = {
      _row:        i + CONFIG.DATA_FIRST_ROW,
      date:        toDate(r[CONFIG.COLS.DATE - 1]),
      name:        s(r[CONFIG.COLS.NAME - 1]),
      email:       s(r[CONFIG.COLS.EMAIL - 1]).toLowerCase(),
      phone:       s(r[CONFIG.COLS.PHONE - 1]),
      category:    classifyCategory(r[CONFIG.COLS.LEAD_CATEGORY - 1]),
      categoryRaw: s(r[CONFIG.COLS.LEAD_CATEGORY - 1]),
      notes:       s(r[CONFIG.COLS.SALES_NOTES - 1]),
      revenue:     num(r[CONFIG.COLS.SALE_REVENUE - 1]),
      source:      s(r[CONFIG.COLS.SOURCE - 1]),
      campaign:    s(r[CONFIG.COLS.CAMPAIGN - 1]),
      adSet:       s(r[CONFIG.COLS.AD_SET - 1]),
      ad:          s(r[CONFIG.COLS.AD - 1]),
      pageVariant: s(r[CONFIG.COLS.PAGE_VARIANT - 1]),
      fbclid:      s(r[CONFIG.COLS.FBCLID - 1])
    };
    // Form questions: expose every column from N onwards as q<col>.
    for (let c = CONFIG.COLS.FORM_FIRST; c <= numCols; c++) {
      obj['q' + c] = s(r[c - 1]);
    }
    rows.push(obj);
  }
  return rows;
}

/**
 * Returns { rows, prior, range, allRowsForDupes }.
 *
 *   rows             — leads that match the active date range AND filters.
 *   prior            — leads in the prior equivalent date range (for ▲/▼ deltas).
 *   range            — { from, to, priorFrom, priorTo, label } from resolveDateRange.
 *   allRowsForDupes  — full unfiltered set, needed so we can flag duplicates
 *                      that span outside the current window.
 *
 * Duplicates are computed across the full dataset, not just the window —
 * a lead that submitted last month and again today is still a dupe.
 */
function getFilteredLeads() {
  const all = loadAllLeads();

  // 1. Mark duplicates on the WHOLE dataset (by email, falling back to phone).
  const seen = {};
  for (const r of all) {
    const key = r.email || r.phone || '';
    if (!key) { r.isDuplicate = false; continue; }
    if (seen[key]) { r.isDuplicate = true; }
    else            { seen[key] = true; r.isDuplicate = false; }
  }

  // 2. Resolve the requested date range.
  const range = resolveDateRange(
    getSetting('DATE_RANGE'),
    getSetting('CUSTOM_FROM'),
    getSetting('CUSTOM_TO')
  );

  // 3. Apply global filters (Source / Campaign / Lead Category / Page Variant).
  const filterSource   = (getSetting('FILTER_SOURCE')        || '').toString().trim().toLowerCase();
  const filterCampaign = (getSetting('FILTER_CAMPAIGN')      || '').toString().trim().toLowerCase();
  const filterCategory = (getSetting('FILTER_LEAD_CATEGORY') || '').toString().trim().toLowerCase();
  const filterVariant  = (getSetting('FILTER_PAGE_VARIANT')  || '').toString().trim().toLowerCase();

  function matchesFilters(r) {
    if (filterSource   && r.source.toLowerCase()      !== filterSource)   return false;
    if (filterCampaign && r.campaign.toLowerCase()    !== filterCampaign) return false;
    if (filterCategory && r.category.toLowerCase()    !== filterCategory) return false;
    if (filterVariant  && r.pageVariant.toLowerCase() !== filterVariant)  return false;
    return true;
  }

  const inWindow = function (d, from, to) { return d && d >= from && d <= to; };

  const rows  = all.filter(function (r) { return inWindow(r.date, range.from, range.to)             && matchesFilters(r); });
  const prior = all.filter(function (r) { return inWindow(r.date, range.priorFrom, range.priorTo)   && matchesFilters(r); });

  return { rows: rows, prior: prior, range: range, allRowsForDupes: all };
}

// --- tiny coercion helpers ---------------------------------------------------

function s(v)   { return v == null ? '' : v.toString().trim(); }
function num(v) { if (v === '' || v == null) return 0; const n = Number(v); return isNaN(n) ? 0 : n; }
function toDate(v) {
  if (v instanceof Date) return v;
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
