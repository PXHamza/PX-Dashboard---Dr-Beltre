/**
 * SheetAlerts.gs
 * ----------------------------------------------------------------------------
 * "🚨 Alerts" tab — proactive signals for the team.
 *
 *   - Sales Notes Activity: leads with no notes after N days.
 *   - Lead Aging Alerts:    overdue follow-ups.
 *   - Underperforming Campaign Flags: Qualified % or Rev/Lead below threshold.
 *
 * Thresholds come from the Settings sheet so the team can dial them in.
 * ----------------------------------------------------------------------------
 */

function buildAlertsSheet() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.TABS.ALERTS) || ss.insertSheet(CONFIG.TABS.ALERTS);
  resetSheet(sheet);
  let row = drawHeader(sheet, 'Alerts');

  const data = getFilteredLeads();
  const agingDays = Number(getSetting('LEAD_AGING_DAYS')) || 3;
  const qualFloor = Number(getSetting('QUALIFIED_PCT_FLOOR')) || 30;
  const rplFloor  = Number(getSetting('REV_PER_LEAD_FLOOR')) || 50;
  const now = new Date();

  // -- KPI strip -------------------------------------------------------------
  const noNotes = data.rows.filter(function (r) { return !r.notes || r.notes.trim() === ''; });
  const aged    = data.rows.filter(function (r) {
    if (!r.date) return false;
    if (r.notes && r.notes.trim() !== '') return false;
    return daysBetween(r.date, now) >= agingDays;
  });

  drawKpiCard(sheet, row, 2, 'No Sales Notes',     fmtInt(noNotes.length));
  drawKpiCard(sheet, row, 4, 'Aging (>' + agingDays + 'd)', fmtInt(aged.length));
  drawKpiCard(sheet, row, 6, 'Qualified % Floor',  qualFloor + '%');
  drawKpiCard(sheet, row, 8, 'Rev/Lead Floor',     '$' + rplFloor);
  row += 5;

  // -- Sales Notes Activity --------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Leads With No Sales Notes');
  const noteRows = noNotes.slice(0, 50).map(function (r) {
    return [
      r.date ? Utilities.formatDate(r.date, Session.getScriptTimeZone(), 'yyyy-mm-dd HH:mm') : '',
      r.name, r.email, r.phone, r.category, r.campaign, r.ad
    ];
  });
  drawTable(sheet, row, 2,
    ['Date', 'Name', 'Email', 'Phone', 'Category', 'Campaign', 'Ad'],
    noteRows,
    [140, 160, 220, 130, 110, 200, 180]);
  row += noteRows.length + 3;

  // -- Lead Aging ------------------------------------------------------------
  row = drawSectionHeader(sheet, row, 'Aging Leads (no contact attempt)');
  const agingRows = aged.slice(0, 50).map(function (r) {
    return [
      r.date ? Utilities.formatDate(r.date, Session.getScriptTimeZone(), 'yyyy-mm-dd HH:mm') : '',
      daysBetween(r.date, now),
      r.name, r.email, r.phone, r.campaign
    ];
  });
  drawTable(sheet, row, 2,
    ['Date', 'Days Old', 'Name', 'Email', 'Phone', 'Campaign'],
    agingRows,
    [140, 90, 160, 220, 130, 220],
    [null, '#,##0']);
  row += agingRows.length + 3;

  // -- Underperforming Campaigns --------------------------------------------
  row = drawSectionHeader(sheet, row, 'Underperforming Campaigns');
  const camp = groupBy(data.rows, function (r) { return r.campaign || '—'; });
  const flagged = [];
  for (const k of Object.keys(camp)) {
    const g = camp[k];
    const total = g.length;
    if (total < 5) continue; // ignore tiny groups (noisy %)
    const qual  = g.filter(function (r) { return r.category === 'Qualified'; }).length;
    const rev   = g.reduce(function (a, r) { return a + (r.revenue || 0); }, 0);
    const qualPct = (qual / total) * 100;
    const rpl     = rev / total;
    const failQ   = qualPct < qualFloor;
    const failR   = rpl < rplFloor;
    if (failQ || failR) {
      const flags = [];
      if (failQ) flags.push('Qual%↓');
      if (failR) flags.push('Rev/Lead↓');
      flagged.push([k, total, qualPct / 100, rev, rpl, flags.join('  •  ')]);
    }
  }
  flagged.sort(function (a, b) { return a[2] - b[2]; });
  drawTable(sheet, row, 2,
    ['Campaign', 'Leads', 'Qual %', 'Revenue', 'Rev / Lead', 'Flags'],
    flagged,
    [320, 80, 90, 110, 110, 220],
    [null, '#,##0', '0.0%', '$#,##0', '$#,##0.00', null]);
}
