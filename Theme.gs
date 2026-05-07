/**
 * Theme.gs
 * ----------------------------------------------------------------------------
 * Reusable styling primitives that give every tab the PX brand look:
 *   - dark navy background
 *   - hot-pink accents
 *   - Montserrat font everywhere
 *   - consistent KPI cards, section headers, tables
 *
 * Centralising this means a brand refresh = edit CONFIG.BRAND, refresh.
 * ----------------------------------------------------------------------------
 */

/** Wipe + prep a sheet so we can re-draw it from scratch. */
function resetSheet(sheet) {
  sheet.clear();
  sheet.clearConditionalFormatRules();
  // Remove every existing chart so refresh doesn't pile them up.
  const charts = sheet.getCharts();
  for (const c of charts) sheet.removeChart(c);
  sheet.setHiddenGridlines(true);
  sheet.setTabColor(CONFIG.BRAND.ACCENT);

  // Paint a generous canvas so the dark bg fills the visible area
  // even before any content is written.
  sheet.getRange(1, 1, 200, 30)
    .setBackground(CONFIG.BRAND.BG_DEEP)
    .setFontFamily(CONFIG.BRAND.FONT)
    .setFontColor(CONFIG.BRAND.TEXT_SECONDARY);
}

/**
 * Draw the page header: logo image (from Settings), big page title,
 * the configurable CTA link, and the live data-refresh timestamp.
 *
 * Returns the row number AFTER the header so callers know where to start
 * laying out content.
 */
function drawHeader(sheet, pageTitle) {
  const logoUrl  = getSetting('LOGO_URL');
  const linkUrl  = getSetting('LINK_URL');
  const linkText = getSetting('LINK_LABEL') || 'APPLY FOR YOUR FREE STRATEGY SESSION';

  // Sizes so the header reads as a proper hero strip.
  sheet.setColumnWidths(1, 12, 110);
  sheet.setRowHeights(1, 6, 28);
  sheet.setRowHeight(2, 70); // logo row
  sheet.setRowHeight(4, 44); // title row

  // Logo — IMAGE() pulled into A2 so users can swap it from Settings.
  // We use a formula (not insertImage) so the image is reactive to URL changes.
  const logoRange = sheet.getRange(2, 1, 1, 3).merge();
  if (logoUrl) {
    logoRange.setFormula('=IMAGE("' + logoUrl.toString().replace(/"/g, '""') + '", 4, 60, 240)');
  }
  logoRange.setBackground(CONFIG.BRAND.BG_DEEP);

  // CTA link, right-aligned.
  const ctaRange = sheet.getRange(2, 9, 1, 4).merge()
    .setFormula('=HYPERLINK("' + linkUrl + '","' + linkText + '")')
    .setFontFamily(CONFIG.BRAND.FONT)
    .setFontWeight('bold').setFontSize(11)
    .setFontColor(CONFIG.BRAND.TEXT_PRIMARY)
    .setBackground(CONFIG.BRAND.ACCENT)
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, CONFIG.BRAND.ACCENT, SpreadsheetApp.BorderStyle.SOLID_THICK);

  // Page title row 4 (e.g., "OVERVIEW").
  sheet.getRange(4, 1, 1, 12).merge()
    .setValue(pageTitle.toUpperCase())
    .setFontFamily(CONFIG.BRAND.FONT)
    .setFontWeight('bold').setFontSize(28)
    .setFontColor(CONFIG.BRAND.TEXT_PRIMARY)
    .setBackground(CONFIG.BRAND.BG_DEEP)
    .setVerticalAlignment('middle');

  // Pink underline.
  sheet.getRange(5, 1, 1, 12)
    .setBackground(CONFIG.BRAND.ACCENT)
    .setFontSize(1);
  sheet.setRowHeight(5, 4);

  // Refresh timestamp + active filters — right under the underline.
  const tz = Session.getScriptTimeZone();
  const ts = Utilities.formatDate(new Date(), tz, 'MMM d, yyyy h:mm a');
  const range = resolveDateRange(getSetting('DATE_RANGE'), getSetting('CUSTOM_FROM'), getSetting('CUSTOM_TO'));
  const fromTo = Utilities.formatDate(range.from, tz, 'MMM d') + ' → ' + Utilities.formatDate(range.to, tz, 'MMM d, yyyy');

  sheet.getRange(6, 1, 1, 12).merge()
    .setValue('  Date range: ' + range.label + '  (' + fromTo + ')   •   Last refreshed: ' + ts)
    .setFontFamily(CONFIG.BRAND.FONT)
    .setFontColor(CONFIG.BRAND.TEXT_MUTED)
    .setFontSize(10)
    .setBackground(CONFIG.BRAND.BG_DEEP)
    .setVerticalAlignment('middle');

  return 8; // first usable content row.
}

/** Section heading bar — pink left rule + uppercase text. */
function drawSectionHeader(sheet, row, title) {
  sheet.setRowHeight(row, 32);
  // Pink left rule.
  sheet.getRange(row, 1, 1, 1).setBackground(CONFIG.BRAND.ACCENT);
  // Title.
  sheet.getRange(row, 2, 1, 11).merge()
    .setValue(title.toUpperCase())
    .setFontFamily(CONFIG.BRAND.FONT)
    .setFontWeight('bold').setFontSize(14)
    .setFontColor(CONFIG.BRAND.TEXT_PRIMARY)
    .setBackground(CONFIG.BRAND.BG_DEEP)
    .setVerticalAlignment('middle');
  return row + 2;
}

/**
 * Draw a KPI card occupying 2 columns × 4 rows starting at (row, col).
 *
 *   label    — small caption ('TOTAL LEADS')
 *   value    — big number ('1,284')
 *   delta    — optional { text, color } from Utils.delta()
 */
function drawKpiCard(sheet, row, col, label, value, deltaObj) {
  const rng = sheet.getRange(row, col, 4, 2);
  rng.merge()
     .setBackground(CONFIG.BRAND.BG_CARD)
     .setBorder(true, true, true, true, false, false, CONFIG.BRAND.GRID, SpreadsheetApp.BorderStyle.SOLID);

  // We can only set one value on a merged range, so we build a rich-text
  // string that stacks: label / value / delta.
  const labelStr = label.toUpperCase();
  const valueStr = value;
  const deltaStr = deltaObj ? deltaObj.text : '';
  const text     = labelStr + '\n' + valueStr + (deltaStr ? '\n' + deltaStr : '');

  const builder = SpreadsheetApp.newRichTextValue().setText(text);
  builder.setTextStyle(0, labelStr.length,
    SpreadsheetApp.newTextStyle()
      .setForegroundColor(CONFIG.BRAND.TEXT_MUTED)
      .setFontFamily(CONFIG.BRAND.FONT)
      .setFontSize(10).setBold(true).build());
  const valStart = labelStr.length + 1;
  const valEnd = valStart + valueStr.toString().length;
  builder.setTextStyle(valStart, valEnd,
    SpreadsheetApp.newTextStyle()
      .setForegroundColor(CONFIG.BRAND.TEXT_PRIMARY)
      .setFontFamily(CONFIG.BRAND.FONT)
      .setFontSize(22).setBold(true).build());
  if (deltaStr) {
    const dStart = valEnd + 1;
    const dEnd = dStart + deltaStr.length;
    builder.setTextStyle(dStart, dEnd,
      SpreadsheetApp.newTextStyle()
        .setForegroundColor(deltaObj.color)
        .setFontFamily(CONFIG.BRAND.FONT)
        .setFontSize(11).setBold(true).build());
  }
  rng.setRichTextValue(builder.build())
     .setHorizontalAlignment('center').setVerticalAlignment('middle')
     .setWrap(true);
}

/**
 * Write a styled table starting at (row, col).
 *   headers — array of strings.
 *   data    — 2D array of values.
 *   widths  — optional array of column widths in px.
 *   formats — optional array of number formats per column ('#,##0', '0.0%', '$#,##0', etc).
 *
 * Returns the row index AFTER the table.
 */
function drawTable(sheet, row, col, headers, data, widths, formats) {
  const ncol = headers.length;
  // Header row.
  sheet.getRange(row, col, 1, ncol)
    .setValues([headers])
    .setBackground(CONFIG.BRAND.ACCENT)
    .setFontColor(CONFIG.BRAND.TEXT_PRIMARY)
    .setFontFamily(CONFIG.BRAND.FONT)
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(row, 28);

  if (data && data.length) {
    const rng = sheet.getRange(row + 1, col, data.length, ncol)
      .setValues(data)
      .setFontFamily(CONFIG.BRAND.FONT)
      .setFontColor(CONFIG.BRAND.TEXT_SECONDARY)
      .setFontSize(11)
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, CONFIG.BRAND.GRID, SpreadsheetApp.BorderStyle.SOLID);

    // Zebra stripes.
    for (let i = 0; i < data.length; i++) {
      const bg = (i % 2 === 0) ? CONFIG.BRAND.BG_CARD : CONFIG.BRAND.BG_CARD_ALT;
      sheet.getRange(row + 1 + i, col, 1, ncol).setBackground(bg);
    }

    if (formats && formats.length) {
      for (let c = 0; c < ncol; c++) {
        if (formats[c]) {
          sheet.getRange(row + 1, col + c, data.length, 1).setNumberFormat(formats[c]);
        }
      }
    }
  }

  if (widths && widths.length) {
    for (let c = 0; c < widths.length; c++) {
      if (widths[c]) sheet.setColumnWidth(col + c, widths[c]);
    }
  }
  return row + 1 + (data ? data.length : 0) + 1;
}

/**
 * Build a Sheets chart with the PX dark theme baked in.
 * Caller passes a builder; we apply theme then insert at (row, col).
 */
function styleChart(builder, title) {
  return builder
    .setOption('backgroundColor',     { fill: CONFIG.BRAND.BG_CARD, stroke: CONFIG.BRAND.GRID, strokeWidth: 1 })
    .setOption('chartArea',           { backgroundColor: CONFIG.BRAND.BG_CARD })
    .setOption('title',               title)
    .setOption('titleTextStyle',      { color: CONFIG.BRAND.TEXT_PRIMARY, fontName: CONFIG.BRAND.FONT, fontSize: 14, bold: true })
    .setOption('legend',              { textStyle: { color: CONFIG.BRAND.TEXT_SECONDARY, fontName: CONFIG.BRAND.FONT } })
    .setOption('hAxis',               { textStyle: { color: CONFIG.BRAND.TEXT_MUTED, fontName: CONFIG.BRAND.FONT }, gridlines: { color: CONFIG.BRAND.GRID }, baselineColor: CONFIG.BRAND.GRID })
    .setOption('vAxis',               { textStyle: { color: CONFIG.BRAND.TEXT_MUTED, fontName: CONFIG.BRAND.FONT }, gridlines: { color: CONFIG.BRAND.GRID }, baselineColor: CONFIG.BRAND.GRID })
    .setOption('colors',              [CONFIG.BRAND.ACCENT, '#7AE7FF', '#FFC857', '#3DDC97', '#A78BFA', '#FF8A65'])
    .setOption('fontName',            CONFIG.BRAND.FONT)
    .setOption('fontColor',           CONFIG.BRAND.TEXT_SECONDARY);
}
