/* GttDrop — 12 timed clinical drops.
   Each drop plays its beats over `seconds`, Vine-style (loopable), then
   opens bedside language + a one-question quiz.
   Educational only: no doses, no orders. Follow your unit's protocols. */
window.GTT_DROPS = [
  {
    id: "norepi-map",
    title: "Norepi: titrate to the MAP, not the number on the pump",
    tag: "Drips",
    seconds: 30,
    color: "#d9485f",
    beats: [
      "Norepinephrine is the usual first-line vasopressor in septic shock.",
      "The goal is the ordered MAP target — often starting at 65 mmHg in septic shock.",
      "Check the a-line waveform before you chase a number: dampened lines lie.",
      "Pair the MAP with perfusion: mentation, urine output, skin, lactate trend.",
      "Peripheral run? Check the site often and know your extravasation steps."
    ],
    bedside: {
      patient: "This medicine is helping your blood pressure stay strong enough to feed your organs. I'm watching it closely.",
      family: "The pump numbers change a lot — that's me adjusting to keep the pressure where the team wants it.",
      team: "MAP is at goal on norepi; waveform is crisp, UO is 40/hr, lactate trending down."
    },
    quiz: {
      q: "MAP reads 58 but the arterial waveform looks flattened. First move?",
      options: ["Increase the norepi immediately", "Check the line: level, zero, flush, and compare with a cuff", "Call a rapid response", "Stop the infusion"],
      answer: 1,
      why: "A dampened waveform under-reads pressure. Confirm the measurement before titrating — then act on the real number."
    },
    sources: ["ssc-2021"]
  },
  {
    id: "propofol-lipids",
    title: "Propofol is also dinner",
    tag: "Drips",
    seconds: 30,
    color: "#e08a2c",
    beats: [
      "Propofol comes in a lipid emulsion — it delivers calories.",
      "Tell the dietitian: long infusions change the nutrition plan.",
      "Triglycerides get checked per protocol on longer or higher-rate runs.",
      "Watch for hypotension, especially with boluses or volume depletion.",
      "Unexplained acidosis, rising CK, arrhythmias, or green/pink urine? Think PRIS and escalate."
    ],
    bedside: {
      patient: "This keeps you comfortable and calm while the breathing machine helps you.",
      family: "This milky medicine helps them rest. We lighten it each day to check how they're doing.",
      team: "Propofol's been running three days — can we get a triglyceride level and loop in nutrition?"
    },
    quiz: {
      q: "Which finding should make you think about propofol-related infusion syndrome?",
      options: ["New metabolic acidosis with rising CK", "A RASS of -1", "Mild hunger after extubation", "SpO2 of 96%"],
      answer: 0,
      why: "PRIS can present with metabolic acidosis, rhabdomyolysis, arrhythmias, and hypertriglyceridemia. Escalate early."
    },
    sources: ["padis-2018", "padis-2025"]
  },
  {
    id: "dex-light",
    title: "Dex: lighter sedation, slower heart",
    tag: "Drips",
    seconds: 25,
    color: "#7a5af8",
    beats: [
      "Dexmedetomidine is an alpha-2 agonist — patients are often rousable and interactive.",
      "That makes it useful when the plan is light sedation.",
      "Main watch-outs: bradycardia and hypotension.",
      "It is not a substitute for treating pain."
    ],
    bedside: {
      patient: "This helps you feel calmer. You may feel sleepy but you'll still be able to wake up and talk with us.",
      family: "They might drift off but should wake up when you talk to them. That's what we want.",
      team: "On dex at RASS 0, HR dropped from 72 to 48 in the last hour — can we reassess the rate?"
    },
    quiz: {
      q: "Main hemodynamic side effects to monitor on dexmedetomidine?",
      options: ["Tachycardia and hypertension", "Bradycardia and hypotension", "Hyperkalemia", "Hyperglycemia"],
      answer: 1,
      why: "Alpha-2 agonism lowers sympathetic tone, so bradycardia and hypotension are the classic effects."
    },
    sources: ["padis-2018", "padis-2025"]
  },
  {
    id: "insulin-gtt",
    title: "Insulin gtt: the clock is the protocol",
    tag: "Drips",
    seconds: 30,
    color: "#12a594",
    beats: [
      "IV insulin works fast and stops fast.",
      "Glucose checks follow the protocol interval — set a timer, not a memory.",
      "Many hospitalized patients target roughly 140–180 mg/dL; follow your order set.",
      "Feeds paused? Tube clogged? NPO for a procedure? Re-check the insulin plan.",
      "Hypoglycemia: follow the protocol, recheck, and tell the team why it happened."
    ],
    bedside: {
      patient: "I'll check your sugar with a small fingerstick often — the drip changes quickly, so I want to keep you safe.",
      family: "The frequent checks are on purpose. This drip needs close watching.",
      team: "Tube feeds were held at 1400 for the procedure — insulin drip needs a plan before the next check."
    },
    quiz: {
      q: "Tube feeds are suddenly held while the insulin drip runs. Best action?",
      options: ["Continue unchanged and check at next routine time", "Follow the protocol for held nutrition and notify the team", "Double the rate", "Stop checking glucose"],
      answer: 1,
      why: "Losing the carbohydrate source while insulin continues raises hypoglycemia risk. Most protocols have a specific step for this."
    },
    sources: ["ada-hospital"]
  },
  {
    id: "heparin-gtt",
    title: "Heparin gtt: nomogram, timing, bleeding",
    tag: "Drips",
    seconds: 25,
    color: "#2f80ed",
    beats: [
      "Heparin infusions are adjusted by a nomogram — aPTT or anti-Xa, per your hospital.",
      "Lab timing after each change matters as much as the result.",
      "Bleeding checks: gums, lines, urine, stool, neuro changes.",
      "Platelets dropping days after starting heparin? Think HIT and speak up."
    ],
    bedside: {
      patient: "This blood thinner helps prevent and treat clots. Tell me if you notice bleeding or a bad headache.",
      family: "We check blood tests on a schedule to keep this medicine in the right range.",
      team: "Platelets fell from 210 to 95 since heparin started on day 2 — can we evaluate for HIT?"
    },
    quiz: {
      q: "Platelets drop by more than half about 5 days into heparin. What should you consider?",
      options: ["Dehydration only", "Heparin-induced thrombocytopenia", "Normal fluctuation — ignore", "Lab error, always"],
      answer: 1,
      why: "A large platelet fall 5–10 days after heparin exposure is the classic HIT timeline. Raise it with the team."
    },
    sources: []
  },
  {
    id: "pain-first",
    title: "Pain first. Then sedation.",
    tag: "Liberation",
    seconds: 20,
    color: "#eb5757",
    beats: [
      "Agitation can be pain in disguise.",
      "Can't self-report? Use a behavioral tool like CPOT or BPS.",
      "Treat pain, then reassess before reaching for a sedative.",
      "This is the 'A' in the ABCDEF bundle."
    ],
    bedside: {
      patient: "Squeeze my hand if you're hurting. Blink twice if it's bad.",
      family: "Grimacing and tensing can be signs of pain. Tell me what you notice — you know them best.",
      team: "CPOT is 5 with grimacing and ventilator fighting — I'd like to treat pain before sedation."
    },
    quiz: {
      q: "An intubated patient is restless and grimacing. First step?",
      options: ["Increase sedation", "Assess pain with a behavioral tool", "Apply restraints", "Ignore — expected"],
      answer: 1,
      why: "ICU Liberation and PADIS emphasize assessing and treating pain first."
    },
    sources: ["iculib", "padis-2018"]
  },
  {
    id: "rass-target",
    title: "RASS: say the target out loud",
    tag: "Liberation",
    seconds: 20,
    color: "#9b51e0",
    beats: [
      "RASS runs from +4 (combative) to -5 (unarousable).",
      "Know the ordered target — and say it at handoff.",
      "Lighter sedation is generally preferred when it's safe.",
      "Too deep? Ask whether the target still fits the patient today."
    ],
    bedside: {
      patient: "Open your eyes and look at me. Great — you're doing well.",
      family: "We try to keep them awake enough to respond. It's better for their recovery.",
      team: "Target RASS 0 to -1; currently -3 on propofol. Can we lighten and reassess?"
    },
    quiz: {
      q: "A patient opens eyes to voice and keeps eye contact for more than 10 seconds. RASS?",
      options: ["0", "-1", "-3", "+1"],
      answer: 1,
      why: "Sustained awakening to voice (≥10 sec eye contact) is -1, drowsy. 0 is alert and calm."
    },
    sources: ["iculib", "padis-2018"]
  },
  {
    id: "cam-icu",
    title: "CAM-ICU in 60 seconds",
    tag: "Liberation",
    seconds: 45,
    color: "#f2994a",
    beats: [
      "Step 0: RASS must be -3 or lighter to assess.",
      "Feature 1: Acute change or fluctuating mental status?",
      "Feature 2: Inattention — squeeze on the letter 'A' in a 10-letter sequence.",
      "Feature 3: Altered level of consciousness (RASS other than 0)?",
      "Feature 4: Disorganized thinking — simple yes/no questions and a command.",
      "Positive = 1 + 2 + (3 or 4). Then hunt for causes."
    ],
    bedside: {
      patient: "I'm going to say some letters. Squeeze my hand every time you hear the letter A.",
      family: "Confusion in the ICU is common and often temporary. Your voice and familiar things help.",
      team: "CAM-ICU positive this morning — new since yesterday. Can we review meds, sleep, and infection?"
    },
    quiz: {
      q: "Which combination makes CAM-ICU positive?",
      options: ["Features 1 + 2 + either 3 or 4", "Feature 3 alone", "Features 2 + 4 only", "Any RASS other than 0"],
      answer: 0,
      why: "Delirium = acute change/fluctuation AND inattention, plus either altered LOC or disorganized thinking."
    },
    sources: ["iculib", "padis-2018"]
  },
  {
    id: "sat-sbt",
    title: "Wake up, then breathe: pair the SAT and SBT",
    tag: "Liberation",
    seconds: 30,
    color: "#27ae60",
    beats: [
      "SAT: spontaneous awakening trial — reduce or pause sedation after a safety screen.",
      "SBT: spontaneous breathing trial — test readiness off full support.",
      "Pairing them is the 'B' in the ABCDEF bundle.",
      "Watch for distress: RR, SpO2, HR, work of breathing, anxiety.",
      "Failed? Restart at a lower level and try again tomorrow — it's information, not defeat."
    ],
    bedside: {
      patient: "We're turning down your sleepy medicine to see how you breathe on your own. I'm right here.",
      family: "This daily test shows us if they're getting closer to coming off the breathing machine.",
      team: "SAT passed at 0700 — RT, are we good to start the SBT?"
    },
    quiz: {
      q: "Why pair the SAT with the SBT?",
      options: ["It saves charting time", "Patients breathe better awake; pairing is linked to shorter ventilation", "It replaces pain assessment", "It is only for post-op patients"],
      answer: 1,
      why: "Coordinated awakening and breathing trials are a core ICU Liberation element associated with earlier liberation."
    },
    sources: ["iculib"]
  },
  {
    id: "early-mobility",
    title: "Move early, screen first",
    tag: "Liberation",
    seconds: 25,
    color: "#2d9cdb",
    beats: [
      "Mobility is the 'E' in ABCDEF.",
      "Screen: hemodynamic stability, oxygenation, lines secured, team ready.",
      "Progress: in-bed exercise → sitting → standing → walking.",
      "Being intubated alone doesn't rule out mobility — your unit's protocol guides it."
    ],
    bedside: {
      patient: "Let's sit you on the edge of the bed. We'll go slow, and you tell me how you feel.",
      family: "Moving early helps them get stronger. You can cheer them on.",
      team: "Passed the mobility screen — PT at 1000? Let's secure the ETT and lines together."
    },
    quiz: {
      q: "Before mobilizing an ICU patient, the most important step is…",
      options: ["Waiting until extubation", "A safety screen and team plan", "Turning off all alarms", "Increasing sedation"],
      answer: 1,
      why: "A structured safety screen and coordinated team make early mobility safe and repeatable."
    },
    sources: ["iculib", "padis-2025"]
  },
  {
    id: "family-f",
    title: "Family is the 'F' — and a superpower",
    tag: "Liberation",
    seconds: 20,
    color: "#e05297",
    beats: [
      "Family engagement is a full element of the ABCDEF bundle.",
      "Invite families to rounds when your unit supports it.",
      "Give them a job: reorient, read aloud, bring glasses and hearing aids.",
      "Ask what matters to the patient as a person."
    ],
    bedside: {
      patient: "Your family is here. Would you like them to sit close?",
      family: "You can help. Talk about home, remind them where they are, and hold their hand.",
      team: "Family wants to join rounds tomorrow — can we plan a time and an interpreter?"
    },
    quiz: {
      q: "Which is a helpful role to offer a family member?",
      options: ["Adjusting the drip rate", "Reorienting and talking with the patient", "Silencing alarms", "Changing dressings"],
      answer: 1,
      why: "Reorientation and familiar voices support delirium prevention and patient comfort."
    },
    sources: ["iculib"]
  },
  {
    id: "hq-cpr",
    title: "High-quality CPR in 20 seconds",
    tag: "Resus",
    seconds: 20,
    color: "#c0392b",
    beats: [
      "Push hard: adult depth at least 2 inches (5 cm).",
      "Push fast: 100–120 per minute.",
      "Full recoil every compression. Minimize pauses.",
      "Avoid excessive ventilation. Switch compressors about every 2 minutes."
    ],
    bedside: {
      patient: "(For the room) We're doing everything we can. A team member will stay with family.",
      family: "Would you like to be present? Someone will stay with you and explain what's happening.",
      team: "Compressor swap at pulse check. Depth looks shallow — push harder."
    },
    quiz: {
      q: "Adult compression rate for high-quality CPR?",
      options: ["60–80/min", "80–100/min", "100–120/min", "140–160/min"],
      answer: 2,
      why: "AHA guidance: 100–120 compressions per minute with adequate depth and full recoil."
    },
    sources: ["aha-2025"]
  }
];
