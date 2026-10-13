/**
 * Stages.gs — Dr Bensoussan pipeline stages.
 *
 * Ordered as the CRM flows: form submission → book consult 1 → attend →
 * qualified post-call → book consult 2 → waiting / lost / won.
 *
 * Notes:
 *   - "New Patient Won" is the northstar win (won:true).
 *   - "Good Fit, Lost The Deal" is the lost branch (lost:true).
 *   - "DQ Automatic" (form-time) and "Unqualified (Post Call 1)"
 *     (post-call) both disqualify — see Qualification.gs.
 *   - Substring-matching keywords are ordered defensively — every match
 *     list is chosen so no keyword accidentally hits a later stage's
 *     label (e.g. 'consult' alone would catch "Consult 1" AND "Consult 2",
 *     so we use the fully-qualified "consult 1" / "consult 2" keywords).
 */

const STAGES = [
  { name: 'New Lead (Not Booked)',
    match: ['new lead'] },
  { name: 'Consult 1 - Call Booked',
    match: ['consult 1 - call booked', 'consult 1', 'call booked'] },
  { name: 'Meeting Cancelled',
    match: ['meeting cancelled', 'meeting canceled'],                terminal: true },
  { name: 'No Show',
    match: ['no show', 'no-show'],                                   terminal: true },
  { name: 'Unqualified (Post Call 1)',
    match: ['unqualified (post call 1)', 'unqualified post call 1',
            'post call 1'],                                          terminal: true },
  { name: 'Good Fit, No Consult Booked',
    match: ['good fit, no consult', 'no consult booked'] },
  { name: 'Consult 2 - In Office',
    match: ['consult 2 - in office', 'consult 2', 'in office'] },
  { name: 'Good Fit, Waiting to Proceed',
    match: ['good fit, waiting', 'waiting to proceed'] },
  { name: 'Good Fit, Lost The Deal',
    match: ['good fit, lost', 'lost the deal'],         lost: true,  terminal: true },
  { name: 'New Patient Won',
    match: ['new patient won', 'new patient'],          won: true,   terminal: true },
  { name: 'DQ Automatic',
    match: ['dq automatic', 'dq auto'],                              terminal: true }
];

/**
 * FEATURED_METRICS — small KPI cards under the main strip on Overview.
 * Each entry: (leads whose stage matches stageNames) / total leads,
 * rendered as one card. Set to [] to hide.
 */
const FEATURED_METRICS = [
  // Booked a consult = anyone past New Lead (Not Booked), excluding
  // auto-DQ'd leads. Includes every downstream post-booking stage.
  { label: 'Consult 1 Booked %', stageNames: ['Consult 1 - Call Booked',
                                               'Meeting Cancelled', 'No Show',
                                               'Unqualified (Post Call 1)',
                                               'Good Fit, No Consult Booked',
                                               'Consult 2 - In Office',
                                               'Good Fit, Waiting to Proceed',
                                               'Good Fit, Lost The Deal',
                                               'New Patient Won'],      color: 'blue'   },
  // Second-consult booking rate — a strong buying signal.
  { label: 'Consult 2 Booked %', stageNames: ['Consult 2 - In Office',
                                               'Good Fit, Waiting to Proceed',
                                               'Good Fit, Lost The Deal',
                                               'New Patient Won'],      color: 'green'  },
  // Pipeline parked waiting for the patient to proceed with treatment.
  { label: 'Waiting to Proceed %',
                                 stageNames: ['Good Fit, Waiting to Proceed'],
                                                                        color: 'amber'  },
  // Northstar close rate.
  { label: 'New Patient Won %',  stageNames: ['New Patient Won'],       color: 'pink'   },
  // No-show rate — pre-consult drop-off.
  { label: 'No Show %',          stageNames: ['No Show'],               color: 'red'    }
];

/**
 * NOTE_BREAKDOWN_STAGES — stages whose Sales-team notes are worth
 * charting as top reasons. Dr Bensoussan doesn't have structured note
 * codes yet, so left empty.
 */
const NOTE_BREAKDOWN_STAGES = [];

/**
 * FUNNELS — sales funnels rendered on the Overview tab (Klaviyo-style
 * horizontal step diagram: big number, %, label, sublabel, KPI line,
 * tapering bar).
 *
 * See Code.gs `computeFunnels` for the full step spec. Every count
 * below mirrors the client's tracker-sheet COUNTIFS formulas exactly.
 */
const FUNNELS = [
  {
    title:    'Patient Acquisition Funnel',
    subtitle: 'Meta click → form → consult 1 → consult 2 → new patient won.',
    steps: [
      // -------------------------------------------------------------------
      // Row-3 (Target KPIs) column map — read from the client's screenshot
      // of SEP/OCT - 2026. Row 2 = headers, row 3 = targets, row 4 = totals.
      //
      //   G  Cost Per Show Up      N  CPM                   V  # Booked Consults
      //   H  Cost Per Qual. Show   O  Ad Spend              W  # of Consults Done
      //   I  Patient Acq. Cost     P  CPLC                  X  # of Show ups
      //   J  Total pipeline gen.   Q  U. Outbound Clicks    Y  # of qualified show ups
      //   K  Total Revenue closed  R  U.O.CTR               Z  # New Patients
      //   L  ROI                   T  # of Leads            AB % Landing Page Conversion
      //                                                     AC % Qualified lead rate
      //                                                     AD % of the good fit leads who book consult
      //                                                     AE % show up rate
      //                                                     AF % Qualified Leads from show ups   (assumed)
      //                                                     AG % Close Rate                      (assumed)
      //
      // Columns past AE aren't fully visible in the client screenshot;
      // AF/AG are an educated guess based on the DTO/Athré tracker pattern.
      // Update if the actual sheet differs.
      // -------------------------------------------------------------------
      { label: 'Total Clicks',            sublabel: 'Meta outbound clicks',
        externalMetric: 'clicks',
        kpiColumn: 'Q',  kpiLabel: 'Clicks',                          kpiFormat: 'int' },
      { label: 'Landing Page CVR',        sublabel: 'Form submissions (all leads)',
        stageNames: '*ALL*',
        kpiColumn: 'AB', kpiLabel: '% Landing Page Conversion',       kpiFormat: 'pct' },
      // # Booked Consults: E <> New Lead (Not Booked). Note: unlike other
      // clients, the Bensoussan formula does NOT additionally exclude
      // DQ Automatic or Fake Lead — any lead past "Not Booked" counts.
      { label: 'Booked Consults',         sublabel: 'Past the "not booked" phase',
        count: { excludeCategories: ['New Lead (Not Booked)'] },
        kpiColumn: 'AD', kpiLabel: '% good fit → book consult',       kpiFormat: 'pct' },
      // # of Consults Done: also excludes Consult 1 - Call Booked
      // (still-scheduled) and Meeting Cancelled (called off beforehand).
      // Denominator for Show Up Rate — matches Show Up % = X / W.
      { label: 'Consults Done',           sublabel: 'Past the "still-scheduled" phase',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Consult 1 - Call Booked',
                                     'Meeting Cancelled'] },
        kpiColumn: 'W',  kpiLabel: 'Target consults done',            kpiFormat: 'int' },
      // # of Show ups: also excludes No Show.
      { label: 'Show Up Rate',            sublabel: 'Attended the consult',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Consult 1 - Call Booked',
                                     'Meeting Cancelled',
                                     'No Show'] },
        kpiColumn: 'AE', kpiLabel: '% show up rate',                  kpiFormat: 'pct' },
      // # of qualified show ups: also excludes Unqualified (Post Call 1).
      // Note: Bensoussan's "# of qualified show ups" formula does NOT
      // exclude DQ Automatic either (unlike Dr Athré). Keep the step
      // definition matching the formula verbatim.
      { label: 'Qualified Show Ups',      sublabel: 'Attended and stayed qualified post-call',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Consult 1 - Call Booked',
                                     'Meeting Cancelled',
                                     'No Show',
                                     'Unqualified (Post Call 1)'] },
        kpiColumn: 'AC', kpiLabel: '% Qualified lead rate',           kpiFormat: 'pct' },
      // # New Patients: E = "New Patient Won". The northstar win.
      { label: 'Sales',                   sublabel: 'New Patient Won',
        count: { matchCategories: ['New Patient Won'] },
        kpiColumn: 'AG', kpiLabel: '% Close Rate',                    kpiFormat: 'pct' }
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
