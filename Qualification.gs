/**
 * Qualification.gs — PX Medical lead-qualification rule.
 *
 * A lead is considered UNQUALIFIED if EITHER:
 *   - Its Lead Category contains "unqualified"  → matches
 *     "Unqualified | After The Call"
 *   - Its Lead Category contains "not a fit"    → matches
 *     "Not A Fit | Application Cancelled"
 *
 * Every other stage — including New Lead (Not Booked), Meeting Booked,
 * No RSVP - Cancelled, No show, Call #2 / Call #3, Qualified | Not
 * Ready, Contract Sent, Paid, Lost, and Cold Lead List — counts as
 * QUALIFIED.
 *
 * "Fake Lead" is intercepted by JUNK_KEYWORDS via the 'fake' entry
 * and rendered in the Junk bucket on the donut.
 *
 * This mirrors the rule set for the sibling "PX" client. If PX Medical
 * wants a stricter definition (e.g. also exclude No show or No RSVP),
 * add the relevant keyword to DISQUALIFYING_KEYWORDS below.
 */

const QUALIFICATION = {
  /**
   * Lead Category contains ANY of these (case-insensitive, substring) → NOT qualified.
   * Anything else → qualified.
   */
  DISQUALIFYING_KEYWORDS: [
    'unqualified',   // matches "Unqualified | After The Call"
    'not a fit'      // matches "Not A Fit | Application Cancelled"
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
