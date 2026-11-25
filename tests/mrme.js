/* MR.ME smoke test. Run: node tests/mrme.js
   Starts a static server, drives Chromium through the main MR.ME flows. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  const file = p.endsWith("/") ? path.join(p, "index.html") : p;
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  res.end(fs.readFileSync(file));
});

let failures = 0;
const settle = (pg) => pg.waitForTimeout(150); // hash routes render on hashchange
function check(cond, msg) { console.log((cond ? "  ok  " : "  FAIL ") + msg); if (!cond) failures++; }

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/mrme/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); // offline-safe
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts|ERR_FAILED/.test(m.text())) errors.push(m.text()); });

  // Sign in
  await page.goto(base + "#home");
  check(/#signin$/.test(page.url()), "signed-out visit redirects to sign in");
  await page.click('button:has-text("Sign in")');
  check(await page.isVisible(".error"), "empty sign in shows error");
  await page.fill('input[name="email"]', "eleanor@example.com");
  await page.fill('input[name="pass"]', "secret");
  await page.click('button:has-text("Sign in")');
  check(await page.isVisible('text="Who are you signing in as?"'), "role picker shown");
  await page.click('button:has-text("I care for someone")');
  await page.waitForSelector(".tabs");
  check((await page.textContent(".viewer")) === "Maya · caregiver", "viewer chip reflects role");
  check(/Looking after Mom/.test(await page.textContent("main")), "greeting follows viewer");

  // Home: medicines checklist
  check(/4 of 6 taken/.test(await page.textContent(".sec")), "starts with 4 of 6 taken");
  await page.click('.med:has-text("Potassium")');
  check(/5 of 6 taken/.test(await page.textContent("main")), "tapping a medicine marks it taken");
  await page.click('.switch:has-text("Attention alerts")');
  check(!(await page.isVisible(".card.alert")), "alert toggle hides the alert");
  await page.click('.switch:has-text("Attention alerts")');

  // Alert -> entry detail -> back
  await page.click(".card.alert"); await settle(page);
  check(/Weight up 4 lb in 5 days/.test(await page.textContent("h1")), "alert opens reading detail");
  check(await page.isVisible('a:has-text("Call Dr. Okafor")'), "reading offers call button");
  await page.click(".back"); await settle(page);
  check(await page.isVisible(".card.alert"), "back returns home");

  // Health -> condition -> med -> back -> back
  await page.click('.tabs a[href="#health"]'); await settle(page);
  check((await page.locator("main a.card").count()) === 5, "five conditions listed");
  await page.click('a.card:has-text("Heart failure")'); await settle(page);
  await page.click('a.row:has-text("Furosemide")'); await settle(page);
  check((await page.textContent("h1")) === "Furosemide", "medicine detail opens");
  check(/Heart failure/.test(await page.textContent(".back")), "back label names the condition");
  await page.click(".back"); await settle(page); await page.click(".back"); await settle(page);
  check((await page.textContent("h1")) === "My health conditions", "back stack returns to conditions");

  // Timeline filter
  await page.goto(base + "#timeline");
  check((await page.locator(".entry").count()) === 5, "history shows 5 entries");
  await page.click('.chip:has-text("Blood test")');
  check((await page.locator(".entry").count()) === 1, "filter narrows history");

  // Add: tiles, medicine scan, portal search, recording
  await page.click('.tabs a[href="#add"]'); await settle(page);
  await page.click('.tile:has-text("Medicine")');
  await page.click('.drop:has-text("Scan the label")');
  check((await page.inputValue('label:has-text("Medicine name") input')) === "Furosemide", "scanning the label fills the form");
  await page.click('.tile:has-text("My records")');
  await page.fill('input[type="search"]', "zzz");
  check(/Nothing found/.test(await page.textContent("#portalList")), "portal search shows empty state");
  await page.fill('input[type="search"]', "kaiser");
  await page.click('#portalList button:has-text("Connect")');
  check(await page.isVisible('#portalList button:has-text("Signing in")'), "connect shows signing in");
  await page.waitForSelector('#portalList button:has-text("Connected")', { timeout: 3000 });
  check(true, "portal finishes connecting");
  await page.click(".tile.rec");
  await page.waitForTimeout(1100);
  check(/00:0[1-9]/.test(await page.textContent("#recTime")), "recording timer runs");
  await page.click('button:has-text("Stop and summarize")'); await settle(page);
  check(/Heart doctor/.test(await page.textContent("h1")), "stopping recording opens visit summary");

  // Companion
  await page.click('.tabs a[href="#companion"]'); await settle(page);
  await page.click('a.row:has-text("Eating less salt")'); await settle(page);
  check(/less salt/.test(await page.textContent("section.card h2")), "topic opens in companion");
  await page.fill('input[data-input="ask"]', "Can I eat bananas?");
  await page.click('button:has-text("Ask")'); await settle(page);
  check((await page.textContent("section.card h2")) === "Can I eat bananas?", "asked question shown");

  // Me: text size, contrast, persistence, sign out
  await page.click('.tabs a[href="#me"]'); await settle(page);
  await page.click('.seg button:has-text("Extra large")');
  const u = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--u").trim());
  check(u === "1.28px", "text size scales content");
  await page.click('.switch:has-text("High contrast")');
  check((await page.getAttribute("html", "data-contrast")) === "high", "high contrast applies");
  await page.reload();
  check(/5 of 6/.test(await page.evaluate(() => { location.hash = "#home"; return new Promise((r) => setTimeout(() => r(document.querySelector("main").textContent), 50)); })), "taken state persists across reload");
  await page.goto(base + "#me");
  await page.click('button:has-text("Sign out")'); await settle(page);
  check(/#signin$/.test(page.url()), "sign out returns to sign in");

  // Mobile layout
  const m = await browser.newPage({ viewport: { width: 375, height: 740 } });
  await m.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await m.goto(base);
  await m.evaluate(() => { localStorage.setItem("mrme.signedIn", "true"); });
  for (const r of ["#home", "#add", "#me", "#companion-hf"]) {
    await m.goto(base + r);
    const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    check(!overflow, `no horizontal scroll at 375px on ${r}`);
  }

  check(errors.length === 0, "no console errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  server.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
