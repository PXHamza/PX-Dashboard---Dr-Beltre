/**
 * Qualification.gs — PX lead-qualification rule.
 *
 * A lead is considered UNQUALIFIED if EITHER of the following is true:
 *
 *   1) Its Lead Category contains:
 *        - "Unqualified | After The Call"   (caught by 'unqualified')
 *        - "Not A Fit | Application Cancelled" (caught by 'not a fit')
 *
 *   2) Its form answer to "What is your average yearly revenue?" (col AB)
 *      is "Under $1M". A business below that revenue threshold isn't
 *      a fit for PX regardless of how far they got in the funnel.
 *
 * Every other combination — including Filled In Form Didn't Book, Booked
 * Strategy Session, No RSVP, Call #1/#2/#3, No Show, Qualified | Not Ready,
 * Contract Sent, Lost, Won, and Paid — counts as QUALIFIED.
 *
 * Both functions accept an optional `ctx` second argument that Code.gs
 * passes with the row's form answers. The qualification logic taps into
 * ctx.formAnswers['Yearly Revenue'] (the label set in Config.gs's
 * FORM_QUESTIONS) to apply the revenue-floor rule.
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
   */
  JUNK_KEYWORDS: [
    'junk',
    'spam',
    'fake'
  ],

  /**
   * Form-answer disqualifiers. The label key must match a FORM_QUESTIONS
   * entry in Config.gs. The match keywords are substring-compared against
   * the form answer value (case-insensitive).
   *
   * For PX: the Yearly Revenue question (col AB) disqualifies on "Under $1M".
   */
  FORM_DISQUALIFIERS: [
    { label: 'Yearly Revenue', match: ['under $1m', 'under 1m', 'under $1 million'] }
  ]
};

/**
 * Helper: does any form answer in `formAnswers` trip a FORM_DISQUALIFIERS rule?
 */
function _hasFormDisqualifier(formAnswers) {
  if (!formAnswers) return false;
  for (let i = 0; i < QUALIFICATION.FORM_DISQUALIFIERS.length; i++) {
    const rule = QUALIFICATION.FORM_DISQUALIFIERS[i];
    const answer = (formAnswers[rule.label] || '').toString().toLowerCase().trim();
    if (!answer) continue;
    for (let j = 0; j < rule.match.length; j++) {
      if (answer.indexOf(rule.match[j].toLowerCase()) !== -1) return true;
    }
  }
  return false;
}

/**
 * Returns true iff the raw category + form answers indicate a qualified lead.
 * Empty / blank category counts as NOT qualified.
 */
function isQualified(rawCategory, ctx) {
  const s = (rawCategory == null ? '' : rawCategory.toString()).toLowerCase().trim();
  if (!s) return false;
  if (QUALIFICATION.JUNK_KEYWORDS.some(function (k) { return s.indexOf(k) !== -1; })) return false;
  if (QUALIFICATION.DISQUALIFYING_KEYWORDS.some(function (k) { return s.indexOf(k) !== -1; })) return false;
  if (ctx && _hasFormDisqualifier(ctx.formAnswers)) return false;
  return true;
}

/**
 * Classify a lead for the donut / breakdown chart.
 *   { qualified: boolean, bucket: 'Qualified'|'Unqualified'|'Junk'|'Unknown' }
 */
function classifyLead(rawCategory, ctx) {
  const raw = (rawCategory == null ? '' : rawCategory.toString()).trim();
  const s = raw.toLowerCase();

  if (!s) return { qualified: false, bucket: 'Unknown' };

  if (QUALIFICATION.JUNK_KEYWORDS.some(function (k) { return s.indexOf(k) !== -1; })) {
    return { qualified: false, bucket: 'Junk' };
  }
  if (QUALIFICATION.DISQUALIFYING_KEYWORDS.some(function (k) { return s.indexOf(k) !== -1; })) {
    return { qualified: false, bucket: 'Unqualified' };
  }
  if (ctx && _hasFormDisqualifier(ctx.formAnswers)) {
    // Form-answer-based disqualification — bucketed as "Unqualified" on
    // the donut so it counts visually with the other unqualified leads.
    return { qualified: false, bucket: 'Unqualified' };
  }
  return { qualified: true, bucket: 'Qualified' };
}
