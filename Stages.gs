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
