/**
 * Stages.gs — PX Medical pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client supplied them. The dashboard preserves this order
 * in the distribution chart and breakdown table.
 *
 * Terminal flags:
 *   - No RSVP - Cancelled, No show — pre-call branches.
 *   - Unqualified | After The Call — disqualifying (see Qualification.gs).
 *   - Not A Fit | Application Cancelled — disqualifying.
 *   - Paid — won outcome (there's no separate "Won" stage in this pipeline;
 *     Paid IS the win).
 *   - Lost — lost outcome.
 *   - Fake Lead — bucketed as Junk by Qualification.gs via the 'fake' keyword.
 *
 * The "Longer-Term Nuture" spelling matches the client's Lead Category
 * text (misspelling and all). Match keywords accept both 'nuture' and
 * the correct 'nurture' in case future rows use the correct spelling.
 */

const STAGES = [
  { name: 'New Lead (Not Booked)',              match: ['new lead (not booked)', 'new lead']                             },
  { name: 'Meeting Booked',                     match: ['meeting booked']                                                },
  { name: 'No RSVP - Cancelled',                match: ['no rsvp - cancelled', 'no rsvp cancelled', 'no rsvp'],
                                                terminal: true                                                            },
  { name: 'No show',                            match: ['no show', 'no-show'],                terminal: true              },
  { name: 'Unqualified | After The Call',       match: ['unqualified | after the call',
                                                        'unqualified after the call',
                                                        'unqualified'],                       terminal: true              },
  { name: 'Call #2',                            match: ['call #2', 'call 2']                                             },
  { name: 'Call #3',                            match: ['call #3', 'call 3']                                             },
  { name: 'Qualified | Not Ready (Longer-Term Nuture)',
                                                match: ['qualified | not ready',
                                                        'qualified not ready',
                                                        'longer-term nuture',
                                                        'longer term nuture',
                                                        'longer-term nurture',
                                                        'longer term nurture',
                                                        'not ready']                                                     },
  { name: 'Contract Sent',                      match: ['contract sent']                                                 },
  { name: 'Paid',                               match: ['paid'],           won:  true,        terminal: true              },
  { name: 'Lost',                               match: ['lost'],           lost: true,        terminal: true              },
  { name: 'Not A Fit | Application Cancelled',  match: ['not a fit | application cancelled',
                                                        'not a fit',
                                                        'application cancelled'],             terminal: true              },
  { name: 'Fake Lead',                          match: ['fake lead'],                         terminal: true              },
  { name: 'Cold Lead List',                     match: ['cold lead list', 'cold lead']                                   }
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
