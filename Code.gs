/**
 * Code.gs
 * ----------------------------------------------------------------------------
 * Entry point for the PX Insights dashboard.
 *
 *   - onOpen()        : adds the "PX Insights" custom menu in the Sheet header.
 *   - buildDashboard(): one-time setup (creates every tab + Settings).
 *   - refreshDashboard(): re-runs every tab against current data + filters.
 *
 * Each individual tab is built by its own SheetXxx.gs file. We just orchestrate.
 * ----------------------------------------------------------------------------
 */

/** Runs automatically when the spreadsheet is opened — installs the menu. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PX Insights')
      .addItem('🚀 Build Dashboard',          'buildDashboard')
      .addItem('🔄 Refresh Dashboard',        'refreshDashboard')
      .addSeparator()
      .addItem('⚙️ Open Settings',            'openSettings')
      .addItem('🧪 Insert Sample Data',       'seedSampleData')
      .addSeparator()
      .addSubMenu(SpreadsheetApp.getUi().createMenu('Daily Email Summary')
        .addItem('Send Now',                  'sendDailySummary')
        .addItem('Install Daily Trigger (7am)','installDailyEmailTrigger')
        .addItem('Remove Daily Trigger',      'uninstallDailyEmailTrigger'))
      .addToUi();
}

/**
 * First-time setup. Safe to call repeatedly — it never destroys the raw
 * Leads sheet, only the dashboard tabs.
 */
function buildDashboard() {
  const ss = SpreadsheetApp.getActive();
  ensureLeadsSheet(ss);
  buildSettingsSheet();          // build Settings first so getSetting() works.
  refreshDashboard();
  ss.toast('Dashboard built. Use PX Insights → Refresh after editing Settings.', 'PX Insights', 6);
}

/**
 * Rebuild every dashboard tab from current data + Settings.
 * Roughly takes a couple of seconds for thousands of leads.
 */
function refreshDashboard() {
  const ss = SpreadsheetApp.getActive();
  const start = new Date();

  // Make sure Settings exists — required by every tab via getSetting().
  if (!ss.getSheetByName(CONFIG.TABS.SETTINGS)) buildSettingsSheet();

  // Build (or rebuild) each tab in display order.
  buildOverviewSheet();
  buildCampaignsSheet();
  buildLeadQualitySheet();
  buildDuplicatesSheet();
  buildABTestingSheet();
  buildSourcesSheet();
  buildFormInsightsSheet();
  buildTimeTrendsSheet();
  buildAlertsSheet();

  // Re-seed dropdowns on Settings (sources/campaigns may have changed).
  buildSettingsSheet();

  // Order tabs nicely (Settings last).
  reorderTabs();

  // Activate the Overview tab.
  const overview = ss.getSheetByName(CONFIG.TABS.OVERVIEW);
  if (overview) ss.setActiveSheet(overview);

  const elapsed = ((new Date() - start) / 1000).toFixed(1);
  ss.toast('Refreshed in ' + elapsed + 's', 'PX Insights', 4);
}

/** Activate the Settings tab so the user can edit values. */
function openSettings() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(CONFIG.TABS.SETTINGS)) buildSettingsSheet();
  ss.setActiveSheet(ss.getSheetByName(CONFIG.TABS.SETTINGS));
}

/**
 * Order: Leads → all dashboard tabs → Settings (last).
 */
function reorderTabs() {
  const ss = SpreadsheetApp.getActive();
  const order = [
    CONFIG.DATA_SHEET_NAME,
    CONFIG.TABS.OVERVIEW, CONFIG.TABS.CAMPAIGNS, CONFIG.TABS.QUALITY,
    CONFIG.TABS.DUPES, CONFIG.TABS.AB, CONFIG.TABS.SOURCES,
    CONFIG.TABS.FORMS, CONFIG.TABS.TIME, CONFIG.TABS.ALERTS,
    CONFIG.TABS.SETTINGS
  ];
  for (let i = 0; i < order.length; i++) {
    const sheet = ss.getSheetByName(order[i]);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(i + 1);
    }
  }
}

/**
 * Ensure the source "Leads" sheet exists with the correct headers.
 * If a sheet of the right name already exists, we leave its data alone.
 */
function ensureLeadsSheet(ss) {
  let leads = ss.getSheetByName(CONFIG.DATA_SHEET_NAME);
  if (leads) return;

  leads = ss.insertSheet(CONFIG.DATA_SHEET_NAME, 0);
  const headers = [
    'Date','Name','Email','Phone Number','Lead Category','Sales Team Notes',
    'Sale Revenue','Source','Campaign','Ad Set','Ad','Page Variant','Fbclid'
  ];
  // Append form-question headers from the modular FORM_QUESTIONS list.
  for (const q of getFormQuestions()) headers.push(q.question);
  leads.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground(CONFIG.BRAND.ACCENT)
    .setFontColor(CONFIG.BRAND.TEXT_PRIMARY)
    .setFontWeight('bold')
    .setFontFamily(CONFIG.BRAND.FONT);
  leads.setFrozenRows(1);
  leads.setColumnWidth(1, 130);
}

// ---------------------------------------------------------------------------
// Sample data — useful so a fresh installer can confirm everything renders
// before they wire up real leads.
// ---------------------------------------------------------------------------
function seedSampleData() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert('Insert sample leads?',
    'This appends ~120 randomised demo rows to the "Leads" tab. Existing rows are kept.',
    ui.ButtonSet.OK_CANCEL);
  if (resp !== ui.Button.OK) return;

  const ss = SpreadsheetApp.getActive();
  ensureLeadsSheet(ss);
  const sheet = ss.getSheetByName(CONFIG.DATA_SHEET_NAME);

  const cats     = ['Qualified','Qualified','Qualified','Unqualified','Unqualified','Junk','Junk'];
  const sources  = ['Facebook','Facebook','Facebook','Google','Instagram'];
  const camps    = ['Weight Loss - Cold','Weight Loss - Retarget','Diabetes Care','Healthy Living'];
  const adSets   = ['Women 35-55','Women 45-65','Men 35-55','LAL 1%','Broad'];
  const ads      = ['Hero Image A','Hero Image B','Video Ad','Testimonial','Carousel'];
  const variants = ['A','B','C'];
  const motivations = [
    'Want to feel confident again',
    'Worried about my health long term',
    'Doctor told me to lose weight',
    'My kids — want to play with them',
    'Wedding coming up next year',
    'Energy levels are terrible',
    'Tired of yo-yo dieting'
  ];
  const struggles  = ['<1 year','1-3 years','3-5 years','5-10 years','10+ years'];
  const diabetic   = ['No','Pre-diabetic','Yes - Type 2','Yes - Type 1','Not sure'];
  const goal       = ['10-20 lbs','20-40 lbs','40-60 lbs','60-100 lbs','100+ lbs'];
  const timing     = ['ASAP','Within 30 days','Within 90 days','Just exploring'];
  const otherNotes = [
    'I have tried everything and nothing works',
    'Recently had surgery',
    'Looking for a sustainable approach',
    'Need accountability',
    'Stress eating is my biggest issue',
    ''
  ];

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  const rows = [];
  const now = new Date();
  for (let i = 0; i < 120; i++) {
    const d = new Date(now.getTime() - Math.floor(Math.random() * 30) * 86400000 - Math.floor(Math.random() * 86400000));
    const cat = pick(cats);
    const rev = (cat === 'Qualified' && Math.random() < 0.25) ? Math.floor(2000 + Math.random() * 6000) : 0;
    rows.push([
      d, 'Lead ' + (i + 1),
      'lead' + (i + 1) + (Math.random() < 0.08 ? '_dupe' : '') + '@example.com',
      '+1 555-01' + String(1000 + i),
      cat, rev > 0 ? 'Closed — strategy session booked' : (Math.random() < 0.5 ? 'Left voicemail' : ''),
      rev,
      pick(sources), pick(camps), pick(adSets), pick(ads), pick(variants),
      Math.random() < 0.85 ? 'fbclid_' + Math.random().toString(36).slice(2, 14) : '',
      pick(struggles), pick(diabetic), pick(goal), pick(motivations), pick(timing), pick(otherNotes)
    ]);
  }
  // Force ~10% true duplicates (same email twice).
  for (let i = 0; i < 12; i++) {
    const src = rows[Math.floor(Math.random() * rows.length)];
    rows.push(src.slice());
  }

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).setNumberFormat('yyyy-mm-dd HH:mm');
  ss.toast('Inserted ' + rows.length + ' sample rows.', 'PX Insights', 4);
}
