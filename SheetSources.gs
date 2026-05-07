/**
 * SheetSources.gs
 * ----------------------------------------------------------------------------
 * "🌐 Sources" tab.
 *
 *   - Source Performance Summary (volume, quality, revenue by Source)
 *   - Fbclid Coverage — % of FB-source leads with a populated fbclid
 *     (diagnostic for CAPI / pixel health).
 * ----------------------------------------------------------------------------
 */

function buildSourcesSheet() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.TABS.SOURCES) || ss.insertSheet(CONFIG.TABS.SOURCES);
  resetSheet(sheet);
  let row = drawHeader(sheet, 'Sources');

  const data = getFilteredLeads();

  // -- Source rollup ---------------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Source Performance Summary');
  const groups = groupBy(data.rows, function (r) { return r.source || '(unknown)'; });
  const out = Object.keys(groups).map(function (k) {
    const g = groups[k];
    const total = g.length;
    const qual  = g.filter(function (r) { return r.category === 'Qualified'; }).length;
    const sales = g.filter(function (r) { return r.revenue > 0; }).length;
    const rev   = g.reduce(function (a, r) { return a + (r.revenue || 0); }, 0);
    return [k, total, safeDiv(qual, total), sales, safeDiv(sales, total), rev, safeDiv(rev, total)];
  });
  out.sort(function (a, b) { return b[5] - a[5]; });

  drawTable(sheet, row, 2,
    ['Source', 'Leads', 'Qual %', 'Sales', 'Close Rate', 'Revenue', 'Rev / Lead'],
    out,
    [200, 90, 90, 80, 110, 120, 110],
    [null, '#,##0', '0.0%', '#,##0', '0.0%', '$#,##0', '$#,##0.00']
  );
  row += out.length + 3;

  // Pie of leads by source.
  sheet.getRange(row, 2, 1, 2).setValues([['Source', 'Leads']])
    .setFontColor(CONFIG.BRAND.TEXT_MUTED).setFontFamily(CONFIG.BRAND.FONT);
  if (out.length) {
    sheet.getRange(row + 1, 2, out.length, 2)
      .setValues(out.map(function (r) { return [r[0], r[1]]; }));
  }
  const pie = styleChart(
    sheet.newChart().asPieChart()
      .addRange(sheet.getRange(row, 2, out.length + 1, 2))
      .setNumHeaders(1)
      .setOption('pieHole', 0.5),
    'Leads by Source'
  ).setPosition(row, 6, 0, 0).setOption('width', 540).setOption('height', 280).build();
  sheet.insertChart(pie);
  row += Math.max(out.length + 3, 14);

  // -- Fbclid coverage -------------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Fbclid Coverage (FB pixel / CAPI health)');
  const fbRows = data.rows.filter(function (r) { return /facebook|fb|meta/i.test(r.source || ''); });
  const fbWith = fbRows.filter(function (r) { return r.fbclid; }).length;
  const fbTotal = fbRows.length;

  drawKpiCard(sheet, row, 2,  'FB Leads',           fmtInt(fbTotal));
  drawKpiCard(sheet, row, 4,  'With fbclid',        fmtInt(fbWith));
  drawKpiCard(sheet, row, 6,  'Coverage',           fmtPct(safeDiv(fbWith, fbTotal)));
  drawKpiCard(sheet, row, 8,  'Missing fbclid',     fmtInt(fbTotal - fbWith));
  row += 5;

  // Fbclid coverage by campaign — useful for finding broken landing pages.
  const camp = groupBy(fbRows, function (r) { return r.campaign || '—'; });
  const covRows = Object.keys(camp).map(function (k) {
    const g = camp[k];
    const w = g.filter(function (r) { return r.fbclid; }).length;
    return [k, g.length, w, safeDiv(w, g.length)];
  }).sort(function (a, b) { return a[3] - b[3]; }); // worst coverage first

  drawTable(sheet, row, 2,
    ['Campaign', 'FB Leads', 'With fbclid', 'Coverage'],
    covRows,
    [320, 100, 120, 110],
    [null, '#,##0', '#,##0', '0.0%']);
}
