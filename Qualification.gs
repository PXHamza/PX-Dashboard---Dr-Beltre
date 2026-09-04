/**
 * Qualification.gs — Dr Athré lead-qualification rule.
 *
 * NOTE: The full CRM stage list wasn't shared at setup time. The two
 * visible stages in the screenshots — "New Lead (Not Booked)" and
 * "Meeting Booked" — match Dr Athré's sister practice PX Medical DTO's
 * naming, so the rule below defaults to DTO's qualification logic
 * (which mirrors the tracker-sheet "# of Qualified Leads" formula 1:1).
 *
 * Update this file when the client confirms which categories should
 * disqualify a lead. The defaults are conservative — only categories
 * that explicitly say "not a fit" / "application cancelled" disqualify,
 * and only "fake" categories count as junk.
 *
 * DISQUALIFYING (default):
 *   - Not A Fit | Application Cancelled
 *
 * JUNK (default, tracked separately from Unqualified):
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
