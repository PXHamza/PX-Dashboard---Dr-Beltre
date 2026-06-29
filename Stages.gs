/**
 * Stages.gs — Maize Restoration and Remodeling pipeline stages.
 *
 * Ordered roughly as the client supplied them — with one important
 * exception. The user-provided order has "Qualified (Post Call)" BEFORE
 * "Unqualified (Post Call)" / "Unqualified (Automatic)". Because
 * substring matching for 'qualified (post call)' also hits inside the
 * string 'unqualified (post call)' (the 'qualified...' substring sits
 * at index 2), we must classify the Unqualified variants FIRST. The
 * array order below reflects that match-priority requirement; the
 * Stage Distribution chart shows them in this order too.
 *
 * Terminal flags:
 *   - Meeting Cancelled, No show — pre-call branches.
 *   - Unqualified (Post Call), Unqualified (Automatic) — disqualifying.
 *   - Won, Lost — terminal outcomes (won / lost).
 *   - Fake Lead — junk; the donut also tags it as Junk via Qualification.gs.
 */

const STAGES = [
  { name: 'New Lead (Not Booked)',     match: ['new lead (not booked)', 'new lead']                                       },
  { name: 'Meeting Booked',            match: ['meeting booked']                                                          },
  { name: 'Meeting Cancelled',         match: ['meeting cancelled', 'meeting cancel'],            terminal: true          },
  { name: 'No show',                   match: ['no show', 'no-show'],                             terminal: true          },
  // Unqualified variants checked BEFORE the generic Qualified (Post Call)
  // because their raw text contains 'qualified (post call)' as a substring.
  { name: 'Unqualified (Post Call)',   match: ['unqualified (post call)', 'unqualified post call'], terminal: true        },
  { name: 'Unqualified (Automatic)',   match: ['unqualified (automatic)', 'unqualified automatic'], terminal: true        },
  { name: 'Qualified (Post Call)',     match: ['qualified (post call)', 'qualified post call']                            },
  { name: 'Home Consultation',         match: ['home consultation']                                                       },
  { name: 'Quoting',                   match: ['quoting']                                                                 },
  { name: 'Won',                       match: ['won'],  won:  true,                               terminal: true          },
  { name: 'Lost',                      match: ['lost'], lost: true,                               terminal: true          },
  { name: 'Cold Lead',                 match: ['cold lead']                                                                },
  { name: 'Fake Lead',                 match: ['fake lead', 'fake'],                              terminal: true          }
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
