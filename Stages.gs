/**
 * Stages.gs — PX OF Funnel pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client supplied them.
 *
 * Terminal flags:
 *   - No RSVP - Cancelled, No Show — pre-call branches.
 *   - Unqualified | After The Call — disqualifying (see Qualification.gs).
 *   - Not A Fit | Application Cancelled — disqualifying.
 *   - Paid — won outcome (no separate "Won" stage in this funnel).
 *   - Lost — lost outcome.
 *   - Fake Lead — junk (see Qualification.gs).
 */

const STAGES = [
  { name: "Filled In Form, Didn't Book",             match: ['filled in form', "didn't book"]                                    },
  { name: 'Booked Strategy Session',                 match: ['booked strategy session', 'strategy session booked']               },
  { name: 'No RSVP - Cancelled',                     match: ['no rsvp - cancelled', 'no rsvp cancelled', 'no rsvp'],
                                                     terminal: true                                                              },
  { name: 'No Show',                                 match: ['no show', 'no-show'],                     terminal: true           },
  { name: 'Unqualified | After The Call',            match: ['unqualified | after the call',
                                                             'unqualified after the call',
                                                             'unqualified'],                            terminal: true           },
  { name: 'Call #2',                                 match: ['call #2', 'call 2']                                                },
  { name: 'Call #3',                                 match: ['call #3', 'call 3']                                                },
  { name: 'Qualified | Not Ready',                   match: ['qualified | not ready',
                                                             'qualified not ready',
                                                             'not ready']                                                        },
  { name: 'Contract Sent',                           match: ['contract sent']                                                    },
  { name: 'Paid',                                    match: ['paid'],   won:  true,                     terminal: true           },
  { name: 'Lost',                                    match: ['lost'],   lost: true,                     terminal: true           },
  { name: 'Not A Fit | Application Cancelled',       match: ['not a fit | application cancelled',
                                                             'not a fit',
                                                             'application cancelled'],                  terminal: true           },
  { name: 'Fake Lead',                               match: ['fake lead'],                              terminal: true           },
  { name: 'Cold Lead List',                          match: ['cold lead list', 'cold lead']                                     }
];

/**
 * FEATURED_METRICS — populated below with the key funnel percentages.
 * These render as an extra KPI-card row on the Overview tab.
 */
const FEATURED_METRICS = [
  // Booked Call % — leads that got past "Filled In Form, Didn't Book",
  // i.e. everything from Booked Strategy Session onward except pre-call
  // drop-offs (No RSVP / No Show).
  { label: 'Booked Call %',   stageNames: ['Booked Strategy Session', 'Unqualified | After The Call',
                                            'Call #2', 'Call #3', 'Qualified | Not Ready',
                                            'Contract Sent', 'Paid', 'Lost',
                                            'Not A Fit | Application Cancelled'],   color: 'blue'   },
  // Contract Sent % — leads at Contract Sent OR past it (Paid).
  { label: 'Contract Sent %', stageNames: ['Contract Sent', 'Paid'],                color: 'purple' },
  // Paid % — the northstar close.
  { label: 'Paid %',          stageNames: ['Paid'],                                 color: 'green'  },
  // No Show + No RSVP combined — pre-call attrition.
  { label: 'No-Show Attrition %', stageNames: ['No Show', 'No RSVP - Cancelled'],   color: 'red'    },
  // Nurture — how many leads are parked long-term.
  { label: 'Nurture %',       stageNames: ['Qualified | Not Ready', 'Cold Lead List'], color: 'amber' }
];

/**
 * NOTE_BREAKDOWN_STAGES — Sales-team notes on Unqualified and
 * Not-A-Fit leads usually carry the specific reason. Surfacing them
 * as bar charts on the Overview tab lets the team see the top DQ
 * patterns at a glance.
 */
const NOTE_BREAKDOWN_STAGES = [
  'Unqualified | After The Call',
  'Not A Fit | Application Cancelled'
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
