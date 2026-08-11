/**
 * Stages.gs — Attic Construction pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client supplied them. The dashboard preserves this order in
 * the distribution chart and breakdown table.
 *
 * Notes:
 *   - "Qualified (verified / confirmed)" and "Not Qualified" both contain
 *     the substring "qualified". Match keywords are distinctive enough that
 *     they don't collide:
 *       Qualified (...) uses 'qualified (verified', 'verified / confirmed'
 *       Not Qualified uses 'not qualified'
 *   - "Inquired / Not Booked" uses several aliases so the dashboard still
 *     classifies it correctly if sales abbreviates the label.
 *
 * Terminal flags:
 *   - Not Qualified — only stage that disqualifies (see Qualification.gs).
 *   - Deal Won — won.
 *   - Deal Lost — lost.
 */

const STAGES = [
  { name: 'New Lead',                          match: ['new lead']                                              },
  { name: 'Inquired / Not Booked',             match: ['inquired / not booked',
                                                       'inquired',
                                                       'not booked']                                            },
  { name: 'Booking Requested',                 match: ['booking requested']                                     },
  { name: 'Qualified (verified / confirmed)',  match: ['qualified (verified',
                                                       'verified / confirmed',
                                                       'verified']                                              },
  { name: 'Not Qualified',                     match: ['not qualified'],            terminal: true              },
  { name: 'Inspection Booked',                 match: ['inspection booked']                                     },
  { name: 'Deal Lost',                         match: ['deal lost'], lost: true,    terminal: true              },
  { name: 'Deal Won',                          match: ['deal won'],  won:  true,    terminal: true              }
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
const FEATURED_METRICS = [];

/**
 * NOTE_BREAKDOWN_STAGES — optional per-client list of stage names. For
 * each stage listed, the dashboard tallies the distinct Sales-team notes
 * on leads at that stage and renders a horizontal bar chart of the top
 * reasons on the Overview tab. Useful when the notes column carries
 * structured codes like "Auto Unqualified - Under 30 pounds".
 *
 * Leave empty [] to hide the breakdown panels entirely.
 */
const NOTE_BREAKDOWN_STAGES = [];

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
 *
 * The dashboard computes count + % of first step + % of prior step +
 * absolute drop for each step, no extra config required. Leave empty
 * [] to hide the funnels section entirely.
 */
const FUNNELS = [];

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
