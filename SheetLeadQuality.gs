/**
 * SheetLeadQuality.gs
 * ----------------------------------------------------------------------------
 * "⭐ Lead Quality" tab.
 *
 *   - Lead Category Distribution (donut)
 *   - Category Trend Over Time (stacked area, weekly buckets)
 *   - Weighted Quality Score per campaign — single index for non-analysts.
 * ----------------------------------------------------------------------------
 */

function buildLeadQualitySheet() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.TABS.QUALITY) || ss.insertSheet(CONFIG.TABS.QUALITY);
  resetSheet(sheet);
  let row = drawHeader(sheet, 'Lead Quality');

  const data = getFilteredLeads();

  // -- Distribution donut ----------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Lead Category Distribution');
  const cats = ['Qualified', 'Unqualified', 'Junk', 'Other', 'Unknown'];
  const total = data.rows.length;
  const dist = cats.map(function (c) {
    return [c, data.rows.filter(function (r) { return r.category === c; }).length];
  });
  // Table.
  drawTable(sheet, row, 2, ['Category', 'Count', '% of Total'],
    dist.map(function (d) { return [d[0], d[1], fmtPct(safeDiv(d[1], total))]; }),
    [180, 100, 120]);
  // Donut chart.
  sheet.getRange(row, 7, 1, 2).setValues([['Category', 'Count']])
    .setFontColor(CONFIG.BRAND.TEXT_MUTED).setFontFamily(CONFIG.BRAND.FONT);
  sheet.getRange(row + 1, 7, dist.length, 2).setValues(dist);
  const donut = styleChart(
    sheet.newChart()
      .asPieChart()
      .addRange(sheet.getRange(row, 7, dist.length + 1, 2))
      .setNumHeaders(1)
      .setOption('pieHole', 0.55),
    'Distribution'
  ).setPosition(row, 11, 0, 0).setOption('width', 480).setOption('height', 280).build();
  sheet.insertChart(donut);
  row += dist.length + 4;

  // -- Trend over time -------------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Category Trend Over Time (weekly)');
  const trend = bucketByWeekCategory(data.rows, data.range.from, data.range.to);
  const headers = ['Week'].concat(cats);
  sheet.getRange(row, 2, 1, headers.length).setValues([headers])
    .setBackground(CONFIG.BRAND.ACCENT)
    .setFontColor(CONFIG.BRAND.TEXT_PRIMARY)
    .setFontFamily(CONFIG.BRAND.FONT).setFontWeight('bold');
  if (trend.length) {
    sheet.getRange(row + 1, 2, trend.length, headers.length).setValues(trend)
      .setBackground(CONFIG.BRAND.BG_CARD).setFontColor(CONFIG.BRAND.TEXT_SECONDARY)
      .setFontFamily(CONFIG.BRAND.FONT);
    sheet.getRange(row + 1, 2, trend.length, 1).setNumberFormat('mmm d');
  }
  const trendChart = styleChart(
    sheet.newChart().asAreaChart()
      .addRange(sheet.getRange(row, 2, trend.length + 1, headers.length))
      .setNumHeaders(1)
      .setOption('isStacked', true),
    'Weekly volume by category'
  ).setPosition(row, 9, 0, 0).setOption('width', 700).setOption('height', 320).build();
  sheet.insertChart(trendChart);
  row += Math.max(trend.length + 3, 14);

  // -- Weighted Quality Score per campaign -----------------------------------
  row = drawSectionHeader(sheet, row, 'Weighted Quality Score by Campaign');
  const wq = parseFloat(getSetting('QS_WEIGHT_QUALIFIED'));
  const wu = parseFloat(getSetting('QS_WEIGHT_UNQUALIFIED'));
  const wj = parseFloat(getSetting('QS_WEIGHT_JUNK'));

  const groups = groupBy(data.rows, function (r) { return r.campaign || '—'; });
  const wqs = Object.keys(groups).map(function (k) {
    const g = groups[k];
    const q = g.filter(function (r) { return r.category === 'Qualified';   }).length;
    const u = g.filter(function (r) { return r.category === 'Unqualified'; }).length;
    const j = g.filter(function (r) { return r.category === 'Junk';        }).length;
    const score = (wq * q + wu * u + wj * j);
    const perLead = safeDiv(score, g.length);
    return [k, g.length, q, u, j, score, perLead];
  });
  wqs.sort(function (a, b) { return b[6] - a[6]; });

  drawTable(sheet, row, 2,
    ['Campaign', 'Leads', 'Qualified', 'Unqualified', 'Junk', 'Score', 'Score / Lead'],
    wqs,
    [280, 80, 100, 110, 80, 100, 120],
    [null, '#,##0', '#,##0', '#,##0', '#,##0', '0.0', '0.00']
  );
}

/**
 * Bucket leads by ISO-week and category.
 * Returns rows like [Date(weekStart), qualifiedCount, unqualifiedCount, ...].
 */
function bucketByWeekCategory(rows, from, to) {
  const cats = ['Qualified', 'Unqualified', 'Junk', 'Other', 'Unknown'];
  const buckets = {}; // key = weekStart ms

  function weekStart(d) {
    const x = startOfDay(d);
    x.setDate(x.getDate() - x.getDay()); // back to Sunday
    return x;
  }
  // Pre-seed weeks in range.
  for (let w = weekStart(from).getTime(); w <= weekStart(to).getTime(); w += 7 * 86400000) {
    buckets[w] = cats.map(function () { return 0; });
  }
  for (const r of rows) {
    if (!r.date) continue;
    const k = weekStart(r.date).getTime();
    if (!buckets[k]) buckets[k] = cats.map(function () { return 0; });
    const idx = cats.indexOf(r.category);
    if (idx !== -1) buckets[k][idx]++;
  }
  return Object.keys(buckets)
    .sort(function (a, b) { return Number(a) - Number(b); })
    .map(function (k) { return [new Date(Number(k))].concat(buckets[k]); });
}
