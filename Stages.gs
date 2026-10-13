/**
 * Stages.gs — Obesity Control Centre (OCC) pipeline stages.
 *
 * Ordered as the CRM flows: form submission → contact → book consult →
 * attend → qualify post-call → good fit → medical records / approval →
 * quote → financing / long-term / booked / lost.
 *
 * Notes:
 *   - "Booked Px (Won)" is the northstar win (won:true).
 *   - "Lost" is the lost branch (lost:true).
 *   - "Unqualified (Post Call 1)" (post-call) is the only explicit
 *     disqualifying stage. "Patients with Problems" also disqualifies
 *     per Qualification.gs. "Duplicate" is treated as junk.
 *   - "Cold Lead" and "Have Not Contacted" are early-funnel parking
 *     states, not disqualifying — they're excluded from downstream
 *     funnel steps but still count as "qualified" for the donut.
 *   - Substring-matching keywords are ordered defensively — e.g.
 *     'consult' alone would be too broad.
 */

const STAGES = [
  { name: 'New Lead (Call ASAP To Book)',
    match: ['new lead (call asap to book)', 'new lead'] },
  { name: 'Have Not Contacted',
    match: ['have not contacted'] },
  { name: 'Cold Lead',
    match: ['cold lead'] },
  { name: 'Consult 1 (Call Booked)',
    match: ['consult 1 (call booked)', 'consult 1', 'call booked'] },
  { name: 'Meeting Cancelled',
    match: ['meeting cancelled', 'meeting canceled'],                terminal: true },
  { name: 'No Show',
    match: ['no show', 'no-show'],                                   terminal: true },
  { name: 'Unqualified (Post Call 1)',
    match: ['unqualified (post call 1)', 'unqualified post call 1',
            'post call 1'],                                          terminal: true },
  { name: 'Good Fit (No Health Questionnaire)',
    match: ['good fit (no health questionnaire)',
            'good fit, no health', 'no health questionnaire'] },
  { name: 'Waiting for Medical Records',
    match: ['waiting for medical records', 'waiting for medical'] },
  { name: "Waiting for Doctor's Approval",
    match: ["waiting for doctor's approval", 'waiting for doctor',
            'doctors approval', "doctor's approval"] },
  { name: 'Quote Sent (Package Discussion)',
    match: ['quote sent (package discussion)', 'quote sent',
            'package discussion'] },
  { name: 'Financing',
    match: ['financing'] },
  { name: 'Long Term',
    match: ['long term', 'long-term'] },
  { name: 'Booked Px (Won)',
    match: ['booked px (won)', 'booked px', 'px (won)'],
                                                        won: true,   terminal: true },
  { name: 'Lost',
    match: ['lost'],                                    lost: true,  terminal: true },
  { name: 'Duplicate',
    match: ['duplicate'],                                            terminal: true },
  { name: 'Patients with Problems',
    match: ['patients with problems', 'problem'],                    terminal: true }
];

/**
 * FEATURED_METRICS — small KPI cards under the main strip on Overview.
 * Each entry: (leads whose stage matches stageNames) / total leads,
 * rendered as one card. Set to [] to hide.
 */
const FEATURED_METRICS = [
  // Consult booking = anyone past the "pre-contact" phase. Includes every
  // downstream post-booking stage.
  { label: 'Consult Booked %',
    stageNames: ['Consult 1 (Call Booked)', 'Meeting Cancelled', 'No Show',
                 'Unqualified (Post Call 1)',
                 'Good Fit (No Health Questionnaire)',
                 'Waiting for Medical Records',
                 "Waiting for Doctor's Approval",
                 'Quote Sent (Package Discussion)',
                 'Financing', 'Long Term',
                 'Booked Px (Won)', 'Lost'],                              color: 'blue'   },

  // Good-fit funnel entry — made it past the post-call qualification bar.
  { label: 'Good Fit %',
    stageNames: ['Good Fit (No Health Questionnaire)',
                 'Waiting for Medical Records',
                 "Waiting for Doctor's Approval",
                 'Quote Sent (Package Discussion)',
                 'Financing', 'Long Term',
                 'Booked Px (Won)', 'Lost'],                              color: 'green'  },

  // Quote stage — an offer is on the table.
  { label: 'Quote Sent %',
    stageNames: ['Quote Sent (Package Discussion)',
                 'Financing', 'Long Term',
                 'Booked Px (Won)', 'Lost'],                              color: 'amber'  },

  // Northstar close rate.
  { label: 'Booked Px (Won) %', stageNames: ['Booked Px (Won)'],          color: 'pink'   },

  // Patients parked in finance.
  { label: 'In Financing %',    stageNames: ['Financing'],                color: 'purple' },

  // No-show rate — pre-consult drop-off.
  { label: 'No Show %',         stageNames: ['No Show'],                  color: 'red'    }
];

/**
 * NOTE_BREAKDOWN_STAGES — stages whose Sales-team notes are worth
 * charting as top reasons. Empty for OCC until structured note codes
 * are introduced.
 */
const NOTE_BREAKDOWN_STAGES = [];

/**
 * FUNNELS — sales funnels rendered on the Overview tab.
 * Every count below mirrors the client's tracker-sheet COUNTIFS
 * formulas exactly.
 */
const FUNNELS = [
  {
    title:    'Patient Acquisition Funnel',
    subtitle: 'Meta click → form → consult → good fit → quote → booked.',
    steps: [
      // -------------------------------------------------------------------
      // Row-3 (Target KPIs) column map for OCC's monthly tracker. Follows
      // the standard PX template (same layout as DTO / Athré / Bensoussan).
      //
      //   D  Cost Per Lead           N  CPM                   V  # Booked Consults
      //   E  Cost Per Qualified Lead O  Ad Spend              W  # of Consults Done
      //   F  Cost per booked call    P  CPLC                  X  # of Show ups
      //   G  Cost Per Show Up        Q  U. Outbound Clicks    Y  # of qualified show ups
      //   H  Cost Per Qual. Show Up  R  U.O. CTR              Z  # of new sales
      //   I  CAC                     T  # of Leads            AB % Landing Page Conversion
      //   J  Total pipeline gen.                              AC % Qualified lead rate
      //   K  Total Revenue closed                             AD % good fit → book consult
      //   L  ROI                                              AE % show up rate
      //                                                       AF % Qualified Leads from show ups   (assumed)
      //                                                       AG % Close Rate                      (assumed)
      // -------------------------------------------------------------------
      { label: 'Total Clicks',            sublabel: 'Meta outbound clicks',
        externalMetric: 'clicks',
        kpiColumn: 'Q',  kpiLabel: 'Clicks',                       kpiFormat: 'int' },
      { label: 'Landing Page CVR',        sublabel: 'Form submissions (all leads)',
        stageNames: '*ALL*',
        kpiColumn: 'AB', kpiLabel: '% Landing Page Conversion',    kpiFormat: 'pct' },
      // # Booked Consults: exclude pre-contact and junk states.
      { label: 'Booked Consults',         sublabel: 'Past the "pre-contact" phase',
        count: { excludeCategories: ['New Lead (Call ASAP To Book)',
                                     'Have Not Contacted',
                                     'Cold Lead',
                                     'Duplicate'] },
        kpiColumn: 'AD', kpiLabel: '% good fit → book consult',    kpiFormat: 'pct' },
      // # of Consults Done: also excludes Consult 1 (Call Booked)
      // (still-scheduled) and Meeting Cancelled.
      // Denominator for Show Up Rate — matches Show Up % = X / W.
      { label: 'Consults Done',           sublabel: 'Past the "still-scheduled" phase',
        count: { excludeCategories: ['New Lead (Call ASAP To Book)',
                                     'Have Not Contacted',
                                     'Cold Lead',
                                     'Duplicate',
                                     'Consult 1 (Call Booked)',
                                     'Meeting Cancelled'] },
        kpiColumn: 'W',  kpiLabel: 'Target consults done',         kpiFormat: 'int' },
      // # of Show ups: also excludes No Show.
      { label: 'Show Up Rate',            sublabel: 'Attended the consult',
        count: { excludeCategories: ['New Lead (Call ASAP To Book)',
                                     'Have Not Contacted',
                                     'Cold Lead',
                                     'Duplicate',
                                     'Consult 1 (Call Booked)',
                                     'Meeting Cancelled',
                                     'No Show'] },
        kpiColumn: 'AE', kpiLabel: '% show up rate',               kpiFormat: 'pct' },
      // # of qualified show ups: also excludes Unqualified (Post Call 1).
      { label: 'Qualified Show Ups',      sublabel: 'Attended and stayed qualified post-call',
        count: { excludeCategories: ['New Lead (Call ASAP To Book)',
                                     'Have Not Contacted',
                                     'Cold Lead',
                                     'Duplicate',
                                     'Consult 1 (Call Booked)',
                                     'Meeting Cancelled',
                                     'No Show',
                                     'Unqualified (Post Call 1)'] },
        kpiColumn: 'AC', kpiLabel: '% Qualified lead rate',        kpiFormat: 'pct' },
      // # of new sales: E = "Booked Px (Won)".
      { label: 'Sales',                   sublabel: 'Booked Px (Won)',
        count: { matchCategories: ['Booked Px (Won)'] },
        kpiColumn: 'AG', kpiLabel: '% Close Rate',                 kpiFormat: 'pct' }
    ]
  }
];

/**
 * Map a raw lead-category value to one of the configured stage names.
 * Returns 'Other' if nothing matches.
 */
function classifyStage(rawCategory) {
  const s = (rawCategory == null ? '' : rawCategory.toString()).toLowerCase().trim();
  if (!s) return 'Other';
  for (let i = 0; i < STAGES.length; i++) {
    const kws = STAGES[i].match;
    for (let j = 0; j < kws.length; j++) {
      if (s.indexOf(kws[j].toLowerCase()) !== -1) return STAGES[i].name;
    }
  }
  return 'Other';
}
