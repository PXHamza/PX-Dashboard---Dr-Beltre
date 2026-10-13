/**
 * Stages.gs — Ploome pipeline stages.
 *
 * Ordered as the CRM flows: form submission → book consult 1 → attend →
 * qualified post-call → good fit → lost or won.
 *
 * Notes:
 *   - "New Client Won" is the northstar win (won:true).
 *   - "Good Fit – Lost the Deal" is the lost branch (lost:true). The
 *     client's category uses an en-dash (U+2013) between "Fit" and
 *     "Lost"; match keywords are chosen so classification works whether
 *     the raw cell uses an en-dash, a plain hyphen, or neither.
 *   - "Unqualified (Post Call 1)" is the only disqualifying stage —
 *     see Qualification.gs. Ploome has no form-time auto-DQ bucket.
 *   - Substring-matching keywords are ordered defensively — e.g.
 *     'good fit' alone would match two stages, so each good-fit stage
 *     uses a fully-qualified keyword ('lost the deal' / 'waiting to
 *     proceed') that only its own category contains.
 */

const STAGES = [
  { name: 'New Lead (Call Them ASAP To Book)',
    match: ['new lead (call them asap to book)', 'new lead'] },
  { name: 'Consult 1 - Call Booked',
    match: ['consult 1 - call booked', 'consult 1', 'call booked'] },
  { name: 'Meeting Cancelled',
    match: ['meeting cancelled', 'meeting canceled'],                terminal: true },
  { name: 'No Show',
    match: ['no show', 'no-show'],                                   terminal: true },
  { name: 'Unqualified (Post Call 1)',
    match: ['unqualified (post call 1)', 'unqualified post call 1',
            'post call 1'],                                          terminal: true },
  { name: 'Good Fit – Lost the Deal',
    match: ['lost the deal'],                           lost: true,  terminal: true },
  { name: 'Good Fit, Waiting to Proceed',
    match: ['good fit, waiting', 'waiting to proceed'] },
  { name: 'New Client Won',
    match: ['new client won', 'client won'],            won: true,   terminal: true }
];

/**
 * FEATURED_METRICS — small KPI cards under the main strip on Overview.
 * Each entry: (leads whose stage matches stageNames) / total leads,
 * rendered as one card. Set to [] to hide.
 */
const FEATURED_METRICS = [
  // Consult 1 booked = anyone past "New Lead". Includes every downstream
  // post-booking stage.
  { label: 'Consult Booked %',
    stageNames: ['Consult 1 - Call Booked', 'Meeting Cancelled', 'No Show',
                 'Unqualified (Post Call 1)',
                 'Good Fit – Lost the Deal',
                 'Good Fit, Waiting to Proceed',
                 'New Client Won'],                                   color: 'blue'   },

  // Post-call qualified path (had the call and stayed qualified).
  { label: 'Qualified Post Call %',
    stageNames: ['Good Fit – Lost the Deal',
                 'Good Fit, Waiting to Proceed',
                 'New Client Won'],                                   color: 'green'  },

  // Pipeline parked waiting for the applicant to decide to start.
  { label: 'Waiting to Proceed %',
    stageNames: ['Good Fit, Waiting to Proceed'],                     color: 'amber'  },

  // Northstar close rate.
  { label: 'New Client Won %',
    stageNames: ['New Client Won'],                                   color: 'pink'   },

  // No-show rate — pre-consult drop-off.
  { label: 'No Show %',         stageNames: ['No Show'],              color: 'red'    }
];

/**
 * NOTE_BREAKDOWN_STAGES — stages whose Sales-team notes are worth
 * charting as top reasons. Empty for Ploome until structured note
 * codes are introduced.
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
    subtitle: 'Meta click → form → consult 1 → qualified → new client won.',
    steps: [
      // -------------------------------------------------------------------
      // Row-3 (Target KPIs) column map — standard PX template.
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
      // # Booked Consults: E <> New Lead (Call Them ASAP To Book).
      { label: 'Booked Consults',         sublabel: 'Past the "not booked" phase',
        count: { excludeCategories: ['New Lead (Call Them ASAP To Book)'] },
        kpiColumn: 'AD', kpiLabel: '% good fit → book consult',    kpiFormat: 'pct' },
      // # of Consults Done: also excludes Consult 1 - Call Booked
      // (still-scheduled) and Meeting Cancelled (called off beforehand).
      // Denominator for Show Up Rate — matches Show Up % = X / W.
      { label: 'Consults Done',           sublabel: 'Past the "still-scheduled" phase',
        count: { excludeCategories: ['New Lead (Call Them ASAP To Book)',
                                     'Consult 1 - Call Booked',
                                     'Meeting Cancelled'] },
        kpiColumn: 'W',  kpiLabel: 'Target consults done',         kpiFormat: 'int' },
      // # of Show ups: also excludes No Show.
      { label: 'Show Up Rate',            sublabel: 'Attended the consult',
        count: { excludeCategories: ['New Lead (Call Them ASAP To Book)',
                                     'Consult 1 - Call Booked',
                                     'Meeting Cancelled',
                                     'No Show'] },
        kpiColumn: 'AE', kpiLabel: '% show up rate',               kpiFormat: 'pct' },
      // # of qualified show ups: also excludes Unqualified (Post Call 1).
      { label: 'Qualified Show Ups',      sublabel: 'Attended and stayed qualified post-call',
        count: { excludeCategories: ['New Lead (Call Them ASAP To Book)',
                                     'Consult 1 - Call Booked',
                                     'Meeting Cancelled',
                                     'No Show',
                                     'Unqualified (Post Call 1)'] },
        kpiColumn: 'AC', kpiLabel: '% Qualified lead rate',        kpiFormat: 'pct' },
      // # of new sales: E = "New Client Won". The northstar.
      { label: 'Sales',                   sublabel: 'New Client Won',
        count: { matchCategories: ['New Client Won'] },
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
