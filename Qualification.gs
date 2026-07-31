/**
 * Qualification.gs — PX OF Funnel lead-qualification rule.
 *
 * A lead is UNQUALIFIED if EITHER:
 *   - Its Lead Category contains 'unqualified' — catches
 *     "Unqualified | After The Call"
 *   - Its Lead Category contains 'not a fit' — catches
 *     "Not A Fit | Application Cancelled"
 *
 * Every other stage — including Filled In Form Didn't Book, Booked
 * Strategy Session, No RSVP - Cancelled, No Show, Call #2 / #3,
 * Qualified | Not Ready, Contract Sent, Paid, Lost, and Cold Lead List
 * — counts as QUALIFIED.
 *
 * "Fake Lead" is intercepted by JUNK_KEYWORDS via 'fake' and rendered
 * in the Junk bucket on the donut.
 *
 * If OF Funnel wants a stricter definition (e.g. exclude No Show or
 * No RSVP), add the relevant keyword to DISQUALIFYING_KEYWORDS below.
 */

const QUALIFICATION = {
  /**
   * Lead Category contains ANY of these (case-insensitive, substring) → NOT qualified.
   * Anything else → qualified.
   */
  DISQUALIFYING_KEYWORDS: [
    'unqualified',   // "Unqualified | After The Call"
    'not a fit'      // "Not A Fit | Application Cancelled"
  ],

  /**
   * Outright junk / spam categories. Tracked separately from "Unqualified"
   * so we can show three buckets on the donut: Qualified / Unqualified / Junk.
   * 'fake' catches "Fake Lead".
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
