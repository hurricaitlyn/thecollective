/* MR.ME — medical record memory. Single-page app, no build step, no dependencies.
   Routes: #signin #home #health #condition-<id> #med-<id> #timeline #entry-<id> #add #companion[-<topic>] #me */
(function () {
  "use strict";

  const D = window.MRME;
  const root = document.getElementById("app");

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const corners = '<i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>';
  const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");
  let toastTimer;
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---------- storage (fails soft) ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("mrme." + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem("mrme." + key, JSON.stringify(value)); } catch (e) { /* private mode */ } }
  };

  /* Persisted settings and record state. */
  const prefs = {
    signedIn: store.get("signedIn", false),
    viewer: store.get("viewer", "Patient"),
    textSize: store.get("textSize", "Standard"),
    contrast: store.get("contrast", false),
    showAlert: store.get("showAlert", true),
    showCompanion: store.get("showCompanion", true),
    taken: store.get("taken", { ...D.takenDefault }),
    portals: store.get("portals", { ...D.portalStateDefault })
  };
  function save(key, value) { prefs[key] = value; store.set(key, value); }

  /* Screen-local state, reset on reload. */
  const ui = {
    signStep: 1, email: "", pass: "", signError: false,
    filter: "All", addMode: null, recording: false, secs: 0,
    vitalKind: "Weight", symptomKind: "Short of breath", severity: 2, reason: "Heart failure",
    pill: false, scanned: false, files: [], portalQuery: "", ask: ""
  };
  let recTimer = null;

  /* ---------- routing ---------- */
  let route = { name: "signin", arg: null };
  let back = []; // stack of { hash, label } for the header back button
  const PARENT = { condition: "#health", med: "#health", timeline: "#home", entry: "#timeline" };

  function parse(hash) {
    const h = (hash || "").replace(/^#/, "");
    const m = h.match(/^(condition|med|entry|companion)-(.+)$/);
    if (m) return { name: m[1], arg: m[2] };
    return { name: h || "home", arg: null };
  }
  function labelFor(r) {
    if (!r) return "Back";
    if (r.name === "condition") return (D.conditions[r.arg] || D.conditions.hf).name;
    if (r.name === "med") return (D.meds[r.arg] || D.meds.furo).name;
    return { home: "Home", health: "Conditions", timeline: "History", companion: "Companion", me: "Me", add: "Add", entry: "Back" }[r.name] || "Back";
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  window.addEventListener("hashchange", (e) => {
    const prev = parse(new URL(e.oldURL).hash);
    const next = parse(location.hash);
    const top = back[back.length - 1];
    if (top && top.hash === location.hash) back.pop();          // went back
    else if (PARENT[next.name] && prev.name !== "signin")
      back.push({ hash: "#" + (prev.arg ? prev.name + "-" + prev.arg : prev.name), label: labelFor(prev) });
    if (!PARENT[next.name]) back = [];
    window.scrollTo(0, 0);
    render();
  });

  /* ---------- shared pieces ---------- */
  function brand(lg) {
    return `<div class="brand${lg ? " lg" : ""}"><span class="mark bp" aria-hidden="true">${corners}MR</span><span>MR<span class="dot">.</span>ME</span></div>`;
  }
  const sec = (title, aside) => `<h2 class="sec">${title}${aside || ""}</h2>`;
  const viewer = () => D.viewers[prefs.viewer] || D.viewers.Patient;
  const takenCount = () => D.today.filter(([k]) => prefs.taken[k]).length;

  function header() {
    const hasBack = !!PARENT[route.name];
    const b = back[back.length - 1] || { hash: PARENT[route.name], label: labelFor(parse(PARENT[route.name])) };
    const left = hasBack
      ? `<button class="back" data-act="back" data-arg="${esc(b.hash)}"><span aria-hidden="true">←</span>${esc(b.label)}</button>`
      : `<a href="#home" aria-label="MR.ME home" style="text-decoration:none">${brand()}</a>`;
    return `<header class="hdr">${left}<div class="viewer" title="Viewing as">${esc(viewer().label)}</div></header>`;
  }

  function tabs() {
    const active = { timeline: "home", entry: "home", condition: "health", med: "health" }[route.name] || route.name;
    return `<nav class="tabs" aria-label="Main">${[["home", "Home"], ["health", "Health"], ["add", "Add"], ["companion", "Companion"], ["me", "Me"]]
      .map(([id, label]) => `<a href="#${id}"${active === id ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
  }

  /* ---------- screens ---------- */
  function signIn() {
    const step1 = `
      <form class="signin-form" data-form="signin" novalidate style="display:flex;flex-direction:column;gap:14px">
        <label class="field">Email or phone<input class="input" type="email" name="email" autocomplete="username" value="${esc(ui.email)}" placeholder="eleanor@example.com"></label>
        <label class="field">Password<input class="input" type="password" name="pass" autocomplete="current-password" value="${esc(ui.pass)}" placeholder="••••••••"></label>
        ${ui.signError ? '<div class="error" role="alert">Please enter your email and password.</div>' : ""}
        <button type="submit" class="btn btn-primary btn-block big">Sign in</button>
        <button type="button" class="btn btn-secondary btn-block big" data-act="signStep2">Use Face ID</button>
        <button type="button" class="link" style="justify-content:center" data-act="toast" data-arg="We'll text you a reset link.">Forgot password?</button>
      </form>
      <div class="or">or</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-secondary btn-block" data-act="signStep2">Continue with Apple</button>
        <button class="btn btn-secondary btn-block" data-act="signStep2">Continue with my patient portal (MyChart)</button>
      </div>
      <div style="text-align:center;font-size:17px">New here? <button class="link" data-act="signStep2">Create an account</button></div>`;
    const step2 = `
      <h2 class="sec" style="margin-top:0">Who are you signing in as?</h2>
      ${Object.entries(D.viewers).map(([id, v]) => `
        <button class="plain card role bp" data-act="pickViewer" data-arg="${id}">${corners}
          <span class="t24">${esc(v.role)}</span><span class="s16 muted">${esc(v.sub)}</span>
        </button>`).join("")}`;
    return `
      <main id="main" class="signin" tabindex="-1">
        ${brand(true)}
        <div style="display:flex;flex-direction:column;gap:8px">
          <h1 class="hero">Your medical memory, in one place.</h1>
          <p class="lede" style="font-size:18px">Sign in to see your record, or the record of someone you care for.</p>
        </div>
        ${ui.signStep === 1 ? step1 : step2}
        <p class="foot">Your record belongs to you. It is encrypted and never sold.</p>
      </main>`;
  }

  function home() {
    const v = viewer(), n = takenCount();
    const meds = D.today.map(([key, id]) => {
      const m = D.meds[id], on = !!prefs.taken[key];
      return `<button class="plain med" data-act="toggleTaken" data-arg="${key}" aria-pressed="${on}">
        <span class="box" aria-hidden="true">${on ? "✓" : ""}</span>
        <span class="stack" style="display:flex;flex-direction:column;gap:2px"><span class="t21 name">${esc(m.name + " " + m.dose)}</span><span class="s16 muted">${esc(m.when)} · ${esc(m.why)}</span></span>
        <span class="state">${on ? "Taken" : "Tap when taken"}</span>
      </button>`;
    }).join("");
    const toggles = [["Attention alerts", "showAlert"], ["Companion card", "showCompanion"]].map(([label, key]) => `
      <button class="plain switch" role="switch" aria-checked="${prefs[key]}" data-act="toggle" data-arg="${key}">
        <span>${label}</span><span class="st"><span>${prefs[key] ? "On" : "Off"}</span><span class="track" aria-hidden="true"></span></span>
      </button>`).join("");
    return `
      <div class="head">
        <div class="s18 muted">${esc(v.greeting)}</div>
        <h1 class="title xl">Eleanor Vance</h1>
        <div class="s17 muted">Friday, October 31 · ${n} of ${D.today.length} medicines taken</div>
      </div>
      ${prefs.showAlert ? `
        <a class="plain card alert bp" href="#entry-vitals">${corners}
          <span class="label">Needs attention today</span>
          <span style="font:600 calc(26 * var(--u))/1.15 var(--font-heading)">Weight is up 4 pounds this week</span>
          <span class="s17" style="line-height:1.4">Dr. Okafor asked you to call if this happens. Tap to see the numbers and call the office.</span>
          <span class="cta" style="margin-top:6px">See details →</span>
        </a>` : ""}
      ${sec("Today's medicines", `<span class="aside">${n} of ${D.today.length} taken</span>`)}
      ${meds}
      ${sec("Coming up")}
      <a class="plain card bp mt14" href="#entry-prep" style="gap:4px">${corners}
        <span class="s16 muted">Tuesday, November 4 · 10:30 am</span>
        <span class="t24">Heart doctor — Dr. Okafor</span>
        <span class="s17">Ride is booked for 9:45. Maya is coming with you.</span>
        <span class="cta">Questions to ask →</span>
      </a>
      ${prefs.showCompanion ? `
        <a class="plain dark mt20" href="#companion">
          <span class="s15 b soft">Your Companion · knows your whole record</span>
          <span style="font:600 calc(24 * var(--u))/1.2 var(--font-heading);text-wrap:pretty">${esc(v.lead)}</span>
          <span class="soft" style="font:600 calc(18 * var(--u)) var(--font-heading)">Ask a question or learn something →</span>
        </a>` : ""}
      <a class="btn btn-secondary btn-block mt20" href="#timeline">See full history</a>
      <h2 class="sec minor">Show on this page</h2>
      ${toggles}`;
  }

  function health() {
    return `
      <div class="head"><h1 class="title">My health conditions</h1><p class="lede">Tap a condition to see its medicines, notes and appointments together.</p></div>
      ${Object.entries(D.conditions).map(([id, c]) => `
        <a class="plain card bp" href="#condition-${id}">${corners}
          <span style="display:flex;justify-content:space-between;gap:10px;align-items:baseline"><span class="t25">${esc(c.name)}</span><span class="s15 b ${c.watch ? "tone-flag" : "tone-sub"}" style="white-space:nowrap">${esc(c.status)}</span></span>
          <span class="s16 muted">${esc(c.doctor)} · since ${esc(c.since)}</span>
          <span class="s16">${[plural(c.meds.length, "medicine"), plural(c.appts.length, "appointment"), plural(c.notes.length, "note")].join(" · ")}</span>
        </a>`).join("")}`;
  }

  function condition(id) {
    const c = D.conditions[id] || D.conditions.hf;
    return `
      <div class="head"><div class="kicker">Condition · since ${esc(c.since)}</div><h1 class="title">${esc(c.name)}</h1><div class="s17 muted">${esc(c.doctor)}</div></div>
      <div class="card accent bp">${corners}<div class="label">In plain words</div><div class="body">${esc(c.plain)}</div></div>
      ${sec("Medicines for this")}
      ${c.meds.map((mid) => { const m = D.meds[mid]; return `
        <a class="plain row split" href="#med-${mid}"><span class="stack"><span class="t21">${esc(m.name + " " + m.dose)}</span><span class="s16 muted">${esc(m.when)}</span></span><span class="arrow" aria-hidden="true">→</span></a>`; }).join("") || '<p class="s16 muted" style="padding:14px 0">No medicines for this.</p>'}
      ${sec("Appointments")}
      ${c.appts.map((a) => `<div class="row"><span class="s16 muted">${esc(a.date)}</span><span class="t20">${esc(a.title)}</span>${a.note ? `<span class="s16">${esc(a.note)}</span>` : ""}</div>`).join("") || '<p class="s16 muted" style="padding:14px 0">No appointments.</p>'}
      ${sec("Notes and results")}
      ${c.notes.map((n) => `<a class="plain row" href="#entry-${n.id}"><span class="s16 muted">${esc(n.date)} · ${esc(n.kind)}</span><span class="t20">${esc(n.title)}</span></a>`).join("")}
      <a class="btn btn-primary btn-block mt18" href="#companion-${c.topic}">Learn about ${esc(c.short)}</a>`;
  }

  function med(id) {
    const m = D.meds[id] || D.meds.furo;
    const facts = [["Reason for taking", m.why], ["Date started", m.started], ["Prescribed by", m.doctor], ["Office", m.office], ["Pharmacy", m.pharmacy], ["Notes", m.notes]];
    const topic = id === "furo" ? "furo" : (Object.values(D.conditions).find((c) => c.meds.includes(id)) || D.conditions.hf).topic;
    return `
      <div class="head"><div class="kicker">Medicine</div><h1 class="title">${esc(m.name)}</h1><div style="font-size:calc(20 * var(--u))">${esc(m.dose)} · ${esc(m.when)}</div></div>
      <div class="photo"><div class="ph">Pill photo</div><div class="s17">${esc(m.look)}</div></div>
      ${facts.map(([k, v]) => `<div class="row" style="min-height:0"><span class="s15 b muted">${k}</span><span style="font-size:calc(19 * var(--u))">${esc(v)}</span></div>`).join("")}
      <a class="btn btn-primary btn-block mt18" href="#companion-${topic}">Why do I take this?</a>`;
  }

  function timeline() {
    const list = D.entries.filter((e) => ui.filter === "All" || e.kind === ui.filter);
    return `
      <div class="head" style="padding-bottom:0"><h1 class="title">Full history</h1></div>
      <div class="chips" role="group" aria-label="Filter history">
        ${D.entryKinds.map((k) => `<button class="chip" data-act="filter" data-arg="${esc(k)}" aria-pressed="${k === ui.filter}">${esc(k)}</button>`).join("")}
      </div>
      ${list.map((e) => `
        <a class="plain entry" href="#entry-${e.id}">
          <span style="display:flex;flex-direction:column"><span class="day">${e.day}</span><span class="s15 muted">${e.mon}</span></span>
          <span style="display:flex;flex-direction:column;gap:4px"><span class="s15 b flag">${esc(e.kind)}</span><span class="t21" style="line-height:1.2">${esc(e.title)}</span><span class="s16 muted" style="line-height:1.4">${esc(e.sub)}</span></span>
        </a>`).join("") || '<p class="s16 muted">Nothing here yet.</p>'}`;
  }

  function entry(id) {
    const d = D.details[id] || D.details.visit;
    return `
      <div class="head"><div class="kicker">${esc(d.kind)} · ${esc(d.date)}</div><h1 class="title" style="font-size:calc(34 * var(--u));line-height:1.08">${esc(d.title)}</h1><div class="s16 muted">${esc(d.source)}</div></div>
      <div class="card accent bp">${corners}<div class="label">What this means</div><div class="body">${esc(d.summary)}</div></div>
      ${d.canCall ? '<a class="btn btn-primary btn-block mt14" href="tel:5550142">Call Dr. Okafor\'s office</a>' : ""}
      ${sec(esc(d.listTitle))}
      ${d.rows.map((r) => `<div class="row split"><span class="stack"><span class="s18" style="font-weight:500">${esc(r.k)}</span><span class="s16 muted">${esc(r.note)}</span></span><span class="h tone-${r.tone}" style="font-size:calc(22 * var(--u))">${esc(r.v)}</span></div>`).join("")}
      ${sec("Message for the family")}
      <p class="s18" style="padding:12px 0;margin:0;line-height:1.5">${esc(d.family)}</p>
      <button class="btn btn-primary btn-block" data-act="toast" data-arg="Sent to Maya and James">Send to family</button>`;
  }

  function cancel(label) { return `<button class="link" data-act="addMode" data-arg="">${label || "Cancel"}</button>`; }
  const chips = (list, cur, key) => `<div class="chips" style="padding-bottom:0">${list.map((l) => `<button class="chip" data-act="pick" data-key="${key}" data-arg="${esc(l)}" aria-pressed="${l === cur}">${esc(l)}</button>`).join("")}</div>`;

  function portalRows() {
    const q = ui.portalQuery.trim().toLowerCase();
    const visible = q ? D.portals.concat(D.morePortals).filter((p) => (p.name + " " + p.sub).toLowerCase().includes(q)) : D.portals;
    if (!visible.length) {
      return `<div style="padding:14px 0;display:flex;flex-direction:column;gap:10px"><span class="s17">Nothing found for “${esc(ui.portalQuery)}”.</span><button class="btn btn-secondary" data-act="addMode" data-arg="doc">Upload the papers instead</button></div>`;
    }
    return visible.map((p) => {
      const st = prefs.portals[p.id];
      const btn = st === "connected" ? '<button class="btn btn-ghost small" disabled style="opacity:1">Connected</button>'
        : st === "connecting" ? '<button class="btn btn-secondary small" disabled style="opacity:1">Signing in…</button>'
        : `<button class="btn btn-primary small" data-act="connect" data-arg="${p.id}">Connect</button>`;
      return `<div class="row split"><span class="stack"><span class="t20">${esc(p.name)}</span><span class="s15 muted">${esc(p.sub)}${st === "connected" ? " · updated today" : ""}</span></span>${btn}</div>`;
    }).join("");
  }

  function addPanel() {
    if (ui.recording) {
      const mm = String(Math.floor(ui.secs / 60)).padStart(2, "0"), ss = String(ui.secs % 60).padStart(2, "0");
      return `
        <div class="dark mt20" style="gap:14px">
          <div class="s16 b soft" style="display:flex;justify-content:space-between;align-items:center"><span>Recording · <span id="recTime">${mm}:${ss}</span></span><span class="rec-dot" aria-hidden="true"></span></div>
          <div style="font:600 calc(22 * var(--u))/1.3 var(--font-heading);text-wrap:pretty">“…so we'll bump the furosemide to forty milligrams and I want a weight every morning…”</div>
          <button class="btn on-dark" data-act="stopRec">Stop and summarize</button>
        </div>`;
    }
    switch (ui.addMode) {
      case "med": {
        const f = ui.scanned ? D.scannedMed : {};
        const val = (k) => esc(f[k] || "");
        return `
          ${sec("Add a medicine", cancel())}
          <div class="pair mt14">
            <button class="plain drop bp" data-act="flag" data-arg="pill" aria-pressed="${ui.pill}">${corners}<span style="display:flex;flex-direction:column;gap:4px"><span class="h" style="font-size:19px">${ui.pill ? "Pill photo added ✓" : "Take pill photo"}</span><span style="font-size:14px" class="muted">Photo of the pill from the bottle</span></span></button>
            <button class="plain drop bp" data-act="flag" data-arg="scanned" aria-pressed="${ui.scanned}">${corners}<span style="display:flex;flex-direction:column;gap:4px"><span class="h" style="font-size:19px">${ui.scanned ? "Label read ✓" : "Scan the label"}</span><span style="font-size:14px" class="muted">Fills in name, dose, doctor</span></span></button>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px;margin-top:18px">
            <label class="field">Medicine name<input class="input" value="${val("name")}" placeholder="e.g. Furosemide"></label>
            <div class="pair"><label class="field">Dose<input class="input" value="${val("dose")}" placeholder="40 mg"></label><label class="field">When<input class="input" value="${val("when")}" placeholder="Every morning"></label></div>
            <div class="field" role="group" aria-label="Reason for taking"><span>Reason for taking</span>${chips(Object.values(D.conditions).map((c) => c.name).concat("Other"), ui.reason, "reason")}</div>
            <label class="field">Date started<input class="input" type="date" value="${val("started")}"></label>
            <label class="field">Doctor who prescribed it<input class="input" value="${val("doctor")}" placeholder="Dr. Adaeze Okafor"></label>
            <label class="field">Office or clinic<input class="input" value="${val("office")}" placeholder="Mercy Health Cardiology · 555-0142"></label>
            <label class="field">Pharmacy<input class="input" value="${val("pharmacy")}" placeholder="Walgreens, Main St"></label>
            <label class="field">Notes<textarea class="input" placeholder="Take with food, what to watch for…" style="min-height:80px"></textarea></label>
          </div>
          <button class="btn btn-primary btn-block mt18" data-act="saveMed">Save medicine</button>`;
      }
      case "vital": {
        const [ph, unit] = D.vitalKinds[ui.vitalKind];
        return `
          ${sec("Log a reading", cancel())}
          ${chips(Object.keys(D.vitalKinds), ui.vitalKind, "vitalKind")}
          <div style="display:grid;grid-template-columns:1fr auto;gap:12px;margin-top:16px;align-items:end">
            <label><span class="sr">${esc(ui.vitalKind)}</span><input class="input huge" inputmode="decimal" placeholder="${esc(ph)}"></label>
            <span class="muted" style="font-size:18px;padding-bottom:16px">${esc(unit)}</span>
          </div>
          <button class="btn btn-primary btn-block mt14" data-act="saved" data-arg="Reading saved">Save reading</button>`;
      }
      case "doc":
        return `
          ${sec("Add a paper or photo", cancel())}
          <label class="drop bp mt14" style="min-height:120px;cursor:pointer">${corners}
            <input type="file" multiple accept="image/*,.pdf" data-input="files" class="sr">
            <span style="display:flex;flex-direction:column;gap:4px"><span class="t20">Tap to choose a file</span><span class="s15 muted">Hospital papers, test results, insurance card</span></span>
          </label>
          <div class="pair mt12">
            <button class="btn btn-secondary" data-act="fakeFile" data-arg="photo">Take a photo</button>
            <button class="btn btn-secondary" data-act="fakeFile" data-arg="pdf">From my files</button>
          </div>
          ${ui.files.length ? ui.files.map((f) => `<div class="row" style="min-height:0"><span class="s18" style="font-weight:500">${esc(f.name)}</span><span class="s15 muted">${esc(f.meta)}</span></div>`).join("") +
            `<button class="btn btn-primary btn-block mt14" data-act="saveDocs">Add ${plural(ui.files.length, "file")} to my record</button>` : ""}`;
      case "symptom":
        return `
          ${sec("How are you feeling?", cancel())}
          ${chips(D.symptomKinds, ui.symptomKind, "symptomKind")}
          <div class="s16 b" style="margin-top:16px">How bad is it? 1 is mild, 5 is severe</div>
          <div class="seg c5" role="group" aria-label="Severity" style="margin-top:8px">
            ${[1, 2, 3, 4, 5].map((n) => `<button data-act="severity" data-arg="${n}" class="${n <= ui.severity ? "fill" : ""}" aria-pressed="${n === ui.severity}">${n}</button>`).join("")}
          </div>
          <label><span class="sr">What happened</span><textarea class="input mt12" placeholder="What happened, and what helped" style="min-height:88px"></textarea></label>
          <button class="btn btn-primary btn-block mt14" data-act="saved" data-arg="Saved to your history">Save</button>`;
      case "portal":
        return `
          ${sec("Bring in my records", cancel("Close"))}
          <p class="s17 muted" style="padding:12px 0 6px;margin:0;line-height:1.45">Sign in once with your patient portal login. After that, visits, tests and medicines come in on their own.</p>
          <label><span class="sr">Search</span><input class="input" type="search" placeholder="Search hospital, clinic, pharmacy or portal" value="${esc(ui.portalQuery)}" data-input="portalQuery"></label>
          <div id="portalList">${portalRows()}</div>`;
      default:
        return `
          ${sec("Quick note")}
          <label><span class="sr">Quick note</span><textarea class="input mt12" placeholder="For example: felt dizzy after lunch"></textarea></label>
          <button class="btn btn-primary btn-block mt12" data-act="saved" data-arg="Note saved">Save note</button>`;
    }
  }

  function add() {
    return `
      <div class="head"><h1 class="title">Add to my record</h1><p class="lede">Pick what you want to add. Your Companion reads it too.</p></div>
      <div class="tiles">
        <button class="tile rec" data-act="startRec"><span class="t">Record a visit</span><span class="s">Records what the doctor says</span></button>
        ${D.addTiles.map(([id, label, sub]) => `<button class="tile" data-act="addMode" data-arg="${id}" aria-pressed="${ui.addMode === id && !ui.recording}"><span class="t">${label}</span><span class="s">${sub}</span></button>`).join("")}
      </div>
      ${addPanel()}`;
  }

  function companion(topicId) {
    const t = topicId === "ask"
      ? { kicker: "Your question", title: ui.ask || "Ask me anything", body: "I would answer this using your own record — your medicines, visits and test results — in plain language, and tell you when a question is best for your doctor.", points: [], note: "Prototype: answers are illustrative." }
      : D.topics[topicId];
    const list = (items) => items.map(([id, label]) => `
      <a class="plain row split" href="#companion-${id}" style="padding:16px 0;min-height:60px"${topicId === id ? ' aria-current="true"' : ""}><span class="t20 ${topicId === id ? "flag" : ""}" style="line-height:1.2">${label}</span><span class="arrow" aria-hidden="true">→</span></a>`).join("");
    return `
      <div class="head"><h1 class="title">Your Companion</h1><p class="lede">It has read your whole record. Ask anything, or pick a topic to learn about.</p></div>
      <form data-form="ask" style="display:flex;gap:10px">
        <label style="flex:1"><span class="sr">Your question</span><input class="input" placeholder="Ask a question…" value="${esc(ui.ask)}" data-input="ask"></label>
        <button class="btn btn-primary" type="submit" style="min-width:76px">Ask</button>
      </form>
      <button class="btn btn-secondary btn-block" style="margin-top:10px" data-act="toast" data-arg="Listening… (voice is not in this version)">Speak instead</button>
      ${t ? `
        <section class="card accent bp" style="margin-top:22px;padding:18px;gap:10px" aria-live="polite">${corners}
          <div class="label">${esc(t.kicker)}</div>
          <h2 style="margin:0;font:600 calc(26 * var(--u))/1.15 var(--font-heading);text-wrap:pretty">${esc(t.title)}</h2>
          <div style="font-size:calc(18 * var(--u));line-height:1.55;text-wrap:pretty">${esc(t.body)}</div>
          ${t.points.map((p) => `<div class="bullet"><span>${esc(p)}</span></div>`).join("")}
          <div class="s15 muted" style="line-height:1.45;margin-top:4px">${esc(t.note)}</div>
          <div class="pair" style="margin-top:6px"><button class="btn btn-primary" data-act="readAloud">Read aloud</button><button class="btn btn-secondary" data-act="share">Share</button></div>
        </section>` : ""}
      ${sec("Food and eating")}${list(D.dietTopics)}
      ${sec("My conditions and medicines")}${list(D.eduTopics)}
      ${sec("Anything else")}
      <p class="s17 muted" style="padding:12px 0 8px;margin:0;line-height:1.45">Type a topic above — sleep, exercise, a new diagnosis, a word your doctor used — and your Companion explains it using your own record.</p>`;
  }

  function me() {
    const synced = Object.values(prefs.portals).filter((v) => v === "connected").length;
    const addBtn = (what) => `<button class="link" data-act="toast" data-arg="Adding ${what} is coming soon">+ Add</button>`;
    return `
      <div class="head"><h1 class="title">About me</h1><div class="s17 muted">Eleanor Vance · born March 2, 1948 · Medicare</div></div>
      <h2 class="sec" style="margin-top:0">Allergies${addBtn("allergies")}</h2>
      ${D.allergies.map((a) => `<div class="row split"><span class="stack"><span class="t21">${esc(a.name)}</span><span class="s16 muted">${esc(a.reaction)}</span></span><span class="badge tone-${a.tone}">${esc(a.severity)}</span></div>`).join("")}
      <h2 class="sec" style="margin-top:26px">Surgeries${addBtn("surgeries")}</h2>
      ${D.surgeries.map((s) => `<div class="row"><span class="s16 muted">${esc(s.year)}</span><span class="t21">${esc(s.name)}</span><span class="s16">${esc(s.where)}</span></div>`).join("")}
      <h2 class="sec" style="margin-top:26px">Medical history</h2>
      ${D.history.map((h) => `<div class="row"><span class="s16 b muted">${esc(h.k)}</span><span class="s18" style="line-height:1.45">${esc(h.v)}</span></div>`).join("")}
      <h2 class="sec" style="margin-top:26px">Who can see my record</h2>
      ${D.people.map((p) => `<div class="row split"><span class="stack"><span class="t20">${esc(p.name)}</span><span class="s16 muted">${esc(p.role)}</span></span><span class="badge flag">${esc(p.scope)}</span></div>`).join("")}
      <button class="btn btn-secondary btn-block mt14" data-act="toast" data-arg="Invite link copied">Invite someone</button>
      <h2 class="sec" style="margin-top:26px">My record</h2>
      <button class="plain row split s18" data-act="portals" style="padding:16px 0;min-height:60px"><span>Outside records (MyChart, labs, pharmacy)</span><span class="b flag" style="white-space:nowrap">${synced} synced →</span></button>
      <div class="row split s18" style="padding:16px 0;min-height:60px"><span>Emergency card</span><span class="b flag">On lock screen</span></div>
      <div class="row split s18" style="padding:16px 0;min-height:60px"><span>Download everything</span><span class="b flag">PDF</span></div>
      <button class="btn btn-secondary btn-block mt14" data-act="signOut">Sign out</button>
      <h2 class="sec" style="margin-top:26px">Text size</h2>
      <div class="seg c3" role="group" aria-label="Text size">
        ${["Standard", "Large", "Extra large"].map((s) => `<button data-act="textSize" data-arg="${s}" aria-pressed="${s === prefs.textSize}">${s}</button>`).join("")}
      </div>
      <button class="plain switch" role="switch" aria-checked="${prefs.contrast}" data-act="toggle" data-arg="contrast" style="margin-top:8px">
        <span>High contrast</span><span class="st"><span>${prefs.contrast ? "On" : "Off"}</span><span class="track" aria-hidden="true"></span></span>
      </button>`;
  }

  /* ---------- render ---------- */
  const SCALE = { Standard: "1px", Large: "1.11px", "Extra large": "1.28px" };
  function applyPrefs() {
    document.documentElement.style.setProperty("--u", SCALE[prefs.textSize] || "1px");
    if (prefs.contrast) document.documentElement.dataset.contrast = "high"; else delete document.documentElement.dataset.contrast;
  }

  function render() {
    route = parse(location.hash);
    if (!prefs.signedIn && route.name !== "signin") { location.replace("#signin"); route = parse("#signin"); }
    if (prefs.signedIn && route.name === "signin") { location.replace("#home"); route = parse("#home"); }
    if (route.name !== "add") stopRec();
    applyPrefs();

    if (route.name === "signin") { root.innerHTML = signIn(); document.title = "Sign in · MR.ME"; return; }
    const screens = { home, health, condition, med, timeline, entry, add, companion, me };
    const fn = screens[route.name] || home;
    root.innerHTML = header() + `<main id="main" class="scroll" tabindex="-1">${fn(route.arg)}</main>` + tabs();
    const h1 = root.querySelector("h1");
    document.title = (h1 ? h1.textContent + " · " : "") + "MR.ME";
  }
  function rerender() { const y = window.scrollY; render(); window.scrollTo(0, y); }

  function stopRec() { clearInterval(recTimer); recTimer = null; ui.recording = false; }

  /* ---------- events ---------- */
  const actions = {
    back(arg) { go(arg); },
    toast(arg) { toast(arg); },
    signStep2() { ui.signStep = 2; rerender(); },
    pickViewer(arg) { save("viewer", arg); save("signedIn", true); ui.signStep = 1; go("#home"); },
    signOut() { save("signedIn", false); ui.pass = ""; ui.signStep = 1; back = []; go("#signin"); },
    toggleTaken(arg) { const t = { ...prefs.taken, [arg]: !prefs.taken[arg] }; save("taken", t); rerender(); },
    toggle(arg) { save(arg, !prefs[arg]); rerender(); },
    textSize(arg) { save("textSize", arg); rerender(); },
    filter(arg) { ui.filter = arg; rerender(); },
    addMode(arg) { stopRec(); ui.addMode = arg && ui.addMode !== arg ? arg : null; rerender(); },
    pick(arg, el) { ui[el.dataset.key] = arg; rerender(); },
    severity(arg) { ui.severity = Number(arg); rerender(); },
    flag(arg) { ui[arg] = !ui[arg]; rerender(); },
    startRec() {
      ui.recording = true; ui.secs = 0; ui.addMode = null; rerender();
      clearInterval(recTimer);
      recTimer = setInterval(() => {
        ui.secs++;
        const el = document.getElementById("recTime");
        if (el) el.textContent = String(Math.floor(ui.secs / 60)).padStart(2, "0") + ":" + String(ui.secs % 60).padStart(2, "0");
      }, 1000);
    },
    stopRec() { stopRec(); toast("Visit summarized"); go("#entry-visit"); },
    saved(arg) { toast(arg); ui.addMode = null; go("#timeline"); },
    saveMed() { toast("Medicine saved"); ui.addMode = null; ui.pill = false; ui.scanned = false; go("#condition-hf"); },
    saveDocs() { toast(plural(ui.files.length, "file") + " added"); ui.files = []; ui.addMode = null; go("#timeline"); },
    fakeFile(arg) {
      ui.files.push(arg === "photo" ? { name: "Hospital discharge papers", meta: "Photo · just now" } : { name: "Echo report 2026-09-18.pdf", meta: "PDF · 412 KB" });
      rerender();
    },
    connect(arg) {
      save("portals", { ...prefs.portals, [arg]: "connecting" }); refreshPortals();
      setTimeout(() => { save("portals", { ...prefs.portals, [arg]: "connected" }); refreshPortals(); toast("Connected"); }, 1400);
    },
    portals() { stopRec(); ui.addMode = "portal"; go("#add"); },
    readAloud() {
      const card = root.querySelector("section.card");
      if (card && "speechSynthesis" in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(card.innerText)); }
      else toast("Read aloud isn't available on this device");
    },
    share() {
      const card = root.querySelector("section.card");
      const text = card ? card.innerText : "";
      if (navigator.share) navigator.share({ title: "From my MR.ME Companion", text }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("Copied to share"), () => toast("Couldn't copy"));
      else toast("Sharing isn't available here");
    }
  };
  function refreshPortals() { const el = document.getElementById("portalList"); if (el) el.innerHTML = portalRows(); }

  root.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || !root.contains(el)) return;
    const fn = actions[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el.dataset.arg, el); }
  });
  root.addEventListener("input", (e) => {
    const el = e.target;
    if (el.name === "email" || el.name === "pass") { ui[el.name] = el.value; if (ui.signError) { ui.signError = false; root.querySelector(".error")?.remove(); } }
    else if (el.dataset.input === "portalQuery") { ui.portalQuery = el.value; refreshPortals(); }
    else if (el.dataset.input === "ask") ui.ask = el.value;
  });
  root.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.input !== "files") return;
    Array.from(el.files || []).forEach((f) => ui.files.push({ name: f.name, meta: (f.type || "file") + " · " + Math.max(1, Math.round(f.size / 1024)) + " KB" }));
    rerender();
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target.dataset.form;
    if (form === "signin") {
      if (!ui.email || !ui.pass) { ui.signError = true; rerender(); root.querySelector(".error")?.focus(); return; }
      ui.signStep = 2; rerender();
    } else if (form === "ask") {
      if (!ui.ask.trim()) { toast("Type a question first"); return; }
      go("#companion-ask");
    }
  });

  render();
})();
