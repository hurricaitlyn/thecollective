/* GttDrop — evidence shelf, editorial queue, team content, downloads. */

/* Evidence shelf. `reviewed` = last time the source was checked against the app.
   The app flags any source whose review is older than REVIEW_INTERVAL_DAYS. */
window.GTT_REVIEW_INTERVAL_DAYS = 31;
window.GTT_EVIDENCE = [
  {
    id: "iculib",
    title: "SCCM ICU Liberation Campaign — ABCDEF Bundle",
    org: "Society of Critical Care Medicine",
    published: "Ongoing campaign",
    reviewed: "2026-11-25",
    url: "https://www.sccm.org/clinical-resources/iculiberation-home",
    scope: "Pain, SAT/SBT, sedation choice, delirium, early mobility, family engagement."
  },
  {
    id: "padis-2025",
    title: "2025 Focused Update to the PADIS Guidelines (Anxiety, Agitation/Sedation, Delirium, Immobility, Sleep)",
    org: "Society of Critical Care Medicine — Critical Care Medicine",
    published: "2025",
    reviewed: "2026-11-25",
    url: "https://www.sccm.org/clinical-resources/guidelines/guidelines",
    scope: "Updates selected questions from the 2018 PADIS guideline. Read the published recommendations for exact wording."
  },
  {
    id: "padis-2018",
    title: "Clinical Practice Guidelines for Pain, Agitation/Sedation, Delirium, Immobility, and Sleep Disruption in Adult ICU Patients (PADIS)",
    org: "Devlin JW et al. — Critical Care Medicine 2018;46(9):e825–e873",
    published: "2018-09",
    reviewed: "2026-11-25",
    url: "https://journals.lww.com/ccmjournal/fulltext/2018/09000/clinical_practice_guidelines_for_the_prevention.29.aspx",
    scope: "Baseline PADIS recommendations; pair with the 2025 focused update."
  },
  {
    id: "aha-2025",
    title: "AHA Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care",
    org: "American Heart Association",
    published: "2025",
    reviewed: "2026-11-25",
    url: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines",
    scope: "Adult BLS/ALS, high-quality CPR metrics, post-arrest care."
  },
  {
    id: "ssc-2021",
    title: "Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021",
    org: "Evans L et al. — Critical Care Medicine 2021;49(11):e1063–e1143",
    published: "2021-11",
    reviewed: "2026-11-25",
    url: "https://www.sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines",
    scope: "Initial MAP target, vasopressor choice, early recognition. Check for a newer edition at each review."
  },
  {
    id: "ada-hospital",
    title: "Standards of Care in Diabetes — Diabetes Care in the Hospital",
    org: "American Diabetes Association (updated annually)",
    published: "Annual",
    reviewed: "2026-11-25",
    url: "https://diabetesjournals.org/care",
    scope: "Inpatient glycemic targets and hypoglycemia prevention."
  }
];

/* Editorial queue — seed items. User pitches are stored locally. */
window.GTT_QUEUE = [
  { id: "q-prone", title: "Prone day choreography: who holds the tube", tag: "Respiratory", status: "Drafting", owner: "Editorial" },
  { id: "q-crrt", title: "CRRT alarms without panic", tag: "Renal", status: "In review", owner: "Editorial" },
  { id: "q-evd", title: "EVD: level, clamp, move", tag: "Neuro", status: "Pitched", owner: "Editorial" },
  { id: "q-vaso", title: "Vasopressin isn't titrated like norepi", tag: "Drips", status: "Scheduled", owner: "Editorial" },
  { id: "q-mt", title: "Massive transfusion: don't forget calcium", tag: "Heme", status: "Pitched", owner: "Editorial" }
];
window.GTT_QUEUE_STATUSES = ["Pitched", "Drafting", "In review", "Scheduled"];

window.GTT_WINS = [
  { who: "Night shift, Bed 12", text: "Caught a dampened a-line before anyone titrated off a false low MAP. Calm, quick, correct." },
  { who: "Day team", text: "First patient walked the hallway while still on high-flow. PT, RT, and nursing in perfect sync." },
  { who: "Charge RN", text: "Turned a tense family meeting around by asking, 'Tell us about your dad before he got sick.'" },
  { who: "New grad, week 6", text: "Called the rapid response early on a gut feeling. Lactate came back 4.2. Trust your gut." },
  { who: "Weekend crew", text: "Zero missed glucose checks on four insulin drips during a 3-admission afternoon." }
];

window.GTT_ENCOURAGEMENT = [
  "You don't have to know everything. You have to know when to ask.",
  "The quiet assessments you do every hour are why people go home.",
  "Hard shift? You still showed up. That counts.",
  "Every handoff you make clearer is a mistake someone else doesn't make.",
  "Drink some water. Eat something. Patients need you rested.",
  "Calling for help early is a skill, not a weakness."
];

window.GTT_INSIGHTS = [
  { title: "Trace every line at handoff", text: "Bag to pump to patient, together, at the bedside. Labels lie less when two people read them." },
  { title: "Glasses and hearing aids are delirium medicine", text: "Ask on admission where they are. Get them back on the patient." },
  { title: "The trend beats the snapshot", text: "One lactate tells you a little. Three tell you a story." },
  { title: "Say the target out loud", text: "MAP goal, RASS goal, glucose range — state them in report so everyone's chasing the same thing." },
  { title: "Write the pause into the plan", text: "If feeds stop, what happens to insulin? If the patient travels, which drips go? Decide before it happens." }
];

/* Downloads. `available: false` means the file slot exists but the file is not yet in /downloads. */
window.GTT_DOWNLOADS = [
  {
    file: "downloads/mgh-study-guide.pdf",
    title: "MGH ICU Study Guide",
    note: "Your personal study guide. Add the PDF at downloads/mgh-study-guide.pdf to enable this download.",
    available: false
  },
  {
    file: "downloads/icu-communication-board-needs.pdf",
    title: "ICU Communication Board — Needs & Feelings",
    note: "Yes/No, 0–10 pain scale, needs, feelings, and body map. Print, laminate, point.",
    available: true
  },
  {
    file: "downloads/icu-communication-board-alphabet.pdf",
    title: "ICU Communication Board — Alphabet & Phrases",
    note: "Letter board, numbers, and common phrases for intubated or nonverbal patients.",
    available: true
  }
];
