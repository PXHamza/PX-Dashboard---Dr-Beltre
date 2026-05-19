/**
 * Stages.gs — Attic Construction pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client supplied them. The dashboard preserves this order in
 * the distribution chart and breakdown table.
 *
 * Notes:
 *   - "Qualified (verified / confirmed)" and "Not Qualified" both contain
 *     the substring "qualified". Match keywords are distinctive enough that
 *     they don't collide:
 *       Qualified (...) uses 'qualified (verified', 'verified / confirmed'
 *       Not Qualified uses 'not qualified'
 *   - "Inquired / Not Booked" uses several aliases so the dashboard still
 *     classifies it correctly if sales abbreviates the label.
 *
 * Terminal flags:
 *   - Not Qualified — only stage that disqualifies (see Qualification.gs).
 *   - Deal Won — won.
 *   - Deal Lost — lost.
 */

const STAGES = [
  { name: 'New Lead',                          match: ['new lead']                                              },
  { name: 'Inquired / Not Booked',             match: ['inquired / not booked',
                                                       'inquired',
                                                       'not booked']                                            },
  { name: 'Booking Requested',                 match: ['booking requested']                                     },
  { name: 'Qualified (verified / confirmed)',  match: ['qualified (verified',
                                                       'verified / confirmed',
                                                       'verified']                                              },
  { name: 'Not Qualified',                     match: ['not qualified'],            terminal: true              },
  { name: 'Inspection Booked',                 match: ['inspection booked']                                     },
  { name: 'Deal Lost',                         match: ['deal lost'], lost: true,    terminal: true              },
  { name: 'Deal Won',                          match: ['deal won'],  won:  true,    terminal: true              }
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
