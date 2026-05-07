/**
 * Email.gs
 * ----------------------------------------------------------------------------
 * Daily email summary for leadership: top KPIs + anomaly flags.
 *
 * Trigger setup is offered via the "PX Insights" menu — it installs a
 * daily time trigger that calls sendDailySummary() each morning.
 * Recipients come from Settings → DAILY_EMAIL_RECIPIENTS.
 * ----------------------------------------------------------------------------
 */

function sendDailySummary() {
  const recipientsRaw = (getSetting('DAILY_EMAIL_RECIPIENTS') || '').toString();
  const recipients = recipientsRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (!recipients.length) {
    SpreadsheetApp.getActive().toast('No DAILY_EMAIL_RECIPIENTS configured.', 'PX Insights', 5);
    return;
  }

  const data = getFilteredLeads();
  const cur = computeKpis(data.rows);
  const pri = computeKpis(data.prior);
  const html = renderEmailHtml(cur, pri, data);
  const subject = 'PX Insights — ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'EEE MMM d') +
    ' — ' + fmtInt(cur.totalLeads) + ' leads, ' + fmtMoney(cur.revenue);

  MailApp.sendEmail({ to: recipients.join(','), subject: subject, htmlBody: html });
}

function renderEmailHtml(cur, pri, data) {
  const B = CONFIG.BRAND;
  const tz = Session.getScriptTimeZone();
  const range = data.range.label + ' (' +
    Utilities.formatDate(data.range.from, tz, 'MMM d') + ' → ' +
    Utilities.formatDate(data.range.to,   tz, 'MMM d, yyyy') + ')';

  function kpi(label, value, deltaObj) {
    const d = deltaObj
      ? '<div style="color:' + deltaObj.color + ';font-size:13px;margin-top:4px">' + deltaObj.text + '</div>'
      : '';
    return '<td style="padding:14px 18px;background:' + B.BG_CARD + ';border:1px solid ' + B.GRID + ';width:140px">' +
      '<div style="color:' + B.TEXT_MUTED + ';font-size:11px;letter-spacing:0.06em;font-weight:bold">' + label.toUpperCase() + '</div>' +
      '<div style="color:' + B.TEXT_PRIMARY + ';font-size:24px;font-weight:bold;margin-top:6px">' + value + '</div>' +
      d + '</td>';
  }

  // Anomaly flags ------------------------------------------------------------
  const qualFloor = Number(getSetting('QUALIFIED_PCT_FLOOR')) || 30;
  const rplFloor  = Number(getSetting('REV_PER_LEAD_FLOOR')) || 50;
  const camp = groupBy(data.rows, function (r) { return r.campaign || '—'; });
  const flags = [];
  for (const k of Object.keys(camp)) {
    const g = camp[k];
    if (g.length < 5) continue;
    const qual = g.filter(function (r) { return r.category === 'Qualified'; }).length;
    const rev  = g.reduce(function (a, r) { return a + (r.revenue || 0); }, 0);
    const qPct = (qual / g.length) * 100;
    const rpl  = rev / g.length;
    if (qPct < qualFloor || rpl < rplFloor) {
      flags.push('• <b>' + escapeHtml(k) + '</b> — ' + qPct.toFixed(1) + '% qualified, $' + rpl.toFixed(2) + ' rev/lead');
    }
  }

  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;background:' + B.BG_DEEP + ';padding:24px;color:' + B.TEXT_SECONDARY + '">',
      '<div style="font-size:22px;font-weight:bold;color:' + B.TEXT_PRIMARY + ';letter-spacing:0.04em">PX INSIGHTS — DAILY SUMMARY</div>',
      '<div style="height:3px;background:' + B.ACCENT + ';margin:8px 0 20px;width:140px"></div>',
      '<div style="font-size:12px;color:' + B.TEXT_MUTED + ';margin-bottom:18px">' + range + '</div>',
      '<table cellspacing="8" cellpadding="0"><tr>',
        kpi('Total Leads', fmtInt(cur.totalLeads),  delta(cur.totalLeads, pri.totalLeads)),
        kpi('New Leads',   fmtInt(cur.newLeads),    delta(cur.newLeads,   pri.newLeads)),
        kpi('Sales',       fmtInt(cur.sales),       delta(cur.sales,      pri.sales)),
        kpi('Revenue',     fmtMoney(cur.revenue),   delta(cur.revenue,    pri.revenue)),
        kpi('Close Rate',  fmtPct(cur.closeRate),   delta(cur.closeRate,  pri.closeRate)),
      '</tr></table>',
      flags.length
        ? '<div style="margin-top:24px;padding:14px;background:' + B.BG_CARD + ';border-left:3px solid ' + B.NEGATIVE + '">' +
          '<div style="color:' + B.NEGATIVE + ';font-weight:bold;margin-bottom:8px">⚠️ Anomaly flags (' + flags.length + ')</div>' +
          flags.join('<br>') + '</div>'
        : '<div style="margin-top:24px;color:' + B.POSITIVE + '">✅ No anomalies above threshold.</div>',
      '<div style="margin-top:24px;font-size:11px;color:' + B.TEXT_MUTED + '">' +
        'Open the dashboard for full breakdown · ' + SpreadsheetApp.getActive().getUrl() + '</div>',
    '</div>'
  ].join('');
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

/** Install (or reinstall) a daily 7am trigger calling sendDailySummary. */
function installDailyEmailTrigger() {
  // Remove any existing triggers for sendDailySummary first.
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    if (t.getHandlerFunction() === 'sendDailySummary') ScriptApp.deleteTrigger(t);
  }
  ScriptApp.newTrigger('sendDailySummary').timeBased().everyDays(1).atHour(7).create();
  SpreadsheetApp.getUi().alert('Daily email trigger installed for ~7am ' + Session.getScriptTimeZone() + '.');
}

function uninstallDailyEmailTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;
  for (const t of triggers) {
    if (t.getHandlerFunction() === 'sendDailySummary') { ScriptApp.deleteTrigger(t); removed++; }
  }
  SpreadsheetApp.getUi().alert('Removed ' + removed + ' daily email trigger(s).');
}
