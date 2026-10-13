/**
 * Qualification.gs — Obesity Control Centre (OCC) lead-qualification rule.
 *
 * NOTE on # of Qualified Leads: the tracker-sheet formula for "# of
 * Qualified Leads" is identical to "# of Leads" (no filter) — so from
 * a tracker perspective every lead is "qualified" at submission. The
 * actual qualification happens post-call via the "Unqualified (Post
 * Call 1)" stage.
 *
 * For the dashboard's quality donut and quality-by-campaign charts we
 * still want a meaningful qualified/unqualified split, so this file
 * disqualifies the categories that explicitly mean "not a candidate":
 *
 * DISQUALIFYING:
 *   - Unqualified (Post Call 1)   — manually tagged after the first call
 *   - Patients with Problems      — flagged problem leads (unlikely to buy)
 *
 * JUNK:
 *   - Duplicate                   — same patient as another row; not a
 *                                   real new lead for quality purposes
 */

const QUALIFICATION = {
  DISQUALIFYING_KEYWORDS: [
    'unqualified (post call 1)',   // "Unqualified (Post Call 1)"
    'unqualified post call 1',
    'post call 1',
    'patients with problems'       // "Patients with Problems"
  ],
  JUNK_KEYWORDS: [
    'duplicate',                   // "Duplicate"
    'fake'                         // defensive — no "Fake Lead" stage today
  ]
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
