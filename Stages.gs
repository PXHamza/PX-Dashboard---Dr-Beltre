/**
 * Stages.gs — PX Medical DTO pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the CRM flows: form submission → booking → call → close.
 *
 * Notes:
 *   - "Paid" is the northstar win (won:true).
 *   - "Unqualified | After The Call", "Not A Fit | Application Cancelled",
 *     "Fake Lead", and "Cold Lead List" all disqualify the lead (see
 *     Qualification.gs).
 *   - Substring-matching keywords are ordered defensively — every match
 *     list is chosen so no keyword accidentally hits a later stage's
 *     label (e.g. "cancelled" appears in TWO stage names, so we never
 *     use that word alone as a keyword).
 */

const STAGES = [
  { name: 'New Lead (Not Booked)',
    match: ['new lead'] },
  { name: 'Meeting Booked',
    match: ['meeting booked'] },
  { name: 'No RSVP - Cancelled',
    match: ['no rsvp'],                                               terminal: true },
  { name: 'Qualified | Not Ready (Longer-Term Nuture)',
    match: ['not ready', 'longer-term nurture', 'longer-term nuture',
            'longer term nurture', 'longer term nuture'] },
  { name: 'No show',
    match: ['no show', 'no-show'],                                    terminal: true },
  { name: 'Unqualified | After The Call',
    match: ['unqualified'],                                           terminal: true },
  { name: 'Call #2',
    match: ['call #2', 'call 2', 'call2'] },
  { name: 'Contract Sent',
    match: ['contract'] },
  { name: 'Paid',
    match: ['paid'],                                    won:  true,   terminal: true },
  { name: 'Lost',
    match: ['lost'],                                    lost: true,   terminal: true },
  { name: 'Not A Fit | Application Cancelled',
    match: ['not a fit', 'application cancel'],                       terminal: true },
  { name: 'Fake Lead',
    match: ['fake'],                                                  terminal: true },
  { name: 'Cold Lead List',
    match: ['cold lead', 'cold list'],                                terminal: true }
];

/**
 * FEATURED_METRICS — small KPI cards under the main strip on Overview.
 * Each entry: (leads whose stage matches stageNames) / total leads,
 * rendered as one card. Set to [] to hide.
 */
const FEATURED_METRICS = [
  // Meetings booked = anyone who booked, whether or not the call has
  // happened yet. Includes every downstream post-booking stage.
  { label: 'Meeting Booked %', stageNames: ['Meeting Booked', 'No RSVP - Cancelled',
                                             'Qualified | Not Ready (Longer-Term Nuture)',
                                             'No show', 'Unqualified | After The Call',
                                             'Call #2', 'Contract Sent',
                                             'Paid', 'Lost'],           color: 'blue'   },
  // Post-call qualified path (had the call and stayed in play).
  { label: 'Qualified Post Call %',
                                 stageNames: ['Qualified | Not Ready (Longer-Term Nuture)',
                                             'Call #2', 'Contract Sent',
                                             'Paid', 'Lost'],           color: 'green'  },
  // Contract stage — an offer is on the table.
  { label: 'Contract Sent %',  stageNames: ['Contract Sent', 'Paid', 'Lost'],
                                                                        color: 'amber'  },
  // Northstar close rate.
  { label: 'Paid %',            stageNames: ['Paid'],                   color: 'pink'   },
  // No-show rate — pre-consult drop-off.
  { label: 'No Show %',         stageNames: ['No show'],                color: 'red'    }
];

/**
 * NOTE_BREAKDOWN_STAGES — stages whose Sales-team notes are worth
 * charting as top reasons (e.g. "Auto Unqualified - Under 30 pounds").
 * DTO doesn't have structured note codes yet, so left empty.
 */
const NOTE_BREAKDOWN_STAGES = [];

/**
 * FUNNELS — sales funnels rendered on the Overview tab (Klaviyo-style
 * horizontal step diagram: big number, %, label, sublabel, KPI line,
 * tapering bar).
 *
 * See Code.gs `computeFunnels` for the full step spec. Key fields:
 *   externalMetric  'clicks' from the monthly Meta tab.
 *   stageNames      '*ALL*' | '*QUALIFIED*' | [stage names]
 *   count           { matchCategories, excludeCategories,
 *                     matchGlpDownsell, excludeGlpDownsell }
 *                   — mirrors tracker-sheet COUNTIFS exactly.
 *   kpiColumn       Row-3 (Target KPIs) letter on the newest monthly
 *                   sheet in range. Renders as "KPI: <value>".
 *   kpiFormat       'money' | 'money2' | 'pct' | 'int' | 'ratio' | 'raw'.
 *                   For 'pct' the dashboard colours the step-to-step %
 *                   red when actual < target, green when at/above.
 *   kpiLabel        Legacy field kept for future use; the label is not
 *                   printed in the current KPI-line render.
 */
const FUNNELS = [
  {
    title:    'Sales Funnel',
    subtitle: 'Meta click → form submission → booked call → paid.',
    steps: [
      // -------------------------------------------------------------------
      // Row-3 (Target KPIs) column map for PX Medical DTO's monthly sheet
      // ("AUG - 2026", "SEP - 2026", …). Row 2 = headers, row 3 = targets,
      // row 4 = totals.
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
        kpiColumn: 'Q',  kpiLabel: 'Clicks',                          kpiFormat: 'int' },
      { label: 'Landing Page CVR',        sublabel: 'Form submissions (all leads)',
        stageNames: '*ALL*',
        kpiColumn: 'AB', kpiLabel: '% Landing Page Conversion',       kpiFormat: 'pct' },
      // # of Qualified Leads: excludes ONLY Not A Fit | Application
      // Cancelled — everything else (Unqualified | After The Call, Cold
      // Lead List, even Fake Lead) counts as a qualified lead per the
      // tracker-sheet formula.
      { label: 'Qualified Leads',         sublabel: 'Excl. Not A Fit | Application Cancelled',
        count: { excludeCategories: ['Not A Fit | Application Cancelled'] },
        kpiColumn: 'AC', kpiLabel: '% Qualified lead rate',           kpiFormat: 'pct' },
      // # Booked Consults: also excludes New Lead (Not Booked) and
      // Cold Lead List (no consult ever booked for either).
      { label: 'Booked Consults',         sublabel: 'A meeting was scheduled',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Not A Fit | Application Cancelled',
                                     'Fake Lead',
                                     'Cold Lead List'] },
        kpiColumn: 'AD', kpiLabel: '% good fit → book consult',       kpiFormat: 'pct' },
      // # of Consults Due: also excludes Meeting Booked (still-scheduled)
      // and No RSVP - Cancelled (cancelled before it happened).
      // Denominator for Show Up Rate below — matches the tracker Show
      // Up % formula (Y / X).
      { label: 'Consults Done',           sublabel: 'Past the "still-scheduled" phase',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Meeting Booked',
                                     'No RSVP - Cancelled',
                                     'Not A Fit | Application Cancelled',
                                     'Fake Lead',
                                     'Cold Lead List'] },
        kpiColumn: 'W',  kpiLabel: 'Target consults due',            kpiFormat: 'int' },
      // # of Show ups: also excludes No show. Includes Unqualified |
      // After The Call — the person showed up before being disqualified.
      { label: 'Show Up Rate',            sublabel: 'Attended the consult',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Meeting Booked',
                                     'No RSVP - Cancelled',
                                     'No show',
                                     'Not A Fit | Application Cancelled',
                                     'Fake Lead',
                                     'Cold Lead List'] },
        kpiColumn: 'AE', kpiLabel: '% show up rate',                  kpiFormat: 'pct' },
      // # of qualified show ups: also excludes Unqualified | After The
      // Call — attended AND stayed qualified post-call.
      { label: 'Qualified Show Ups',      sublabel: 'Attended and stayed qualified post-call',
        count: { excludeCategories: ['New Lead (Not Booked)',
                                     'Meeting Booked',
                                     'No RSVP - Cancelled',
                                     'No show',
                                     'Unqualified | After The Call',
                                     'Not A Fit | Application Cancelled',
                                     'Fake Lead',
                                     'Cold Lead List'] },
        kpiColumn: 'AF', kpiLabel: '% Qualified Leads from show ups', kpiFormat: 'pct' },
      // # of new sales: exact match on Paid — the northstar win.
      { label: 'Sales',                   sublabel: 'Paid (win)',
        count: { matchCategories: ['Paid'] },
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
