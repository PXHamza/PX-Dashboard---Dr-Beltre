/**
 * Code.gs — server-side logic for the PX Lead Intelligence dashboard.
 *
 * Architecture:
 *
 *   onOpen()              Adds the "PX Insights" menu (one button: Dashboard).
 *   showDashboard()       Opens dashboard.html in a modal popup.
 *   getDashboardPayload() Called by the popup via google.script.run; returns
 *                         the brand + initial filter options + the full
 *                         set of KPIs/charts for the requested date range.
 *
 * Everything client-specific lives in Config.gs (column mapping, form
 * questions, brand). This file should rarely need editing.
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

/** Open the dashboard popup. */
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
 * Returns everything the dashboard needs in a single round-trip.
 *
 *   filters: { fromIso, toIso, source, campaign, leadCategory, pageVariant }
 *            All optional. fromIso/toIso default to "all time".
 */
function getDashboardPayload(filters) {
  filters = filters || {};
  const data    = loadAllRows();
  const filtered = applyFilters(data.rows, filters);

  return {
    brand: CONFIG.BRAND,
    filterOptions: {
      sources:       distinct(data.rows.map(function (r) { return r.source; })),
      campaigns:     distinct(data.rows.map(function (r) { return r.campaign; })),
      pageVariants:  distinct(data.rows.map(function (r) { return r.pageVariant; })),
      categories:    Object.keys(CONFIG.CATEGORIES).concat(['Other']),
      dateMin:       data.dateMin ? data.dateMin.toISOString() : null,
      dateMax:       data.dateMax ? data.dateMax.toISOString() : null
    },
    refreshedAt:    new Date().toISOString(),
    columnsResolved: data.columnsResolved,   // surface mapping for the diagnostic banner
    rowCount:        filtered.length,
    kpis:            computeKpis(filtered),
    daily:           dailyVolume(filtered, filters),
    qualityBreakdown:        qualityBreakdown(filtered),
    qualityBySource:         qualityBySource(filtered),
    campaignTable:           campaignRollup(filtered),
    adCreativeTable:         adRollup(filtered),
    pageVariantTable:        pageVariantRollup(filtered),
    sourceTable:             sourceRollup(filtered),
    fbclidCoverage:          fbclidCoverage(filtered),
    formQuestions:           formInsights(filtered),
    alerts:                  computeAlerts(filtered)
  };
}

// =============================================================================
// DATA LOADING & MAPPING
// =============================================================================

/**
 * Load every row from the configured DATA_SHEET, normalised into JS objects
 * keyed by the field names in CONFIG.COLUMNS. Also returns a `columnsResolved`
 * map showing which column letter each field landed on, so the dashboard can
 * surface a friendly diagnostic if the user's headers don't match.
 */
function loadAllRows() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) {
    throw new Error('Sheet "' + CONFIG.DATA_SHEET + '" not found. Update CONFIG.DATA_SHEET in Config.gs.');
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return { rows: [], dateMin: null, dateMax: null, columnsResolved: {} };
  }

  // Read headers and map field keys to 1-based column indices.
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return (h == null ? '' : h.toString()).trim(); });

  const colIdx = {};                                // field key → 1-based col index
  const columnsResolved = {};                       // field key → 'Header (col B)'
  Object.keys(CONFIG.COLUMNS).forEach(function (key) {
    const idx = resolveColumn(CONFIG.COLUMNS[key], headers);
    colIdx[key] = idx;
    columnsResolved[key] = idx
      ? headers[idx - 1] + ' (col ' + colLetter(idx) + ')'
      : '— (not found)';
  });

  // Form-question columns — same lookup against headers.
  const formColIdx = FORM_QUESTIONS.map(function (q) {
    return { q: q, col: resolveColumn(q.header, headers) };
  });

  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const rows = [];
  let dateMin = null, dateMax = null;

  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    if (isBlankRow(r)) continue;

    const date    = colIdx.date    ? toDate(r[colIdx.date - 1])    : null;
    const email   = colIdx.email   ? str(r[colIdx.email - 1]).toLowerCase() : '';
    const name    = colIdx.name    ? str(r[colIdx.name - 1])       : '';
    const phone   = colIdx.phone   ? str(r[colIdx.phone - 1])      : '';
    const cat     = colIdx.leadCategory ? classify(r[colIdx.leadCategory - 1]) : 'Unknown';
    const notes   = colIdx.salesNotes   ? str(r[colIdx.salesNotes - 1]) : '';
    const revenue = colIdx.saleRevenue  ? num(r[colIdx.saleRevenue - 1]) : 0;
    const source  = colIdx.source  ? str(r[colIdx.source - 1])     : '';
    const camp    = colIdx.campaign? str(r[colIdx.campaign - 1])   : '';
    const adSet   = colIdx.adSet   ? str(r[colIdx.adSet - 1])      : '';
    const ad      = colIdx.ad      ? str(r[colIdx.ad - 1])         : '';
    const variant = colIdx.pageVariant ? str(r[colIdx.pageVariant - 1]) : '';
    const fbclid  = colIdx.fbclid  ? str(r[colIdx.fbclid - 1])     : '';

    const formAnswers = {};
    formColIdx.forEach(function (fc) {
      formAnswers[fc.q.label] = fc.col ? str(r[fc.col - 1]) : '';
    });

    if (date) {
      if (!dateMin || date < dateMin) dateMin = date;
      if (!dateMax || date > dateMax) dateMax = date;
    }

    rows.push({
      date: date, name: name, email: email, phone: phone,
      category: cat, notes: notes, revenue: revenue,
      source: source, campaign: camp, adSet: adSet, ad: ad,
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

/** Resolve a Config.gs column spec (header text or letter) to a 1-based index. */
function resolveColumn(spec, headers) {
  const v = (spec == null ? '' : spec.toString()).trim();
  if (!v) return 0;
  // Letter form: A, B, AA, BC...
  if (/^[A-Za-z]{1,3}$/.test(v)) return colNumber(v);
  // Header text — case-insensitive contains.
  const needle = v.toLowerCase();
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].toLowerCase().indexOf(needle) !== -1) return i + 1;
  }
  return 0;
}

function colLetter(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function colNumber(letters) { let n = 0; for (let i = 0; i < letters.length; i++) n = n * 26 + (letters.toUpperCase().charCodeAt(i) - 64); return n; }

// =============================================================================
// FILTERS
// =============================================================================

function applyFilters(rows, filters) {
  const from = filters.fromIso ? new Date(filters.fromIso) : null;
  const to   = filters.toIso   ? new Date(filters.toIso)   : null;
  if (from) from.setHours(0, 0, 0, 0);
  if (to)   to.setHours(23, 59, 59, 999);

  return rows.filter(function (r) {
    if (from && (!r.date || r.date < from)) return false;
    if (to   && (!r.date || r.date > to))   return false;
    if (filters.source       && r.source       !== filters.source)       return false;
    if (filters.campaign     && r.campaign     !== filters.campaign)     return false;
    if (filters.leadCategory && r.category     !== filters.leadCategory) return false;
    if (filters.pageVariant  && r.pageVariant  !== filters.pageVariant)  return false;
    return true;
  });
}

// =============================================================================
// ANALYSIS — one function per dashboard widget
// =============================================================================

function computeKpis(rows) {
  const total     = rows.length;
  const dupes     = rows.filter(function (r) { return r.isDuplicate; }).length;
  const newLeads  = total - dupes;
  const qualified = rows.filter(function (r) { return r.category === 'Qualified'; }).length;
  const sales     = rows.filter(function (r) { return r.revenue > 0; }).length;
  const revenue   = rows.reduce(function (a, r) { return a + (r.revenue || 0); }, 0);

  return {
    totalLeads:  total,
    newLeads:    newLeads,
    duplicates:  dupes,
    dupePct:     safeDiv(dupes, total),
    qualified:   qualified,
    qualPct:     safeDiv(qualified, total),
    sales:       sales,
    closeRate:   safeDiv(sales, total),
    revenue:     revenue,
    revPerLead:  safeDiv(revenue, total)
  };
}

/** [{date:'2026-03-19', total:8, qualPct:0.5}, ...] within the requested window. */
function dailyVolume(rows, filters) {
  // If the user didn't pick dates, infer the window from the rows we have.
  let from = filters.fromIso ? new Date(filters.fromIso) : null;
  let to   = filters.toIso   ? new Date(filters.toIso)   : null;
  rows.forEach(function (r) {
    if (!r.date) return;
    if (!from || r.date < from) from = r.date;
    if (!to   || r.date > to)   to   = r.date;
  });
  if (!from || !to) return [];
  from = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  to   = new Date(to.getFullYear(),   to.getMonth(),   to.getDate());

  const buckets = {};
  for (let d = from.getTime(); d <= to.getTime(); d += 86400000) {
    buckets[d] = { total: 0, qualified: 0 };
  }
  rows.forEach(function (r) {
    if (!r.date) return;
    const k = new Date(r.date.getFullYear(), r.date.getMonth(), r.date.getDate()).getTime();
    if (!buckets[k]) buckets[k] = { total: 0, qualified: 0 };
    buckets[k].total++;
    if (r.category === 'Qualified') buckets[k].qualified++;
  });

  return Object.keys(buckets).sort(function (a, b) { return a - b; })
    .map(function (k) {
      const b = buckets[k];
      return {
        date:   isoDay(new Date(Number(k))),
        total:  b.total,
        qualPct: safeDiv(b.qualified, b.total)
      };
    });
}

function qualityBreakdown(rows) {
  const cats = ['Qualified', 'Unqualified', 'Junk', 'Other', 'Unknown'];
  return cats.map(function (c) {
    return { label: c, count: rows.filter(function (r) { return r.category === c; }).length };
  });
}

function qualityBySource(rows) {
  const cats    = ['Qualified', 'Unqualified', 'Junk', 'Other', 'Unknown'];
  const sources = distinct(rows.map(function (r) { return r.source || '(unknown)'; }));
  return {
    sources: sources,
    series: cats.map(function (c) {
      return {
        category: c,
        counts: sources.map(function (s) {
          return rows.filter(function (r) {
            return (r.source || '(unknown)') === s && r.category === c;
          }).length;
        })
      };
    })
  };
}

function campaignRollup(rows)  { return rollup(rows, function (r) { return r.campaign || '—'; }); }
function adRollup(rows)        { return rollup(rows, function (r) { return r.ad || '—'; }); }
function pageVariantRollup(rows){ return rollup(rows, function (r) { return r.pageVariant || '(none)'; }); }
function sourceRollup(rows)    { return rollup(rows, function (r) { return r.source || '(unknown)'; }); }

function rollup(rows, keyFn) {
  const out = {};
  rows.forEach(function (r) {
    const k = keyFn(r);
    if (!out[k]) out[k] = { key: k, leads: 0, qualified: 0, sales: 0, revenue: 0 };
    out[k].leads++;
    if (r.category === 'Qualified') out[k].qualified++;
    if (r.revenue > 0)               out[k].sales++;
    out[k].revenue += r.revenue || 0;
  });
  return Object.keys(out).map(function (k) {
    const o = out[k];
    return {
      key: o.key,
      leads: o.leads,
      qualified: o.qualified,
      qualPct: safeDiv(o.qualified, o.leads),
      sales: o.sales,
      closeRate: safeDiv(o.sales, o.leads),
      revenue: o.revenue,
      revPerLead: safeDiv(o.revenue, o.leads)
    };
  }).sort(function (a, b) { return b.revenue - a.revenue || b.leads - a.leads; });
}

function fbclidCoverage(rows) {
  const fb     = rows.filter(function (r) { return /facebook|fb|meta/i.test(r.source || ''); });
  const withId = fb.filter(function (r) { return r.fbclid; }).length;
  return {
    fbLeads:     fb.length,
    withFbclid:  withId,
    coverage:    safeDiv(withId, fb.length)
  };
}

function formInsights(rows) {
  return FORM_QUESTIONS.map(function (q) {
    const answers = rows.map(function (r) { return r.formAnswers[q.label]; }).filter(Boolean);
    if (q.type === 'text') {
      return { label: q.label, header: q.header, type: 'text', words: topWords(answers, q.topN || 25) };
    }
    return {
      label: q.label, header: q.header, type: 'choice',
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

function topWords(answers, n) {
  const STOP = ['a','an','and','or','but','if','then','the','this','that','these','those','is','am','are','was','were','be','been','being','have','has','had','do','does','did','to','of','in','on','at','by','for','with','about','as','from','i','you','he','she','it','we','they','me','my','your','his','her','our','their','its','so','no','not','can','will','just','really','very','too','also','than','more','most','some','any','all','only','because','what','when','where','who','why','how','which','there','here','into','over','out','up','down','off','again','still','want','wanting','would','could','should','get','getting','got','feel','feeling','etc','m','s','t','d','re','ve','ll','don','isn','aren','wasn','weren'];
  const stop = {}; STOP.forEach(function (w) { stop[w] = 1; });
  const counts = {};
  answers.forEach(function (a) {
    (a.toString().toLowerCase().match(/[a-z][a-z']{2,}/g) || []).forEach(function (w) {
      if (stop[w]) return;
      counts[w] = (counts[w] || 0) + 1;
    });
  });
  return Object.keys(counts).map(function (k) { return { word: k, count: counts[k] }; })
    .sort(function (a, b) { return b.count - a.count; })
    .slice(0, n);
}

function computeAlerts(rows) {
  const now = new Date();
  const noNotes = rows.filter(function (r) { return !r.notes; }).length;
  const aging   = rows.filter(function (r) {
    return r.date && !r.notes && (now - r.date) / 86400000 >= 3;
  }).length;
  const camps = {};
  rows.forEach(function (r) {
    const k = r.campaign || '—';
    if (!camps[k]) camps[k] = { total: 0, qual: 0, rev: 0 };
    camps[k].total++;
    if (r.category === 'Qualified') camps[k].qual++;
    camps[k].rev += r.revenue || 0;
  });
  const flagged = [];
  Object.keys(camps).forEach(function (k) {
    const c = camps[k];
    if (c.total < 5) return;
    const qPct = c.qual / c.total;
    const rpl  = c.rev  / c.total;
    if (qPct < 0.30 || rpl < 50) {
      flagged.push({ campaign: k, leads: c.total, qualPct: qPct, revPerLead: rpl });
    }
  });
  flagged.sort(function (a, b) { return a.qualPct - b.qualPct; });
  return { noNotes: noNotes, aging: aging, underperforming: flagged };
}

// =============================================================================
// HELPERS
// =============================================================================

function distinct(arr) {
  const seen = {}; const out = [];
  for (let i = 0; i < arr.length; i++) {
    const v = (arr[i] == null ? '' : arr[i].toString()).trim();
    if (!v || seen[v]) continue;
    seen[v] = 1; out.push(v);
  }
  return out.sort();
}

function classify(raw) {
  const s = (raw == null ? '' : raw.toString()).toLowerCase().trim();
  if (!s) return 'Unknown';
  const cats = CONFIG.CATEGORIES;
  for (const key of Object.keys(cats)) {
    if (cats[key].some(function (kw) { return s.indexOf(kw) !== -1; })) return key;
  }
  return 'Other';
}

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
