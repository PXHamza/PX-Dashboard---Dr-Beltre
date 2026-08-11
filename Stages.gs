/**
 * Stages.gs — per-client pipeline stages for the "Funnel Stages" tab.
 *
 * Every client's CRM has a different set of stages (a SaaS funnel looks
 * nothing like a construction-quote funnel). Defining them once here keeps
 * the dashboard layout fixed while making each client's stages a single
 * file edit.
 *
 * STAGES is an ordered array — roughly the order leads progress through
 * the pipeline. The dashboard preserves this order in the distribution
 * chart and the breakdown table.
 *
 * Each stage object:
 *   name      (string, required)  Display label.
 *   match     (string[], required) Case-insensitive substring keywords
 *                                  that classify a raw Lead Category into
 *                                  this stage. First STAGES entry whose
 *                                  match hits wins — so put more specific
 *                                  variants (e.g. "Unqualified (Post Call)")
 *                                  BEFORE the broad version ("Unqualified").
 *   terminal  (boolean, optional) Dead-end / branch state. Excluded from
 *                                  the "active in pipeline" count.
 *   won       (boolean, optional) Counts toward the win rate. Also implies
 *                                  terminal.
 *   lost      (boolean, optional) Counts toward the lost bucket. Also
 *                                  implies terminal.
 *
 * To deploy on a new client: replace the STAGES list with their CRM stages
 * in the order they appear. Nothing else changes.
 */

const STAGES = [
  { name: 'New Lead',         match: ['new lead']                                 },
  { name: 'Tried Contacting', match: ['tried contacting', 'attempted']            },
  { name: 'Booked Call',      match: ['booked call', 'booked', 'scheduled']       },
  { name: 'Showed Up',        match: ['showed up', 'showed', 'completed call']    },
  { name: 'Qualified',        match: ['qualified']                                },
  { name: 'Unqualified',      match: ['unqualified'],   terminal: true            },
  { name: 'Closed Won',       match: ['closed won', 'won'],  won:  true, terminal: true },
  { name: 'Closed Lost',      match: ['closed lost', 'lost'], lost: true, terminal: true }
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
 * Returns 'Other' if nothing matches — those leads show up in a separate
 * "Unmatched" bucket on the dashboard so a typo in the source data is
 * immediately visible.
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
