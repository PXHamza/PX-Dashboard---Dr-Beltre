/**
 * Qualification.gs — PX Medical DTO lead-qualification rule.
 *
 * A lead is UNQUALIFIED when its Lead Category is:
 *   - Unqualified | After The Call
 *   - Not A Fit | Application Cancelled
 *   - Cold Lead List
 *
 * A lead is JUNK when its Lead Category contains:
 *   - Fake Lead
 *
 * Everything else counts as QUALIFIED — including active states
 * (New Lead / Meeting Booked / Call #2 / Contract Sent / Paid /
 * Qualified | Not Ready) and terminal ones that didn't disqualify
 * the lead (No RSVP - Cancelled, No show, Lost).
 */

const QUALIFICATION = {
  DISQUALIFYING_KEYWORDS: [
    'unqualified',            // "Unqualified | After The Call"
    'not a fit',              // "Not A Fit | Application Cancelled"
    'application cancel',     // (matches "Application Cancelled" / "Canceled")
    'cold lead',              // "Cold Lead List"
    'cold list'
  ],
  JUNK_KEYWORDS: [
    'fake'
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
