/**
 * Qualification.gs — Maize Restoration and Remodeling lead-qualification rule.
 *
 * A lead is considered UNQUALIFIED only when its Lead Category contains
 * "unqualified" — which catches both "Unqualified (Post Call)" and
 * "Unqualified (Automatic)". Every other stage (New Lead, Meeting Booked,
 * Meeting Cancelled, No show, Qualified (Post Call), Home Consultation,
 * Quoting, Won, Lost, Cold Lead) counts as QUALIFIED.
 *
 * "Fake Lead" is intercepted by JUNK_KEYWORDS below and rendered in the
 * Junk bucket on the donut.
 */

const QUALIFICATION = {
  /**
   * Lead Category contains ANY of these (case-insensitive, substring) → NOT qualified.
   * Anything else → qualified.
   */
  DISQUALIFYING_KEYWORDS: [
    'unqualified'        // catches "Unqualified (Post Call)" and "Unqualified (Automatic)"
  ],

  /**
   * Outright junk / spam categories. Tracked separately from "Unqualified"
   * so we can show three buckets on the donut: Qualified / Unqualified / Junk.
   * 'fake' catches the "Fake Lead" category.
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
