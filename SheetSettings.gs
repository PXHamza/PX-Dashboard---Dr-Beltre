/**
 * SheetSettings.gs
 * ----------------------------------------------------------------------------
 * Builds the "⚙️ Settings" tab — a 2-column key/value table that the user
 * edits directly. Everything else in the dashboard reads from here via
 * getSetting().
 *
 * Behaviour:
 *   - First build seeds the sheet with CONFIG.DEFAULTS.
 *   - Subsequent rebuilds preserve any value the user has already entered.
 *   - The Date Range / Filter cells use data-validation dropdowns where
 *     it makes sense, so users can't typo their way into broken filters.
 * ----------------------------------------------------------------------------
 */

function buildSettingsSheet() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(CONFIG.TABS.SETTINGS);
  const existing = {};

  // Preserve user-set values across rebuilds.
  if (sheet) {
    const last = sheet.getLastRow();
    if (last >= 2) {
      const kv = sheet.getRange(2, 1, last - 1, 2).getValues();
      for (const row of kv) if (row[0]) existing[row[0]] = row[1];
    }
  } else {
    sheet = ss.insertSheet(CONFIG.TABS.SETTINGS);
  }
  resetSheet(sheet);
  const startRow = drawHeader(sheet, 'Settings');

  // Section: branding ---------------------------------------------------------
  let row = drawSectionHeader(sheet, startRow, 'Branding');
  row = writeKv(sheet, row, [
    ['LOGO_URL',   pick(existing, 'LOGO_URL'),   'Public image URL (PNG/JPG). Shows top-left of every tab.'],
    ['LINK_URL',   pick(existing, 'LINK_URL'),   'CTA URL — clicking the pink button on each tab opens this.'],
    ['LINK_LABEL', pick(existing, 'LINK_LABEL'), 'Button label text.']
  ]);

  // Section: date range -------------------------------------------------------
  row = drawSectionHeader(sheet, row + 1, 'Date Range');
  row = writeKv(sheet, row, [
    ['DATE_RANGE',  pick(existing, 'DATE_RANGE'),  'Today | Yesterday | Last 7 | Last 30 | MTD | Last Month | Custom'],
    ['CUSTOM_FROM', pick(existing, 'CUSTOM_FROM'), 'Only used when DATE_RANGE = Custom (yyyy-mm-dd).'],
    ['CUSTOM_TO',   pick(existing, 'CUSTOM_TO'),   'Only used when DATE_RANGE = Custom (yyyy-mm-dd).']
  ]);
  // Dropdown for DATE_RANGE.
  const dateOpts = ['Today','Yesterday','Last 7','Last 30','MTD','Last Month','Custom'];
  applyDropdown(sheet, 'DATE_RANGE', dateOpts);

  // Section: global filters ---------------------------------------------------
  row = drawSectionHeader(sheet, row + 1, 'Global Filters');
  row = writeKv(sheet, row, [
    ['FILTER_SOURCE',        pick(existing, 'FILTER_SOURCE'),        'Exact source value, or blank for all.'],
    ['FILTER_CAMPAIGN',      pick(existing, 'FILTER_CAMPAIGN'),      'Exact campaign name, or blank for all.'],
    ['FILTER_LEAD_CATEGORY', pick(existing, 'FILTER_LEAD_CATEGORY'), 'Qualified | Unqualified | Junk | Other'],
    ['FILTER_PAGE_VARIANT',  pick(existing, 'FILTER_PAGE_VARIANT'),  'Exact page variant, or blank for all.']
  ]);
  applyDropdown(sheet, 'FILTER_LEAD_CATEGORY', ['', 'Qualified', 'Unqualified', 'Junk', 'Other']);
  // Source / Campaign / Variant dropdowns are populated dynamically from data.
  populateFilterDropdownFromData(sheet, 'FILTER_SOURCE',       function (r) { return r.source; });
  populateFilterDropdownFromData(sheet, 'FILTER_CAMPAIGN',     function (r) { return r.campaign; });
  populateFilterDropdownFromData(sheet, 'FILTER_PAGE_VARIANT', function (r) { return r.pageVariant; });

  // Section: thresholds & alerts ---------------------------------------------
  row = drawSectionHeader(sheet, row + 1, 'Thresholds & Alerts');
  row = writeKv(sheet, row, [
    ['LEAD_AGING_DAYS',        pick(existing, 'LEAD_AGING_DAYS'),        'Flag leads with no sales notes after this many days.'],
    ['QUALIFIED_PCT_FLOOR',    pick(existing, 'QUALIFIED_PCT_FLOOR'),    'Campaigns flagged when Qualified % falls below this.'],
    ['REV_PER_LEAD_FLOOR',     pick(existing, 'REV_PER_LEAD_FLOOR'),     'Campaigns flagged when Rev/Lead falls below this.'],
    ['DAILY_EMAIL_RECIPIENTS', pick(existing, 'DAILY_EMAIL_RECIPIENTS'), 'Comma-separated recipients for the daily summary email.']
  ]);

  // Section: weighted quality score ------------------------------------------
  row = drawSectionHeader(sheet, row + 1, 'Weighted Quality Score');
  row = writeKv(sheet, row, [
    ['QS_WEIGHT_QUALIFIED',   pick(existing, 'QS_WEIGHT_QUALIFIED'),   'Points awarded per Qualified lead (default 1.0).'],
    ['QS_WEIGHT_UNQUALIFIED', pick(existing, 'QS_WEIGHT_UNQUALIFIED'), 'Points per Unqualified lead (default 0.2).'],
    ['QS_WEIGHT_JUNK',        pick(existing, 'QS_WEIGHT_JUNK'),        'Points per Junk lead — usually negative (default -0.5).']
  ]);

  // Final sizing.
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 240);
  sheet.setColumnWidth(3, 320);
  sheet.setColumnWidth(4, 480);
  sheet.setFrozenRows(7);
}

// --- helpers ----------------------------------------------------------------

function pick(existing, key) {
  if (Object.prototype.hasOwnProperty.call(existing, key) && existing[key] !== '' && existing[key] !== null) {
    return existing[key];
  }
  return CONFIG.DEFAULTS[key] == null ? '' : CONFIG.DEFAULTS[key];
}

function writeKv(sheet, startRow, kvDescriptions) {
  // Header row for the table.
  sheet.getRange(startRow, 1, 1, 4)
    .setValues([['Key','Value','Description','']])
    .setBackground(CONFIG.BRAND.ACCENT)
    .setFontColor(CONFIG.BRAND.TEXT_PRIMARY)
    .setFontFamily(CONFIG.BRAND.FONT)
    .setFontWeight('bold');
  sheet.setRowHeight(startRow, 26);

  for (let i = 0; i < kvDescriptions.length; i++) {
    const r = startRow + 1 + i;
    const [k, v, d] = kvDescriptions[i];
    sheet.getRange(r, 1).setValue(k)
      .setFontFamily('Roboto Mono').setFontWeight('bold')
      .setFontColor(CONFIG.BRAND.ACCENT)
      .setBackground(CONFIG.BRAND.BG_CARD);
    sheet.getRange(r, 2).setValue(v)
      .setFontFamily(CONFIG.BRAND.FONT).setFontColor(CONFIG.BRAND.TEXT_PRIMARY)
      .setBackground(CONFIG.BRAND.BG_CARD_ALT);
    sheet.getRange(r, 3).setValue(d)
      .setFontFamily(CONFIG.BRAND.FONT).setFontColor(CONFIG.BRAND.TEXT_MUTED)
      .setBackground(CONFIG.BRAND.BG_CARD).setWrap(true);
    sheet.getRange(r, 4).setBackground(CONFIG.BRAND.BG_DEEP);
    sheet.setRowHeight(r, 28);
  }
  return startRow + kvDescriptions.length + 1;
}

function applyDropdown(sheet, key, options) {
  const cell = findKeyCell(sheet, key);
  if (!cell) return;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(options, true).setAllowInvalid(false).build();
  cell.setDataValidation(rule);
}

function findKeyCell(sheet, key) {
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const keys = sheet.getRange(1, 1, last, 1).getValues();
  for (let i = 0; i < keys.length; i++) {
    if (keys[i][0] === key) return sheet.getRange(i + 1, 2);
  }
  return null;
}

function populateFilterDropdownFromData(sheet, key, accessor) {
  try {
    const rows = loadAllLeads();
    const values = distinctNonEmpty(rows.map(accessor));
    if (!values.length) return;
    applyDropdown(sheet, key, [''].concat(values));
  } catch (e) {
    // Source sheet may not exist yet on first install — fine.
  }
}
