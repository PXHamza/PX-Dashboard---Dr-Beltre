/**
 * FormQuestions.gs
 * ----------------------------------------------------------------------------
 * Single source of truth for the form-question section of the dashboard.
 *
 * The current lead form has 6 questions in columns N → S. If/when more
 * questions are added (or the wording changes), edit ONLY the FORM_QUESTIONS
 * array below — every dashboard tab that visualises form data reads from
 * this list, so nothing else has to change.
 *
 * To add a question:
 *   1) Add a new row to the source sheet in column T (or further right).
 *   2) Append a new object to FORM_QUESTIONS with the matching column index.
 *   3) Refresh the dashboard from the "PX Insights" menu.
 *
 * Each question object accepts:
 *   col       (number, required)  1-based column index in the leads sheet.
 *   label     (string, required)  Short label for charts/headings.
 *   question  (string, required)  Full question text shown on the dashboard.
 *   type      ('choice' | 'text') 'choice' → bar/donut of distinct answers.
 *                                 'text'   → word cloud + sample answers.
 *   topN      (number, optional)  How many rows to render in distribution
 *                                 charts. Defaults to 10.
 * ----------------------------------------------------------------------------
 */

const FORM_QUESTIONS = [
  {
    col: 14, // N
    label: 'Struggle Duration',
    question: 'How long have you been struggling with your weight?',
    type: 'choice',
    topN: 10
  },
  {
    col: 15, // O
    label: 'Diabetic',
    question: 'Are you currently diabetic?',
    type: 'choice',
    topN: 5
  },
  {
    col: 16, // P
    label: 'Weight to Lose',
    question: 'How much weight are you looking to lose?',
    type: 'choice',
    topN: 10
  },
  {
    col: 17, // Q
    label: 'Motivation',
    question: 'What’s your biggest motivation right now?',
    type: 'text', // open-ended → word cloud
    topN: 25
  },
  {
    col: 18, // R
    label: 'Start Timing',
    question: 'When would you look at getting started?',
    type: 'choice',
    topN: 10
  },
  {
    col: 19, // S
    label: 'Other Notes',
    question: 'Anything else you would like to tell us about your situation so we can help you?',
    type: 'text', // open-ended → word cloud
    topN: 30
  }
];

/**
 * Returns the configured form questions, validated. Filters out any entries
 * whose column index is outside the data range so a typo can never break the
 * dashboard build.
 */
function getFormQuestions() {
  return FORM_QUESTIONS.filter(function (q) {
    return q && typeof q.col === 'number' && q.col >= CONFIG.COLS.FORM_FIRST;
  });
}

/**
 * Words to ignore when building word clouds — common English stop words.
 * Tweak freely; this is a "good enough" list for short open-ended answers.
 */
const STOP_WORDS = new Set([
  'a','an','and','or','but','if','then','the','this','that','these','those',
  'is','am','are','was','were','be','been','being','have','has','had','do',
  'does','did','to','of','in','on','at','by','for','with','about','as','from',
  'i','you','he','she','it','we','they','me','my','your','his','her','our',
  'their','its','so','no','not','can','will','just','really','very','just',
  'too','also','than','more','most','some','any','all','any','only','than',
  'because','what','when','where','who','why','how','which','there','here',
  'into','over','out','up','down','off','again','still','want','wanting',
  'would','could','should','get','getting','got','feel','feeling','am','m',
  's','t','d','re','ve','ll','don','isn','aren','wasn','weren','etc'
]);
