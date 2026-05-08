/**
 * Code.gs — server-side logic for the PX Lead Intelligence dashboard.
 *
 *   onOpen()              Adds the "PX Insights" menu (one button: Dashboard).
 *   showDashboard()       Opens dashboard.html in a modal popup.
 *   getDashboardPayload() Called by the popup via google.script.run; returns
 *                         brand + filter options + KPIs (current + prior
 *                         period for ▲/▼ deltas) + every chart/table the
 *                         popup needs in a single round-trip.
 *
 * Everything client-specific lives in:
 *   - Config.gs        (column mapping, form questions, brand)
 *   - Qualification.gs (what counts as a qualified lead)
 */

// =============================================================================
// MENU
// =============================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PX Insights')
      .addItem('📊 Dashboard', 'showDashboard')
      .addToUi();
}

function showDashboard() {
  const html = HtmlService.createTemplateFromFile('dashboard')
    .evaluate()
    .setWidth(1400)
    .setHeight(900)
    .setTitle(CONFIG.BRAND.title);
  SpreadsheetApp.getUi().showModalDialog(html, CONFIG.BRAND.title);
}

// =============================================================================
// PUBLIC API — called by dashboard.html via google.script.run
// =============================================================================

/**
 * Returns the entire dashboard payload for the requested filters.
 *
 *   filters:
 *     preset       'Today' | 'Yesterday' | 'Last 7' | 'This Week' |
 *                  'Last Month' | 'Last 30' | 'Custom'
 *     fromIso      ISO date — used only when preset === 'Custom'
 *     toIso        ISO date — used only when preset === 'Custom'
 *     campaign     exact campaign name (or '')
 *     adSet        exact ad-set name  (or '')
 *     ad           exact ad name      (or '')
 *     pageVariant  exact page-variant name (or '')
 */
function getDashboardPayload(filters) {
  filters = filters || {};
  const data = loadAllRows();

  // Resolve preset (or custom range) → { from, to, priorFrom, priorTo, label }.
  const range = resolveRange(
    filters.preset || 'Last 30',
    filters.fromIso, filters.toIso,
    data.dateMin, data.dateMax
  );

  const cur = applyFilters(data.rows, filters, range.from,      range.to);
  const pri = applyFilters(data.rows, filters, range.priorFrom, range.priorTo);

  return {
    brand:           CONFIG.BRAND,
    refreshedAt:     new Date().toISOString(),
    columnsResolved: data.columnsResolved,
    rowCount:        cur.length,
    range: {
      label:     range.label,
      fromIso:   range.from     ? range.from.toISOString()     : null,
      toIso:     range.to       ? range.to.toISOString()       : null,
      priorFrom: range.priorFrom? range.priorFrom.toISOString(): null,
      priorTo:   range.priorTo  ? range.priorTo.toISOString()  : null
    },

    // Cascading filter options — server-built so the UI can chain them
    // (selecting a campaign filters the ad-set list to that campaign's sets).
    filterOptions: buildFilterOptions(data.rows),

    // KPIs for current period + prior, plus pre-computed deltas.
    kpis:      computeKpis(cur),
    priorKpis: computeKpis(pri),
    deltas:    computeDeltas(computeKpis(cur), computeKpis(pri)),

    daily:               dailyVolume(cur, range),
    qualityBreakdown:    qualityBreakdown(cur),
    qualityByCampaign:   qualityByCampaign(cur),

    campaignTable:       rollup(cur, function (r) { return r.campaign    || '—'; }),
    adSetTable:          rollup(cur, function (r) { return r.adSet       || '—'; }, function (r) { return r.campaign || '—'; }),
    adTable:             rollup(cur, function (r) { return r.ad          || '—'; }, function (r) { return (r.campaign || '—') + ' / ' + (r.adSet || '—'); }),
    pageVariantTable:    rollup(cur, function (r) { return r.pageVariant || '(none)'; }),

    errors:              computeErrors(cur),
    formQuestions:       formInsights(cur),
    alerts:              computeAlerts(cur)
  };
}

// =============================================================================
// DATA LOADING & MAPPING
// =============================================================================

function loadAllRows() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) throw new Error('Sheet "' + CONFIG.DATA_SHEET + '" not found. Update CONFIG.DATA_SHEET in Config.gs.');

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return { rows: [], dateMin: null, dateMax: null, columnsResolved: {} };

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return (h == null ? '' : h.toString()).trim(); });

  const colIdx = {};
  const columnsResolved = {};
  Object.keys(CONFIG.COLUMNS).forEach(function (key) {
    const idx = resolveColumn(CONFIG.COLUMNS[key], headers);
    colIdx[key] = idx;
    columnsResolved[key] = idx
      ? headers[idx - 1] + ' (col ' + colLetter(idx) + ')'
      : '— (not found)';
  });

  const formColIdx = FORM_QUESTIONS.map(function (q) {
    return { q: q, col: resolveColumn(q.header, headers) };
  });

  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const rows = [];
  let dateMin = null, dateMax = null;

  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    if (isBlankRow(r)) continue;

    const date    = colIdx.date         ? toDate(r[colIdx.date - 1])              : null;
    const email   = colIdx.email        ? str(r[colIdx.email - 1]).toLowerCase()  : '';
    const name    = colIdx.name         ? str(r[colIdx.name - 1])                 : '';
    const phone   = colIdx.phone        ? str(r[colIdx.phone - 1])                : '';
    const rawCat  = colIdx.leadCategory ? str(r[colIdx.leadCategory - 1])         : '';
    const cls     = classifyLead(rawCat);                          // from Qualification.gs
    const notes   = colIdx.salesNotes   ? str(r[colIdx.salesNotes - 1])           : '';
    const revenue = colIdx.saleRevenue  ? num(r[colIdx.saleRevenue - 1])          : 0;
    const source  = colIdx.source       ? str(r[colIdx.source - 1])               : '';
    const camp    = colIdx.campaign     ? str(r[colIdx.campaign - 1])             : '';
    const adSet   = colIdx.adSet        ? str(r[colIdx.adSet - 1])                : '';
    const ad      = colIdx.ad           ? str(r[colIdx.ad - 1])                   : '';
    const variant = colIdx.pageVariant  ? str(r[colIdx.pageVariant - 1])          : '';
    const fbclid  = colIdx.fbclid       ? str(r[colIdx.fbclid - 1])               : '';

    const formAnswers = {};
    formColIdx.forEach(function (fc) {
      formAnswers[fc.q.label] = fc.col ? str(r[fc.col - 1]) : '';
    });

    if (date) {
      if (!dateMin || date < dateMin) dateMin = date;
      if (!dateMax || date > dateMax) dateMax = date;
    }

    rows.push({
      rowId:       i + 2,                  // Actual sheet row number
      date:        date,
      name:        name, email: email, phone: phone,
      rawCategory: rawCat,
      qualified:   cls.qualified,
      bucket:      cls.bucket,             // 'Qualified' | 'Unqualified' | 'Junk' | 'Unknown'
      notes:       notes, revenue: revenue,
      source:      source, campaign: camp, adSet: adSet, ad: ad,
      pageVariant: variant, fbclid: fbclid,
      formAnswers: formAnswers
    });
  }

  // Tag duplicates across the whole dataset (by email, then phone).
  const seen = {};
  rows.forEach(function (r) {
    const key = r.email || r.phone;
    if (!key) { r.isDuplicate = false; return; }
    if (seen[key]) r.isDuplicate = true;
    else { seen[key] = true; r.isDuplicate = false; }
  });

  return { rows: rows, dateMin: dateMin, dateMax: dateMax, columnsResolved: columnsResolved };
}

/**
 * Resolve a Config.gs column spec to a 1-based column index.
 *
 *   1) Exact case-insensitive header match (preferred — so `'Ad'` finds the
 *      "Ad" column, not "Ad Set").
 *   2) Case-insensitive contains match.
 *   3) Treat the spec as a column letter ('A', 'B', 'AA').
 *
 * Returns 0 if nothing matched.
 */
function resolveColumn(spec, headers) {
  const v = (spec == null ? '' : spec.toString()).trim();
  if (!v) return 0;
  const lower = v.toLowerCase();

  // 1) Exact match.
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].toLowerCase().trim() === lower) return i + 1;
  }
  // 2) Contains.
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].toLowerCase().indexOf(lower) !== -1) return i + 1;
  }
  // 3) Column letter form ('A', 'AA', etc.) — only kicks in if no header matched.
  if (/^[A-Za-z]{1,3}$/.test(v)) return colNumber(v);
  return 0;
}

function colLetter(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function colNumber(letters) { let n = 0; for (let i = 0; i < letters.length; i++) n = n * 26 + (letters.toUpperCase().charCodeAt(i) - 64); return n; }

// =============================================================================
// DATE PRESETS  (Today / Yesterday / Last 7 / This Week / Last Month / Last 30 / Custom)
// =============================================================================

function resolveRange(preset, fromIso, toIso, dataMin, dataMax) {
  const now = new Date();
  const sod = function (d) { const x = new Date(d); x.setHours(0, 0, 0, 0);    return x; };
  const eod = function (d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  const add = function (d, days) { const x = new Date(d); x.setDate(x.getDate() + days); return x; };
  const daysBetween = function (a, b) { return Math.round((sod(b) - sod(a)) / 86400000); };

  let from, to, priorFrom, priorTo, label = preset;

  switch (preset) {
    case 'Today':
      from = sod(now); to = eod(now);
      priorFrom = sod(add(now, -1));   priorTo = eod(add(now, -1));
      break;
    case 'Yesterday':
      from = sod(add(now, -1));        to = eod(add(now, -1));
      priorFrom = sod(add(now, -2));   priorTo = eod(add(now, -2));
      break;
    case 'Last 7':
      to = eod(now);                   from = sod(add(now, -6));
      priorTo = eod(add(now, -7));     priorFrom = sod(add(now, -13));
      break;
    case 'This Week':
      // Week starts Monday. JS Sunday = 0.
      var dow = now.getDay() || 7;            // Sun → 7
      from = sod(add(now, -(dow - 1)));       // Mon
      to   = eod(now);
      priorFrom = sod(add(from, -7));
      priorTo   = eod(add(from, -1));
      break;
    case 'Last Month':
      from = sod(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      to   = eod(new Date(now.getFullYear(), now.getMonth(), 0));
      priorFrom = sod(new Date(now.getFullYear(), now.getMonth() - 2, 1));
      priorTo   = eod(new Date(now.getFullYear(), now.getMonth() - 1, 0));
      break;
    case 'Custom':
      from = fromIso ? sod(new Date(fromIso)) : (dataMin || sod(add(now, -29)));
      to   = toIso   ? eod(new Date(toIso))   : (dataMax || eod(now));
      var span = daysBetween(from, to) + 1;
      priorTo   = eod(add(from, -1));
      priorFrom = sod(add(from, -span));
      label = 'Custom';
      break;
    case 'All Time':
      from = dataMin ? sod(dataMin) : sod(add(now, -365));
      to   = dataMax ? eod(dataMax) : eod(now);
      // Prior period for "All Time" doesn't really make sense — use the
      // same length immediately before. (Will usually be empty.)
      var span2 = daysBetween(from, to) + 1;
      priorTo   = eod(add(from, -1));
      priorFrom = sod(add(from, -span2));
      break;
    case 'Last 30':
    default:
      to = eod(now);                        from = sod(add(now, -29));
      priorTo = eod(add(now, -30));         priorFrom = sod(add(now, -59));
      label = 'Last 30';
      break;
  }
  return { from: from, to: to, priorFrom: priorFrom, priorTo: priorTo, label: label };
}

// =============================================================================
// FILTERS
// =============================================================================

function applyFilters(rows, filters, from, to) {
  return rows.filter(function (r) {
    if (from && (!r.date || r.date < from)) return false;
    if (to   && (!r.date || r.date > to))   return false;
    if (filters.campaign    && r.campaign    !== filters.campaign)    return false;
    if (filters.adSet       && r.adSet       !== filters.adSet)       return false;
    if (filters.ad          && r.ad          !== filters.ad)          return false;
    if (filters.pageVariant && r.pageVariant !== filters.pageVariant) return false;
    return true;
  });
}

/**
 * Cascading filter options. Returns:
 *   campaigns          — flat sorted list
 *   adSetsByCampaign   — { campaignName: [adSet,...] }
 *   adsByAdSet         — { campaign|adSet: [ad,...] }
 *   pageVariants       — flat sorted list
 *
 * The popup uses these to chain dropdowns (campaign → ad set → ad).
 */
function buildFilterOptions(rows) {
  const campaigns       = {};
  const adSetsByCamp    = {};
  const adsByAdSet      = {};
  const variants        = {};
  rows.forEach(function (r) {
    if (r.campaign)    campaigns[r.campaign] = 1;
    if (r.pageVariant) variants[r.pageVariant] = 1;
    const c  = r.campaign || '—';
    const as = r.adSet    || '—';
    if (!adSetsByCamp[c]) adSetsByCamp[c] = {};
    if (r.adSet) adSetsByCamp[c][r.adSet] = 1;
    const k = c + '||' + as;
    if (!adsByAdSet[k]) adsByAdSet[k] = {};
    if (r.ad) adsByAdSet[k][r.ad] = 1;
  });
  const sortKeys = function (o) { return Object.keys(o).sort(); };
  const out = {
    campaigns:        sortKeys(campaigns),
    pageVariants:     sortKeys(variants),
    adSetsByCampaign: {},
    adsByAdSet:       {}
  };
  Object.keys(adSetsByCamp).forEach(function (c) { out.adSetsByCampaign[c] = sortKeys(adSetsByCamp[c]); });
  Object.keys(adsByAdSet).forEach(function (k)   { out.adsByAdSet[k]       = sortKeys(adsByAdSet[k]); });
  return out;
}

// =============================================================================
// ANALYSIS
// =============================================================================

function computeKpis(rows) {
  const total     = rows.length;
  const dupes     = rows.filter(function (r) { return r.isDuplicate; }).length;
  const newLeads  = total - dupes;
  const qualified = rows.filter(function (r) { return r.qualified; }).length;
  const sales     = rows.filter(function (r) { return r.revenue > 0; }).length;
  const revenue   = rows.reduce(function (a, r) { return a + (r.revenue || 0); }, 0);
  return {
    totalLeads: total, newLeads: newLeads, duplicates: dupes,
    dupePct: safeDiv(dupes, total),
    qualified: qualified, qualPct: safeDiv(qualified, total),
    sales: sales, closeRate: safeDiv(sales, total),
    revenue: revenue, revPerLead: safeDiv(revenue, total)
  };
}

/**
 * For each KPI: pct change vs prior period + direction. The dashboard turns
 * these into ▲ green / ▼ red pills.
 *
 * `inverted: true` for metrics where lower is better (Dupe %): a drop is
 * shown as green ▼.
 */
function computeDeltas(cur, pri) {
  function delta(c, p, inverted) {
    if (p == null || p === 0) return { pct: null, dir: 'flat', good: null };
    const d = (c - p) / p;
    const dir = d > 0.0001 ? 'up' : (d < -0.0001 ? 'down' : 'flat');
    const good = inverted ? (dir === 'down') : (dir === 'up');
    return { pct: d, dir: dir, good: good };
  }
  return {
    totalLeads: delta(cur.totalLeads, pri.totalLeads, false),
    qualPct:    delta(cur.qualPct,    pri.qualPct,    false),
    dupePct:    delta(cur.dupePct,    pri.dupePct,    true),     // lower = better
    closeRate:  delta(cur.closeRate,  pri.closeRate,  false),
    revenue:    delta(cur.revenue,    pri.revenue,    false),
    revPerLead: delta(cur.revPerLead, pri.revPerLead, false)
  };
}

function dailyVolume(rows, range) {
  if (!range.from || !range.to) return [];
  const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
  const to   = new Date(range.to.getFullYear(),   range.to.getMonth(),   range.to.getDate());
  const buckets = {};
  for (let d = from.getTime(); d <= to.getTime(); d += 86400000) {
    buckets[d] = { total: 0, qualified: 0 };
  }
  rows.forEach(function (r) {
    if (!r.date) return;
    const k = new Date(r.date.getFullYear(), r.date.getMonth(), r.date.getDate()).getTime();
    if (!buckets[k]) buckets[k] = { total: 0, qualified: 0 };
    buckets[k].total++;
    if (r.qualified) buckets[k].qualified++;
  });
  return Object.keys(buckets).sort(function (a, b) { return a - b; }).map(function (k) {
    const b = buckets[k];
    return { date: isoDay(new Date(Number(k))), total: b.total, qualPct: safeDiv(b.qualified, b.total) };
  });
}

function qualityBreakdown(rows) {
  const cats = ['Qualified', 'Unqualified', 'Junk', 'Unknown'];
  return cats.map(function (c) {
    return { label: c, count: rows.filter(function (r) { return r.bucket === c; }).length };
  });
}

/**
 * Replaces the old "Quality by Source" stack — we always know the source is
 * Facebook, so this is more useful: which campaigns are bringing the best
 * quality? Top 10 campaigns shown, normalised to 100% per campaign.
 */
function qualityByCampaign(rows) {
  const buckets = ['Qualified', 'Unqualified', 'Junk', 'Unknown'];
  const counts = {};
  rows.forEach(function (r) {
    const k = r.campaign || '—';
    if (!counts[k]) counts[k] = { Qualified: 0, Unqualified: 0, Junk: 0, Unknown: 0, total: 0 };
    counts[k][r.bucket || 'Unknown']++;
    counts[k].total++;
  });
  const top = Object.keys(counts)
    .map(function (k) { return { key: k, total: counts[k].total }; })
    .sort(function (a, b) { return b.total - a.total; })
    .slice(0, 10)
    .map(function (x) { return x.key; });
  return {
    campaigns: top,
    series: buckets.map(function (b) {
      return { category: b, counts: top.map(function (k) { return counts[k][b]; }) };
    })
  };
}

/**
 * Generic rollup. `keyFn` produces the row key; optional `parentFn` adds a
 * parent-context column (used for Ad Set table to show its campaign, and
 * for Ad table to show campaign / ad-set).
 */
function rollup(rows, keyFn, parentFn) {
  const out = {};
  rows.forEach(function (r) {
    const k = keyFn(r);
    if (!out[k]) {
      out[k] = {
        key: k, parent: parentFn ? parentFn(r) : '',
        leads: 0, qualified: 0, sales: 0, revenue: 0
      };
    }
    out[k].leads++;
    if (r.qualified)   out[k].qualified++;
    if (r.revenue > 0) out[k].sales++;
    out[k].revenue += r.revenue || 0;
  });
  return Object.keys(out).map(function (k) {
    const o = out[k];
    return {
      key: o.key, parent: o.parent,
      leads: o.leads, qualified: o.qualified, qualPct: safeDiv(o.qualified, o.leads),
      sales: o.sales, closeRate: safeDiv(o.sales, o.leads),
      revenue: o.revenue, revPerLead: safeDiv(o.revenue, o.leads)
    };
  }).sort(function (a, b) { return b.revenue - a.revenue || b.leads - a.leads; });
}

/**
 * Errors / data-quality summary. Counts of rows missing key UTM-style fields.
 * Surfaced on the "Errors" tab — replaces the old Sources tab since the
 * source is always Facebook.
 */
function computeErrors(rows) {
  const total = rows.length;
  const missing = function (acc) { return rows.filter(function (r) { return !acc(r); }).length; };

  // Facebook subset for fbclid coverage.
  const fb     = rows.filter(function (r) { return /facebook|fb|meta/i.test(r.source || '') || !r.source; });
  const withId = fb.filter(function (r) { return r.fbclid; }).length;

  return {
    total:           total,
    missingSource:   missing(function (r) { return r.source; }),
    missingCampaign: missing(function (r) { return r.campaign; }),
    missingAdSet:    missing(function (r) { return r.adSet; }),
    missingAd:       missing(function (r) { return r.ad; }),
    missingVariant:  missing(function (r) { return r.pageVariant; }),
    fbLeads:         fb.length,
    withFbclid:      withId,
    fbclidCoverage:  safeDiv(withId, fb.length),

    // Sample rows for each missing dimension — the popup shows them in a
    // table so the user can jump to the row in question.
    samples: {
      noCampaign: rows.filter(function (r) { return !r.campaign; }).slice(0, 25)
                       .map(function (r) { return slimRow(r, 'No campaign tagged'); }),
      noAdSet:    rows.filter(function (r) { return !r.adSet;    }).slice(0, 25)
                       .map(function (r) { return slimRow(r, 'No ad set tagged'); }),
      noAd:       rows.filter(function (r) { return !r.ad;       }).slice(0, 25)
                       .map(function (r) { return slimRow(r, 'No ad tagged'); }),
      noFbclid:   fb.filter(function (r) { return !r.fbclid;     }).slice(0, 25)
                       .map(function (r) { return slimRow(r, 'No fbclid (pixel/CAPI gap)'); })
    }
  };
}

function slimRow(r, reason) {
  return {
    rowId:    r.rowId,
    date:     r.date ? r.date.toISOString() : null,
    name:     r.name, email: r.email,
    campaign: r.campaign, adSet: r.adSet, ad: r.ad,
    reason:   reason
  };
}

// =============================================================================
// FORM INSIGHTS
// =============================================================================

function formInsights(rows) {
  return FORM_QUESTIONS.map(function (q) {
    const answers = rows.map(function (r) { return r.formAnswers[q.label]; }).filter(Boolean);
    if (q.type === 'text') {
      // Show a top-words list AND a top-bigrams list — phrases like
      // "weight loss" or "blood sugar" are usually more meaningful than
      // single words on their own.
      return {
        label: q.label, header: q.header, type: 'text',
        responses: answers.length,
        words:    topNgrams(answers, 1, q.topN || 25),
        phrases:  topNgrams(answers, 2, Math.min(15, q.topN || 25))
      };
    }
    return {
      label: q.label, header: q.header, type: 'choice',
      responses: answers.length,
      bars: topAnswers(answers, q.topN || 10)
    };
  });
}

function topAnswers(answers, n) {
  const counts = {};
  answers.forEach(function (a) {
    const k = a.toString().trim();
    if (!k) return;
    counts[k] = (counts[k] || 0) + 1;
  });
  return Object.keys(counts).map(function (k) { return { label: k, count: counts[k] }; })
    .sort(function (a, b) { return b.count - a.count; })
    .slice(0, n);
}

/**
 * Top n-grams. n=1 → words, n=2 → bigrams. Strips stop words.
 */
function topNgrams(answers, n, topN) {
  const STOP = stopWords();
  const counts = {};
  answers.forEach(function (a) {
    const tokens = (a.toString().toLowerCase().match(/[a-z][a-z']{1,}/g) || [])
      .filter(function (w) { return !STOP[w] && w.length > 2; });
    for (let i = 0; i + n - 1 < tokens.length; i++) {
      const gram = tokens.slice(i, i + n).join(' ');
      counts[gram] = (counts[gram] || 0) + 1;
    }
  });
  return Object.keys(counts).map(function (k) { return { word: k, count: counts[k] }; })
    .filter(function (x) { return x.count >= 2; })   // ignore one-offs — they're noise
    .sort(function (a, b) { return b.count - a.count; })
    .slice(0, topN);
}

function stopWords() {
  // Comprehensive English stop-word list, plus form-answer noise like 'lol' / 'idk'.
  const arr = [
    'a','about','above','after','again','against','all','am','an','and','any','are','as','at','be','because','been','before','being','below','between','both','but','by','can','cant','cannot','could','couldnt','did','didnt','do','does','doesnt','doing','dont','down','during','each','few','for','from','further','had','hadnt','has','hasnt','have','havent','having','he','hed','hell','hes','her','here','heres','hers','herself','him','himself','his','how','hows','i','id','ill','im','ive','if','in','into','is','isnt','it','its','itself','lets','me','more','most','mustnt','my','myself','no','nor','not','of','off','on','once','only','or','other','ought','our','ours','ourselves','out','over','own','same','shant','she','shed','shell','shes','should','shouldnt','so','some','such','than','that','thats','the','their','theirs','them','themselves','then','there','theres','these','they','theyd','theyll','theyre','theyve','this','those','through','to','too','under','until','up','very','was','wasnt','we','wed','well','were','werent','weve','what','whats','when','whens','where','wheres','which','while','who','whos','whom','why','whys','with','wont','would','wouldnt','you','youd','youll','youre','youve','your','yours','yourself','yourselves',
    'just','really','also','still','want','wanting','get','getting','got','feel','feeling','etc','little','lot','lots','bit','kinda','kind','sort','sure','maybe','probably','always','never','ever','one','two','three','take','taking','make','making','put','say','saying','said','done','going','go','went','need','needed','look','looking','see','seen','able','well','good','bad','okay','ok','yes','no','yeah','nope','nah','lol','idk','tbh'
  ];
  const o = {}; arr.forEach(function (w) { o[w] = 1; });
  return o;
}

// =============================================================================
// ALERTS
// =============================================================================

function computeAlerts(rows) {
  const now = new Date();

  // Each alert returns up to 50 rows so the table stays manageable.
  const noNotes = rows.filter(function (r) { return !r.notes; })
    .slice(0, 50)
    .map(function (r) { return alertRow(r, 'No sales notes logged'); });

  const aging = rows.filter(function (r) {
      return r.date && !r.notes && (now - r.date) / 86400000 >= 3;
    })
    .map(function (r) { return alertRow(r, Math.floor((now - r.date) / 86400000) + ' days old, no contact attempt'); })
    .sort(function (a, b) { return b._daysOld - a._daysOld; })
    .slice(0, 50);

  // Underperforming campaigns: aggregate, then flag.
  const camps = {};
  rows.forEach(function (r) {
    const k = r.campaign || '—';
    if (!camps[k]) camps[k] = { total: 0, qual: 0, rev: 0 };
    camps[k].total++;
    if (r.qualified)   camps[k].qual++;
    camps[k].rev += r.revenue || 0;
  });
  const flagged = [];
  Object.keys(camps).forEach(function (k) {
    const c = camps[k];
    if (c.total < 5) return;
    const qPct = c.qual / c.total;
    const rpl  = c.rev  / c.total;
    if (qPct < 0.30 || rpl < 50) {
      const reasons = [];
      if (qPct < 0.30) reasons.push('Qual % below 30%');
      if (rpl  < 50)   reasons.push('Rev/Lead below $50');
      flagged.push({ campaign: k, leads: c.total, qualPct: qPct, revPerLead: rpl, reason: reasons.join('; ') });
    }
  });
  flagged.sort(function (a, b) { return a.qualPct - b.qualPct; });

  return { noNotes: noNotes, aging: aging, underperforming: flagged };
}

function alertRow(r, reason) {
  return {
    rowId:    r.rowId,
    date:     r.date ? r.date.toISOString() : null,
    name:     r.name, email: r.email,
    campaign: r.campaign, ad: r.ad,
    bucket:   r.bucket,
    reason:   reason,
    _daysOld: r.date ? (new Date() - r.date) / 86400000 : 0
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function isBlankRow(r) {
  for (let i = 0; i < r.length; i++) if (r[i] !== '' && r[i] != null) return false;
  return true;
}
function str(v)  { return v == null ? '' : v.toString().trim(); }
function num(v)  { if (v === '' || v == null) return 0; const n = Number(v); return isNaN(n) ? 0 : n; }
function toDate(v) {
  if (v instanceof Date) return v;
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function safeDiv(a, b) { return (!b || isNaN(b)) ? 0 : a / b; }
function isoDay(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}
