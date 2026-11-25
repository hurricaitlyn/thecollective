/* MR.ME sample record — Eleanor Vance. Edit here; app.js only renders it.
   Tones: "flag" = needs attention (accent), "ink" = normal text, "sub" = muted. */
window.MRME = (function () {
  "use strict";

  const meds = {
    furo: { name: "Furosemide", dose: "40 mg", when: "Every morning", why: "Heart failure", look: 'Small round white tablet, scored, marked "3170 V".', started: "October 14, 2026 (was 20 mg since March 2019)", doctor: "Dr. Adaeze Okafor", office: "Mercy Health Cardiology · 555-0142", pharmacy: "Walgreens, Main St", notes: "Water pill. Makes you urinate more — take it in the morning. Weigh yourself every day." },
    meto: { name: "Metoprolol", dose: "25 mg", when: "Morning and evening", why: "Heart failure, blood pressure", look: "Round pink tablet.", started: "March 2019", doctor: "Dr. Adaeze Okafor", office: "Mercy Health Cardiology · 555-0142", pharmacy: "Walgreens, Main St", notes: "Slows the heart so it works less hard. Don't stop suddenly." },
    lisin: { name: "Lisinopril", dose: "10 mg", when: "Every morning", why: "Blood pressure, heart", look: "Oval yellow tablet.", started: "June 2015", doctor: "Dr. Paul Chen", office: "Lakeside Primary Care · 555-0188", pharmacy: "Walgreens, Main St", notes: "A dry cough is a known side effect — tell Dr. Chen if it starts." },
    potas: { name: "Potassium", dose: "20 mEq", when: "Every morning", why: "Replaces what the water pill removes", look: "Large oval orange tablet.", started: "March 2019", doctor: "Dr. Adaeze Okafor", office: "Mercy Health Cardiology · 555-0142", pharmacy: "Walgreens, Main St", notes: "Take with food and a full glass of water." },
    ator: { name: "Atorvastatin", dose: "40 mg", when: "At bedtime", why: "Cholesterol", look: "Oval white tablet.", started: "June 2015", doctor: "Dr. Paul Chen", office: "Lakeside Primary Care · 555-0188", pharmacy: "Walgreens, Main St", notes: "Tell Dr. Chen about unexplained muscle aches." },
    levo: { name: "Levothyroxine", dose: "75 mcg", when: "Morning, empty stomach", why: "Thyroid", look: "Small round purple tablet.", started: "2009", doctor: "Dr. Paul Chen", office: "Lakeside Primary Care · 555-0188", pharmacy: "Walgreens, Main St", notes: "Wait 30 minutes before breakfast or other pills." }
  };

  /* Today's doses: [taken-key, med id]. Metoprolol appears as its morning dose. */
  const today = [["furo", "furo"], ["metoAm", "meto"], ["lisin", "lisin"], ["potas", "potas"], ["levo", "levo"], ["ator", "ator"]];
  const takenDefault = { furo: true, metoAm: true, lisin: true, potas: false, levo: true, ator: false };

  const conditions = {
    hf: { name: "Heart failure", short: "heart failure", since: "2019", doctor: "Dr. Okafor · Heart doctor", status: "Watch closely", watch: true,
      plain: "Your heart pumps a little weaker than it used to, so fluid can build up. The water pill removes it. Daily weights tell us early if fluid is building.",
      meds: ["furo", "meto", "potas"],
      appts: [{ date: "Tue, Nov 4 · 10:30 am", title: "Follow-up with Dr. Okafor", note: "Ride booked 9:45 · Maya coming" }, { date: "Oct 14", title: "Cardiology visit", note: "Water pill increased to 40 mg" }],
      notes: [{ id: "vitals", date: "Oct 31", kind: "Reading", title: "Weight up 4 lb in 5 days" }, { id: "lab", date: "Oct 20", kind: "Blood test", title: "Potassium and kidney check — normal" }, { id: "note", date: "Oct 9", kind: "Note", title: "Short of breath on stairs" }],
      topic: "hf" },
    htn: { name: "High blood pressure", short: "blood pressure", since: "2015", doctor: "Dr. Chen · Primary care", status: "Controlled", watch: false,
      plain: "Your blood pressure runs high without medicine. Keeping it near 130/80 protects your heart, kidneys and brain.",
      meds: ["lisin", "meto"], appts: [{ date: "Dec 12", title: "Yearly check with Dr. Chen", note: "Bring your home readings" }],
      notes: [{ id: "vitals", date: "Oct 31", kind: "Reading", title: "BP 138/82" }], topic: "bp" },
    chol: { name: "High cholesterol", short: "cholesterol", since: "2015", doctor: "Dr. Chen · Primary care", status: "Controlled", watch: false,
      plain: "Too much fat in the blood can clog arteries. Your statin keeps it low.",
      meds: ["ator"], appts: [{ date: "Dec 12", title: "Yearly check · lipid panel", note: "Fasting blood test before" }],
      notes: [{ id: "lab", date: "Jun 3", kind: "Blood test", title: "LDL 84 — at goal" }], topic: "chol" },
    thy: { name: "Underactive thyroid", short: "thyroid", since: "2009", doctor: "Dr. Chen · Primary care", status: "Stable", watch: false,
      plain: "Your thyroid makes too little hormone, which can cause tiredness and feeling cold. One pill each morning replaces it.",
      meds: ["levo"], appts: [{ date: "Dec 12", title: "Yearly check · TSH", note: "" }],
      notes: [{ id: "lab", date: "Jun 3", kind: "Blood test", title: "TSH 2.1 — normal" }], topic: "thy" },
    oa: { name: "Knee arthritis", short: "knee arthritis", since: "2016", doctor: "Dr. Reyes · Orthopedics", status: "Stable", watch: false,
      plain: "Wear on the knee joint. Right knee was replaced in 2021; the left is managed with movement and acetaminophen when needed.",
      meds: [], appts: [], notes: [{ id: "note", date: "2021", kind: "Surgery", title: "Right knee replacement" }], topic: "oa" }
  };

  const entries = [
    { id: "vitals", day: "31", mon: "Oct", kind: "Reading", title: "Morning weight 171 lb", sub: "Up 4 lb over 5 days. BP 138/82." },
    { id: "meds", day: "28", mon: "Oct", kind: "Medicine", title: "New bottle · Furosemide 40 mg", sub: "Replaces the 20 mg bottle still at home." },
    { id: "lab", day: "20", mon: "Oct", kind: "Blood test", title: "Potassium and kidney check", sub: "Everything in the normal range." },
    { id: "visit", day: "14", mon: "Oct", kind: "Visit", title: "Heart doctor — Dr. Okafor", sub: "Water pill increased. Weigh every day." },
    { id: "note", day: "09", mon: "Oct", kind: "Note", title: "Short of breath on stairs", sub: "Added by Maya. Better after resting." }
  ];
  const entryKinds = ["All", "Visit", "Medicine", "Reading", "Blood test", "Note"];

  const details = {
    visit: { kind: "Visit", date: "Oct 14", title: "Heart doctor — Dr. Okafor", source: "Recorded by Maya · summarized by Companion",
      summary: "Your heart is holding steady, but you are carrying extra fluid. Your water pill was doubled to 40 mg each morning. Weigh yourself every morning and call if you gain 3 pounds in a week. Blood test in one week. Come back in three weeks.",
      listTitle: "What changed", rows: [{ k: "Furosemide", note: "20 mg → 40 mg, mornings", v: "Changed", tone: "flag" }, { k: "Daily weight", note: "Call if up 3 lb in a week", v: "New", tone: "flag" }, { k: "Blood test", note: "Due Oct 21", v: "Ordered", tone: "ink" }],
      family: "Mom saw Dr. Okafor today. Her heart is holding steady but she's carrying extra fluid, so her water pill is doubled. We'll weigh her every morning. Next visit in three weeks." },
    vitals: { kind: "Reading", date: "Oct 31", title: "Weight up 4 lb in 5 days", source: "Home scale · 7:40 am", canCall: true,
      summary: "This is past the 3 pound limit Dr. Okafor set. It also comes 3 days after your new 40 mg bottle arrived — check you switched to the new bottle, then call the office.",
      listTitle: "Last 5 mornings", rows: [{ k: "Oct 31", note: "BP 138/82", v: "171 lb", tone: "flag" }, { k: "Oct 30", note: "BP 134/80", v: "169 lb", tone: "ink" }, { k: "Oct 29", note: "BP 131/79", v: "168 lb", tone: "ink" }, { k: "Oct 27", note: "BP 129/78", v: "167 lb", tone: "ink" }, { k: "Oct 26", note: "BP 130/80", v: "167 lb", tone: "ink" }],
      family: "Heads up — Mom's weight is up 4 lb since the weekend, which is the number her cardiologist told us to call about. Maya is calling the office this morning." },
    meds: { kind: "Medicine", date: "Oct 28", title: "New bottle · Furosemide 40 mg", source: "Walgreens · e-prescription",
      summary: "This replaces the 20 mg bottle filled Sep 30. The old bottle is still at home — put it in the pharmacy take-back bag so the two don't get mixed up.",
      listTitle: "Your medicines", rows: Object.values(meds).map((m) => ({ k: m.name + " " + m.dose, note: m.when, v: m.name === "Furosemide" ? "Check" : "OK", tone: m.name === "Furosemide" ? "flag" : "sub" })),
      family: "Reminder: the old 20 mg water pill bottle should go in the take-back bag — Mom is on 40 mg now." },
    prep: { kind: "Appointment", date: "Tue Nov 4", title: "Questions for Dr. Okafor", source: "Built from your last visit, this week's readings and your medicines",
      summary: "Three things have changed since October 14 that Dr. Okafor should hear about first. Your ride is confirmed for 9:45.",
      listTitle: "Ask about", rows: [{ k: "Weight up 4 lb", note: "Did the 40 mg dose start on time?", v: "1", tone: "flag" }, { k: "Breathless on stairs", note: "Oct 9, once since", v: "2", tone: "flag" }, { k: "Potassium 3.6", note: "Recheck after the dose change?", v: "3", tone: "flag" }],
      family: "Tuesday 10:30 with Dr. Okafor. Maya is taking her. We'll ask about the weight gain and whether the new dose is working." },
    lab: { kind: "Blood test", date: "Oct 20", title: "Potassium and kidney check", source: "Quest · brought in from your portal",
      summary: "All normal. Potassium is at the low end, which matters because the water pill lowers it — your Companion will flag the next result if it drops further.",
      listTitle: "Results", rows: [{ k: "Potassium", note: "Normal 3.5–5.0", v: "3.6", tone: "flag" }, { k: "Creatinine", note: "Normal 0.6–1.2", v: "1.1", tone: "ink" }, { k: "Sodium", note: "Normal 135–145", v: "139", tone: "ink" }],
      family: "Mom's blood work from Monday came back normal." },
    note: { kind: "Note", date: "Oct 9", title: "Short of breath on stairs", source: "Added by Maya · 8:12 pm",
      summary: "A family note from five days before the heart visit. Dr. Okafor used it when deciding to raise the water pill dose.",
      listTitle: "Details", rows: [{ k: "Recovered", note: "After about 2 minutes sitting", v: "Yes", tone: "ink" }, { k: "Weight that morning", note: "Baseline", v: "166 lb", tone: "ink" }],
      family: "Mom got winded on the stairs tonight. She's fine now, but I've logged it for her appointment." }
  };

  const topics = {
    hf: { kicker: "About your condition", title: "Living with heart failure", body: "Your heart still works — it just pumps a little less strongly. The goal is to keep fluid from building up.", points: ["Weigh yourself every morning after the bathroom, before breakfast.", "Call Dr. Okafor if you gain 3 pounds in a week or feel more breathless.", "Keep taking furosemide in the morning so nights stay dry."], note: "Based on your Oct 14 visit and this week's readings." },
    furo: { kicker: "About your medicine", title: "Why you take furosemide", body: "It is a water pill. It helps your kidneys remove extra fluid so your heart and lungs are not working against it.", points: ["Take it in the morning — you will urinate more for a few hours.", "It lowers potassium, which is why you also take a potassium pill.", "Dr. Okafor doubled it on Oct 14 because of fluid build-up."], note: "Dizziness when standing can mean too much fluid is leaving — mention it at your visit." },
    salt: { kicker: "Food and eating", title: "Eating less salt with heart failure", body: "Salt holds water in the body. Less salt means less fluid for your heart to deal with. Aim for under 2,000 mg of sodium a day.", points: ["Biggest sources: canned soup, deli meat, bread, cheese, restaurant food.", "Swap: fresh or frozen vegetables instead of canned; herbs and lemon instead of the salt shaker.", "Read labels — pick items under 140 mg sodium per serving."], note: "Ask Dr. Okafor whether you also have a daily fluid limit." },
    fluid: { kicker: "Food and eating", title: "Fluids: how much is right for you", body: "Many people with heart failure are asked to keep fluids around 6–8 cups a day. Your record does not show a limit yet.", points: ["Soup, ice cream, gelatin and fruit count as fluid.", "Sip small amounts through the day; suck on ice chips if thirsty.", "Ask on Tuesday whether a limit makes sense for you."], note: "This is a question to bring up — it has been added to your Tuesday list." },
    potassium: { kicker: "Food and eating", title: "Potassium-rich foods", body: "Your water pill lowers potassium; your Oct 20 level was at the low end of normal. Food can help, alongside your potassium pill.", points: ["Bananas, oranges, cantaloupe, potatoes, beans, spinach.", "Do not add extra potassium pills or salt substitutes without asking — too much is also dangerous."], note: "Dr. Okafor can tell you whether to aim higher." },
    bp: { kicker: "About your condition", title: "Understanding blood pressure numbers", body: "The top number is the pressure when your heart beats; the bottom is between beats. Your goal is around 130 over 80.", points: ["Your reading this morning was 138/82 — a little high, likely from the extra fluid.", "Sit quietly 5 minutes before measuring, feet flat, arm at heart level."], note: "Your readings sync to your record automatically." },
    chol: { kicker: "About your condition", title: "Cholesterol and your statin", body: "Cholesterol is a fat in the blood. Too much builds up in arteries. Atorvastatin keeps your LDL low — yours was 84 in June, which is at goal.", points: ["Take it at bedtime.", "Unexplained muscle aches are worth reporting to Dr. Chen."], note: "Your next cholesterol test is with the December check-up." },
    thy: { kicker: "About your condition", title: "Your thyroid medicine", body: "Levothyroxine replaces a hormone your thyroid makes too little of. The dose has been steady since 2009.", points: ["Take it on an empty stomach, 30 minutes before breakfast.", "Keep it apart from calcium or iron pills."], note: "TSH was 2.1 in June — right where it should be." },
    oa: { kicker: "About your condition", title: "Keeping your knees moving", body: "Gentle daily movement keeps the joint flexible and the muscles strong.", points: ["Short walks and chair exercises are good; avoid deep squats.", "Acetaminophen is safer for your heart than ibuprofen or naproxen."], note: 'Avoid "NSAID" pain relievers — they can hold fluid and strain the heart.' }
  };
  const dietTopics = [["salt", "Eating less salt"], ["fluid", "How much to drink"], ["potassium", "Potassium-rich foods"]];
  const eduTopics = [["hf", "Living with heart failure"], ["furo", "Why I take furosemide"], ["bp", "Blood pressure numbers"], ["oa", "Keeping my knees moving"]];

  /* Shown by default; the rest appear when searched. */
  const portals = [
    { id: "mychart", name: "MyChart · Mercy Health", sub: "Heart doctor, primary care" },
    { id: "quest", name: "Quest Diagnostics", sub: "Blood tests" },
    { id: "walgreens", name: "Walgreens", sub: "Pharmacy" },
    { id: "va", name: "VA Health", sub: "My HealtheVet" },
    { id: "cerner", name: "St. Joseph Hospital", sub: "Emergency visits, X-rays" },
    { id: "health", name: "Apple Health", sub: "Steps, heart rate, sleep" }
  ];
  const morePortals = [
    { id: "kaiser", name: "Kaiser Permanente", sub: "kp.org" }, { id: "sutter", name: "Sutter Health", sub: "My Health Online" }, { id: "mayo", name: "Mayo Clinic", sub: "Patient Online Services" },
    { id: "cvs", name: "CVS Pharmacy", sub: "Pharmacy" }, { id: "labcorp", name: "Labcorp", sub: "Blood tests" }, { id: "medicare", name: "Medicare Blue Button", sub: "Claims history" },
    { id: "followmy", name: "FollowMyHealth", sub: "Many clinics" }, { id: "athena", name: "athenaPatient", sub: "Independent clinics" }
  ];
  const portalStateDefault = { mychart: "connected", quest: "connected", walgreens: "connected" };

  const people = [
    { name: "Maya Vance", role: "Daughter · main caregiver", scope: "Everything" }, { name: "James Vance", role: "Son", scope: "Updates" },
    { name: "Dr. Adaeze Okafor", role: "Heart doctor", scope: "Clinical" }, { name: "Dr. Paul Chen", role: "Primary care", scope: "Clinical" }, { name: "Rosa Tran, RN", role: "Home health nurse", scope: "Readings" }
  ];
  const allergies = [
    { name: "Penicillin", reaction: "Rash all over, 1986", severity: "Serious", tone: "flag" },
    { name: "Sulfa drugs", reaction: "Hives, 2004", severity: "Serious", tone: "flag" },
    { name: "Shellfish", reaction: "Swollen lips", severity: "Moderate", tone: "sub" }
  ];
  const surgeries = [
    { year: "2021", name: "Right knee replacement", where: "St. Joseph Hospital · Dr. Reyes" },
    { year: "2018", name: "Cataract surgery, both eyes", where: "Lakeside Eye Center" },
    { year: "1972", name: "Appendix removed", where: "Chicago" }
  ];
  const history = [
    { k: "Ongoing conditions", v: "Heart failure (2019), high blood pressure (2015), high cholesterol (2015), underactive thyroid (2009), knee arthritis (2016)" },
    { k: "Past", v: "Pneumonia 2017 (hospital, 4 days). Two pregnancies, no complications." },
    { k: "Family history", v: "Mother — heart disease. Father — stroke at 71. Sister — breast cancer." },
    { k: "Vaccines", v: "Flu Oct 2026 · COVID Sep 2026 · Shingles 2020 · Pneumonia 2018" },
    { k: "Habits", v: "Never smoked. Rare alcohol. Walks most days." }
  ];

  const viewers = {
    Patient: { label: "Eleanor", greeting: "Good morning", role: "I am the patient", sub: "This is my own record",
      lead: "Your weight went up this week. I can explain what that means and help you call the clinic." },
    Caregiver: { label: "Maya · caregiver", greeting: "Looking after Mom", role: "I care for someone", sub: "Family member or caregiver with access",
      lead: "Mom's weight is up 4 lb since Friday — that meets the call threshold from her last visit." },
    Clinician: { label: "Dr. Okafor", greeting: "Patient record", role: "I am on the care team", sub: "Doctor, nurse or home health",
      lead: "Weight +4 lb / 5 d since furosemide titration Oct 14. Last BMP Oct 20: K 3.6, Cr 1.1." }
  };

  const addTiles = [["med", "Medicine", "Add a pill or bottle"], ["vital", "Reading", "Weight, blood pressure, sugar"], ["doc", "Paper or photo", "Results, papers, cards"], ["symptom", "How I feel", "Symptoms"], ["portal", "My records", "MyChart, labs, pharmacy"]];
  const vitalKinds = { Weight: ["171", "lb"], "Blood pressure": ["138 / 82", "mmHg"], "Blood sugar": ["104", "mg/dL"], Oxygen: ["96", "%"], Temperature: ["98.4", "°F"] };
  const symptomKinds = ["Short of breath", "Swelling", "Dizzy", "Pain", "Tired", "Other"];
  const scannedMed = { name: "Furosemide", dose: "40 mg", when: "Every morning", started: "2026-10-14", doctor: "Dr. Adaeze Okafor", office: "Mercy Health Cardiology · 555-0142", pharmacy: "Walgreens, Main St" };

  return { meds, today, takenDefault, conditions, entries, entryKinds, details, topics, dietTopics, eduTopics, portals, morePortals, portalStateDefault,
    people, allergies, surgeries, history, viewers, addTiles, vitalKinds, symptomKinds, scannedMed };
})();
