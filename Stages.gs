/**
 * Stages.gs — PX pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client supplied them. The dashboard preserves this order
 * in the distribution chart and breakdown table.
 *
 * Terminal flags:
 *   - No RSVP - Cancelled, No Show, Unqualified | After The Call,
 *     Not A Fit | Application Cancelled — branch / dead-end states.
 *   - Won AND Paid — both flagged won. Paid is the downstream "money in"
 *     state; Won is the contract-signed state. If you'd rather only count
 *     paid deals toward the Win Rate, remove `won: true` from the Won
 *     entry below.
 *   - Lost — flagged lost (terminal).
 *
 * Ordering note: 'Unqualified | After The Call' is matched on its full
 * specific phrase first; the plain 'unqualified' fallback keyword sits
 * in the same entry so any minor wording variation still catches.
 */

const STAGES = [
  { name: "Filled In Form, Didn't Book",              match: ['filled in form', "didn't book"]                                  },
  { name: 'Booked Strategy Session',                  match: ['booked strategy session', 'strategy session booked']             },
  { name: 'No RSVP - Cancelled',                      match: ['no rsvp - cancelled', 'no rsvp cancelled', 'no rsvp'],
                                                      terminal: true                                                            },
  { name: 'Call #1',                                  match: ['call #1', 'call 1']                                              },
  { name: 'No Show',                                  match: ['no show', 'no-show'],                terminal: true              },
  { name: 'Unqualified | After The Call',             match: ['unqualified | after the call',
                                                              'unqualified after the call',
                                                              'unqualified'],                       terminal: true              },
  { name: 'Call #2',                                  match: ['call #2', 'call 2']                                              },
  { name: 'Call #3',                                  match: ['call #3', 'call 3']                                              },
  { name: 'Qualified | Not Ready (Longer-Term Nurture)',
                                                      match: ['qualified | not ready',
                                                              'qualified not ready',
                                                              'longer-term nurture',
                                                              'longer term nurture']                                            },
  { name: 'Contract Sent',                            match: ['contract sent']                                                  },
  { name: 'Lost',                                     match: ['lost'],          lost: true,         terminal: true              },
  { name: 'Not A Fit | Application Cancelled',        match: ['not a fit | application cancelled',
                                                              'not a fit',
                                                              'application cancelled'],             terminal: true              },
  { name: 'Won',                                      match: ['won'],           won:  true,         terminal: true              },
  { name: 'Paid',                                     match: ['paid'],          won:  true,         terminal: true              }
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
