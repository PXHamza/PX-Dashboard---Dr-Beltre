/**
 * Stages.gs — Lincoln Institute pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client supplied them. The dashboard preserves this order
 * in the distribution chart and breakdown table.
 *
 * Pipeline shape:
 *   New Lead → Call Booked (or Quiz Funnel side-path) → Proposal Sent →
 *   Bank Options Sent → Follow Up Call → Supporting Documents Requested →
 *   Bank Application Submitted → Bank Approval → Approved → Purchased.
 *
 * Terminal stages:
 *   - "No show" / "Not qualified" — branch off pre-deal.
 *   - "Purchased" — won.
 *   - "PRE-APPROVAL COLLAPSED" — lost late in the bank-approval process.
 *
 * Ordering note: "Bank Approval" sits before "Approved" so that a raw
 * value of "Bank Approval" matches its own stage. "Approved" uses the
 * exact keyword 'approved' (with the -d), which does NOT substring-match
 * "approval", "pre-approval", etc.
 */

const STAGES = [
  { name: 'New Lead',                       match: ['new lead']                                      },
  { name: 'Call Booked',                    match: ['call booked']                                   },
  { name: 'Quiz Funnel',                    match: ['quiz funnel']                                   },
  { name: 'No show',                        match: ['no show', 'no-show'],            terminal: true },
  { name: 'Not qualified',                  match: ['not qualified'],                 terminal: true },
  { name: 'Proposal Sent',                  match: ['proposal sent']                                 },
  { name: 'Bank Options Sent',              match: ['bank options sent']                             },
  { name: 'Follow Up Call',                 match: ['follow up call', 'follow-up call']              },
  { name: 'Supporting Documents Requested', match: ['supporting documents requested',
                                                    'documents requested']                          },
  { name: 'Bank Application Submitted',     match: ['bank application submitted',
                                                    'application submitted']                        },
  { name: 'Bank Approval',                  match: ['bank approval']                                 },
  { name: 'Approved',                       match: ['approved']                                      },
  { name: 'Purchased',                      match: ['purchased'], won:  true,         terminal: true },
  { name: 'PRE-APPROVAL COLLAPSED',         match: ['pre-approval collapsed',
                                                    'pre approval collapsed',
                                                    'preapproval collapsed'],
                                            lost: true,                               terminal: true }
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
