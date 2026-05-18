/**
 * Stages.gs — MMT pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client supplied them. The dashboard preserves this order
 * in the distribution chart and breakdown table.
 *
 * Pipeline shape:
 *   New Lead → Call Booked (or Meeting Cancelled / No show side-paths) →
 *   Second Meeting → Custom Follow Up → Deal Won / Deal Lost.
 *
 * Terminal flags:
 *   - Unqualified, Meeting Cancelled, No show — branch / dead-end states.
 *   - Deal Won — won.
 *   - Deal Lost — lost.
 */

const STAGES = [
  { name: 'New Lead',          match: ['new lead']                                    },
  { name: 'Unqualified',       match: ['unqualified'],            terminal: true      },
  { name: 'Meeting Cancelled', match: ['meeting cancelled',
                                       'meeting cancel'],         terminal: true      },
  { name: 'Call Booked',       match: ['call booked']                                 },
  { name: 'No show',           match: ['no show', 'no-show'],     terminal: true      },
  { name: 'Second Meeting',    match: ['second meeting']                              },
  { name: 'Custom Follow Up',  match: ['custom follow up',
                                       'custom follow-up']                            },
  { name: 'Deal Won',          match: ['deal won'],  won:  true,  terminal: true      },
  { name: 'Deal Lost',         match: ['deal lost'], lost: true,  terminal: true      }
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
