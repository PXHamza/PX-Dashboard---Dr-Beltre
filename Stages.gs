/**
 * Stages.gs — Maize Restoration and Remodeling pipeline stages.
 *
 * Ordered roughly as the client supplied them — with one important
 * exception. The user-provided order has "Qualified (Post Call)" BEFORE
 * "Unqualified (Post Call)" / "Unqualified (Automatic)". Because
 * substring matching for 'qualified (post call)' also hits inside the
 * string 'unqualified (post call)' (the 'qualified...' substring sits
 * at index 2), we must classify the Unqualified variants FIRST. The
 * array order below reflects that match-priority requirement; the
 * Stage Distribution chart shows them in this order too.
 *
 * Terminal flags:
 *   - Meeting Cancelled, No show — pre-call branches.
 *   - Unqualified (Post Call), Unqualified (Automatic) — disqualifying.
 *   - Won, Lost — terminal outcomes (won / lost).
 *   - Fake Lead — junk; the donut also tags it as Junk via Qualification.gs.
 */

const STAGES = [
  { name: 'New Lead (Not Booked)',     match: ['new lead (not booked)', 'new lead']                                       },
  { name: 'Meeting Booked',            match: ['meeting booked']                                                          },
  { name: 'Meeting Cancelled',         match: ['meeting cancelled', 'meeting cancel'],            terminal: true          },
  { name: 'No show',                   match: ['no show', 'no-show'],                             terminal: true          },
  // Unqualified variants checked BEFORE the generic Qualified (Post Call)
  // because their raw text contains 'qualified (post call)' as a substring.
  { name: 'Unqualified (Post Call)',   match: ['unqualified (post call)', 'unqualified post call'], terminal: true        },
  { name: 'Unqualified (Automatic)',   match: ['unqualified (automatic)', 'unqualified automatic'], terminal: true        },
  { name: 'Qualified (Post Call)',     match: ['qualified (post call)', 'qualified post call']                            },
  { name: 'Home Consultation',         match: ['home consultation']                                                       },
  { name: 'Quoting',                   match: ['quoting']                                                                 },
  { name: 'Won',                       match: ['won'],  won:  true,                               terminal: true          },
  { name: 'Lost',                      match: ['lost'], lost: true,                               terminal: true          },
  { name: 'Cold Lead',                 match: ['cold lead']                                                                },
  { name: 'Fake Lead',                 match: ['fake lead', 'fake'],                              terminal: true          }
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
