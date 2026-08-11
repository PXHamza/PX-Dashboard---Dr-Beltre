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
 *
 * The dashboard computes count + % of first step + % of prior step +
 * absolute drop for each step, no extra config required. Leave empty
 * [] to hide the funnels section entirely.
 */
const FUNNELS = [
  // -----------------------------------------------------------------------
  // Primary funnel: Booked Surgery (the northstar). Each step is a subset
  // of the prior step so the funnel tapers left-to-right.
  //
  // Interpretation of the sheet's stages:
  //   Landing Page CVR       — every submitted form (all rows in view).
  //   Good Fit Lead          — passed qualification (isQualified).
  //   Calendar Bookings      — reached Booked Consult or any later stage.
  //   Show Up Rate           — moved PAST Booked Consult (so not stuck
  //                            there and not tagged No Show).
  //   Good Fit Post Consult  — booked to meet Beltre (Qualified Moving
  //                            Forward + Booked Surgery + everything
  //                            downstream from there).
  //   Show Up To Beltre      — actually met Beltre (Booked Surgery +
  //                            downstream outcomes).
  //   Close Rate             — Booked Surgery (the win).
  // -----------------------------------------------------------------------
  {
    title:    'Booked Surgery Funnel',
    subtitle: 'Northstar — form submission → surgery booked with Dr Beltre',
    steps: [
      { label: 'Landing Page CVR',       sublabel: 'Form submissions',
        stageNames: '*ALL*' },
      { label: 'Good Fit Lead in Funnel', sublabel: 'Pass qualification',
        stageNames: '*QUALIFIED*' },
      { label: 'Calendar Bookings',      sublabel: 'Book initial call',
        stageNames: ['Booked Consult', 'Booked Surgery',
                     'Qualified (Moving Forward)', 'Won (GLP -1)',
                     'Lost', 'Waiting for Finance', 'GLP-1 Downsell'] },
      { label: 'Show Up Rate',           sublabel: 'Show up to initial call',
        stageNames: ['Booked Surgery', 'Qualified (Moving Forward)',
                     'Won (GLP -1)', 'Lost', 'Waiting for Finance',
                     'GLP-1 Downsell'] },
      { label: 'Good Fit Post Consult',  sublabel: 'Booked to meet Beltre',
        stageNames: ['Qualified (Moving Forward)', 'Booked Surgery',
                     'Won (GLP -1)', 'Lost', 'Waiting for Finance',
                     'GLP-1 Downsell'] },
      { label: 'Show Up To Beltre',      sublabel: 'Meet Beltre',
        stageNames: ['Booked Surgery', 'Won (GLP -1)', 'Lost',
                     'Waiting for Finance', 'GLP-1 Downsell'] },
      { label: 'Close Rate',             sublabel: 'Booked Surgery (win)',
        stageNames: ['Booked Surgery'] }
    ]
  },

  // -----------------------------------------------------------------------
  // Secondary funnel: GLP-1 downsell. Renders below the primary funnel
  // with a pink bar treatment to visually distinguish it.
  // -----------------------------------------------------------------------
  {
    title:    'GLP-1 Downsell Funnel',
    subtitle: 'Secondary — leads that don\'t qualify for surgery but buy GLP-1',
    steps: [
      { label: 'Landing Page CVR',         sublabel: 'Form submissions',
        stageNames: '*ALL*' },
      { label: 'Bad Fit Lead in Funnel, GLP-1', sublabel: 'Qualify for GLP-1 downsell',
        stageNames: ['GLP-1 Downsell', 'Won (GLP -1)'] },
      { label: 'Close Rate',               sublabel: 'GLP-1 downsell closed',
        stageNames: ['Won (GLP -1)'] }
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
