/**
 * Qualification.gs — per-client lead-qualification rule.
 *
 * Every client's funnel labels leads differently. This file contains the
 * single rule that decides "is this lead qualified?" — keep it separate
 * from Code.gs so a client swap is one file edit, not a dozen.
 *
 * The rule below is for a client whose Lead Category column uses values
 * like "New Lead", "Tried Contacting", "Unqualified", "Booked", "Showed",
 * "Closed", etc. We treat anything that contains one of the disqualifying
 * strings as NOT qualified — everything else is qualified.
 *
 * To deploy on a new client:
 *   1) Edit DISQUALIFYING_KEYWORDS to match their non-qualified statuses.
 *   2) Edit JUNK_KEYWORDS for outright junk (counted separately for the
 *      breakdown chart and alert math).
 *   3) Optionally edit displayBucket() if you want fancier grouping for
 *      the donut/legend (e.g. roll "Booked" + "Showed" + "Closed" into
 *      one "Engaged" bucket).
 *
 * Code.gs imports nothing from this file by name — it uses isQualified()
 * and classifyLead() globally, so all you have to do is paste this file
 * into the Apps Script project.
 */

const QUALIFICATION = {
  /**
   * Lead Category contains ANY of these (case-insensitive, substring) → NOT qualified.
   * Anything else → qualified.
   */
  DISQUALIFYING_KEYWORDS: [
    'new lead',
    'tried contacting',
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
  // Junk → not qualified.
  if (QUALIFICATION.JUNK_KEYWORDS.some(function (k) { return s.indexOf(k) !== -1; })) return false;
  // Disqualifying status → not qualified.
  if (QUALIFICATION.DISQUALIFYING_KEYWORDS.some(function (k) { return s.indexOf(k) !== -1; })) return false;
  return true;
}

/**
 * Classify a lead for the donut / breakdown chart.
 *   { qualified: boolean, bucket: 'Qualified'|'Unqualified'|'Junk'|'Unknown' }
 *
 * The bucket is what we colour the donut by; the qualified flag drives KPI
 * math (qualification rate, qualified count, etc.).
 *
 * If you'd rather show the raw category strings on the donut instead of
 * three rolled-up buckets, return `bucket: rawCategory` from the qualified
 * branch. The dashboard will pick up whatever bucket strings you emit.
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
