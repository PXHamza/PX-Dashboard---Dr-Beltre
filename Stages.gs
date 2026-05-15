/**
 * Stages.gs — Dr Beltre pipeline stages for the "Funnel Stages" tab.
 *
 * Ordered as the client requested. The dashboard preserves this order in
 * the distribution chart and breakdown table.
 *
 * Notes:
 *   - "Booked Consult" → "Booked Surgery" → "Qualified (Moving Forward)"
 *     is the happy-path progression.
 *   - "Unqualified" is the only stage that disqualifies a lead (see
 *     Qualification.gs).
 *   - "Waiting for Finance" is a parking state — leads here are still
 *     active in the pipeline, just blocked on external approval.
 *   - "GLP-1 Downsell" captures the alternate (lower-priced) product
 *     path — also kept active so leads here still count toward the
 *     pipeline volume.
 */

const STAGES = [
  { name: 'New Lead',                   match: ['new lead']                                 },
  { name: 'Tried Contacting',           match: ['tried contacting', 'attempted']            },
  { name: 'Unqualified',                match: ['unqualified'],         terminal: true      },
  { name: 'Booked Consult',             match: ['booked consult']                           },
  { name: 'Booked Surgery',             match: ['booked surgery']                           },
  { name: 'Qualified (Moving Forward)', match: ['qualified (moving forward)',
                                                'qualified moving forward',
                                                'moving forward']                           },
  { name: 'Won',                        match: ['won'],  won:  true,    terminal: true      },
  { name: 'Lost',                       match: ['lost'], lost: true,    terminal: true      },
  { name: 'Waiting for Finance',        match: ['waiting for finance', 'awaiting finance']  },
  { name: 'GLP-1 Downsell',             match: ['glp-1 downsell', 'glp1 downsell',
                                                'glp-1', 'glp1']                            }
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
