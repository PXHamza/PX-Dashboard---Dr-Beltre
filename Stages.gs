/**
 * Stages.gs — PX Medical pipeline stages for the "Funnel Stages" tab.
 *
 * NOTE: the client didn't specify a Lead Category list, so the STAGES
 * array below is a generic medical-practice funnel template. Once the
 * actual CRM stages are confirmed, edit the array — the dashboard will
 * pick up the change on next refresh.
 *
 * Terminal flags:
 *   - Unqualified — the only stage that disqualifies (see Qualification.gs).
 *   - No Show — pre-call drop-off.
 *   - Closed Won — won outcome.
 *   - Closed Lost — lost outcome.
 */

const STAGES = [
  { name: 'New Lead',         match: ['new lead']                                            },
  { name: 'Tried Contacting', match: ['tried contacting', 'attempted']                       },
  { name: 'Consult Booked',   match: ['consult booked', 'consultation booked', 'booked']     },
  { name: 'No Show',          match: ['no show', 'no-show'],                terminal: true   },
  { name: 'Consult Completed',match: ['consult completed', 'consultation completed',
                                      'showed', 'completed']                                 },
  { name: 'Qualified',        match: ['qualified']                                           },
  { name: 'Unqualified',      match: ['unqualified'],                       terminal: true   },
  { name: 'Proposal Sent',    match: ['proposal sent']                                       },
  { name: 'Closed Won',       match: ['closed won', 'won'], won:  true,     terminal: true   },
  { name: 'Closed Lost',      match: ['closed lost', 'lost'], lost: true,   terminal: true   }
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
