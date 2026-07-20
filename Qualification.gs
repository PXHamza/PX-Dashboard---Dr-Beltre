/**
 * Qualification.gs — PX Medical lead-qualification rule.
 *
 * NOTE: the client didn't specify a qualification rule, so this file uses
 * the generic default: a lead is UNQUALIFIED only when its Lead Category
 * contains the substring "unqualified". Everything else counts as
 * qualified. Adjust DISQUALIFYING_KEYWORDS once the actual funnel stages
 * are confirmed.
 */

const QUALIFICATION = {
  /**
   * Lead Category contains ANY of these (case-insensitive, substring) → NOT qualified.
   * Anything else → qualified.
   */
  DISQUALIFYING_KEYWORDS: [
    'unqualified'
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
