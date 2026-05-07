/**
 * Utils.gs
 * ----------------------------------------------------------------------------
 * Small pure helpers used everywhere: date math, formatting, stats, dedupe.
 * Keep it framework-agnostic — no Sheets API calls in here.
 * ----------------------------------------------------------------------------
 */

// --- Numbers / formatting ----------------------------------------------------

function fmtInt(n)     { return (n == null || isNaN(n)) ? '0' : Math.round(n).toLocaleString('en-US'); }
function fmtPct(n, dp) { dp = dp == null ? 1 : dp; return (n == null || isNaN(n)) ? '0%' : (n * 100).toFixed(dp) + '%'; }
function fmtMoney(n)   { return (n == null || isNaN(n)) ? '$0' : '$' + Math.round(n).toLocaleString('en-US'); }
function safeDiv(a, b) { return (!b || isNaN(b)) ? 0 : (a / b); }

// --- Period-over-period delta arrow + colour --------------------------------
//
// Returns { text: '▲ 12.3%', color: '#3DDC97' } or '▼ ...' for the
// `current` value compared to `prior`. Used in KPI cards.
//
function delta(current, prior) {
  if (!prior || isNaN(prior)) return { text: '—', color: CONFIG.BRAND.TEXT_MUTED };
  const change = (current - prior) / prior;
  const arrow = change >= 0 ? '▲' : '▼';
  const color = change >= 0 ? CONFIG.BRAND.POSITIVE : CONFIG.BRAND.NEGATIVE;
  return { text: arrow + ' ' + Math.abs(change * 100).toFixed(1) + '%', color: color, raw: change };
}

// --- Dates -------------------------------------------------------------------

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d)   { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); }

/**
 * Resolve a named date range (Today / Last 7 / MTD / etc) into
 * { from, to, priorFrom, priorTo, label }.
 *
 * "prior" is the immediately-previous equivalent window — used to compute
 * period-over-period deltas for the hero KPIs.
 */
function resolveDateRange(name, customFrom, customTo) {
  const now = new Date();
  let from, to, priorFrom, priorTo;

  switch ((name || 'Last 30').toString()) {
    case 'Today':
      from = startOfDay(now); to = endOfDay(now);
      priorFrom = startOfDay(addDays(now, -1)); priorTo = endOfDay(addDays(now, -1));
      break;
    case 'Yesterday':
      from = startOfDay(addDays(now, -1)); to = endOfDay(addDays(now, -1));
      priorFrom = startOfDay(addDays(now, -2)); priorTo = endOfDay(addDays(now, -2));
      break;
    case 'Last 7':
      to = endOfDay(now); from = startOfDay(addDays(now, -6));
      priorTo = endOfDay(addDays(now, -7)); priorFrom = startOfDay(addDays(now, -13));
      break;
    case 'MTD':
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      to = endOfDay(now);
      // Prior = same day-count window in the previous month.
      const dayInMonth = now.getDate();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      priorFrom = startOfDay(prevMonthStart);
      priorTo = endOfDay(new Date(now.getFullYear(), now.getMonth() - 1, dayInMonth));
      break;
    case 'Last Month':
      from = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      to   = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      priorFrom = startOfDay(new Date(now.getFullYear(), now.getMonth() - 2, 1));
      priorTo   = endOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 0));
      break;
    case 'Custom':
      from = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(addDays(now, -30));
      to   = customTo   ? endOfDay(new Date(customTo))     : endOfDay(now);
      const span = daysBetween(from, to) + 1;
      priorTo   = endOfDay(addDays(from, -1));
      priorFrom = startOfDay(addDays(from, -span));
      break;
    case 'Last 30':
    default:
      to = endOfDay(now); from = startOfDay(addDays(now, -29));
      priorTo = endOfDay(addDays(now, -30)); priorFrom = startOfDay(addDays(now, -59));
      break;
  }
  return { from: from, to: to, priorFrom: priorFrom, priorTo: priorTo, label: name || 'Last 30' };
}

// --- Category classification -------------------------------------------------

function classifyCategory(raw) {
  const s = (raw == null ? '' : raw.toString()).toLowerCase().trim();
  if (!s) return 'Unknown';
  for (const key of Object.keys(CONFIG.CATEGORIES)) {
    if (CONFIG.CATEGORIES[key].some(function (kw) { return s.indexOf(kw) !== -1; })) {
      return key.charAt(0) + key.slice(1).toLowerCase(); // 'Qualified', 'Unqualified', 'Junk'
    }
  }
  return 'Other';
}

// --- Stats: two-proportion z-test for A/B significance ----------------------
//
// Returns p-value (two-sided) for the null "the two close-rates are equal".
// We use this to flag winning page variants without calling false positives.
//
function twoProportionPValue(x1, n1, x2, n2) {
  if (!n1 || !n2) return 1;
  const p1 = x1 / n1, p2 = x2 / n2;
  const p  = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (!se) return 1;
  const z  = (p1 - p2) / se;
  // Two-sided p-value via Abramowitz & Stegun 7.1.26 erf approximation.
  return 2 * (1 - normalCdf(Math.abs(z)));
}
function normalCdf(z) {
  // Probability that a standard-normal variate ≤ z. Good to ~1e-7.
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989422804 * Math.exp(-z * z / 2);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return 1 - p;
}

// --- Word cloud helpers ------------------------------------------------------

/** Extract a frequency-sorted word list from an array of free-text answers. */
function buildWordFrequencies(texts, topN) {
  const counts = {};
  for (const t of texts) {
    if (!t) continue;
    const words = t.toString().toLowerCase().match(/[a-z][a-z']{2,}/g) || [];
    for (const w of words) {
      if (STOP_WORDS.has(w)) continue;
      counts[w] = (counts[w] || 0) + 1;
    }
  }
  const arr = Object.keys(counts).map(function (w) { return [w, counts[w]]; });
  arr.sort(function (a, b) { return b[1] - a[1]; });
  return arr.slice(0, topN || 25);
}

// --- Misc --------------------------------------------------------------------

/** Distinct, non-empty, sorted values from an array. */
function distinctNonEmpty(arr) {
  const seen = {};
  const out = [];
  for (const v of arr) {
    const k = (v == null ? '' : v.toString()).trim();
    if (!k || seen[k]) continue;
    seen[k] = 1;
    out.push(k);
  }
  out.sort();
  return out;
}

/** Group rows by a key; returns { key: [rows...] }. */
function groupBy(rows, keyFn) {
  const out = {};
  for (const r of rows) {
    const k = keyFn(r);
    (out[k] = out[k] || []).push(r);
  }
  return out;
}
