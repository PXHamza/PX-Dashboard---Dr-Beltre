/**
 * Stages.gs — Dr Beltre pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client requested. The dashboard preserves this order in
 * the distribution chart and breakdown table.
 *
 * Notes:
 *   - "Booked Consult" → "Booked Surgery" → "Qualified (Moving Forward)"
 *     is the happy-path progression.
 *   - "Unqualified" is the only stage that disqualifies a lead (see
 *     Qualification.gs).
 *   - "Waiting for Finance" is a parking state — leads here are still
 *     active in the pipeline, just blocked on external approval.
 *   - "GLP-1 Downsell" captures the alternate (lower-priced) product
 *     path — also kept active so leads here still count toward the
 *     pipeline volume.
 *   - The winning stage is "Won (GLP -1)" — that IS the win, and it's
 *     flagged won:true. Legacy rows with just "Won" still classify
 *     into this stage via the 'won' fallback keyword.
 *   - "No Show" is a terminal branch (pre-consult drop-off).
 */

const STAGES = [
  { name: 'New Lead',                   match: ['new lead']                                 },
  { name: 'Tried Contacting',           match: ['tried contacting', 'attempted']            },
  { name: 'Unqualified',                match: ['unqualified'],         terminal: true      },
  { name: 'Booked Consult',             match: ['booked consult']                           },
  { name: 'Booked Surgery',             match: ['booked surgery']                           },
  { name: 'Qualified (Moving Forward)', match: ['qualified (moving forward)',
                                                'qualified moving forward',
                                                'moving forward']                           },
  // The winning stage was renamed to "Won (GLP -1)" — match keywords
  // accept the new label, minor formatting variants, and plain 'won'
  // so any legacy rows still classify correctly.
  { name: 'Won (GLP -1)',               match: ['won (glp -1)', 'won (glp-1)', 'won'],
                                        won:  true,                    terminal: true      },
  { name: 'Lost',                       match: ['lost'], lost: true,    terminal: true      },
  { name: 'Waiting for Finance',        match: ['waiting for finance', 'awaiting finance']  },
  { name: 'GLP-1 Downsell',             match: ['glp-1 downsell', 'glp1 downsell',
                                                'glp-1', 'glp1']                            },
  { name: 'No Show',                    match: ['no show', 'no-show'], terminal: true       }
];

/**
 * FEATURED_METRICS — optional per-client list of extra KPI cards that
 * appear on the Overview tab below the main KPI strip. Each entry
 * computes (leads whose stage matches stageNames) / total leads and
 * renders as one card.
 *
 * Fields per entry:
 *   label       (string, required)   Card label.
 *   stageNames  (string[], required) Stage names (from STAGES above) to
 *                                    include in the numerator.
 *   color       (string, optional)   'green'|'blue'|'pink'|'red'|
 *                                    'amber'|'purple'. Defaults to blue.
 *   as          (string, optional)   'pct' (default) shows a percentage
 *                                    with an "N of M" meta line;
 *                                    'count' shows the raw count.
 *
 * Leave empty [] to hide the strip entirely.
 */
const FEATURED_METRICS = [
  // Booked Calls = leads currently at Booked Consult OR any later stage
  // that implies a call already happened (Booked Surgery, Qualified,
  // Won, Lost, Waiting for Finance, GLP-1 Downsell).
  { label: 'Booked Calls %',   stageNames: ['Booked Consult', 'Booked Surgery',
                                             'Qualified (Moving Forward)',
                                             'Won (GLP -1)', 'Lost',
                                             'Waiting for Finance',
                                             'GLP-1 Downsell'],           color: 'blue'   },
  // Northstar: leads that made it to Booked Surgery — the primary win.
  { label: 'Booked Surgery %', stageNames: ['Booked Surgery'],            color: 'green'  },
  // Secondary win path: downsell to GLP-1.
  { label: 'GLP-1 Won %',      stageNames: ['Won (GLP -1)'],              color: 'amber'  },
  // How much of the pipeline is parked in GLP-1 downsell right now.
  { label: 'GLP-1 Downsell %', stageNames: ['GLP-1 Downsell'],            color: 'pink'   },
  // Combined win rate: Booked Surgery + GLP-1 Won across all leads.
  { label: 'Combined Won %',   stageNames: ['Booked Surgery', 'Won (GLP -1)'],
                                                                          color: 'purple' },
  // No-show rate — pre-consult drop-off.
  { label: 'No Show %',        stageNames: ['No Show'],                   color: 'red'    }
];

/**
 * NOTE_BREAKDOWN_STAGES — optional per-client list of stage names. For
 * each stage listed, the dashboard tallies the distinct Sales-team notes
 * on leads at that stage and renders a horizontal bar chart of the top
 * reasons on the Overview tab. Useful when the notes column carries
 * structured codes like "Auto Unqualified - Under 30 pounds".
 *
 * Leave empty [] to hide the breakdown panels entirely.
 */
const NOTE_BREAKDOWN_STAGES = [
  'Unqualified',      // Sales notes carry "Auto Unqualified - <reason>" strings
  'GLP-1 Downsell'    // Sales notes carry the reason a lead was downsold
];

/**
 * FUNNELS — optional per-client list of sales funnels rendered as
 * horizontal step-diagrams on the Overview tab (Klaviyo-style: big
 * number, label, % of prior, tapering bar chart).
 *
 * Each funnel:
 *   title    (string, required) Panel heading.
 *   subtitle (string, optional) One-line description under the heading.
 *   steps    (object[], required) Ordered stages, top of funnel first.
 *
 * Each step:
 *   label      (string, required) Big label for the step.
 *   sublabel   (string, optional) Small caption under the label.
 *   stageNames Either an array of STAGES names to count, or one of
 *              the shorthand strings:
 *                '*ALL*'       — every lead in the filtered set
 *                '*QUALIFIED*' — every qualified lead (isQualified)
 *   externalMetric (string, optional) An alternative to stageNames. Pulls
 *              the count from the traffic-metrics payload rather than
 *              the leads set. Currently supported keys:
 *                'clicks'  — unique outbound clicks from Meta monthly
 *                            tabs (see loadTrafficMetrics in Code.gs).
 *                'adSpend' — total ad spend from Meta monthly tabs.
 *   kpiColumn  (string, optional) Column letter (e.g. 'F', 'H') whose
 *              row-4 value on the latest overlapping monthly sheet is
 *              displayed as an extra KPI line under the sublabel. If
 *              the cell is empty the card shows "-" — no fabrication.
 *   kpiLabel   (string, optional) Prefix for the KPI line, e.g.
 *              "Cost / booked call". Defaults to "KPI".
 *   kpiFormat  (string, optional) 'money' | 'money2' | 'pct' | 'int' |
 *              'ratio' | 'raw'. Defaults to 'raw' — value shown as-is.
 *
 * The dashboard computes count + % of first step + % of prior step +
 * absolute drop for each step, no extra config required. Leave empty
 * [] to hide the funnels section entirely.
 */
const FUNNELS = [
  // -----------------------------------------------------------------------
  // Primary funnel: Booked Surgery (the northstar). Each step is a strict
  // subset of the prior step so the funnel tapers left-to-right.
  //
  // IMPORTANT: GLP-1 Downsell and Won (GLP -1) are auto-assigned at form
  // submission when a lead doesn't qualify for surgery. Those leads never
  // enter the surgery consult flow, so they're EXCLUDED from every step
  // starting at "Good Fit Lead in Funnel". Unqualified (Auto) is
  // excluded for the same reason.
  //
  // Step-by-step counting rules:
  //   Total Clicks           — Meta outbound clicks (from monthly sheets).
  //   Landing Page CVR       — every form submission (all rows in view).
  //   Good Fit Lead          — qualifies for the SURGERY pipeline. Excludes
  //                            Unqualified, GLP-1 Downsell, Won (GLP -1).
  //   Calendar Bookings      — booked an initial consult. Cumulative:
  //                            counts leads at Booked Consult PLUS every
  //                            downstream surgery-track stage (they had a
  //                            booking at some point). No Show is included
  //                            (a booking that wasn't attended).
  //   Show Up Rate           — attended the initial consult. Progressed
  //                            past Booked Consult and not tagged No Show.
  //   Good Fit Post Consult  — deemed good fit post-consult (booked to
  //                            meet Beltre). Same set as Show Up Rate given
  //                            the current CRM structure — there's no
  //                            explicit "showed up but bad fit" stage
  //                            (those would move back to Unqualified).
  //   Show Up To Beltre      — actually met Beltre. Excludes Qualified
  //                            (Moving Forward), which means "booked to
  //                            meet" but pre-meeting.
  //   Sales                  — Beltre closed them for surgery = Booked
  //                            Surgery. Labelled "Sales" (not "Close
  //                            Rate") because the card shows a count,
  //                            not a percentage. Waiting for Finance is
  //                            booked but pending; excluded from wins.
  // -----------------------------------------------------------------------
  {
    title:    'Booked Surgery Funnel',
    subtitle: 'Northstar — Meta click → surgery booked. GLP-1 & Unqualified auto-assigned at form; both excluded from this funnel.',
    steps: [
      // externalMetric='clicks' pulls the count from loadTrafficMetrics
      // (monthly "MMM - YYYY" sheets). This makes "Landing Page CVR" show
      // the true click-to-lead rate as its "% of prior".
      //
      // Each step also references a row-4 KPI column from the newest
      // monthly sheet in the range — the funnel card renders it under
      // the sublabel. Column letters match the Aug-2026 sheet layout:
      //   D  Cost Per Lead
      //   E  Cost Per Qualified Lead
      //   F  Cost per booked call
      //   G  Cost Per Show Up
      //   H  Cost Per Qual. Show Up
      //   I  Customer Acquisition
      //   O  Ad Spend
      // If a cell in row 4 is blank, the card shows "-" (never fabricated).
      { label: 'Total Clicks',            sublabel: 'Meta outbound clicks',
        externalMetric: 'clicks',
        kpiColumn: 'O',  kpiLabel: 'Ad Spend',              kpiFormat: 'money' },
      { label: 'Landing Page CVR',        sublabel: 'Form submissions (all leads)',
        stageNames: '*ALL*',
        kpiColumn: 'D',  kpiLabel: 'Cost / lead',           kpiFormat: 'money2' },
      // Good Fit for SURGERY. Explicit include-list — safer than
      // *QUALIFIED* which would leave GLP-1 leads in (they're not
      // "unqualified", they're just on a different track).
      { label: 'Good Fit Lead in Funnel', sublabel: 'Surgery-eligible (excl. Unqualified & GLP-1)',
        stageNames: ['New Lead', 'Tried Contacting', 'Booked Consult',
                     'Booked Surgery', 'Qualified (Moving Forward)',
                     'Lost', 'Waiting for Finance', 'No Show'],
        kpiColumn: 'E',  kpiLabel: 'Cost / qualified lead', kpiFormat: 'money2' },
      { label: 'Calendar Bookings',       sublabel: 'Booked a consult (cumulative)',
        stageNames: ['Booked Consult', 'Booked Surgery',
                     'Qualified (Moving Forward)', 'Lost',
                     'Waiting for Finance', 'No Show'],
        kpiColumn: 'F',  kpiLabel: 'Cost / booked call',    kpiFormat: 'money2' },
      { label: 'Show Up Rate',            sublabel: 'Attended initial consult',
        stageNames: ['Booked Surgery', 'Qualified (Moving Forward)',
                     'Lost', 'Waiting for Finance'],
        kpiColumn: 'G',  kpiLabel: 'Cost / show up',        kpiFormat: 'money2' },
      { label: 'Good Fit Post Consult',   sublabel: 'Booked to meet Beltre',
        stageNames: ['Booked Surgery', 'Qualified (Moving Forward)',
                     'Lost', 'Waiting for Finance'],
        kpiColumn: 'H',  kpiLabel: 'Cost / qual. show up',  kpiFormat: 'money2' },
      { label: 'Show Up To Beltre',       sublabel: 'Met Beltre (excl. pre-meeting)',
        stageNames: ['Booked Surgery', 'Lost', 'Waiting for Finance'],
        kpiColumn: 'H',  kpiLabel: 'Cost / qual. show up',  kpiFormat: 'money2' },
      // Renamed from "Close Rate" — it's a count of surgeries booked,
      // not a percentage.
      { label: 'Sales',                   sublabel: 'Booked Surgery (win)',
        stageNames: ['Booked Surgery'],
        kpiColumn: 'I',  kpiLabel: 'Cost / acquisition',    kpiFormat: 'money2' }
    ]
  },

  // -----------------------------------------------------------------------
  // Secondary funnel: GLP-1 downsell. Rendered below the primary funnel
  // with a pink bar treatment. Bad Fit auto-classification happens at
  // form submission — surgery-ineligible leads get routed here directly.
  // -----------------------------------------------------------------------
  {
    title:    'GLP-1 Downsell Funnel',
    subtitle: 'Secondary — auto-routed at form when a lead doesn\'t qualify for surgery',
    steps: [
      { label: 'Total Clicks',             sublabel: 'Meta outbound clicks',
        externalMetric: 'clicks',
        kpiColumn: 'O', kpiLabel: 'Ad Spend',       kpiFormat: 'money' },
      { label: 'Landing Page CVR',         sublabel: 'Form submissions (all leads)',
        stageNames: '*ALL*',
        kpiColumn: 'D', kpiLabel: 'Cost / lead',    kpiFormat: 'money2' },
      { label: 'Bad Fit Lead in Funnel, GLP-1', sublabel: 'Auto-routed to GLP-1 (cumulative)',
        stageNames: ['GLP-1 Downsell', 'Won (GLP -1)'] },
      // Renamed from "Close Rate" for consistency — it's a sales count.
      { label: 'Sales',                    sublabel: 'GLP-1 purchased (win)',
        stageNames: ['Won (GLP -1)'],
        kpiColumn: 'I', kpiLabel: 'Cost / acquisition', kpiFormat: 'money2' }
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
