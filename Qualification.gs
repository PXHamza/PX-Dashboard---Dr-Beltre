/**
 * Qualification.gs — Builderwell lead-qualification rule.
 *
 * A lead is considered UNQUALIFIED only when its Lead Category is one of:
 *   - "Unqualified"               (auto-set when the budget answer is
 *                                  Under $200,000)
 *   - "Unqualified (Post Call)"   (set manually by sales after a call)
 *
 * Everything else — including New Lead, Meeting Booked, Meeting Cancelled,
 * No show, Qualified (Post Call), Home Consultation, all later sales
 * stages, Won, and Lost — counts as QUALIFIED.
 *
 * Because both disqualifying buckets contain the substring "unqualified",
 * a single keyword is enough to match both. If Builderwell later adds
 * another disqualifying category, append it to DISQUALIFYING_KEYWORDS.
 */

const QUALIFICATION = {
  /**
   * Lead Category contains ANY of these (case-insensitive, substring) → NOT qualified.
   * Anything else → qualified.
   */
  DISQUALIFYING_KEYWORDS: [
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
