/**
 * SheetTimeTrends.gs
 * ----------------------------------------------------------------------------
 * "⏱ Time Trends" tab.
 *
 *   - Daily Lead Volume (already on Overview, repeated here in finer detail)
 *   - Day-of-week × Hour-of-day heatmap — best windows for spend pacing
 *     and sales follow-up staffing.
 *   - Lead-to-Sale time lag — average days between form fill and first
 *     non-zero revenue (informs forecasting).
 * ----------------------------------------------------------------------------
 */

function buildTimeTrendsSheet() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.TABS.TIME) || ss.insertSheet(CONFIG.TABS.TIME);
  resetSheet(sheet);
  let row = drawHeader(sheet, 'Time Trends');

  const data = getFilteredLeads();

  // -- Daily lead volume -----------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Daily Lead Volume');
  const daily = bucketByDay(data.rows, data.range.from, data.range.to);
  sheet.getRange(row, 2, 1, 2).setValues([['Date', 'Leads']])
    .setFontColor(CONFIG.BRAND.TEXT_MUTED).setFontFamily(CONFIG.BRAND.FONT);
  if (daily.length) {
    sheet.getRange(row + 1, 2, daily.length, 2).setValues(daily);
    sheet.getRange(row + 1, 2, daily.length, 1).setNumberFormat('mmm d');
  }
  const line = styleChart(
    sheet.newChart().asLineChart()
      .addRange(sheet.getRange(row, 2, daily.length + 1, 2))
      .setNumHeaders(1)
      .setOption('legend', 'none')
      .setOption('curveType', 'function')
      .setOption('pointSize', 4),
    'Leads per day'
  ).setPosition(row, 6, 0, 0).setOption('width', 720).setOption('height', 280).build();
  sheet.insertChart(line);
  row += Math.max(daily.length + 3, 14);

  // -- Day × Hour heatmap ----------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Day-of-Week × Hour-of-Day Heatmap');
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const grid  = [];
  for (let d = 0; d < 7; d++) { grid.push(new Array(24).fill(0)); }
  for (const r of data.rows) {
    if (!r.date) continue;
    grid[r.date.getDay()][r.date.getHours()]++;
  }

  // Header row: hours 0–23.
  const hourHeader = ['Day'].concat(['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p']);
  sheet.getRange(row, 2, 1, hourHeader.length).setValues([hourHeader])
    .setBackground(CONFIG.BRAND.ACCENT)
    .setFontColor(CONFIG.BRAND.TEXT_PRIMARY)
    .setFontFamily(CONFIG.BRAND.FONT).setFontWeight('bold')
    .setHorizontalAlignment('center');

  for (let d = 0; d < 7; d++) {
    sheet.getRange(row + 1 + d, 2).setValue(days[d])
      .setFontColor(CONFIG.BRAND.TEXT_PRIMARY).setBackground(CONFIG.BRAND.BG_CARD)
      .setFontFamily(CONFIG.BRAND.FONT).setFontWeight('bold');
    sheet.getRange(row + 1 + d, 3, 1, 24).setValues([grid[d]])
      .setFontFamily(CONFIG.BRAND.FONT).setFontColor(CONFIG.BRAND.TEXT_SECONDARY)
      .setHorizontalAlignment('center');
  }
  const heatRange = sheet.getRange(row + 1, 3, 7, 24);
  heatRange.setBackground(CONFIG.BRAND.BG_CARD);
  const heatRule = SpreadsheetApp.newConditionalFormatRule()
    .setGradientMinpointWithValue(CONFIG.BRAND.BG_CARD,    SpreadsheetApp.InterpolationType.NUMBER, '0')
    .setGradientMidpointWithValue(CONFIG.BRAND.ACCENT_SOFT,SpreadsheetApp.InterpolationType.PERCENTILE, '50')
    .setGradientMaxpointWithValue(CONFIG.BRAND.ACCENT,     SpreadsheetApp.InterpolationType.PERCENTILE, '100')
    .setRanges([heatRange]).build();
  sheet.setConditionalFormatRules(sheet.getConditionalFormatRules().concat([heatRule]));
  for (let c = 3; c < 27; c++) sheet.setColumnWidth(c, 36);
  row += 9;

  // -- Lead-to-Sale time lag -------------------------------------------------
  // Without an explicit "sale date" column we approximate using the lead's
  // own date and the row's update timestamp. If a Sale Date column gets added
  // later, plug it in here.
  row = drawSectionHeader(sheet, row, 'Lead-to-Sale Time Lag (approximate)');
  const sold = data.rows.filter(function (r) { return r.revenue > 0 && r.date; });
  // We don't have a closed-on date in the schema, so best-effort = treat the
  // sale as happening at the time the row was last edited would require an
  // onEdit-stamp column. Until that exists, we report counts only.
  drawKpiCard(sheet, row, 2, 'Sales in Window', fmtInt(sold.length));
  drawKpiCard(sheet, row, 4, 'Avg Revenue / Sale', fmtMoney(safeDiv(
    sold.reduce(function (a, r) { return a + r.revenue; }, 0), sold.length)));
  drawKpiCard(sheet, row, 6, 'Total Revenue', fmtMoney(
    sold.reduce(function (a, r) { return a + r.revenue; }, 0)));

  // Note explaining how to enable a real lag metric.
  sheet.getRange(row + 5, 2, 1, 12).merge()
    .setValue('Tip: add a "Sale Date" column to your raw sheet to enable an actual lead-to-sale lag chart. Update CONFIG.COLS in Config.gs to include the new column index.')
    .setFontFamily(CONFIG.BRAND.FONT).setFontStyle('italic')
    .setFontColor(CONFIG.BRAND.TEXT_MUTED).setBackground(CONFIG.BRAND.BG_DEEP);
}
