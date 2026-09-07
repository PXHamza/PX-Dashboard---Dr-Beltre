/**
 * Qualification.gs — Dr Athré lead-qualification rule.
 *
 * Matches the tracker-sheet "# of Qualified Leads" formula 1:1 — a
 * lead is qualified iff its Lead Category is NOT one of the disqualifying
 * values below AND its Lead Category 2.0 flag (col Z) is not
 * "GLP-1 Downsell". Everything else — including "Waiting for Finance",
 * "Cold Leads", "Lost", and any of the active mid-funnel stages —
 * counts as QUALIFIED.
 *
 * DISQUALIFYING (from the # of Qualified Leads COUNTIFS):
 *   - Unqualified (Automatic)          — auto-tagged at form submission
 *   - Unqualified (Post Call)          — manually tagged after the consult
 *
 * JUNK (tracked separately):
 *   - Fake Lead
 *
 * Note: the GLP-1 Downsell flag exclusion is handled inside computeFunnels
 * via `excludeGlpDownsell: true` on each funnel step (see Stages.gs) —
 * isQualified() itself only looks at the Lead Category. The quality donut
 * therefore counts GLP-1 leads as either Qualified or Unqualified depending
 * on their Lead Category, which matches the tracker's semantics.
 */

const QUALIFICATION = {
  DISQUALIFYING_KEYWORDS: [
    'unqualified (automatic)',   // "Unqualified (Automatic)"
    'unqualified automatic',
    'unqualified (post call)',   // "Unqualified (Post Call)"
    'unqualified post call'
  ],
  JUNK_KEYWORDS: [
    'fake'                       // "Fake Lead"
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
