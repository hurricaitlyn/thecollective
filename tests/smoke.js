/* GttDrop smoke test. Run: node tests/smoke.js
   Starts a static server, drives Chromium through the main flows. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".pdf": "application/pdf" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  const file = p.endsWith("/") ? path.join(p, "index.html") : p;
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  res.end(req.method === "HEAD" ? undefined : fs.readFileSync(file));
});

let failures = 0;
function check(cond, msg) { console.log((cond ? "  ok  " : "  FAIL ") + msg); if (!cond) failures++; }

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("404")) errors.push(m.text()); });

  await page.goto(base);
  check((await page.locator(".drop-card").count()) === 12, "feed shows 12 drops");

  // Filter
  await page.click('a.btn:has-text("Resus")');
  await page.waitForFunction(() => document.querySelectorAll(".drop-card").length < 12);
  check((await page.locator(".drop-card").count()) === 1, "tag filter narrows feed");

  // Save to tray
  await page.goto(base + "#/drops");
  await page.locator(".drop-card [data-tray]").first().click();
  check((await page.textContent("#trayCount")) === "1", "save increments tray count");

  // Play a drop, skip, quiz
  await page.goto(base + "#/drop/cam-icu");
  await page.waitForFunction(() => document.querySelector(".beat").textContent.length > 0);
  check(/RASS/.test(await page.textContent(".beat")), "player shows first beat");
  await page.click('[data-act="next"]');
  check(/Feature 1/.test(await page.textContent(".beat")), "next beat control works");
  await page.click('[data-act="skip"]');
  check(await page.isVisible("#after"), "bedside + quiz revealed after skip");
  await page.check('#quiz input[value="1"]');
  await page.click('#quiz button[type="submit"]');
  check(/Not quite/.test(await page.textContent("#feedback")), "wrong answer feedback");
  await page.check('#quiz input[value="0"]');
  await page.click('#quiz button[type="submit"]');
  check(/Correct/.test(await page.textContent("#feedback")), "correct answer feedback");

  // Timer finishes on its own (shortest drop is 20s; fast-forward via clock not needed: check timer counts down)
  await page.goto(base + "#/drop/hq-cpr");
  const t1 = await page.textContent(".timer");
  await page.waitForTimeout(1200);
  const t2 = await page.textContent(".timer");
  check(parseInt(t2) < parseInt(t1), `timer counts down (${t1} → ${t2})`);

  // Atlas search
  await page.goto(base + "#/atlas");
  check(/170 of 170/.test(await page.textContent("#atlasCount")), "atlas has 170 topics");
  await page.fill("#atlasQ", "tamponade");
  const n = await page.locator(".atlas-item").count();
  check(n >= 1 && n < 170, `search narrows results (${n})`);
  check((await page.locator(".atlas-item mark").count()) > 0, "search terms highlighted");
  await page.fill("#atlasQ", "zzzznotatopic");
  check(await page.isVisible(".empty"), "empty search state");
  await page.fill("#atlasQ", "");
  await page.selectOption("#atlasSys", "Neuro");
  check((await page.locator(".atlas-item").count()) === 12, "system filter works");
  await page.locator(".atlas-item [data-tray]").first().click();

  // Tray persists after reload
  await page.goto(base + "#/tray");
  await page.reload();
  check((await page.locator("#main .card").count()) === 2, "tray shows saved drop + topic after reload");

  // Queue: pitch + move
  await page.goto(base + "#/queue");
  await page.fill("#pitchTitle", "Nimodipine timing after SAH");
  await page.click('#pitchForm button[type="submit"]');
  check(/Nimodipine/.test(await page.textContent(".kanban")), "pitch added to queue");
  await page.locator('[data-move^="p-"]').selectOption("Drafting");
  const drafting = await page.locator('section[aria-label="Drafting"]').textContent();
  check(/Nimodipine/.test(drafting), "pitch moved to Drafting");

  // Evidence + team + downloads
  await page.goto(base + "#/evidence");
  check((await page.locator(".evidence .card").count()) === 6, "evidence shelf lists 6 dated sources");
  await page.goto(base + "#/team");
  const e1 = await page.textContent("#enc");
  await page.click("#encNext");
  check((await page.textContent("#enc")) !== e1, "encouragement rotates");
  await page.goto(base + "#/downloads");
  const links = await page.locator('#dl a[download]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  check(links.length === 2, "two board downloads available");
  for (const href of links) {
    const r = await page.request.get(base + href);
    check(r.ok() && (await r.body()).slice(0, 4).toString() === "%PDF", `${href} serves a PDF`);
  }
  check(await page.isVisible("[data-slot]"), "study guide slot shown as not yet added");

  // 404 route
  await page.goto(base + "#/nope");
  check(/Not found/.test(await page.textContent("main")), "unknown route shows not found");

  // Mobile layout
  const m = await browser.newPage({ viewport: { width: 375, height: 740 } });
  await m.goto(base + "#/atlas");
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check(!overflow, "no horizontal scroll at 375px");
  await m.click("#menuBtn");
  check(await m.isVisible('.nav a[data-route="team"]'), "mobile menu opens");
  await m.click('.nav a[data-route="team"]');
  await m.waitForSelector("#enc");
  check(!(await m.isVisible('.nav a[data-route="team"]')), "mobile menu closes on navigate");

  check(errors.length === 0, "no console errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
