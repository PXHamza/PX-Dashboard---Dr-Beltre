/**
 * Qualification.gs — Builderwell lead-qualification rule.
 *
 * A lead counts as QUALIFIED unless its Lead Category contains one of the
 * disqualifying keywords below. Aligned with Builderwell's CRM stages so
 * that:
 *   - Pre-call stages (New Lead, Meeting Booked, Cancelled, No show)
 *     are NOT yet qualified — the salesperson hasn't confirmed fit.
 *   - "Qualified (Post Call)" and every later stage (Home Consultation,
 *     3D Scan, …, Build Phase, Won, Lost) all count as qualified, since
 *     the lead passed the post-call screening at some point.
 *   - "Unqualified" / "Unqualified (Post Call)" are explicitly NOT qualified.
 *
 * If Builderwell wants "Meeting Booked" leads to count as qualified
 * (sales-qualified at the booking step rather than post-call), remove
 * 'meeting booked' from DISQUALIFYING_KEYWORDS.
 */

const QUALIFICATION = {
  /**
   * Lead Category contains ANY of these (case-insensitive, substring) → NOT qualified.
   * Anything else → qualified.
   */
  DISQUALIFYING_KEYWORDS: [
    'new lead',
    'meeting booked',
    'meeting cancelled',
    'no show',
    'unqualified'        // catches both "Unqualified" and "Unqualified (Post Call)"
  ],

  /**
   * Outright junk / spam categories. Tracked separately from "Unqualified"
   * so we can show three buckets on the donut: Qualified / Unqualified / Junk.
   */
  JUNK_KEYWORDS: [
    'junk',
    'spam',
    'fake'
  ]
};

/**
 * Returns true iff the raw category indicates a qualified lead.
 * Empty / blank category counts as NOT qualified (we can't assume anything).
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
