/**
 * SheetOverview.gs
 * ----------------------------------------------------------------------------
 * The "📊 Overview" tab — five-second read for leadership.
 *
 *   - Hero KPI strip with period-over-period deltas
 *   - Conversion funnel (Leads → Qualified → Sales → Revenue)
 *   - Daily lead volume line chart
 *   - Top campaigns mini-table
 * ----------------------------------------------------------------------------
 */

function buildOverviewSheet() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(CONFIG.TABS.OVERVIEW) || ss.insertSheet(CONFIG.TABS.OVERVIEW);
  resetSheet(sheet);
  let row = drawHeader(sheet, 'Overview');

  const data = getFilteredLeads();
  const cur = computeKpis(data.rows);
  const pri = computeKpis(data.prior);

  // --- Hero KPI strip ------------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Top-Line KPIs');
  drawKpiStrip(sheet, row, cur, pri);
  row += 5;

  // --- Conversion funnel ---------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Conversion Funnel');
  // Keep numbers numeric so the chart can use the same range. Display
  // formatting (currency / percent) comes from drawTable's `formats` arg.
  // Revenue lives in the same column as counts — it has its own row format.
  const funnelData = [
    ['Leads',     cur.totalLeads, 1.0],
    ['New Leads', cur.newLeads,   safeDiv(cur.newLeads,  cur.totalLeads)],
    ['Qualified', cur.qualified,  safeDiv(cur.qualified, cur.totalLeads)],
    ['Sales',     cur.sales,      safeDiv(cur.sales,     cur.totalLeads)],
    ['Revenue',   cur.revenue,    null]
  ];
  const tableRow = row;
  drawTable(sheet, row, 2,
    ['Stage', 'Count / $', '% of Leads'],
    funnelData,
    [180, 160, 140],
    [null, '#,##0', '0.0%']);
  // Override the Revenue row to display as currency.
  sheet.getRange(tableRow + 1 + 4, 3).setNumberFormat('$#,##0');
  // Blank the % cell on the Revenue row (it's null).
  sheet.getRange(tableRow + 1 + 4, 4).setValue('—').setNumberFormat('@');

  // Funnel bar chart on the right — exclude the Revenue row so the
  // dollar value doesn't squash the lead-count bars.
  const chart = styleChart(
    sheet.newChart()
      .asBarChart()
      .addRange(sheet.getRange(tableRow, 2, funnelData.length /* skip Revenue */, 2))
      .setNumHeaders(1)
      .setOption('legend', 'none'),
    'Funnel'
  ).setPosition(tableRow, 6, 0, 0)
   .setOption('width', 540).setOption('height', 230).build();
  sheet.insertChart(chart);
  row = tableRow + funnelData.length + 3;

  // --- Daily lead volume ---------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Daily Lead Volume');
  const daily = bucketByDay(data.rows, data.range.from, data.range.to);
  // Stash chart data in a hidden block off-screen so the chart can range it.
  const chartStart = row;
  sheet.getRange(chartStart, 2, 1, 2).setValues([['Date', 'Leads']])
    .setFontColor(CONFIG.BRAND.TEXT_MUTED).setFontFamily(CONFIG.BRAND.FONT);
  if (daily.length) {
    sheet.getRange(chartStart + 1, 2, daily.length, 2).setValues(daily);
    sheet.getRange(chartStart + 1, 2, daily.length, 1).setNumberFormat('mmm d');
  }
  const lineChart = styleChart(
    sheet.newChart()
      .asLineChart()
      .addRange(sheet.getRange(chartStart, 2, daily.length + 1, 2))
      .setNumHeaders(1)
      .setOption('legend', 'none')
      .setOption('curveType', 'function')
      .setOption('pointSize', 4),
    'Leads per Day'
  ).setPosition(chartStart, 6, 0, 0)
   .setOption('width', 720).setOption('height', 280).build();
  sheet.insertChart(lineChart);

  // Hide the data block visually by pushing it under the chart anchor —
  // it stays on-sheet but is covered by the chart.
  row = chartStart + Math.max(daily.length + 2, 14);

  // --- Top performing combinations ----------------------------------------
  row = drawSectionHeader(sheet, row, 'Top Campaign × Ad × Variant');
  const top = topCombinations(data.rows, 8);
  drawTable(sheet, row, 2,
    ['Campaign', 'Ad', 'Variant', 'Leads', 'Qual %', 'Sales', 'Revenue', 'Rev / Lead'],
    top,
    [220, 200, 100, 80, 90, 80, 110, 120],
    [null, null, null, '#,##0', '0.0%', '#,##0', '$#,##0', '$#,##0.00']
  );

  sheet.setColumnWidth(1, 12); // pink rule width.
}

// --- KPI math ---------------------------------------------------------------

function computeKpis(rows) {
  const total      = rows.length;
  const newLeads   = rows.filter(function (r) { return !r.isDuplicate; }).length;
  const dupes      = total - newLeads;
  const qualified  = rows.filter(function (r) { return r.category === 'Qualified'; }).length;
  const sales      = rows.filter(function (r) { return r.revenue > 0; }).length;
  const revenue    = rows.reduce(function (a, r) { return a + (r.revenue || 0); }, 0);
  return {
    totalLeads: total,
    newLeads:   newLeads,
    dupes:      dupes,
    dupePct:    safeDiv(dupes, total),
    qualified:  qualified,
    qualPct:    safeDiv(qualified, total),
    sales:      sales,
    closeRate:  safeDiv(sales, total),
    revenue:    revenue,
    revPerLead: safeDiv(revenue, total)
  };
}

function drawKpiStrip(sheet, row, cur, pri) {
  // Seven cards × 2 cols each = cols 2–15. We'll lay 5 across to keep
  // the layout readable and put the remaining two on the next row.
  const cards = [
    { label: 'Total Leads', value: fmtInt(cur.totalLeads), delta: delta(cur.totalLeads, pri.totalLeads) },
    { label: 'New Leads',   value: fmtInt(cur.newLeads),   delta: delta(cur.newLeads,   pri.newLeads) },
    { label: 'Dupe %',      value: fmtPct(cur.dupePct),    delta: delta(pri.dupePct, cur.dupePct) /* lower is better — flip */ },
    { label: 'Sales',       value: fmtInt(cur.sales),      delta: delta(cur.sales,      pri.sales) },
    { label: 'Revenue',     value: fmtMoney(cur.revenue),  delta: delta(cur.revenue,    pri.revenue) },
    { label: 'Rev / Lead',  value: '$' + cur.revPerLead.toFixed(2), delta: delta(cur.revPerLead, pri.revPerLead) },
    { label: 'Close Rate',  value: fmtPct(cur.closeRate),  delta: delta(cur.closeRate,  pri.closeRate) }
  ];
  // Place 4 across, then 3 across (cols 2–9 / 10–17 alt).
  let col = 2;
  for (let i = 0; i < cards.length; i++) {
    drawKpiCard(sheet, row, col, cards[i].label, cards[i].value, cards[i].delta);
    col += 2;
    if (col > 14) { col = 2; row += 5; }
  }
}

// --- Time bucketing & top combos -------------------------------------------

function bucketByDay(rows, from, to) {
  const buckets = {};
  // Pre-seed every day in range with 0 so the line chart doesn't have gaps.
  for (let d = startOfDay(from).getTime(); d <= startOfDay(to).getTime(); d += 86400000) {
    buckets[d] = 0;
  }
  for (const r of rows) {
    if (!r.date) continue;
    const k = startOfDay(r.date).getTime();
    if (buckets[k] != null) buckets[k]++;
  }
  return Object.keys(buckets)
    .map(function (k) { return [new Date(Number(k)), buckets[k]]; })
    .sort(function (a, b) { return a[0] - b[0]; });
}

function topCombinations(rows, n) {
  const groups = groupBy(rows, function (r) {
    return [r.campaign, r.ad, r.pageVariant].join('||');
  });
  const out = [];
  for (const k of Object.keys(groups)) {
    const g = groups[k];
    if (!g.length) continue;
    const [camp, ad, pv] = k.split('||');
    const leads = g.length;
    const qual  = g.filter(function (r) { return r.category === 'Qualified'; }).length;
    const sales = g.filter(function (r) { return r.revenue > 0; }).length;
    const rev   = g.reduce(function (a, r) { return a + (r.revenue || 0); }, 0);
    out.push([
      camp || '—', ad || '—', pv || '—',
      leads,
      safeDiv(qual, leads),
      sales,
      rev,
      safeDiv(rev, leads)
    ]);
  }
  out.sort(function (a, b) { return b[6] - a[6]; }); // by revenue desc
  return out.slice(0, n);
}
