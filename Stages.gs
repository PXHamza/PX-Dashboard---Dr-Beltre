/**
 * Stages.gs — Builderwell pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered roughly the way leads progress through Builderwell's CRM. The
 * dashboard preserves this order in the distribution chart and breakdown
 * table.
 *
 * Notes on ordering:
 *   - "Unqualified (Post Call)" is listed BEFORE "Unqualified" so the
 *     specific phrase matches first. classifyStage() returns the first
 *     stage whose match keywords hit; a more general "unqualified" entry
 *     would otherwise swallow the post-call variant.
 *   - Branch / dead-end stages (Meeting Cancelled, No show, Unqualified*,
 *     Lost) are flagged terminal: true so they're excluded from the
 *     "Active in Pipeline" count and tinted differently on the chart.
 *   - "Won" / "Lost" are flagged won / lost so they feed the Win Rate KPI.
 */

const STAGES = [
  // Pre-call
  { name: 'New Lead (Not Booked)',     match: ['new lead (not booked)', 'new lead']                                       },
  { name: 'Meeting Booked',            match: ['meeting booked']                                                          },
  { name: 'Meeting Cancelled',         match: ['meeting cancelled', 'meeting cancel'],            terminal: true          },
  { name: 'No show',                   match: ['no show', 'no-show'],                             terminal: true          },

  // Post-call screening
  { name: 'Qualified (Post Call)',     match: ['qualified (post call)', 'qualified post call']                            },
  { name: 'Unqualified (Post Call)',   match: ['unqualified (post call)', 'unqualified post call'], terminal: true        },
  { name: 'Unqualified',               match: ['unqualified'],                                    terminal: true          },

  // Sales process
  { name: 'Home Consultation',                         match: ['home consultation']                                       },
  { name: '3D Scan Completed',                         match: ['3d scan completed', '3d scan']                            },
  { name: 'In Office Estimate Review',                 match: ['in office estimate review', 'estimate review']            },
  { name: 'Design and Architecture Proposal Presented',match: ['design and architecture proposal', 'design and architecture'] },
  { name: 'Design Package Signed or Deposit Paid',     match: ['design package signed', 'deposit paid']                   },
  { name: 'Plans Approved',                            match: ['plans approved']                                          },
  { name: 'Construction Proposal Presented',           match: ['construction proposal presented', 'construction proposal'] },
  { name: 'Build Phase',                               match: ['build phase']                                             },

  // Terminal outcomes
  { name: 'Won',                       match: ['won'],   won:  true, terminal: true              },
  { name: 'Lost',                      match: ['lost'],  lost: true, terminal: true              }
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
