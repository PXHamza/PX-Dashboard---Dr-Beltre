/**
 * SheetFormInsights.gs
 * ----------------------------------------------------------------------------
 * "📝 Form Insights" tab — fully driven by FORM_QUESTIONS in FormQuestions.gs.
 *
 * For each question:
 *   - 'choice' type → frequency table + bar chart (gauge ICP fit).
 *   - 'text'   type → word cloud (font-size scaled by frequency) plus a
 *                     short list of representative answers.
 *
 * Adding a new question? Append it to FORM_QUESTIONS and rebuild — this
 * file does not need to be touched.
 * ----------------------------------------------------------------------------
 */

function buildFormInsightsSheet() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.TABS.FORMS) || ss.insertSheet(CONFIG.TABS.FORMS);
  resetSheet(sheet);
  let row = drawHeader(sheet, 'Form Insights');

  const data = getFilteredLeads();
  const questions = getFormQuestions();

  if (!questions.length) {
    sheet.getRange(row, 2).setValue('No form questions configured. See FormQuestions.gs.');
    return;
  }

  for (const q of questions) {
    row = drawSectionHeader(sheet, row, q.label + '  —  ' + q.question);
    const answers = data.rows.map(function (r) { return r['q' + q.col]; }).filter(Boolean);

    if (q.type === 'choice') {
      row = renderChoiceQuestion(sheet, row, q, answers);
    } else {
      row = renderTextQuestion(sheet, row, q, answers);
    }
    row += 1;
  }
}

/** Choice-type question: frequency table + bar chart. */
function renderChoiceQuestion(sheet, row, q, answers) {
  const counts = {};
  for (const a of answers) {
    const key = a.toString().trim();
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  const total = answers.length;
  const sorted = Object.keys(counts)
    .map(function (k) { return [k, counts[k], safeDiv(counts[k], total)]; })
    .sort(function (a, b) { return b[1] - a[1]; })
    .slice(0, q.topN || 10);

  drawTable(sheet, row, 2,
    ['Answer', 'Count', '% of Responses'],
    sorted.map(function (r) { return [r[0], r[1], fmtPct(r[2])]; }),
    [320, 100, 140]);

  // Bar chart on the side.
  sheet.getRange(row, 7, 1, 2).setValues([['Answer', 'Count']])
    .setFontColor(CONFIG.BRAND.TEXT_MUTED).setFontFamily(CONFIG.BRAND.FONT);
  if (sorted.length) {
    sheet.getRange(row + 1, 7, sorted.length, 2)
      .setValues(sorted.map(function (r) { return [r[0], r[1]]; }));
  }
  const chart = styleChart(
    sheet.newChart().asBarChart()
      .addRange(sheet.getRange(row, 7, sorted.length + 1, 2))
      .setNumHeaders(1)
      .setOption('legend', 'none'),
    q.label
  ).setPosition(row, 11, 0, 0).setOption('width', 480).setOption('height', Math.max(220, 26 * sorted.length + 80)).build();
  sheet.insertChart(chart);

  return row + Math.max(sorted.length + 3, 12);
}

/**
 * Text-type question: word cloud rendered as a single rich-text cell where
 * each word's font size scales with its frequency. Sheets has no native word
 * cloud, but rich-text-with-mixed-sizes captures the spirit cheaply.
 */
function renderTextQuestion(sheet, row, q, answers) {
  const freqs = buildWordFrequencies(answers, q.topN || 25);

  // Render the cloud across cols 2–13, ~6 rows tall.
  const cloudRange = sheet.getRange(row, 2, 6, 12).merge()
    .setBackground(CONFIG.BRAND.BG_CARD)
    .setVerticalAlignment('middle').setHorizontalAlignment('center')
    .setWrap(true)
    .setBorder(true, true, true, true, false, false, CONFIG.BRAND.GRID, SpreadsheetApp.BorderStyle.SOLID);

  if (!freqs.length) {
    cloudRange.setValue('No responses yet.')
      .setFontColor(CONFIG.BRAND.TEXT_MUTED).setFontFamily(CONFIG.BRAND.FONT);
    return row + 7;
  }

  // Build text + per-word styles.
  const max = freqs[0][1];
  const min = freqs[freqs.length - 1][1];
  const text = freqs.map(function (f) { return f[0]; }).join('   ');

  const builder = SpreadsheetApp.newRichTextValue().setText(text);
  let cursor = 0;
  for (let i = 0; i < freqs.length; i++) {
    const word = freqs[i][0];
    const count = freqs[i][1];
    // Scale 12pt → 36pt.
    const t = (max === min) ? 1 : (count - min) / (max - min);
    const size = Math.round(12 + t * 24);
    // Alternate two accent shades for visual variety.
    const color = (i % 3 === 0) ? CONFIG.BRAND.ACCENT
               : (i % 3 === 1) ? CONFIG.BRAND.TEXT_PRIMARY
                               : '#7AE7FF';

    const style = SpreadsheetApp.newTextStyle()
      .setFontFamily(CONFIG.BRAND.FONT)
      .setFontSize(size)
      .setBold(true)
      .setForegroundColor(color)
      .build();
    builder.setTextStyle(cursor, cursor + word.length, style);
    cursor += word.length + 3; // +3 = '   ' separator
  }
  cloudRange.setRichTextValue(builder.build());
  sheet.setRowHeights(row, 6, 32);

  // Sample of representative answers under the cloud.
  const sampleRow = row + 6;
  const samples = answers.slice(0, 5).map(function (a) {
    return [a.toString().slice(0, 200) + (a.length > 200 ? '…' : '')];
  });
  if (samples.length) {
    drawTable(sheet, sampleRow, 2, ['Sample answers'], samples, [900]);
  }
  return sampleRow + samples.length + 2;
}
