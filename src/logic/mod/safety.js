/* Safety: overview, checks, defects, incidents, evidence and packs. Sample data stands in for Flex.
   Every tile, chart element and row opens the records behind it. */
import {
  CLOCK, HIST, MONTH_LABELS, INCIDENTS, TRAINING, eur, fmtDate, daysFrom, packProgress
} from "../fixtures";
import { sumBy, pill, L, G, badge, person, delta } from "./kit";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const addDays = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
const daysLeft = iso => Math.round((Date.parse(iso) - Date.UTC(2026, 9, 1)) / 864e5);
const expPill = iso => { const n = daysLeft(iso); return Object.assign(pill(n < 0 ? "expired" : n + " days", n < 0 ? "bad" : n <= 30 ? "warn" : ""), { v: n }); };
const TYPE_TONE = { recordable: "bad", "near miss": "warn", "first aid": "warn", "property damage": "", environmental: "" };
const INC_TYPES = ["near miss", "first aid", "recordable", "property damage", "environmental"];
const CHECK_ITEMS = ["Tyres and tracks", "Lights and beacons", "Hydraulics and hoses", "Brakes and steering", "Cab, mirrors and seat belt"];
const ACTIONS_BY_TYPE = {
  "near miss": ["Toolbox talk on the event", "Review exclusion zones and spotter use", "Update the task risk assessment"],
  "first aid": ["Complete the first aid record", "Review gloves and PPE for the task", "Toolbox talk on the task"],
  recordable: ["Notify the Health and Safety Authority if reportable", "Agree the return-to-work plan", "Revise the task assessment"],
  "property damage": ["Repair or replace the damaged item", "Review reversing plan and banksman use", "Brief the crew"],
  environmental: ["Restock the spill kit", "Review drip trays and bunding", "Brief the crew on spill response"]
};
const monthKey = iso => iso.slice(0, 7);
const monthLabel = key => MON[Number(key.slice(5, 7)) - 1] + " " + key.slice(2, 4);
const trState = t => { const n = daysLeft(t.expiry); return n < 0 ? "expired" : n <= 60 ? "expiring" : "valid"; };

export function buildSafety(k){
  const { fx, sec, tbl, out, sel, select, act, chips, detail, U, h } = k;
  const pp = packProgress(fx.pack), p = fx.pack, n9 = HIST.nearMiss.length - 1;
  const checks = fx.checks, byCk = s => checks.filter(c => c.status === s);
  const compliance = Math.round((byCk("reviewed").length + byCk("submitted").length) / checks.length * 100);
  const openInc = INCIDENTS.filter(i => i.state !== "closed");
  const lastRec = INCIDENTS.filter(i => i.type === "recordable").map(i => i.date).sort().pop();
  const sinceRec = lastRec ? Math.round((Date.UTC(2026, 9, 1) - Date.parse(lastRec)) / 864e5) : 0;
  const evSoon = fx.evidence.filter(e => e.expiry <= daysFrom(60));
  const evReview = fx.evidence.filter(e => e.status !== "reviewed");
  const trDue = TRAINING.filter(t => daysLeft(t.expiry) <= 30);
  const jobOf = id => fx.jobcards.find(j => j.id === id);
  const assetOf = id => fx.assets.find(a => a.id === id);
  const linkGroup = g => (g.indexOf("PRJ-") === 0 ? L(g, "Projects", "contracts", g) : L(g, "Plant & Hire", "assets", g));
  const evLabel = e => (e.status === "reviewed" ? "reviewed" : "awaiting review");
  const evPill = e => pill(evLabel(e), e.status === "reviewed" ? "ok" : "warn");
  const incLoc = i => (i.where.indexOf("PRJ-") === 0 ? L(i.where, "Projects", "contracts", i.where) : i.where);

  /* ───────── drawers ───────── */
  const checkDrawer = c => {
    const def = fx.defects.find(d => d.asset === c.asset), a = assetOf(c.asset);
    const res = s => (c.status === "failed" ? (s === 2 ? "fail" : "pass") : c.status === "reviewed" || c.status === "submitted" ? "pass" : "pending");
    const links = [{ label: "Asset " + c.asset, go: G("Plant & Hire", "assets", c.asset) }];
    if (c.status === "failed" && def) links.push({ label: "Defect " + def.id, go: G("Safety", "defects", def.id) });
    links.push({ label: "Checks with this status", go: G("Safety", "checks", null, { chkF: c.status }) });
    return detail(c.id + " on " + c.asset, [["Asset", c.asset + (a ? ", " + a.type : "")], ["Site", c.site.replace(" (demo location)", "")], ["Operator", c.operator], ["Timestamp", c.at], ["Status", c.status], ["Source", c.source],
      ["Result", c.status === "failed" ? "Hydraulics and hoses failed; asset must not run until released" : c.status === "missing" ? "No check submitted for today's shift" : c.status === "scheduled" ? "Scheduled, not yet due" : "All five items passed"]],
    [], { kicker: "Walk-around check", status: { t: c.status, tone: badge(c.status).pill }, links,
      blocks: [{ type: "list", title: "Check items", items: CHECK_ITEMS.map((t, s) => ({ title: t, sub: res(s) === "pending" ? "Not completed" : res(s) === "fail" ? "Leak found at hose connection" : "No defect found", pill: { t: res(s), tone: res(s) === "fail" ? "bad" : res(s) === "pass" ? "ok" : "warn" }, tone: res(s) === "fail" ? "bad" : res(s) === "pass" ? "info" : "warn" })) }] });
  };

  const defectDrawer = d => {
    const j = jobOf(d.job), a = assetOf(d.asset), day = d.reported.slice(0, 10);
    const ev = [{ title: "Defect reported", sub: d.owner + " owns the repair", right: fmtDate(day), tone: "bad" }];
    if (j){ ev.push({ title: "Workshop job " + j.id + " opened", sub: j.fault, right: fmtDate(j.opened), tone: "info", go: G("Garage", "jobs", j.id) }); ev.push({ title: "Job stage: " + j.status, sub: eur(j.partsCost) + " parts booked", right: "due " + fmtDate(j.due), tone: "warn", go: G("Garage", "jobs", j.id) }); }
    if (j && j.release) ev.push({ title: "Workshop release recorded", sub: "Seán Duffy", right: fmtDate("2026-10-01"), tone: "info" });
    if (j && j.check) ev.push({ title: "Required check recorded", sub: "Fiona McHale", right: fmtDate("2026-10-01"), tone: "info" });
    ev.push({ title: "Asset " + d.asset + " is " + (a ? a.status : "unknown"), sub: a && a.reason ? a.reason : "Back in service", right: d.restriction, tone: a && a.status === "unavailable" ? "bad" : "info" });
    const links = [{ label: "Asset " + d.asset, go: G("Plant & Hire", "assets", d.asset) }];
    if (j) links.push({ label: "Workshop job " + j.id, go: G("Garage", "jobs", j.id) });
    links.push({ label: "Fleet unavailable", go: G("Plant & Hire", "assets", null, { assetType: "all", assetStatus: "unavailable" }) });
    return detail(d.id + " on " + d.asset, [["Asset", d.asset + (a ? ", " + a.type : "")], ["Severity", d.severity], ["Owner", d.owner], ["Reported", d.reported], ["Restriction", d.restriction], ["Workshop job", d.job + (j ? ", " + j.status + ", " + j.downDays + " asset-days down" : "")],
      ["Release", "Requires a human workshop release and check on the job card. AI cannot mark an asset safe."]], [],
    { kicker: "Defect", status: { t: d.severity, tone: badge(d.severity).pill }, sub: d.restriction, links, blocks: [{ type: "list", title: "Timeline", items: ev }] });
  };

  const incDrawer = i => {
    const closed = i.state === "closed", tl = [{ title: "Incident reported", sub: i.what, right: fmtDate(i.date), tone: "info" }, { title: "Triage by " + i.owner, sub: "Severity set to " + i.sev, right: fmtDate(addDays(i.date, 1)), tone: "info" }];
    tl.push(closed ? { title: "Investigation complete", sub: "Findings shared with the crew", right: fmtDate(addDays(i.date, 7)), tone: "info" } : { title: "Investigation open", sub: "Statements and photos being collected", right: "in progress", tone: "warn" });
    if (closed) tl.push({ title: "Closed out", sub: "Actions verified", right: fmtDate(addDays(i.date, 14)), tone: "info" });
    const acts = ACTIONS_BY_TYPE[i.type].map((t, n) => ({ title: t, sub: n === 0 ? i.owner : "Site team", pill: { t: closed ? "done" : n === 0 ? "in progress" : "open", tone: closed ? "ok" : n === 0 ? "warn" : "" }, tone: closed ? "info" : "warn" }));
    const links = [{ label: "Incidents of this type", go: G("Safety", "incidents", null, { incF: i.type }) }];
    if (i.where.indexOf("PRJ-") === 0) links.unshift({ label: "Contract " + i.where, go: G("Projects", "contracts", i.where) });
    return detail(i.id + " " + cap(i.type), [["Date", fmtDate(i.date)], ["Type", i.type], ["Location", i.where], ["What happened", i.what], ["Severity", i.sev], ["Status", i.state], ["Owner", i.owner]], [],
      { kicker: "Incident", status: { t: i.state, tone: badge(i.state).pill }, sub: i.sev + " severity", links, blocks: [{ type: "list", title: "Timeline", items: tl }, { type: "list", title: "Corrective actions", items: acts }] });
  };

  const evDrawer = e => {
    const used = p.items.filter(x => x.ev === e.id), n = daysLeft(e.expiry), up = addDays(e.expiry, -365);
    const ev = [{ title: "Document uploaded", sub: e.source, right: fmtDate(up), tone: "info" }];
    if (e.status === "reviewed") ev.push({ title: "Reviewed", sub: "Fiona McHale", right: fmtDate(addDays(up, 3)), tone: "info" }); else ev.push({ title: "Awaiting review", sub: "Assigned to Fiona McHale", right: "open", tone: "warn" });
    ev.push({ title: n < 0 ? "Expired" : "Expires", sub: n < 0 ? -n + " days ago" : "in " + n + " days", right: fmtDate(e.expiry), tone: n < 0 ? "bad" : n <= 30 ? "warn" : "muted" });
    const links = [{ label: e.group.indexOf("PRJ-") === 0 ? "Contract " + e.group : "Asset " + e.group, go: e.group.indexOf("PRJ-") === 0 ? G("Projects", "contracts", e.group) : G("Plant & Hire", "assets", e.group) }];
    if (used.length) links.push({ label: "Used in " + p.id, go: G("Safety", "packs") });
    return detail(e.id + " " + e.title, [["Contract or asset", e.group], ["Review status", evLabel(e)], ["Expiry", fmtDate(e.expiry) + (n < 0 ? " (expired)" : " (in " + n + " days)")], ["Source", e.source], ["Used in packs", used.length ? p.id + ": " + used.map(x => x.t).join(", ") : "Not in a pack"]], [],
      { kicker: "Evidence", status: { t: evLabel(e), tone: e.status === "reviewed" ? "ok" : "warn" }, sub: "Sample document, mock preview only", links, blocks: [{ type: "list", title: "Review trail", items: ev }] });
  };

  const trDrawer = t => {
    const n = daysLeft(t.expiry), st = trState(t);
    return detail(t.id + " " + t.cert, [["Person", t.person], ["Certificate", t.cert], ["Expiry", fmtDate(t.expiry)], ["Days left", n < 0 ? "Expired " + -n + " days ago" : String(n)], ["Status", st]], [],
      { kicker: "Competency and training", status: { t: st, tone: st === "expired" ? "bad" : st === "expiring" ? "warn" : "ok" }, sub: t.person,
        links: [{ label: "Competency register", go: G("Safety", "evidence", null, { evF: "expiring" }) }, { label: "Evidence library", go: G("Safety", "evidence", null, { evF: "all" }) }],
        blocks: [{ type: "progress", title: "Time to renew", items: [{ label: t.cert, value: Math.max(0, Math.min(100, n / 365 * 100)), text: n < 0 ? "expired" : n + " days", tone: n < 0 ? "bad" : n <= 30 ? "warn" : undefined }] }],
        note: "Book a renewal course before the expiry date. A lapsed ticket stops the person operating the related plant." });
  };

  /* ───────── overview ───────── */
  if (sec === "overview"){
    const sev = s => fx.defects.filter(d => d.severity === s).length;
    const where = {}; INCIDENTS.forEach(i => { where[i.where] = (where[i.where] || 0) + 1; });
    const trList = TRAINING.filter(t => trState(t) !== "valid").sort((a, b) => (trState(a) === "expired" ? 0 : 1) - (trState(b) === "expired" ? 0 : 1) || a.expiry.localeCompare(b.expiry));
    const attention = checks.filter(c => c.status === "missing" || c.status === "failed");
    return out("Safety overview", [
      { type: "kpis", items: [
        { label: "Missing checks", value: String(byCk("missing").length), hint: byCk("failed").length + " failed, " + checks.length + " logged today", tone: "bad", go: G("Safety", "checks", null, { chkF: "missing" }) },
        { label: "Open defects", value: String(fx.defects.length), hint: "DEF-028 restricts EX-014", tone: "bad", go: G("Safety", "defects") },
        { label: "Open incidents", value: String(openInc.length), hint: openInc.length ? openInc[0].id + " " + openInc[0].state : "all closed", tone: openInc.length ? "warn" : undefined, go: G("Safety", "incidents", null, { incF: "open" }) },
        { label: "Near misses, September", value: String(HIST.nearMiss[n9]), delta: delta(HIST.nearMiss[n9], HIST.nearMiss[n9 - 1], { good: "down", abs: true, fmt: v => String(v), label: "vs Aug" }), hint: "monthly safety summary", spark: HIST.nearMiss, go: G("Safety", "incidents", null, { incF: "near miss" }) },
        { label: "Evidence expiring in 60 days", value: String(evSoon.length), hint: "documents", tone: "warn", go: G("Safety", "evidence", null, { evF: "expiring" }) },
        { label: "Pack readiness", value: pp.done + " / " + pp.total, hint: "SAFE-031 for PRJ-027", tone: p.state === "approved" ? undefined : "warn", go: G("Safety", "packs") },
        { label: "Training expiring or expired", value: String(trDue.length), hint: TRAINING.filter(t => trState(t) === "expired").length + " expired, others due within 30 days", tone: "warn", go: G("Safety", "evidence", "TR-305") },
        { label: "Days since recordable", value: String(sinceRec), hint: lastRec ? "last on " + fmtDate(lastRec) : "none on record", go: G("Safety", "incidents", null, { incF: "recordable" }) }] },
      { type: "grid", cols: "2fr 1fr", items: [
        { type: "chart", kind: "column", title: "Near misses against recordables", sub: "Monthly count, 2026. Click a month for the incident register.", labels: MONTH_LABELS, h: 250, fmt: v => String(Math.round(v)),
          series: [{ name: "Near misses", data: HIST.nearMiss }, { name: "Recordable", data: HIST.recordable, color: "var(--bad)" }], go: MONTH_LABELS.map(() => G("Safety", "incidents", null, { incF: "all" })) },
        { type: "chart", kind: "rings", title: "Compliance", sub: "Share of required items complete", size: 92,
          items: [{ label: "Checks in", value: compliance, sub: "pre-start", go: G("Safety", "checks") }, { label: "Evidence", value: Math.round((fx.evidence.length - evReview.length) / fx.evidence.length * 100), sub: "reviewed", go: G("Safety", "evidence", null, { evF: "review" }) },
            { label: p.id, value: Math.round(pp.done / pp.total * 100), sub: "pack", tone: p.state === "approved" ? undefined : "warn", go: G("Safety", "packs") }] }] },
      { type: "grid", cols: "1fr 1fr 1fr", items: [
        { type: "chart", kind: "donut", title: "Defects by severity", sub: "Open defects. Click to open the list.", size: 140, fmt: v => String(v), center: { value: String(fx.defects.length), label: "Defects" },
          items: [{ label: "High", value: sev("high"), tone: "bad" }, { label: "Medium", value: sev("medium"), tone: "warn" }, { label: "Low", value: sev("low") }].filter(x => x.value > 0).map(x => Object.assign(x, { text: String(x.value), go: G("Safety", "defects", fx.defects.find(d => d.severity === x.label.toLowerCase()).id) })) },
        { type: "chart", kind: "column", title: "Inductions by month", sub: "People inducted on site, 2026", labels: MONTH_LABELS, h: 190, fmt: v => String(Math.round(v)), series: [{ name: "Inductions", data: HIST.inductions }], go: MONTH_LABELS.map(() => G("Safety", "evidence")) },
        { type: "chart", kind: "hbar", title: "Incidents by location", sub: "Register, Aug and Sep 2026", fmt: v => String(v),
          items: Object.keys(where).sort((a, b) => where[b] - where[a]).slice(0, 6).map(w => ({ label: w, value: where[w], text: String(where[w]), go: w.indexOf("PRJ-") === 0 ? G("Projects", "contracts", w) : G("Safety", "incidents", INCIDENTS.find(i => i.where === w).id) })) }] },
      { type: "grid", cols: "1fr 1fr 1fr", items: [
        { type: "list", title: "Training and competency", sub: "Expired first, then by expiry date", items: trList.map(t => ({ title: t.cert, sub: t.person + ", " + fmtDate(t.expiry), pill: { t: trState(t), tone: trState(t) === "expired" ? "bad" : "warn" }, tone: trState(t) === "expired" ? "bad" : "warn", go: G("Safety", "evidence", t.id) })), action: { label: "All training", go: G("Safety", "evidence") } },
        { type: "list", title: "Recent incidents", sub: "Latest from the register", items: INCIDENTS.slice(0, 5).map(i => ({ title: i.id + " " + cap(i.type), sub: i.what, right: fmtDate(i.date).slice(0, 6), pill: { t: i.state, tone: i.state === "closed" ? "ok" : "warn" }, tone: i.state === "closed" ? undefined : "warn", go: G("Safety", "incidents", i.id) })), action: { label: "Register", go: G("Safety", "incidents") } },
        { type: "list", title: "Checks needing attention", sub: attention.length + " missing or failed", items: attention.map(c => ({ title: c.id + " " + c.asset, sub: c.operator + ", " + c.site.replace(" (demo location)", ""), pill: { t: c.status, tone: c.status === "failed" ? "bad" : "bad" }, tone: "bad", go: G("Safety", "checks", c.id) })), action: { label: "All checks", go: G("Safety", "checks") } }] }
    ]);
  }

  /* ───────── checks ───────── */
  if (sec === "checks"){
    const f = U("chkF", "all"), list = checks.filter(c => f === "all" || c.status === f);
    const ops = {}; checks.forEach(c => { ops[c.operator] = ops[c.operator] || { n: 0, bad: 0 }; ops[c.operator].n++; if (c.status === "failed" || c.status === "missing") ops[c.operator].bad++; });
    const blocks = [
      chips("Status", "chkF", [["all", "All"], ["scheduled", "Scheduled"], ["submitted", "Submitted"], ["reviewed", "Reviewed"], ["failed", "Failed"], ["missing", "Missing"]], "all"),
      { type: "kpis", items: [
        { label: "Checks logged today", value: String(checks.length), hint: "walk-around checks, 1 Oct", go: G("Safety", "checks", null, { chkF: "all" }) },
        { label: "Compliance", value: compliance + "%", hint: "reviewed or submitted", tone: compliance < 70 ? "warn" : undefined, go: G("Safety", "checks", null, { chkF: "reviewed" }) },
        { label: "Missing", value: String(byCk("missing").length), hint: "no check submitted", tone: "bad", go: G("Safety", "checks", null, { chkF: "missing" }) },
        { label: "Failed", value: String(byCk("failed").length), hint: byCk("failed").map(c => c.asset).join(", ") || "none", tone: byCk("failed").length ? "bad" : undefined, go: G("Safety", "checks", null, { chkF: "failed" }) },
        { label: "Awaiting review", value: String(byCk("submitted").length), hint: "submitted, not yet reviewed", tone: "warn", go: G("Safety", "checks", null, { chkF: "submitted" }) },
        { label: "Scheduled", value: String(byCk("scheduled").length), hint: "later in the shift", go: G("Safety", "checks", null, { chkF: "scheduled" }) }] },
      { type: "grid", cols: "1fr 1fr", items: [
        { type: "chart", kind: "donut", title: "Checks by status", sub: "Click a slice to filter.", size: 150, fmt: v => String(v), center: { value: compliance + "%", label: "In" },
          items: ["reviewed", "submitted", "scheduled", "failed", "missing"].filter(s => byCk(s).length).map(s => ({ label: cap(s), value: byCk(s).length, text: String(byCk(s).length), tone: s === "failed" || s === "missing" ? "bad" : s === "submitted" ? "warn" : undefined, go: G("Safety", "checks", null, { chkF: s }) })) },
        { type: "chart", kind: "hbar", title: "Checks by operator", sub: "Missing or failed shown in the label.", fmt: v => String(v),
          items: Object.keys(ops).sort((a, b) => ops[b].n - ops[a].n).map(o => ({ label: o, sub: ops[o].bad ? ops[o].bad + " missing or failed" : "all in", value: ops[o].n, text: String(ops[o].n), tone: ops[o].bad ? "warn" : undefined, go: G("Safety", "checks", list.find(c => c.operator === o) ? list.find(c => c.operator === o).id : checks.find(c => c.operator === o).id) })) }] },
      tbl("chk", "Walk-around checks", ["Check", "Asset", "Site", "Operator", "Timestamp", "Status", "Source"],
        list.map(c => ({ id: c.id, onClick: select(c.id), cells: [L(c.id, "Safety", "checks", c.id), L(c.asset, "Plant & Hire", "assets", c.asset), c.site.replace(" (demo location)", ""), person(c.operator), c.at, badge(c.status), c.source] })), { note: "Failed checks open a defect and a workshop job." }),
      { type: "form", title: "Simple mobile pre-start form (demo)", fields: [["Asset", "EX-022"], ["Operator", "Declan Moran"], ["Tyres, lights, hydraulics checked", "Yes"], ["Notes (optional)", ""]], submit: { label: "Submit check (local demo)", run: act("addTask", { title: "Pre-start check submitted for EX-022 (demo)", related: "EX-022" }) } }];
    const c = sel ? checks.find(x => x.id === sel) : null;
    if (c) blocks.push(checkDrawer(c));
    return out("Checks", blocks);
  }

  /* ───────── defects ───────── */
  if (sec === "defects"){
    const hrs = d => Math.max(0, (Date.UTC(2026, 9, 1, 9) - Date.parse(d.reported.replace(" ", "T") + ":00Z")) / 36e5);
    const oldest = fx.defects.slice().sort((a, b) => hrs(b) - hrs(a))[0];
    const noOp = fx.defects.filter(d => d.restriction === "Do not operate");
    const sev = s => fx.defects.filter(d => d.severity === s);
    const blocks = [
      { type: "kpis", items: [
        { label: "Open defects", value: String(fx.defects.length), hint: sev("high").length + " high, " + sev("medium").length + " medium, " + sev("low").length + " low", tone: "bad", go: G("Safety", "defects") },
        { label: "Assets do not operate", value: String(noOp.length), hint: noOp.map(d => d.asset).join(", ") || "none", tone: noOp.length ? "bad" : undefined, go: G("Plant & Hire", "assets", null, { assetType: "all", assetStatus: "unavailable" }) },
        { label: "Workshop jobs linked", value: String(fx.defects.filter(d => jobOf(d.job)).length), hint: fx.defects.map(d => d.job).join(", "), go: G("Garage", "jobs") },
        { label: "Downtime on linked jobs", value: sumBy(fx.defects, d => (jobOf(d.job) || { downDays: 0 }).downDays) + " asset-days", hint: "from open job cards", go: G("Garage", "overview") },
        { label: "Oldest open defect", value: Math.round(hrs(oldest)) + " h", hint: oldest.id + " on " + oldest.asset, go: G("Safety", "defects", oldest.id) }] },
      { type: "grid", cols: "1fr 1fr", items: [
        { type: "chart", kind: "donut", title: "Defects by severity", sub: "Click a slice to open the first defect of that severity.", size: 150, fmt: v => String(v), center: { value: String(fx.defects.length), label: "Defects" },
          items: ["high", "medium", "low"].filter(s => sev(s).length).map(s => ({ label: cap(s), value: sev(s).length, text: String(sev(s).length), tone: s === "high" ? "bad" : s === "medium" ? "warn" : undefined, go: G("Safety", "defects", sev(s)[0].id) })) },
        { type: "chart", kind: "hbar", title: "Downtime by defect", sub: "Asset-days on the linked workshop job. Click to open.", fmt: v => String(v),
          items: fx.defects.map(d => ({ label: d.id + " " + d.asset, sub: (jobOf(d.job) || { status: "no job" }).status, value: (jobOf(d.job) || { downDays: 0 }).downDays, text: (jobOf(d.job) || { downDays: 0 }).downDays + " days", tone: d.severity === "high" ? "bad" : d.severity === "medium" ? "warn" : undefined, go: G("Safety", "defects", d.id) })) }] },
      tbl("def", "Defects", ["Defect", "Asset", "Severity", "Owner", "Reported", "Restriction", "Workshop link", "Job stage"],
        fx.defects.map(d => ({ id: d.id, onClick: select(d.id), cells: [L(d.id, "Safety", "defects", d.id), L(d.asset, "Plant & Hire", "assets", d.asset), badge(d.severity), person(d.owner), d.reported, pill(d.restriction, d.restriction === "Do not operate" ? "bad" : "warn"), L(d.job, "Garage", "jobs", d.job), jobOf(d.job) ? badge(jobOf(d.job).status) : "-"] })), { sort: false }),
      { type: "note", text: "Release requires a human workshop release and check on the job card. AI cannot mark an asset safe." }];
    const d = sel ? fx.defects.find(x => x.id === sel) : null;
    if (d) blocks.push(defectDrawer(d));
    return out("Defects", blocks);
  }

  /* ───────── incidents ───────── */
  if (sec === "incidents"){
    const f = U("incF", "all");
    const list = INCIDENTS.filter(i => f === "all" || (f === "open" ? i.state !== "closed" : i.type === f));
    const byType = t => INCIDENTS.filter(i => i.type === t).length;
    const where = {}; INCIDENTS.forEach(i => { where[i.where] = (where[i.where] || 0) + 1; });
    const blocks = [
      chips("Type", "incF", [["all", "All"], ["open", "Open"]].concat(INC_TYPES.map(t => [t, cap(t)])), "all"),
      { type: "kpis", items: [
        { label: "Logged in register", value: String(INCIDENTS.length), hint: "Aug and Sep 2026", go: G("Safety", "incidents", null, { incF: "all" }) },
        { label: "Open", value: String(openInc.length), hint: openInc.length ? openInc[0].id + " " + openInc[0].state : "all closed", tone: openInc.length ? "warn" : undefined, go: G("Safety", "incidents", null, { incF: "open" }) },
        { label: "Near misses", value: String(byType("near miss")), hint: "reported before anyone was hurt", go: G("Safety", "incidents", null, { incF: "near miss" }) },
        { label: "Recordable", value: String(byType("recordable")), hint: lastRec ? "last on " + fmtDate(lastRec) : "none", tone: byType("recordable") ? "bad" : undefined, go: G("Safety", "incidents", null, { incF: "recordable" }) },
        { label: "High severity", value: String(INCIDENTS.filter(i => i.sev === "high").length), hint: INCIDENTS.filter(i => i.sev === "high").map(i => i.id).join(", ") || "none", tone: "warn", go: G("Safety", "incidents", INCIDENTS.find(i => i.sev === "high").id) },
        { label: "Days since recordable", value: String(sinceRec), hint: "as at " + CLOCK.label, go: G("Safety", "incidents", null, { incF: "recordable" }) }] },
      { type: "grid", cols: "1fr 1fr", items: [
        { type: "chart", kind: "donut", title: "Incidents by type", sub: "Click a type to filter the register.", size: 150, fmt: v => String(v), center: { value: String(INCIDENTS.length), label: "Logged" },
          items: INC_TYPES.filter(t => byType(t)).map(t => ({ label: cap(t), value: byType(t), text: String(byType(t)), tone: t === "recordable" ? "bad" : undefined, go: G("Safety", "incidents", null, { incF: t }) })) },
        { type: "chart", kind: "column", title: "Monthly trend", sub: "Near misses and recordables from the monthly safety summary, 2026", labels: MONTH_LABELS, h: 230, fmt: v => String(Math.round(v)),
          series: [{ name: "Near misses", data: HIST.nearMiss }, { name: "Recordable", data: HIST.recordable, color: "var(--bad)" }], go: MONTH_LABELS.map(() => G("Safety", "incidents", null, { incF: "all" })),
          note: "The register below lists incidents logged individually; the monthly summary also counts minor reports." }] },
      { type: "chart", kind: "hbar", title: "Incidents by location", sub: "Click a contract to open it.", fmt: v => String(v),
        items: Object.keys(where).sort((a, b) => where[b] - where[a]).map(w => ({ label: w, value: where[w], text: String(where[w]), go: w.indexOf("PRJ-") === 0 ? G("Projects", "contracts", w) : G("Safety", "incidents", INCIDENTS.find(i => i.where === w).id) })) },
      tbl("inc", "Incident register", ["Incident", "Date", "Type", "Where", "What happened", "Severity", "Status", "Owner"],
        list.map(i => ({ id: i.id, onClick: select(i.id), cells: [L(i.id, "Safety", "incidents", i.id), fmtDate(i.date), pill(i.type, TYPE_TONE[i.type] || ""), incLoc(i), i.what, badge(i.sev), badge(i.state), person(i.owner)] })), { search: true, note: list.length + " of " + INCIDENTS.length + " incidents." })];
    const i = sel ? INCIDENTS.find(x => x.id === sel) : null;
    if (i) blocks.push(incDrawer(i));
    return out("Incidents", blocks);
  }

  /* ───────── evidence ───────── */
  if (sec === "evidence"){
    const f = U("evF", "all");
    const list = fx.evidence.filter(e => f === "all" || (f === "expiring" ? e.expiry <= daysFrom(60) : e.status !== "reviewed"));
    const trList = TRAINING.filter(t => f === "all" || (f === "expiring" && trState(t) !== "valid"));
    const all = fx.evidence.map(e => e.expiry).concat(TRAINING.map(t => t.expiry)).sort();
    const months = []; let m = "2026-09"; while (m <= monthKey(all[all.length - 1])){ months.push(m); const y = Number(m.slice(0, 4)), mo = Number(m.slice(5, 7)); m = mo === 12 ? (y + 1) + "-01" : y + "-" + String(mo + 1).padStart(2, "0"); }
    const byGroup = {}; fx.evidence.forEach(e => { byGroup[e.group] = (byGroup[e.group] || 0) + 1; });
    const blocks = [
      chips("Show", "evF", [["all", "All"], ["expiring", "Expiring in 60 days"], ["review", "Awaiting review"]], "all"),
      { type: "kpis", items: [
        { label: "Documents", value: String(fx.evidence.length), hint: "contracts and assets", go: G("Safety", "evidence", null, { evF: "all" }) },
        { label: "Expiring in 60 days", value: String(evSoon.length), hint: evSoon.length ? "next " + fmtDate(evSoon.map(e => e.expiry).sort()[0]) : "none", tone: "warn", go: G("Safety", "evidence", null, { evF: "expiring" }) },
        { label: "Awaiting review", value: String(evReview.length), hint: "uploaded, not yet signed off", tone: "warn", go: G("Safety", "evidence", null, { evF: "review" }) },
        { label: "Reviewed", value: Math.round((fx.evidence.length - evReview.length) / fx.evidence.length * 100) + "%", hint: fx.evidence.length - evReview.length + " of " + fx.evidence.length + " documents", go: G("Safety", "packs") },
        { label: "Training expired", value: String(TRAINING.filter(t => trState(t) === "expired").length), hint: TRAINING.filter(t => trState(t) === "expired").map(t => t.person).join(", ") || "none", tone: "bad", go: G("Safety", "evidence", "TR-305") },
        { label: "Training due in 60 days", value: String(TRAINING.filter(t => trState(t) === "expiring").length), hint: "tickets to renew", tone: "warn", go: G("Safety", "evidence", null, { evF: "expiring" }) }] },
      { type: "grid", cols: "2fr 1fr", items: [
        { type: "chart", kind: "stacked", title: "Expiry by month", sub: "Evidence documents and training tickets reaching expiry. Click a month.", labels: months.map(monthLabel), h: 240, fmt: v => String(Math.round(v)),
          series: [{ name: "Evidence", data: months.map(x => fx.evidence.filter(e => monthKey(e.expiry) === x).length) }, { name: "Training", data: months.map(x => TRAINING.filter(t => monthKey(t.expiry) === x).length), color: "var(--ch3)" }],
          go: months.map(x => G("Safety", "evidence", null, { evF: x <= "2026-11" ? "expiring" : "all" })) },
        { type: "chart", kind: "donut", title: "Review status", sub: "Click a slice to filter.", size: 140, fmt: v => String(v), center: { value: String(fx.evidence.length), label: "Documents" },
          items: [{ label: "Reviewed", value: fx.evidence.length - evReview.length, go: G("Safety", "evidence", null, { evF: "all" }) }, { label: "Awaiting review", value: evReview.length, tone: "warn", go: G("Safety", "evidence", null, { evF: "review" }) }].map(x => Object.assign(x, { text: String(x.value) })) }] },
      tbl("ev", "Evidence by contract or asset", ["Ref", "Title", "Contract / asset", "Review status", "Expiry", "Days left", "Source"],
        list.map(e => ({ id: e.id, onClick: select(e.id), cells: [L(e.id, "Safety", "evidence", e.id), e.title, linkGroup(e.group), evPill(e), fmtDate(e.expiry), expPill(e.expiry), e.source] })),
        { size: 10, search: true, note: "Sample documents are mock previews. No file links. Amber within 30 days, red once expired." }),
      tbl("tr", "Competency and training", ["Ref", "Person", "Certificate", "Expiry", "Days left", "Status"],
        trList.map(t => ({ id: t.id, onClick: select(t.id), cells: [L(t.id, "Safety", "evidence", t.id), person(t.person), t.cert, fmtDate(t.expiry), expPill(t.expiry), pill(trState(t), trState(t) === "expired" ? "bad" : trState(t) === "expiring" ? "warn" : "ok")] })), { empty: "No training tickets match." })];
    const e = sel ? fx.evidence.find(x => x.id === sel) : null, t = sel ? TRAINING.find(x => x.id === sel) : null;
    if (e) blocks.push(evDrawer(e)); else if (t) blocks.push(trDrawer(t));
    return out("Evidence", blocks);
  }

  /* ───────── packs ───────── */
  const stN = s => p.items.filter(i => i.state === s).length;
  const stateLabel = p.state === "incomplete" ? "Incomplete" : p.state === "ready" ? "Ready for approval" : "Approved";
  return out("Packs", [
    { type: "kpis", items: [
      { label: p.id + " for " + p.contract, value: pp.done + " of " + pp.total, hint: "required items reviewed", tone: p.state === "approved" ? undefined : "warn", go: G("Projects", "contracts", p.contract) },
      { label: "State", value: stateLabel, hint: "no compliance badge from a partial checklist", tone: p.state === "approved" ? undefined : "warn", go: G("Work", "approvals") },
      { label: "Attached, awaiting review", value: String(stN("attached")), hint: "mark reviewed to count", tone: stN("attached") ? "warn" : undefined, go: G("Safety", "packs") },
      { label: "Missing evidence", value: String(stN("missing")), hint: p.items.filter(i => i.state === "missing").map(i => i.t).slice(0, 2).join("; ") || "nothing missing", tone: stN("missing") ? "bad" : undefined, go: G("Safety", "evidence", null, { evF: "all" }) },
      { label: "Library reviewed", value: Math.round((fx.evidence.length - evReview.length) / fx.evidence.length * 100) + "%", hint: evReview.length + " documents awaiting review", go: G("Safety", "evidence", null, { evF: "review" }) }] },
    { type: "grid", cols: "1fr 2fr", items: [
      { type: "chart", kind: "rings", title: "Pack progress", sub: "Share of the checklist complete", size: 100,
        items: [{ label: "Reviewed", value: Math.round(pp.done / pp.total * 100), sub: "items", tone: p.state === "approved" ? undefined : "warn" }, { label: "With evidence", value: Math.round((p.items.length - stN("missing")) / p.items.length * 100), sub: "attached" }] },
      { type: "progress", title: "Checklist by item", sub: "Reviewed, attached and missing items",
        items: p.items.map((it, n) => ({ label: it.t, value: it.state === "reviewed" ? 100 : it.state === "attached" ? 60 : 4, text: it.state, tone: it.state === "reviewed" ? undefined : it.state === "attached" ? "warn" : "bad" })) }] },
    tbl("pack", "Required checklist", ["#", "Item", "State", "Evidence", "Action"],
      p.items.map((it, n) => ({ cells: [String(n + 1), it.t, badge(it.state), it.ev ? (fx.evidence.some(e => e.id === it.ev) ? L(it.ev, "Safety", "evidence", it.ev) : it.ev) : "-",
        it.state === "missing" ? { t: "Attach sample evidence", run: act("attachEvidence", { i: n }), button: true } : it.state === "attached" ? { t: "Mark reviewed", run: act("reviewEvidence", { i: n }), button: true } : "-"] })), { sort: false }),
    { type: "actions", items: [{ label: "Approve pack (authorised human)", run: act("approvePack"), disabled: p.state !== "ready", primary: true },
      { label: "Export manifest (.json)", run: () => h.download("SAFE-031-manifest.json", JSON.stringify({ pack: p.id, contract: p.contract, state: p.state, snapshot: CLOCK.label, progress: pp.done + "/" + pp.total, items: p.items.map(i => ({ item: i.t, state: i.state, evidence: i.ev || null })), note: "Demo sample manifest" }, null, 2), "application/json") }] }]);
}
