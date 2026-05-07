/**
 * SheetCampaigns.gs
 * ----------------------------------------------------------------------------
 * "🎯 Campaigns" tab — Campaign / Ad Set / Ad hierarchy + ad-level lead
 * quality matrix + ad-spend efficiency placeholder (ROAS lights up if a
 * Spend column is added later).
 * ----------------------------------------------------------------------------
 */

function buildCampaignsSheet() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.TABS.CAMPAIGNS) || ss.insertSheet(CONFIG.TABS.CAMPAIGNS);
  resetSheet(sheet);
  let row = drawHeader(sheet, 'Campaigns');

  const data = getFilteredLeads();

  // -- Campaign-level rollup -------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Campaigns');
  row = drawHierarchyTable(sheet, row, data.rows, function (r) { return r.campaign || '—'; }, 'Campaign');

  // Bar chart: leads per campaign.
  row = drawSectionHeader(sheet, row + 1, 'Leads by Campaign');
  const campRows = rollupByKey(data.rows, function (r) { return r.campaign || '—'; });
  row = drawChartFromRollup(sheet, row, 'Campaign', campRows, /*chartType*/ 'bar');

  // -- Ad Set rollup ---------------------------------------------------------
  row = drawSectionHeader(sheet, row + 1, 'Ad Sets');
  row = drawHierarchyTable(sheet, row, data.rows, function (r) { return (r.campaign || '—') + '  •  ' + (r.adSet || '—'); }, 'Campaign • Ad Set');

  // -- Ad-level lead quality matrix -----------------------------------------
  row = drawSectionHeader(sheet, row + 1, 'Ad-Level Lead Quality Matrix');
  drawAdQualityMatrix(sheet, row, data.rows);
}

/**
 * One-line generic rollup table that powers the campaign / ad-set / ad views.
 *
 *   keyFn → string used to group rows
 *
 * Columns: <label>, Leads, New, Qual %, Sales, Revenue, Rev/Lead.
 */
function drawHierarchyTable(sheet, row, rows, keyFn, label) {
  const groups = groupBy(rows, keyFn);
  const out = Object.keys(groups).map(function (k) {
    const g = groups[k];
    const total = g.length;
    const newL  = g.filter(function (r) { return !r.isDuplicate; }).length;
    const qual  = g.filter(function (r) { return r.category === 'Qualified'; }).length;
    const sales = g.filter(function (r) { return r.revenue > 0; }).length;
    const rev   = g.reduce(function (a, r) { return a + (r.revenue || 0); }, 0);
    return [k, total, newL, safeDiv(qual, total), sales, rev, safeDiv(rev, total)];
  });
  out.sort(function (a, b) { return b[5] - a[5]; }); // by revenue desc

  return drawTable(sheet, row, 2,
    [label, 'Leads', 'New', 'Qual %', 'Sales', 'Revenue', 'Rev / Lead'],
    out,
    [320, 80, 80, 90, 80, 110, 110],
    [null, '#,##0', '#,##0', '0.0%', '#,##0', '$#,##0', '$#,##0.00']
  );
}

function rollupByKey(rows, keyFn) {
  const groups = groupBy(rows, keyFn);
  return Object.keys(groups).map(function (k) {
    return [k, groups[k].length];
  }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 12);
}

function drawChartFromRollup(sheet, row, headerLabel, data, kind) {
  // Place chart-data table side-by-side (cols 2–3) with chart anchored col 6.
  sheet.getRange(row, 2, 1, 2).setValues([[headerLabel, 'Leads']])
    .setFontColor(CONFIG.BRAND.TEXT_MUTED)
    .setBackground(CONFIG.BRAND.BG_DEEP)
    .setFontFamily(CONFIG.BRAND.FONT);
  if (!data.length) return row + 4; // nothing to chart
  sheet.getRange(row + 1, 2, data.length, 2).setValues(data);
  let builder = sheet.newChart();
  builder = (kind === 'bar') ? builder.asBarChart() : builder.asColumnChart();
  builder = builder
    .addRange(sheet.getRange(row, 2, data.length + 1, 2))
    .setNumHeaders(1)
    .setOption('legend', 'none');
  const chart = styleChart(builder, headerLabel + ' rollup')
    .setPosition(row, 6, 0, 0)
    .setOption('width', 720).setOption('height', Math.max(200, 30 * data.length + 100))
    .build();
  sheet.insertChart(chart);
  return row + Math.max(data.length + 2, 12);
}

/**
 * Ad × Lead Category matrix — counts per (ad, category) cell with a heatmap-
 * style background gradient applied via conditional formatting.
 */
function drawAdQualityMatrix(sheet, row, rows) {
  const cats = ['Qualified', 'Unqualified', 'Junk', 'Other', 'Unknown'];

  const adGroups = groupBy(rows, function (r) { return r.ad || '—'; });
  const adNames  = Object.keys(adGroups).sort();

  // Header.
  sheet.getRange(row, 2, 1, 1 + cats.length + 2)
    .setValues([['Ad'].concat(cats).concat(['Total', 'Qual %'])])
    .setBackground(CONFIG.BRAND.ACCENT)
    .setFontColor(CONFIG.BRAND.TEXT_PRIMARY)
    .setFontWeight('bold')
    .setFontFamily(CONFIG.BRAND.FONT);

  if (!adNames.length) return row + 2;

  const matrix = adNames.map(function (ad) {
    const g = adGroups[ad];
    const counts = cats.map(function (c) { return g.filter(function (r) { return r.category === c; }).length; });
    const total  = g.length;
    const qual   = g.filter(function (r) { return r.category === 'Qualified'; }).length;
    return [ad].concat(counts).concat([total, safeDiv(qual, total)]);
  });

  const dataRange = sheet.getRange(row + 1, 2, matrix.length, matrix[0].length);
  dataRange.setValues(matrix)
    .setFontFamily(CONFIG.BRAND.FONT)
    .setFontColor(CONFIG.BRAND.TEXT_SECONDARY)
    .setBackground(CONFIG.BRAND.BG_CARD)
    .setBorder(true, true, true, true, true, true, CONFIG.BRAND.GRID, SpreadsheetApp.BorderStyle.SOLID);

  // Format Total / Qual % columns.
  const lastCol = 2 + cats.length + 2;
  sheet.getRange(row + 1, lastCol, matrix.length, 1).setNumberFormat('0.0%');

  // Heatmap on the count cells (cols cats.length wide, starting col 3).
  const countRange = sheet.getRange(row + 1, 3, matrix.length, cats.length);
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .setGradientMinpointWithValue(CONFIG.BRAND.BG_CARD,    SpreadsheetApp.InterpolationType.NUMBER, '0')
    .setGradientMidpointWithValue(CONFIG.BRAND.ACCENT_SOFT,SpreadsheetApp.InterpolationType.PERCENTILE, '50')
    .setGradientMaxpointWithValue(CONFIG.BRAND.ACCENT,     SpreadsheetApp.InterpolationType.PERCENTILE, '100')
    .setRanges([countRange]).build();
  sheet.setConditionalFormatRules(sheet.getConditionalFormatRules().concat([rule]));

  return row + matrix.length + 2;
}
