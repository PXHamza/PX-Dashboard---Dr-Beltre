/**
 * Stages.gs — Dr Athré pipeline stages.
 *
 * Ordered as the CRM flows: form submission → book meeting → consult →
 * qualified post-call → book surgery → paid.
 *
 * Notes:
 *   - "Won (Surgery)" is the northstar win (won:true). "Won (GLP -1)"
 *     is the secondary GLP-1 downsell win.
 *   - "Unqualified (Automatic)" (form-time) and "Unqualified (Post Call)"
 *     (post-consult) both disqualify — see Qualification.gs.
 *   - GLP-1 auto-routing lives in col Z ("GLP-1 Downsell" value) — see
 *     glpDownsellFlag in Config.gs. The stage list also carries a
 *     "GLP-1 Downsell" bucket for leads whose Lead Category was manually
 *     set that way.
 *   - "Cold Leads" (plural) is the stage name. The tracker formula uses
 *     the singular "Cold Lead"; both variants are covered in excludes.
 *   - Substring-matching keywords are ordered defensively — every match
 *     list is chosen so no keyword accidentally hits a later stage's
 *     label (e.g. "unqualified" alone would match two stages, so we
 *     use the fully-qualified "unqualified (post call)" /
 *     "unqualified (automatic)" keywords).
 */

const STAGES = [
  { name: 'New Lead (Not Booked)',
    match: ['new lead'] },
  { name: 'Meeting 1 Booked',
    match: ['meeting 1 booked'] },
  { name: 'Meeting Cancelled',
    match: ['meeting cancelled', 'meeting canceled'],                terminal: true },
  { name: 'No Show',
    match: ['no show', 'no-show'],                                   terminal: true },
  { name: 'Qualified Post Call (Meeting 2 Booked)',
    match: ['meeting 2 booked', 'qualified post call'] },
  { name: 'Unqualified (Post Call)',
    match: ['unqualified (post call)', 'unqualified post call'],     terminal: true },
  { name: 'Unqualified (Automatic)',
    match: ['unqualified (automatic)', 'unqualified automatic',
            'unqualified auto'],                                     terminal: true },
  { name: 'Waiting for Finance',
    match: ['waiting for finance', 'awaiting finance'] },
  { name: 'Booked Surgery',
    match: ['booked surgery'] },
  { name: 'GLP-1 Downsell',
    match: ['glp-1 downsell', 'glp1 downsell'] },
  { name: 'Won (GLP -1)',
    match: ['won (glp -1)', 'won (glp-1)', 'won glp'],  won: true,   terminal: true },
  { name: 'Won (Surgery)',
    match: ['won (surgery)', 'won surgery'],            won: true,   terminal: true },
  { name: 'Lost',
    match: ['lost'],                                    lost: true,  terminal: true },
  { name: 'Cold Leads',
    match: ['cold lead'],                                            terminal: true },
  { name: 'Fake Lead',
    match: ['fake'],                                                 terminal: true }
];

/**
 * FEATURED_METRICS — small KPI cards under the main strip on Overview.
 * Each entry: (leads whose stage matches stageNames) / total leads,
 * rendered as one card. Set to [] to hide.
 */
const FEATURED_METRICS = [
  // Meeting booked = anyone who booked Meeting 1, whether or not the
  // call has happened yet. Includes every downstream post-booking stage.
  { label: 'Meeting Booked %', stageNames: ['Meeting 1 Booked',
                                             'Meeting Cancelled', 'No Show',
                                             'Qualified Post Call (Meeting 2 Booked)',
                                             'Unqualified (Post Call)',
                                             'Waiting for Finance',
                                             'Booked Surgery',
                                             'Won (Surgery)', 'Won (GLP -1)',
                                             'Lost'],                color: 'blue'   },
  // Northstar win path: booked or completed surgery.
  { label: 'Booked Surgery %', stageNames: ['Booked Surgery',
                                             'Won (Surgery)'],       color: 'green'  },
  // Secondary win path: GLP-1 downsell converted.
  { label: 'GLP-1 Won %',      stageNames: ['Won (GLP -1)'],         color: 'amber'  },
  // Parked in finance approval — worth watching so leads don't stall.
  { label: 'Awaiting Finance %', stageNames: ['Waiting for Finance'], color: 'purple' },
  // Combined win rate — Surgery + GLP-1 as a % of every lead.
  { label: 'Combined Won %',   stageNames: ['Won (Surgery)',
                                             'Won (GLP -1)'],         color: 'pink'   },
  // No-show rate — pre-consult drop-off.
  { label: 'No Show %',        stageNames: ['No Show'],               color: 'red'    }
];

/**
 * NOTE_BREAKDOWN_STAGES — stages whose Sales-team notes are worth
 * charting as top reasons. Left empty for Dr Athré until structured
 * note codes are introduced.
 */
const NOTE_BREAKDOWN_STAGES = [];

/**
 * FUNNELS — sales funnels rendered on the Overview tab (Klaviyo-style
 * horizontal step diagram: big number, %, label, sublabel, KPI line,
 * tapering bar).
 *
 * See Code.gs `computeFunnels` for the full step spec. Every count
 * below mirrors the tracker-sheet COUNTIFS formulas exactly.
 */
const FUNNELS = [
  // -----------------------------------------------------------------------
  // Primary funnel: Booked Surgery (northstar). Each step is a strict
  // subset of the prior step so the funnel tapers left-to-right.
  //
  // GLP-1 downsell leads are excluded from EVERY step here via
  // excludeGlpDownsell: true — they're auto-routed onto their own path
  // at form submission and belong in the secondary funnel below.
  // -----------------------------------------------------------------------
  {
    title:    'Booked Surgery Funnel',
    subtitle: 'Northstar — Meta click → form → consult → surgery.',
    steps: [
      // -------------------------------------------------------------------
      // Row-3 (Target KPIs) column map for Dr Athré's monthly sheet
      // ("SEP - 2026", "OCT - 2026", …). Same layout as the DTO tracker
      // for columns A-U; the count / rate columns (V+) are assumed to
      // follow the DTO pattern — update if Dr Athré's tracker differs.
      //
      //   D  Cost Per Lead           N  CPM                   V  # Booked Consults
      //   E  Cost Per Qualified Lead O  Ad Spend              W  # of Consults Due
      //   F  Cost per booked call    P  CPLC                  X  # of Show ups
      //   G  Cost Per Show Up        Q  U. Outbound Clicks    Y  # of qualified show ups
      //   H  Cost Per Qual. Show Up  R  U.O. CTR              Z  # of new sales
      //   I  CAC                     T  # of Leads            AB % Landing Page Conversion
      //   J  Total pipeline gen.     U  # of Qualified Leads  AC % Qualified lead rate
      //   K  Total Revenue closed                             AD % good fit → book consult
      //   L  ROI                                              AE % show up rate
      //                                                       AF % Qualified Leads from show ups
      //                                                       AG % Close Rate
      // -------------------------------------------------------------------
      { label: 'Total Clicks',            sublabel: 'Meta outbound clicks',
        externalMetric: 'clicks',
        kpiColumn: 'Q',  kpiLabel: 'Clicks',                       kpiFormat: 'int' },
      { label: 'Landing Page CVR',        sublabel: 'Form submissions (all leads)',
        stageNames: '*ALL*',
        kpiColumn: 'AB', kpiLabel: '% Landing Page Conversion',    kpiFormat: 'pct' },
      // # of Qualified Leads: E<>Unqualified (Automatic), E<>Fake Lead,
      //                       E<>Unqualified (Post Call), Z<>GLP-1 Downsell.
      { label: 'Qualified Leads',         sublabel: 'Surgery-eligible (excl. Unqualified & GLP-1)',
        count: { excludeCategories: ['Unqualified (Automatic)',
                                     'Fake Lead',
                                     'Unqualified (Post Call)'],
                 excludeGlpDownsell: true },
        kpiColumn: 'AC', kpiLabel: '% Qualified lead rate',        kpiFormat: 'pct' },
      // # Booked Consults: also excludes New Lead (Not Booked) and
      // Cold Lead(s). Does NOT re-exclude Unqualified (Post Call) —
      // they booked the meeting before being disqualified so they still
      // count as a booked consult here.
      { label: 'Booked Consults',         sublabel: 'A meeting was scheduled',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Unqualified (Automatic)',
                                     'Fake Lead',
                                     'Cold Lead', 'Cold Leads'],
                 excludeGlpDownsell: true },
        kpiColumn: 'AD', kpiLabel: '% good fit → book consult',    kpiFormat: 'pct' },
      // # of Consults Done: also excludes Meeting 1 Booked (still-scheduled)
      // and Meeting Cancelled (called off before it happened). Denominator
      // for Show Up Rate below — matches Show Up % = Y / X in the tracker.
      { label: 'Consults Done',           sublabel: 'Past the "still-scheduled" phase',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Meeting 1 Booked',
                                     'Unqualified (Automatic)',
                                     'Fake Lead',
                                     'Cold Lead', 'Cold Leads',
                                     'Meeting Cancelled'],
                 excludeGlpDownsell: true },
        kpiColumn: 'W',  kpiLabel: 'Target consults due',          kpiFormat: 'int' },
      // # of Show ups: also excludes No Show.
      { label: 'Show Up Rate',            sublabel: 'Attended the consult',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Meeting 1 Booked',
                                     'Meeting Cancelled',
                                     'No Show',
                                     'Unqualified (Automatic)',
                                     'Fake Lead',
                                     'Cold Lead', 'Cold Leads'],
                 excludeGlpDownsell: true },
        kpiColumn: 'AE', kpiLabel: '% show up rate',               kpiFormat: 'pct' },
      // # of qualified show ups: also excludes Unqualified (Post Call).
      { label: 'Qualified Show Ups',      sublabel: 'Attended and stayed qualified post-call',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Meeting 1 Booked',
                                     'Meeting Cancelled',
                                     'No Show',
                                     'Unqualified (Automatic)',
                                     'Unqualified (Post Call)',
                                     'Fake Lead',
                                     'Cold Lead', 'Cold Leads'],
                 excludeGlpDownsell: true },
        kpiColumn: 'AF', kpiLabel: '% Qualified Leads from show ups', kpiFormat: 'pct' },
      // # of new Surgeries: E = "Won (Surgery)". The northstar win.
      { label: 'Sales',                   sublabel: 'Won (Surgery)',
        count: { matchCategories: ['Won (Surgery)'] },
        kpiColumn: 'AG', kpiLabel: '% Close Rate',                 kpiFormat: 'pct' }
    ]
  },

  // -----------------------------------------------------------------------
  // Secondary funnel: GLP-1 downsell. Auto-routed at form submission via
  // col Z = "GLP-1 Downsell". Rendered below the primary funnel with the
  // pink treatment.
  //
  // No KPI columns wired on the middle / last step: Dr Athré's tracker
  // layout past col U isn't fully confirmed yet — update the kpiColumn
  // letters here once the % GLP-1 Downsell rate and % Close Rate (GLP-1)
  // column positions are known.
  // -----------------------------------------------------------------------
  {
    title:    'GLP-1 Downsell Funnel',
    subtitle: 'Secondary — auto-routed at form when a lead doesn\'t qualify for surgery.',
    steps: [
      { label: 'Total Clicks',                 sublabel: 'Meta outbound clicks',
        externalMetric: 'clicks',
        kpiColumn: 'Q', kpiLabel: 'Clicks', kpiFormat: 'int' },
      // # of GLP-1 Downsell: col Z = "GLP-1 Downsell".
      { label: 'Bad Fit Lead in Funnel, GLP-1', sublabel: 'Auto-routed to GLP-1 (flag column Z)',
        count: { matchGlpDownsell: true } },
      // # of new GLP-1: E = "Won (GLP -1)".
      { label: 'Sales',                         sublabel: 'Won (GLP -1)',
        count: { matchCategories: ['Won (GLP -1)'] } }
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
