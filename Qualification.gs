/**
 * Qualification.gs — PX Medical DTO lead-qualification rule.
 *
 * Matches the tracker-sheet "# of Qualified Leads" formula exactly:
 * a lead is qualified iff its Lead Category is NOT one of the
 * disqualifying values below. Everything else — including
 * "Unqualified | After The Call" (qualified through the call, then
 * disqualified post-call) and "Cold Lead List" (a qualified cold
 * lead) — counts as QUALIFIED.
 *
 * DISQUALIFYING:
 *   - Not A Fit | Application Cancelled
 *
 * JUNK (tracked separately from Unqualified):
 *   - Fake Lead
 */

const QUALIFICATION = {
  DISQUALIFYING_KEYWORDS: [
    'not a fit',              // "Not A Fit | Application Cancelled"
    'application cancel'      // matches "Application Cancelled" / "Canceled"
  ],
  JUNK_KEYWORDS: [
    'fake'                    // "Fake Lead"
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
