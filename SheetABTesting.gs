/**
 * SheetABTesting.gs
 * ----------------------------------------------------------------------------
 * "🧪 A/B Testing" tab.
 *
 *   - Per-page-variant performance (volume, quality, sales, revenue, close rate)
 *   - Statistical-significance flag — a winner is only called when a
 *     two-proportion z-test on close-rate produces p < 0.05 vs the leader.
 * ----------------------------------------------------------------------------
 */

function buildABTestingSheet() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.TABS.AB) || ss.insertSheet(CONFIG.TABS.AB);
  resetSheet(sheet);
  let row = drawHeader(sheet, 'A/B Testing');

  const data = getFilteredLeads();

  row = drawSectionHeader(sheet, row, 'Page Variant Performance');

  const groups = groupBy(data.rows, function (r) { return r.pageVariant || '(none)'; });
  const variants = Object.keys(groups).map(function (k) {
    const g = groups[k];
    const total = g.length;
    const qual  = g.filter(function (r) { return r.category === 'Qualified'; }).length;
    const sales = g.filter(function (r) { return r.revenue > 0; }).length;
    const rev   = g.reduce(function (a, r) { return a + (r.revenue || 0); }, 0);
    return {
      key: k, leads: total, qualified: qual, sales: sales, revenue: rev,
      qualPct:   safeDiv(qual, total),
      closeRate: safeDiv(sales, total),
      revPerLead: safeDiv(rev, total)
    };
  }).sort(function (a, b) { return b.closeRate - a.closeRate; });

  // Statistical-significance flag: compare each variant's close rate to the
  // leader. p<0.05 → ✅ Winner. Otherwise → "Not yet significant".
  const leader = variants[0];
  const tableRows = variants.map(function (v) {
    let flag = '—';
    if (leader && v !== leader) {
      const p = twoProportionPValue(leader.sales, leader.leads, v.sales, v.leads);
      flag = (p < 0.05) ? '⛔ Loser (p=' + p.toFixed(3) + ')' : '⚠️ Not sig (p=' + p.toFixed(3) + ')';
    } else if (leader) {
      // Confirm the leader against the second-place variant.
      if (variants.length > 1) {
        const p = twoProportionPValue(leader.sales, leader.leads, variants[1].sales, variants[1].leads);
        flag = (p < 0.05) ? '✅ Winner (p=' + p.toFixed(3) + ')' : '⚠️ Inconclusive (p=' + p.toFixed(3) + ')';
      } else {
        flag = '—';
      }
    }
    return [v.key, v.leads, v.qualified, v.qualPct, v.sales, v.closeRate, v.revenue, v.revPerLead, flag];
  });

  drawTable(sheet, row, 2,
    ['Variant', 'Leads', 'Qualified', 'Qual %', 'Sales', 'Close Rate', 'Revenue', 'Rev / Lead', 'Significance'],
    tableRows,
    [160, 80, 100, 90, 80, 110, 110, 110, 220],
    [null, '#,##0', '#,##0', '0.0%', '#,##0', '0.0%', '$#,##0', '$#,##0.00', null]
  );
  row += tableRows.length + 3;

  // Close-rate column chart.
  row = drawSectionHeader(sheet, row, 'Close Rate by Variant');
  sheet.getRange(row, 2, 1, 2).setValues([['Variant', 'Close Rate']])
    .setFontColor(CONFIG.BRAND.TEXT_MUTED).setFontFamily(CONFIG.BRAND.FONT);
  if (variants.length) {
    sheet.getRange(row + 1, 2, variants.length, 2)
      .setValues(variants.map(function (v) { return [v.key, v.closeRate]; }));
    sheet.getRange(row + 1, 3, variants.length, 1).setNumberFormat('0.0%');
  }
  const chart = styleChart(
    sheet.newChart().asColumnChart()
      .addRange(sheet.getRange(row, 2, variants.length + 1, 2))
      .setNumHeaders(1)
      .setOption('legend', 'none'),
    'Close rate'
  ).setPosition(row, 6, 0, 0).setOption('width', 600).setOption('height', 280).build();
  sheet.insertChart(chart);
}
