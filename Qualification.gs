/**
 * Qualification.gs — Dr Bensoussan lead-qualification rule.
 *
 * Mirrors the client's "# of qualified show ups" formula semantics:
 * a lead is NOT qualified when its Lead Category is one of the
 * disqualifying values below. Everything else counts as qualified.
 *
 * DISQUALIFYING:
 *   - DQ Automatic                — auto-tagged at form submission
 *   - Unqualified (Post Call 1)   — manually tagged after the first call
 *
 * JUNK:
 *   (none wired for Dr Bensoussan — the client's CRM doesn't have an
 *   explicit junk / fake-lead bucket. Add here if one gets introduced.)
 */

const QUALIFICATION = {
  DISQUALIFYING_KEYWORDS: [
    'dq automatic',               // "DQ Automatic"
    'dq auto',
    'unqualified (post call 1)',  // "Unqualified (Post Call 1)"
    'unqualified post call 1',
    'post call 1'
  ],
  JUNK_KEYWORDS: []
};

/**
 * Returns true iff the raw category indicates a qualified lead.
 * Empty / blank category counts as NOT qualified.
 */
function isQualified(rawCategory) {
  const s = (rawCategory == null ? '' : rawCategory.toString()).toLowerCase().trim();
  if (!s) return false;
  if (QUALIFICATION.JUNK_KEYWORDS.some(function (k) { return s.indexOf(k) !== -1; })) return false;
  if (QUALIFICATION.DISQUALIFYING_KEYWORDS.some(function (k) { return s.indexOf(k) !== -1; })) return false;
  return true;
}

/**
 * Classify a lead for the donut / breakdown chart.
 *   { qualified: boolean, bucket: 'Qualified'|'Unqualified'|'Junk'|'Unknown' }
 */
function classifyLead(rawCategory) {
  const raw = (rawCategory == null ? '' : rawCategory.toString()).trim();
  const s = raw.toLowerCase();

  if (!s) return { qualified: false, bucket: 'Unknown' };

  if (QUALIFICATION.JUNK_KEYWORDS.some(function (k) { return s.indexOf(k) !== -1; })) {
    return { qualified: false, bucket: 'Junk' };
  }
  if (QUALIFICATION.DISQUALIFYING_KEYWORDS.some(function (k) { return s.indexOf(k) !== -1; })) {
    return { qualified: false, bucket: 'Unqualified' };
  }
  return { qualified: true, bucket: 'Qualified' };
}
