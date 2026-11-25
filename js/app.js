/* GttDrop — single-page app. No build step, no dependencies. */
(function () {
  "use strict";

  const DROPS = window.GTT_DROPS;
  const EVIDENCE = window.GTT_EVIDENCE;
  const ATLAS = Object.entries(window.GTT_ATLAS_RAW).flatMap(([system, list]) =>
    list.map((raw) => {
      const [title, what, focus] = raw.split("|");
      return { id: slug(title), system, title, what, focus };
    })
  );
  const main = document.getElementById("main");

  /* ---------- helpers ---------- */
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function highlight(text, q) {
    const safe = esc(text);
    if (!q) return safe;
    const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return safe.replace(re, "<mark>$1</mark>");
  }
  function daysSince(iso) { return Math.floor((Date.now() - new Date(iso + "T00:00:00").getTime()) / 86400000); }
  function addDays(iso, n) {
    const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
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
      try { const v = localStorage.getItem("gtt." + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem("gtt." + key, JSON.stringify(value)); } catch (e) { /* private mode */ } }
  };
  const tray = {
    all() { return store.get("tray", []); },
    has(key) { return this.all().includes(key); },
    toggle(key) {
      const list = this.all(); const i = list.indexOf(key);
      if (i >= 0) list.splice(i, 1); else list.push(key);
      store.set("tray", list); updateTrayCount();
      return i < 0;
    },
    clear() { store.set("tray", []); updateTrayCount(); }
  };
  function updateTrayCount() { document.getElementById("trayCount").textContent = tray.all().length; }
  function trayButton(key, label) {
    const on = tray.has(key);
    return `<button class="btn" data-tray="${esc(key)}" aria-pressed="${on}">${on ? "Saved to tray" : (label || "Save to tray")}</button>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tray]");
    if (!b) return;
    const added = tray.toggle(b.dataset.tray);
    b.setAttribute("aria-pressed", added);
    b.textContent = added ? "Saved to tray" : "Save to tray";
    toast(added ? "Added to your shift tray" : "Removed from tray");
    if (currentRoute === "tray") render();
  });

  /* ---------- player ---------- */
  let player = null;
  function stopPlayer() { if (player) { cancelAnimationFrame(player.raf); player = null; } }

  function startPlayer(drop) {
    stopPlayer();
    const root = document.getElementById("player");
    const beatEl = root.querySelector(".beat");
    const fills = root.querySelectorAll(".bars i");
    const timerEl = root.querySelector(".timer");
    const playBtn = root.querySelector("[data-act=play]");
    const loopBtn = root.querySelector("[data-act=loop]");
    const total = drop.seconds * 1000;
    const per = total / drop.beats.length;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    player = { elapsed: 0, last: performance.now(), playing: true, loop: store.get("loop", false), raf: 0, beat: -1 };
    loopBtn.setAttribute("aria-pressed", player.loop);

    function paint() {
      const i = Math.min(drop.beats.length - 1, Math.floor(player.elapsed / per));
      if (i !== player.beat) { player.beat = i; beatEl.textContent = drop.beats[i]; }
      fills.forEach((f, k) => {
        const p = k < i ? 1 : k > i ? 0 : (player.elapsed - k * per) / per;
        f.style.width = Math.max(0, Math.min(1, p)) * 100 + "%";
      });
      timerEl.textContent = Math.max(0, Math.ceil((total - player.elapsed) / 1000)) + "s";
    }
    function tick(now) {
      if (!player) return;
      if (player.playing) player.elapsed += now - player.last;
      player.last = now;
      if (player.elapsed >= total) {
        if (player.loop) { player.elapsed = 0; }
        else {
          player.elapsed = total; player.playing = false; paint();
          playBtn.textContent = "Replay"; playBtn.setAttribute("aria-pressed", "false");
          document.getElementById("after").hidden = false;
          return;
        }
      }
      paint();
      player.raf = requestAnimationFrame(tick);
    }
    root.querySelector(".player-controls").onclick = (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act || !player) return;
      if (act === "play") {
        if (player.elapsed >= total) { player.elapsed = 0; player.beat = -1; }
        player.playing = !player.playing; player.last = performance.now();
        playBtn.textContent = player.playing ? "Pause" : "Play";
        playBtn.setAttribute("aria-pressed", player.playing);
        cancelAnimationFrame(player.raf); player.raf = requestAnimationFrame(tick);
      } else if (act === "prev" || act === "next") {
        const target = Math.max(0, Math.min(drop.beats.length - 1, player.beat + (act === "next" ? 1 : -1)));
        player.elapsed = target * per; player.beat = -1; paint();
      } else if (act === "loop") {
        player.loop = !player.loop; store.set("loop", player.loop);
        loopBtn.setAttribute("aria-pressed", player.loop);
      } else if (act === "skip") {
        player.playing = false; player.elapsed = total; paint();
        playBtn.textContent = "Replay"; playBtn.setAttribute("aria-pressed", "false");
        const after = document.getElementById("after"); after.hidden = false;
        after.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      }
    };
    paint();
    player.raf = requestAnimationFrame(tick);
  }

  /* ---------- views ---------- */
  function viewDrops(q) {
    const results = store.get("quiz", {});
    const tags = ["All", ...new Set(DROPS.map((d) => d.tag))];
    const tag = q.tag || "All";
    const list = DROPS.filter((d) => tag === "All" || d.tag === tag);
    const done = DROPS.filter((d) => d.id in results).length;
    return `
      <h1>Today's drops</h1>
      <p class="lede">Twelve timed clinical drops. Each plays in under a minute, then gives you bedside language and a one-question check. ${done}/${DROPS.length} quizzes done.</p>
      <div class="toolbar" role="group" aria-label="Filter by tag">
        ${tags.map((t) => `<a class="btn" href="#/drops?tag=${encodeURIComponent(t)}" aria-pressed="${t === tag}">${esc(t)}</a>`).join("")}
      </div>
      <div class="grid">
        ${list.map((d) => `
          <article class="card drop-card" style="--c:${d.color}">
            <div class="drop-meta"><span class="chip">${esc(d.tag)}</span><span class="chip">${d.seconds}s</span>
              ${d.id in results ? `<span class="done">${results[d.id] ? "✓ Quiz correct" : "Quiz tried"}</span>` : ""}</div>
            <h3><a href="#/drop/${d.id}">${esc(d.title)}</a></h3>
            <p class="muted">${esc(d.beats[0])}</p>
            <div class="row"><a class="btn primary" href="#/drop/${d.id}">Play drop</a>${trayButton("drop:" + d.id)}</div>
          </article>`).join("")}
      </div>`;
  }

  function viewDrop(id) {
    const d = DROPS.find((x) => x.id === id);
    if (!d) return notFound();
    const idx = DROPS.indexOf(d);
    const next = DROPS[(idx + 1) % DROPS.length];
    const srcs = d.sources.map((s) => EVIDENCE.find((e) => e.id === s)).filter(Boolean);
    const prior = store.get("quiz", {})[d.id];
    return `
      <p><a href="#/drops">← All drops</a></p>
      <section id="player" class="player" style="--c:${d.color}" aria-label="Drop player">
        <div class="bars" aria-hidden="true">${d.beats.map(() => "<span><i></i></span>").join("")}</div>
        <p class="beat" aria-live="polite"></p>
        <div class="player-controls">
          <button class="btn" data-act="prev" aria-label="Previous beat">‹</button>
          <button class="btn" data-act="play" aria-pressed="true">Pause</button>
          <button class="btn" data-act="next" aria-label="Next beat">›</button>
          <button class="btn" data-act="loop" aria-pressed="false" title="Loop the drop">Loop</button>
          <button class="btn" data-act="skip">Skip to bedside</button>
          <span class="timer"></span>
        </div>
      </section>
      <div class="row" style="margin:14px 0">
        <h1 style="flex:1;font-size:1.4rem;margin:0">${esc(d.title)}</h1>
        ${trayButton("drop:" + d.id)}
      </div>

      <div id="after" ${prior === undefined ? "hidden" : ""}>
        <h2>Bedside language</h2>
        <div class="bedside">
          <div class="card"><div class="label">To the patient</div><p>“${esc(d.bedside.patient)}”</p></div>
          <div class="card"><div class="label">To the family</div><p>“${esc(d.bedside.family)}”</p></div>
          <div class="card"><div class="label">To the team</div><p>“${esc(d.bedside.team)}”</p></div>
        </div>

        <h2>Quick check</h2>
        <form class="quiz card" id="quiz">
          <fieldset>
            <legend>${esc(d.quiz.q)}</legend>
            ${d.quiz.options.map((o, i) => `<label><input type="radio" name="a" value="${i}"> <span>${esc(o)}</span></label>`).join("")}
          </fieldset>
          <div class="row" style="margin-top:12px"><button class="btn primary" type="submit">Check answer</button></div>
          <div id="feedback" aria-live="polite"></div>
        </form>

        <h2>Sources</h2>
        ${srcs.length ? `<ul>${srcs.map((s) => `<li><a href="#/evidence">${esc(s.title)}</a> <span class="muted">(reviewed ${s.reviewed})</span></li>`).join("")}</ul>`
          : `<p class="muted">General critical care nursing practice — follow your hospital's protocol for this infusion.</p>`}
        <p class="muted">Education only. Doses, targets and titration come from provider orders and your hospital's protocols.</p>
        <p><a class="btn" href="#/drop/${next.id}">Next drop: ${esc(next.title)} →</a></p>
      </div>`;
  }

  function bindDrop(id) {
    const d = DROPS.find((x) => x.id === id);
    if (!d) return;
    startPlayer(d);
    document.getElementById("quiz").addEventListener("submit", (e) => {
      e.preventDefault();
      const picked = e.target.querySelector("input[name=a]:checked");
      const fb = document.getElementById("feedback");
      if (!picked) { fb.innerHTML = `<div class="feedback">Pick an answer first.</div>`; return; }
      const ok = Number(picked.value) === d.quiz.answer;
      e.target.querySelectorAll("label").forEach((l, i) => {
        l.classList.remove("correct", "wrong");
        if (i === d.quiz.answer) l.classList.add("correct");
        else if (l.contains(picked)) l.classList.add("wrong");
      });
      fb.innerHTML = `<div class="feedback ${ok ? "ok" : "no"}"><strong>${ok ? "Correct." : "Not quite."}</strong> ${esc(d.quiz.why)}</div>`;
      const results = store.get("quiz", {}); results[d.id] = ok; store.set("quiz", results);
    });
  }

  function viewAtlas(q) {
    const systems = ["All systems", ...Object.keys(window.GTT_ATLAS_RAW)];
    return `
      <h1>ICU atlas</h1>
      <p class="lede">${ATLAS.length} topics across ${systems.length - 1} systems. Short orientation summaries with a nursing focus — a starting point, not a reference text.</p>
      <div class="toolbar">
        <input type="search" id="atlasQ" placeholder="Search topics, e.g. CRRT, delirium, tamponade" value="${esc(q.q || "")}" aria-label="Search the atlas">
        <select id="atlasSys" aria-label="Filter by system">
          ${systems.map((s) => `<option ${s === (q.system || "All systems") ? "selected" : ""}>${esc(s)}</option>`).join("")}
        </select>
      </div>
      <p class="muted" id="atlasCount" aria-live="polite"></p>
      <div class="atlas-list" id="atlasList"></div>`;
  }

  function bindAtlas() {
    const input = document.getElementById("atlasQ");
    const sel = document.getElementById("atlasSys");
    const listEl = document.getElementById("atlasList");
    const countEl = document.getElementById("atlasCount");
    function draw() {
      const q = input.value.trim().toLowerCase();
      const sys = sel.value;
      const hits = ATLAS.filter((t) =>
        (sys === "All systems" || t.system === sys) &&
        (!q || (t.title + " " + t.what + " " + t.focus + " " + t.system).toLowerCase().includes(q)));
      countEl.textContent = `${hits.length} of ${ATLAS.length} topics`;
      listEl.innerHTML = hits.length ? hits.map((t) => `
        <article class="card atlas-item" id="t-${t.id}">
          <span class="chip">${esc(t.system)}</span>
          <h3 style="margin-top:8px">${highlight(t.title, q)}</h3>
          <p>${highlight(t.what, q)}</p>
          <p class="focus"><b>Nursing focus:</b> ${highlight(t.focus, q)}</p>
          <div class="row" style="margin-top:10px">${trayButton("atlas:" + t.id)}</div>
        </article>`).join("") : `<div class="empty">No topics match “${esc(input.value)}”. Try a broader word.</div>`;
      const params = new URLSearchParams();
      if (input.value) params.set("q", input.value);
      if (sys !== "All systems") params.set("system", sys);
      history.replaceState(null, "", "#/atlas" + (params.toString() ? "?" + params : ""));
    }
    input.addEventListener("input", draw);
    sel.addEventListener("change", draw);
    draw();
  }

  function viewTray() {
    const keys = tray.all();
    const drops = keys.filter((k) => k.startsWith("drop:")).map((k) => DROPS.find((d) => "drop:" + d.id === k)).filter(Boolean);
    const topics = keys.filter((k) => k.startsWith("atlas:")).map((k) => ATLAS.find((t) => "atlas:" + t.id === k)).filter(Boolean);
    if (!drops.length && !topics.length) {
      return `<h1>Shift tray</h1><div class="empty"><p>Your tray is empty.</p><p>Save drops and atlas topics you want to review on shift.</p><a class="btn primary" href="#/drops">Browse drops</a></div>`;
    }
    return `
      <h1>Shift tray</h1>
      <p class="lede">Saved on this device only. ${keys.length} item${keys.length === 1 ? "" : "s"}.</p>
      <div class="toolbar"><button class="btn" id="printTray">Print tray</button><button class="btn" id="clearTray">Clear tray</button></div>
      ${drops.length ? `<h2>Drops</h2><div class="grid">${drops.map((d) => `
        <article class="card drop-card" style="--c:${d.color}">
          <span class="chip">${esc(d.tag)} · ${d.seconds}s</span>
          <h3><a href="#/drop/${d.id}">${esc(d.title)}</a></h3>
          <p class="muted">“${esc(d.bedside.team)}”</p>
          <div class="row"><a class="btn primary" href="#/drop/${d.id}">Play</a>${trayButton("drop:" + d.id)}</div>
        </article>`).join("")}</div>` : ""}
      ${topics.length ? `<h2>Atlas topics</h2><div class="atlas-list">${topics.map((t) => `
        <article class="card atlas-item">
          <span class="chip">${esc(t.system)}</span>
          <h3 style="margin-top:8px">${esc(t.title)}</h3>
          <p>${esc(t.what)}</p>
          <p class="focus"><b>Nursing focus:</b> ${esc(t.focus)}</p>
          <div class="row" style="margin-top:10px">${trayButton("atlas:" + t.id)}</div>
        </article>`).join("")}</div>` : ""}`;
  }
  function bindTray() {
    document.getElementById("clearTray")?.addEventListener("click", () => {
      if (confirm("Clear everything from your shift tray?")) { tray.clear(); render(); }
    });
    document.getElementById("printTray")?.addEventListener("click", () => window.print());
  }

  function queueItems() {
    const overrides = store.get("queueStatus", {});
    const pitches = store.get("pitches", []);
    return [...window.GTT_QUEUE, ...pitches].map((i) => ({ ...i, status: overrides[i.id] || i.status }));
  }
  function viewQueue() {
    const items = queueItems();
    const S = window.GTT_QUEUE_STATUSES;
    return `
      <h1>Editorial queue</h1>
      <p class="lede">What's coming next. Pitch a drop and move it along as it gets drafted and reviewed. Pitches are saved on this device.</p>
      <form class="pitch card" id="pitchForm">
        <input type="text" id="pitchTitle" placeholder="Pitch a drop: e.g. 'Nimodipine timing after SAH'" required maxlength="120" aria-label="Drop idea">
        <select id="pitchTag" aria-label="Topic">${["Drips", "Liberation", "Resus", "Respiratory", "Neuro", "Renal", "Heme", "Other"].map((t) => `<option>${t}</option>`).join("")}</select>
        <button class="btn primary" type="submit">Add pitch</button>
      </form>
      <div class="kanban">
        ${S.map((s) => {
          const col = items.filter((i) => i.status === s);
          return `<section class="col" aria-label="${s}"><h3><span>${s}</span><span class="chip">${col.length}</span></h3>
            ${col.map((i) => `<div class="card">
              <span class="chip">${esc(i.tag)}</span>
              <p><strong>${esc(i.title)}</strong></p>
              <div class="row">
                <select data-move="${esc(i.id)}" aria-label="Move ${esc(i.title)}">${S.map((x) => `<option ${x === s ? "selected" : ""}>${x}</option>`).join("")}</select>
                ${i.mine ? `<button class="btn" data-del="${esc(i.id)}" aria-label="Delete pitch">Delete</button>` : ""}
              </div></div>`).join("") || `<p class="muted">Nothing here.</p>`}
          </section>`;
        }).join("")}
      </div>
      <p class="muted" style="margin-top:16px">Every drop is reviewed against the evidence shelf before it is scheduled.</p>`;
  }
  function bindQueue() {
    document.getElementById("pitchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("pitchTitle").value.trim();
      if (!title) return;
      const pitches = store.get("pitches", []);
      pitches.push({ id: "p-" + Date.now(), title, tag: document.getElementById("pitchTag").value, status: "Pitched", mine: true });
      store.set("pitches", pitches); toast("Pitch added"); render();
    });
    main.querySelectorAll("[data-move]").forEach((sel) => sel.addEventListener("change", () => {
      const o = store.get("queueStatus", {}); o[sel.dataset.move] = sel.value; store.set("queueStatus", o); render();
    }));
    main.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
      store.set("pitches", store.get("pitches", []).filter((p) => p.id !== b.dataset.del)); render();
    }));
  }

  function viewTeam() {
    const enc = window.GTT_ENCOURAGEMENT;
    const day = Math.floor(Date.now() / 86400000);
    return `
      <h1>Team</h1>
      <p class="lede">Wins worth repeating, a word for the hard shifts, and the things experienced nurses wish they'd known sooner.</p>
      <section class="card" aria-label="Encouragement">
        <p class="muted" style="margin:0 0 6px">For your shift</p>
        <p class="encourage" id="enc" aria-live="polite">${esc(enc[day % enc.length])}</p>
        <button class="btn" id="encNext">Another one</button>
      </section>
      <h2>Team wins</h2>
      <div class="grid">${window.GTT_WINS.map((w) => `<blockquote class="card"><p>${esc(w.text)}</p><footer class="muted">— ${esc(w.who)}</footer></blockquote>`).join("")}</div>
      <h2>Nursing insights</h2>
      <div class="grid">${window.GTT_INSIGHTS.map((i) => `<article class="card"><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></article>`).join("")}</div>`;
  }
  function bindTeam() {
    const enc = window.GTT_ENCOURAGEMENT;
    let i = enc.indexOf(document.getElementById("enc").textContent);
    document.getElementById("encNext").addEventListener("click", () => {
      i = (i + 1) % enc.length; document.getElementById("enc").textContent = enc[i];
    });
  }

  function viewEvidence() {
    const N = window.GTT_REVIEW_INTERVAL_DAYS;
    const stale = EVIDENCE.filter((e) => daysSince(e.reviewed) > N).length;
    return `
      <h1>Evidence shelf</h1>
      <p class="lede">Every drop points back to a dated source. Sources are re-checked about monthly; anything older than ${N} days is flagged so the shelf never goes stale quietly.</p>
      <p class="${stale ? "status stale" : "status fresh"}">${stale ? `${stale} source${stale === 1 ? "" : "s"} due for review` : "All sources reviewed within the last " + N + " days"}</p>
      <div class="grid evidence">${EVIDENCE.map((e) => {
        const isStale = daysSince(e.reviewed) > N;
        const used = DROPS.filter((d) => d.sources.includes(e.id));
        return `<article class="card">
          <span class="status ${isStale ? "stale" : "fresh"}">${isStale ? "Review due" : "Current"} · reviewed ${e.reviewed} · next by ${addDays(e.reviewed, N)}</span>
          <h3>${esc(e.title)}</h3>
          <p class="muted" style="margin:0">${esc(e.org)} · ${esc(e.published)}</p>
          <p style="margin:0">${esc(e.scope)}</p>
          ${used.length ? `<p class="muted" style="margin:0">Used in: ${used.map((d) => `<a href="#/drop/${d.id}">${esc(d.title)}</a>`).join(", ")}</p>` : ""}
          <p style="margin:6px 0 0"><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></p>
        </article>`;
      }).join("")}</div>`;
  }

  function viewDownloads() {
    return `
      <h1>Downloads</h1>
      <p class="lede">Printable references for shift. Communication boards print best on letter paper, laminated.</p>
      <div class="grid" id="dl">${window.GTT_DOWNLOADS.map((f, i) => `
        <article class="card" data-i="${i}">
          <span class="chip">PDF</span>
          <h3 style="margin-top:8px">${esc(f.title)}</h3>
          <p class="muted">${esc(f.note)}</p>
          <div class="row">${f.available
            ? `<a class="btn primary" href="${esc(f.file)}" download>Download</a><a class="btn" href="${esc(f.file)}" target="_blank" rel="noopener">Open</a>`
            : `<span class="btn" aria-disabled="true" data-slot>File not added yet</span>`}</div>
        </article>`).join("")}</div>`;
  }
  function bindDownloads() {
    // If a file slot was filled after publishing (e.g. the study guide), enable it automatically.
    main.querySelectorAll("[data-slot]").forEach((el) => {
      const f = window.GTT_DOWNLOADS[Number(el.closest("[data-i]").dataset.i)];
      fetch(f.file, { method: "HEAD" }).then((r) => {
        if (r.ok) el.outerHTML = `<a class="btn primary" href="${esc(f.file)}" download>Download</a><a class="btn" href="${esc(f.file)}" target="_blank" rel="noopener">Open</a>`;
      }).catch(() => {});
    });
  }

  function viewAbout() {
    return `
      <h1>Clinical guardrails</h1>
      <p class="lede">GttDrop is an education tool for ICU nurses. Read this once; it applies to every page.</p>
      <div class="grid">
        <article class="card"><h3>Education, not orders</h3><p>Nothing here is a provider order. Doses, targets, titration and parameters come from the patient's orders.</p></article>
        <article class="card"><h3>Local policy wins</h3><p>Your hospital's policies, protocols and nomograms take precedence over anything in GttDrop. When they differ, follow local policy and tell the editorial team.</p></article>
        <article class="card"><h3>Judgment at the bedside</h3><p>Drops are simplified on purpose. Real patients are not. Escalate concerns early and use your rapid response team.</p></article>
        <article class="card"><h3>No patient data</h3><p>Don't enter patient identifiers anywhere in GttDrop. The shift tray and pitches are stored only in this browser.</p></article>
        <article class="card"><h3>Dated evidence</h3><p>Each source shows when it was last reviewed. Guidelines change; check the <a href="#/evidence">evidence shelf</a> for review status.</p></article>
        <article class="card"><h3>No dosing content</h3><p>Drops deliberately avoid medication doses. Use your pharmacy references and order sets.</p></article>
      </div>
      <h2>About this edition</h2>
      <p>First edition · ${DROPS.length} drops · ${ATLAS.length} atlas topics · ${EVIDENCE.length} evidence sources. Private, not indexed by search engines.</p>`;
  }

  function notFound() {
    return `<div class="empty"><h1>Not found</h1><p>That page doesn't exist.</p><a class="btn primary" href="#/drops">Back to drops</a></div>`;
  }

  /* ---------- router ---------- */
  let currentRoute = "";
  function parse() {
    const h = location.hash.replace(/^#\/?/, "") || "drops";
    const [path, qs] = h.split("?");
    const parts = path.split("/");
    return { route: parts[0], arg: parts[1], q: Object.fromEntries(new URLSearchParams(qs || "")) };
  }
  function render() {
    stopPlayer();
    const { route, arg, q } = parse();
    const key = route + (arg || "");
    const changed = key !== currentRoute;
    currentRoute = key;
    const views = {
      drops: () => [viewDrops(q)],
      drop: () => [viewDrop(arg), () => bindDrop(arg)],
      atlas: () => [viewAtlas(q), bindAtlas],
      tray: () => [viewTray(), bindTray],
      queue: () => [viewQueue(), bindQueue],
      team: () => [viewTeam(), bindTeam],
      evidence: () => [viewEvidence()],
      downloads: () => [viewDownloads(), bindDownloads],
      about: () => [viewAbout()]
    };
    const [html, bind] = (views[route] || (() => [notFound()]))();
    main.innerHTML = html;
    if (bind) bind();
    document.querySelectorAll(".nav a").forEach((a) => {
      const on = a.dataset.route === route || (route === "drop" && a.dataset.route === "drops");
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    document.getElementById("nav").classList.remove("open");
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
    const titles = { drops: "Drops", drop: "Drop", atlas: "Atlas", tray: "Shift tray", queue: "Queue", team: "Team", evidence: "Evidence", downloads: "Downloads", about: "Guardrails" };
    document.title = (titles[route] ? titles[route] + " · " : "") + "GttDrop";
    if (changed) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }

  document.getElementById("menuBtn").addEventListener("click", (e) => {
    const nav = document.getElementById("nav");
    const open = nav.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", open);
  });
  document.getElementById("shelfDate").textContent = EVIDENCE.map((e) => e.reviewed).sort()[0];
  window.addEventListener("hashchange", render);
  updateTrayCount();
  render();
})();
