/**
 * Qualification.gs — PX lead-qualification rule.
 *
 * A lead is considered UNQUALIFIED only when its Lead Category contains
 * "unqualified" — i.e. the explicit "Unqualified | After The Call" stage.
 * Every other stage — including Filled In Form Didn't Book, Booked
 * Strategy Session, No RSVP - Cancelled, Call #1/#2/#3, No Show,
 * Qualified | Not Ready, Contract Sent, Lost, Not A Fit | Application
 * Cancelled, Won, and Paid — counts as QUALIFIED.
 *
 * Tweaking notes:
 *   - To also exclude "Not A Fit | Application Cancelled" from the
 *     qualified bucket, add 'not a fit' to DISQUALIFYING_KEYWORDS below.
 *   - To exclude no-shows and cancelled bookings (treat only post-call
 *     leads as qualifiable), add 'no show' and 'no rsvp' here.
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
