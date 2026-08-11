/**
 * Stages.gs — Dr Shim Ching pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client supplied them. The dashboard preserves this order in
 * the distribution chart and breakdown table.
 *
 * Ordering note: "Qualified (Not Moving Forward)" sits BEFORE plain
 * "Qualified" so the more specific phrase matches first. Plain "Qualified"
 * is also positioned AFTER "Unqualified" so a raw value of "Unqualified"
 * binds to its own stage (since 'unqualified' contains 'qualified' as a
 * substring, the more specific keyword has to be checked first).
 *
 * Terminal flags:
 *   - Qualified (Not Moving Forward) — stalled state; not actively progressing.
 *   - Unqualified — only stage that disqualifies (see Qualification.gs).
 *   - No show — pre-call drop-off.
 *   - Deal Won — won.
 *   - Deal Lost — lost.
 */

const STAGES = [
  { name: 'New Lead',                       match: ['new lead']                                            },
  { name: 'Booked Call',                    match: ['booked call']                                         },
  { name: 'Qualified (Not Moving Forward)', match: ['qualified (not moving forward)',
                                                    'qualified not moving forward',
                                                    'not moving forward'],     terminal: true              },
  { name: 'Contacted',                      match: ['contacted']                                           },
  { name: 'Proposal Sent',                  match: ['proposal sent']                                       },
  { name: 'In-Person Booked',               match: ['in-person booked', 'in person booked']                },
  { name: 'Unqualified',                    match: ['unqualified'],            terminal: true              },
  { name: 'Deal Won',                       match: ['deal won'], won:  true,   terminal: true              },
  { name: 'Qualified',                      match: ['qualified']                                           },
  { name: 'No show',                        match: ['no show', 'no-show'],     terminal: true              },
  { name: 'Deal Lost',                      match: ['deal lost'], lost: true,  terminal: true              },
  { name: 'Active in LLP',                  match: ['active in llp']                                       },
  { name: 'Active in SalesApe',             match: ['active in salesape']                                  }
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
