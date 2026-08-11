/**
 * Stages.gs — Builderwell pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered roughly the way leads progress through Builderwell's CRM. The
 * dashboard preserves this order in the distribution chart and breakdown
 * table.
 *
 * Notes on ordering:
 *   - "Unqualified (Post Call)" is listed BEFORE "Unqualified" so the
 *     specific phrase matches first. classifyStage() returns the first
 *     stage whose match keywords hit; a more general "unqualified" entry
 *     would otherwise swallow the post-call variant.
 *   - Branch / dead-end stages (Meeting Cancelled, No show, Unqualified*,
 *     Lost) are flagged terminal: true so they're excluded from the
 *     "Active in Pipeline" count and tinted differently on the chart.
 *   - "Won" / "Lost" are flagged won / lost so they feed the Win Rate KPI.
 */

const STAGES = [
  // Pre-call
  { name: 'New Lead (Not Booked)',     match: ['new lead (not booked)', 'new lead']                                       },
  { name: 'Meeting Booked',            match: ['meeting booked']                                                          },
  { name: 'Meeting Cancelled',         match: ['meeting cancelled', 'meeting cancel'],            terminal: true          },
  { name: 'No show',                   match: ['no show', 'no-show'],                             terminal: true          },

  // Post-call screening
  { name: 'Qualified (Post Call)',     match: ['qualified (post call)', 'qualified post call']                            },
  { name: 'Unqualified (Post Call)',   match: ['unqualified (post call)', 'unqualified post call'], terminal: true        },
  { name: 'Unqualified',               match: ['unqualified'],                                    terminal: true          },

  // Sales process
  { name: 'Home Consultation',                         match: ['home consultation']                                       },
  { name: '3D Scan Completed',                         match: ['3d scan completed', '3d scan']                            },
  { name: 'In Office Estimate Review',                 match: ['in office estimate review', 'estimate review']            },
  { name: 'Design and Architecture Proposal Presented',match: ['design and architecture proposal', 'design and architecture'] },
  { name: 'Design Package Signed or Deposit Paid',     match: ['design package signed', 'deposit paid']                   },
  { name: 'Plans Approved',                            match: ['plans approved']                                          },
  { name: 'Construction Proposal Presented',           match: ['construction proposal presented', 'construction proposal'] },
  { name: 'Build Phase',                               match: ['build phase']                                             },

  // Terminal outcomes
  { name: 'Won',                       match: ['won'],   won:  true, terminal: true              },
  { name: 'Lost',                      match: ['lost'],  lost: true, terminal: true              }
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
