/**
 * SheetDuplicates.gs
 * ----------------------------------------------------------------------------
 * "🔁 Duplicates" tab.
 *
 *   - New vs Duplicate split (count + %)
 *   - Duplicate rate by campaign / ad — flags audience saturation
 *
 * Duplicate detection runs in Data.gs (across the whole dataset, not just
 * the current window) so a lead that submitted last month and again today
 * is correctly treated as a dupe.
 * ----------------------------------------------------------------------------
 */

function buildDuplicatesSheet() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.TABS.DUPES) || ss.insertSheet(CONFIG.TABS.DUPES);
  resetSheet(sheet);
  let row = drawHeader(sheet, 'Duplicates');

  const data = getFilteredLeads();
  const rows = data.rows;
  const total = rows.length;
  const dupes = rows.filter(function (r) { return r.isDuplicate; }).length;
  const news  = total - dupes;

  // -- KPI strip -------------------------------------------------------------
  row = drawSectionHeader(sheet, row, 'New vs. Duplicate');
  drawKpiCard(sheet, row, 2, 'Total Leads', fmtInt(total));
  drawKpiCard(sheet, row, 4, 'New Leads',   fmtInt(news));
  drawKpiCard(sheet, row, 6, 'Duplicates',  fmtInt(dupes));
  drawKpiCard(sheet, row, 8, 'Dupe %',      fmtPct(safeDiv(dupes, total)));
  row += 5;

  // -- Donut: split ----------------------------------------------------------
  sheet.getRange(row, 2, 1, 2).setValues([['Type', 'Count']])
    .setFontColor(CONFIG.BRAND.TEXT_MUTED).setFontFamily(CONFIG.BRAND.FONT);
  sheet.getRange(row + 1, 2, 2, 2).setValues([['New', news], ['Duplicate', dupes]]);
  const donut = styleChart(
    sheet.newChart().asPieChart()
      .addRange(sheet.getRange(row, 2, 3, 2))
      .setNumHeaders(1)
      .setOption('pieHole', 0.55),
    'New vs Duplicate'
  ).setPosition(row, 5, 0, 0).setOption('width', 420).setOption('height', 240).build();
  sheet.insertChart(donut);
  row += 5;

  // -- Duplicate rate by campaign -------------------------------------------
  row = drawSectionHeader(sheet, row, 'Duplicate Rate by Campaign');
  row = drawDupeBreakdown(sheet, row, rows, function (r) { return r.campaign || '—'; }, 'Campaign');

  // -- Duplicate rate by ad --------------------------------------------------
  row = drawSectionHeader(sheet, row + 1, 'Duplicate Rate by Ad');
  drawDupeBreakdown(sheet, row, rows, function (r) { return r.ad || '—'; }, 'Ad');
}

function drawDupeBreakdown(sheet, row, rows, keyFn, label) {
  const groups = groupBy(rows, keyFn);
  const out = Object.keys(groups).map(function (k) {
    const g = groups[k];
    const dupes = g.filter(function (r) { return r.isDuplicate; }).length;
    return [k, g.length, dupes, safeDiv(dupes, g.length)];
  });
  out.sort(function (a, b) { return b[3] - a[3]; }); // worst offender first

  return drawTable(sheet, row, 2,
    [label, 'Total', 'Duplicates', 'Dupe %'],
    out,
    [280, 100, 120, 110],
    [null, '#,##0', '#,##0', '0.0%']);
}
