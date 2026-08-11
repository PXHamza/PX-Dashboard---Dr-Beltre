/**
 * Stages.gs — PX pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client supplied them. The dashboard preserves this order
 * in the distribution chart and breakdown table.
 *
 * Terminal flags:
 *   - No RSVP - Cancelled, No Show, Unqualified | After The Call,
 *     Not A Fit | Application Cancelled — branch / dead-end states.
 *   - Won AND Paid — both flagged won. Paid is the downstream "money in"
 *     state; Won is the contract-signed state. If you'd rather only count
 *     paid deals toward the Win Rate, remove `won: true` from the Won
 *     entry below.
 *   - Lost — flagged lost (terminal).
 *
 * Ordering note: 'Unqualified | After The Call' is matched on its full
 * specific phrase first; the plain 'unqualified' fallback keyword sits
 * in the same entry so any minor wording variation still catches.
 */

const STAGES = [
  { name: "Filled In Form, Didn't Book",              match: ['filled in form', "didn't book"]                                  },
  { name: 'Booked Strategy Session',                  match: ['booked strategy session', 'strategy session booked']             },
  { name: 'No RSVP - Cancelled',                      match: ['no rsvp - cancelled', 'no rsvp cancelled', 'no rsvp'],
                                                      terminal: true                                                            },
  { name: 'Call #1',                                  match: ['call #1', 'call 1']                                              },
  { name: 'No Show',                                  match: ['no show', 'no-show'],                terminal: true              },
  { name: 'Unqualified | After The Call',             match: ['unqualified | after the call',
                                                              'unqualified after the call',
                                                              'unqualified'],                       terminal: true              },
  { name: 'Call #2',                                  match: ['call #2', 'call 2']                                              },
  { name: 'Call #3',                                  match: ['call #3', 'call 3']                                              },
  { name: 'Qualified | Not Ready (Longer-Term Nurture)',
                                                      match: ['qualified | not ready',
                                                              'qualified not ready',
                                                              'longer-term nurture',
                                                              'longer term nurture']                                            },
  { name: 'Contract Sent',                            match: ['contract sent']                                                  },
  { name: 'Lost',                                     match: ['lost'],          lost: true,         terminal: true              },
  { name: 'Not A Fit | Application Cancelled',        match: ['not a fit | application cancelled',
                                                              'not a fit',
                                                              'application cancelled'],             terminal: true              },
  { name: 'Won',                                      match: ['won'],           won:  true,         terminal: true              },
  { name: 'Paid',                                     match: ['paid'],          won:  true,         terminal: true              }
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
