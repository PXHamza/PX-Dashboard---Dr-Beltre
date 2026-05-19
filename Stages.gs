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
