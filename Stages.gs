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
