/* Garage: overview, job cards, parts and purchasing. Repair cost is an internal cost centre, never revenue.
   Every chart element, KPI and list row opens the records behind it. */
import {
  WORKSHOP_RATE, HIST, MONTH_LABELS, SUPPLIERS, eur, fmtDate, daysFrom, jobCost, partAvail, partsHealth, shortName
} from "../fixtures";
import { sumBy, tone, pill, L, G, bar, badge, person, eurC, delta } from "./kit";

const TODAY = "2026-10-01";
const STAGES = ["waiting assessment", "awaiting parts", "in progress", "ready for review"];
const OPEN_PO = ["draft", "approved", "ordered", "part received"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const addDays = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
const minDate = (a, b) => (a < b ? a : b);
const dueTone = d => (d < TODAY ? "bad" : d <= daysFrom(2) ? "warn" : "");
const monthKey = iso => iso.slice(0, 7);
const monthLabel = key => MON[Number(key.slice(5, 7)) - 1] + " " + key.slice(2, 4);
const labour = j => j.hours * WORKSHOP_RATE;

export function buildGarage(k){
  const { fx, sec, tbl, out, sel, select, act, chips, detail, U, h } = k;
  const jobs = fx.jobcards, ph = partsHealth(fx), n9 = HIST.workshopCost.length - 1;
  const jobsTotal = sumBy(jobs, jobCost);
  const assetType = id => { const a = fx.assets.find(x => x.id === id); return a ? a.type : ""; };
  const lowParts = fx.parts.filter(p => partAvail(p) < p.min).sort((a, b) => (partAvail(a) - a.min) - (partAvail(b) - b.min));
  const repGo = G("Finance", "reports", null, { repId: "workshop" });

  /* purchase orders: the live draft flow (fx.pos) plus the history */
  const poList = fx.pos.map(p => { const part = fx.parts.find(x => x.sku === p.sku); return { id: p.id, supplier: shortName(p.supplier), what: p.qty + " x " + p.sku + (part ? ", " + part.desc : ""), contract: "", value: p.qty * p.unit, date: "2026-10-01", state: p.state, live: p }; })
    .concat(fx.poHistory.slice().reverse().map(p => ({ id: p.id, supplier: p.supplier, what: p.what, contract: p.contract, value: p.value, date: p.date, state: p.state, live: null })));

  /* ───────── drawers ───────── */
  const jobDrawer = j => {
    const si = STAGES.indexOf(j.status), is84 = j.id === "WO-0184", def = fx.defects.find(d => d.job === j.id);
    const ev = [{ title: "Job card opened", sub: "Fault reported: " + j.fault, right: fmtDate(j.opened), tone: "info" }];
    if (si >= 1) ev.push({ title: "Assessed by " + j.mech, sub: "Parts requested from stores", right: fmtDate(minDate(addDays(j.opened, 1), TODAY)), tone: "info" });
    if (si >= 2) ev.push({ title: "Work started", sub: "Parts issued, " + j.hours + " h booked so far", right: fmtDate(minDate(addDays(j.opened, 2), TODAY)), tone: "info" });
    if (si >= 3) ev.push({ title: "Work complete", sub: "Waiting for review and release", right: fmtDate(minDate(addDays(j.opened, 3), TODAY)), tone: "info" });
    if (is84 && j.release) ev.push({ title: "Workshop release recorded", sub: "Seán Duffy", right: fmtDate(TODAY), tone: "info" });
    if (is84 && j.check) ev.push({ title: "Required check recorded", sub: "Fiona McHale", right: fmtDate(TODAY), tone: "info" });
    ev.push({ title: "Due", sub: j.due < TODAY ? "Past due" : "Target completion", right: fmtDate(j.due), tone: dueTone(j.due) || "muted" });
    const sameAsset = jobs.filter(x => x.asset === j.asset && x.id !== j.id);
    const links = [{ label: "Asset " + j.asset, go: G("Plant & Hire", "assets", j.asset) }];
    if (def) links.push({ label: "Defect " + def.id, go: G("Safety", "defects", def.id) });
    if (is84) links.push({ label: "Part HF-220", go: G("Garage", "parts", "HF-220") });
    sameAsset.forEach(x => links.push({ label: "Also on asset: " + x.id, go: G("Garage", "jobs", x.id) }));
    links.push({ label: "Workshop cost report", go: repGo });
    return detail(j.id + " on " + j.asset, [
      ["Reported fault", j.fault], ["Mechanic", j.mech], ["Asset", j.asset + ", " + assetType(j.asset)], ["Opened", fmtDate(j.opened)], ["Due", fmtDate(j.due)], ["Downtime", j.downDays + " asset-days"],
      ["Parts used", eur(j.partsCost) + (is84 ? " (HF-220 and seals)" : "")], ["Labour", j.hours + " h x " + eur(WORKSHOP_RATE) + " = " + eur(labour(j))],
      ["Total internal cost", eur(jobCost(j)) + " (internal maintenance; no external invoice, no garage revenue)"],
      ["Linked defect", def ? def.id : "-"], ["Workshop release", is84 ? (j.release ? "Recorded by Seán Duffy" : "Not recorded") : "-"], ["Required check", is84 ? (j.check ? "Recorded by Fiona McHale" : "Not recorded") : "-"]],
    is84 ? [{ label: "Record workshop release (human)", run: act("releaseJob"), disabled: j.release, primary: true }, { label: "Record required check (human)", run: act("recordCheck"), disabled: j.check }, { label: "Open defect DEF-028", run: () => h.nav("Safety", "defects", "DEF-028") }] : [],
    { kicker: "Job card", status: { t: j.status, tone: badge(j.status).pill }, sub: j.urgent ? "Urgent" : undefined, links,
      blocks: [
        { type: "chart", kind: "donut", title: "Internal cost split", sub: eur(jobCost(j)) + " in total", size: 130, fmt: eur, center: { value: eurC(jobCost(j)), label: "Cost" },
          items: [{ label: "Parts", value: j.partsCost, text: eur(j.partsCost) }, { label: "Labour", value: labour(j), text: eur(labour(j)), color: "var(--ch3)" }] },
        { type: "list", title: "Timeline", items: ev }] });
  };

  const partDrawer = p => {
    const av = partAvail(p), mv = fx.movements.filter(m => m.sku === p.sku);
    const rows = mv.length ? mv : [{ when: "2026-09-30", sku: p.sku, kind: "count", qty: p.onHand, ref: "Cycle count" }];
    const refCell = r => fx.jobcards.some(j => j.id === r) ? L(r, "Garage", "jobs", r) : poList.some(x => x.id === r) ? L(r, "Garage", "purchasing", r) : r;
    const po = fx.pos.find(x => x.sku === p.sku);
    const jobsUsing = p.sku === "HF-220" ? jobs.filter(j => j.id === "WO-0184") : [];
    const links = [{ label: "Supplier " + shortName(p.supplier), go: G("Records", "suppliers", shortName(p.supplier)) }];
    if (po) links.push({ label: "Purchase order " + po.id, go: G("Garage", "purchasing", po.id) });
    jobsUsing.forEach(j => links.push({ label: "Used on " + j.id, go: G("Garage", "jobs", j.id) }));
    links.push({ label: "Low stock list", go: G("Garage", "parts", null, { partLow: "low" }) });
    return detail(p.sku + " " + p.desc, [["Physical stock", p.onHand], ["Reserved", p.reserved], ["Available", av], ["Minimum", p.min], ["Bin", p.bin], ["Unit cost", eur(p.cost)], ["Stock value", eur(p.onHand * p.cost)], ["Supplier", p.supplier],
      ["Suggested order", av < p.min ? Math.max(p.min * 2 - av, 1) + " units to reach twice the minimum" : "None needed"]],
    p.sku === "HF-220" ? [{ label: "Prepare purchase order (10 units)", run: act("draftPO"), disabled: fx.pos.length > 0, primary: true }] : [],
    { kicker: "Stock item", status: av <= 0 ? { t: "out of stock", tone: "bad" } : av < p.min ? { t: "below minimum", tone: "warn" } : { t: "healthy", tone: "ok" }, links,
      blocks: [
        { type: "progress", title: "Available against minimum", items: [{ label: "Available", value: Math.min(100, av / Math.max(1, p.min) * 100), text: av + " of " + p.min, tone: av <= 0 ? "bad" : av < p.min ? "warn" : undefined }] },
        tbl("moves", "Stock movements", ["Date", "Type", "Qty", "Reference"], rows.map(m => ({ cells: [fmtDate(m.when), m.kind, String(m.qty), refCell(m.ref)] })), { num: [2], sort: false })] });
  };

  const poDrawer = p => {
    const pay = fx.payables.filter(x => x.po === p.id), si = ["draft", "approved", "ordered", "received"].indexOf(p.state === "part received" ? "ordered" : p.state);
    const ev = [{ title: "Order raised", sub: "Seán Duffy", right: fmtDate(p.date), tone: "info" }];
    if (si >= 1) ev.push({ title: "Approved", sub: "Ronan Conneely", right: fmtDate(minDate(addDays(p.date, 1), TODAY)), tone: "info" });
    if (si >= 2) ev.push({ title: "Sent to supplier", sub: p.supplier, right: fmtDate(minDate(addDays(p.date, 2), TODAY)), tone: "info" });
    if (p.state === "received") ev.push({ title: "Received in full", sub: "Goods receipt recorded", right: fmtDate(minDate(addDays(p.date, 12), TODAY)), tone: "info" });
    if (p.state === "part received") ev.push({ title: "Part received", sub: "Balance still to arrive", right: fmtDate(minDate(addDays(p.date, 12), TODAY)), tone: "warn" });
    const links = [{ label: "Supplier " + p.supplier, go: G("Records", "suppliers", p.supplier) }];
    if (p.contract) links.push({ label: "Contract " + p.contract, go: G("Projects", "contracts", p.contract) });
    if (p.live) links.push({ label: "Part " + p.live.sku, go: G("Garage", "parts", p.live.sku) });
    pay.forEach(x => links.push({ label: "Supplier invoice " + x.id, go: G("Finance", "payables", x.id) }));
    const next = p.live ? { draft: "Approve (demo)", approved: "Mark ordered (simulated)", ordered: "Simulate receipt" }[p.state] : null;
    const sup = SUPPLIERS.find(x => x.name === p.supplier);
    return detail(p.id + " " + p.supplier, [["What", p.what], ["Supplier", p.supplier], ["Contract", p.contract || "Workshop stock"], ["Raised", fmtDate(p.date)], ["Value (net)", eur(p.value)], ["State", p.state],
      ["Supplier terms", sup ? sup.terms + " days, on-time " + sup.onTime + "%" : "-"], ["Supplier invoices", pay.length ? pay.map(x => x.id + " " + eur(x.amount)).join(", ") : "None matched yet"],
      ["Stock effect", p.live ? "Drafting or approving does not add stock. Only a receipt increases physical stock." : "Receipt recorded against stock or contract cost"]],
    p.live && next ? [{ label: next, run: act("advancePO"), primary: true }] : [],
    { kicker: "Purchase order", status: { t: p.state, tone: badge(p.state).pill }, links, blocks: [{ type: "list", title: "Order trail", items: ev }] });
  };

  /* ───────── overview ───────── */
  if (sec === "overview"){
    const bySt = s => jobs.filter(j => j.status === s);
    const down = {}; jobs.forEach(j => { down[j.asset] = (down[j.asset] || 0) + j.downDays; });
    const downItems = Object.keys(down).sort((a, b) => down[b] - down[a]).slice(0, 8);
    const byMech = {}; jobs.forEach(j => { byMech[j.mech] = byMech[j.mech] || { n: 0, c: 0 }; byMech[j.mech].n++; byMech[j.mech].c += jobCost(j); });
    const dueSoon = jobs.filter(j => j.due <= daysFrom(2)).sort((a, b) => a.due.localeCompare(b.due));
    return out("Garage overview", [
      { type: "kpis", items: [
        { label: "Open job cards", value: String(jobs.length), hint: "internal workshop backlog", go: G("Garage", "jobs", null, { jobStage: "all" }) },
        { label: "Urgent", value: String(jobs.filter(j => j.urgent).length), hint: jobs.filter(j => j.urgent).map(j => j.id + " on " + j.asset).join(", "), tone: "bad", go: G("Garage", "jobs", "WO-0184") },
        { label: "Downtime", value: sumBy(jobs, j => j.downDays) + " asset-days", hint: "across open jobs", go: G("Plant & Hire", "assets", null, { assetType: "all", assetStatus: "unavailable" }) },
        { label: "Backlog cost", value: eur(jobsTotal), hint: "parts and labour on open jobs", go: G("Garage", "jobs") },
        { label: "Low stock SKUs", value: String(ph.low), hint: "of " + ph.total + " stocked, " + ph.out + " out of stock", tone: "warn", go: G("Garage", "parts", null, { partLow: "low" }) },
        { label: "Stock value", value: eurC(ph.value), hint: ph.total + " SKUs at unit cost", go: G("Garage", "parts", null, { partLow: "all" }) },
        { label: "Workshop cost, September", value: eurC(HIST.workshopCost[n9]), delta: delta(HIST.workshopCost[n9], HIST.workshopCost[n9 - 1], { good: "down", label: "vs Aug" }), hint: "internal cost centre, not revenue", spark: HIST.workshopCost, go: repGo },
        { label: "Jobs closed, September", value: String(HIST.workshopJobs[n9]), delta: delta(HIST.workshopJobs[n9], HIST.workshopJobs[n9 - 1], { label: "vs Aug" }), hint: "completed job cards", spark: HIST.workshopJobs, go: G("Garage", "jobs") }] },
      { type: "board", title: "Workshop pipeline", sub: "Open job cards by stage. Click a card to open it.", min: 230,
        cols: STAGES.map(s => ({ title: s, total: eur(sumBy(bySt(s), jobCost)), cards: bySt(s).map(j => ({ id: j.id, title: j.fault, sub: j.asset + ", " + j.mech, value: eur(jobCost(j)), meta: "due " + fmtDate(j.due).slice(0, 6), tag: j.urgent ? { t: "Urgent", tone: "bad" } : undefined, go: G("Garage", "jobs", j.id) })) })) },
      { type: "grid", cols: "2fr 1fr", items: [
        { type: "chart", kind: "column", title: "Workshop cost by month", sub: "Internal parts and labour, 2026. Click a month for the report.", labels: MONTH_LABELS, h: 250, series: [{ name: "Workshop cost", data: HIST.workshopCost }], go: MONTH_LABELS.map(() => repGo), action: { label: "Open report", go: repGo } },
        { type: "chart", kind: "donut", title: "Internal cost split", sub: "Open job cards, parts against labour", size: 150, fmt: eurC, center: { value: eurC(jobsTotal), label: "Backlog" },
          items: [{ label: "Parts", value: sumBy(jobs, j => j.partsCost), go: G("Garage", "parts") }, { label: "Labour", value: sumBy(jobs, labour), color: "var(--ch3)", go: G("Garage", "jobs") }] }] },
      { type: "grid", cols: "1fr 1fr", items: [
        { type: "chart", kind: "hbar", title: "Downtime by asset", sub: "Asset-days lost on open job cards. Click an asset to open it.", fmt: v => String(v),
          items: downItems.map(a => ({ label: a, sub: assetType(a), value: down[a], text: down[a] + " days", tone: down[a] >= 3 ? "warn" : undefined, go: G("Plant & Hire", "assets", a) })) },
        { type: "list", title: "Parts below minimum", sub: lowParts.length + " SKUs need stock", items: lowParts.slice(0, 8).map(p => ({ title: p.sku + " " + p.desc, sub: "Available " + partAvail(p) + ", minimum " + p.min + ", " + shortName(p.supplier), right: "short " + (p.min - partAvail(p)), pill: { t: partAvail(p) <= 0 ? "out" : "low", tone: partAvail(p) <= 0 ? "bad" : "warn" }, tone: partAvail(p) <= 0 ? "bad" : "warn", go: G("Garage", "parts", p.sku) })), action: { label: "All low stock", go: G("Garage", "parts", null, { partLow: "low" }) } }] },
      { type: "grid", cols: "1fr 1fr 1fr", items: [
        { type: "chart", kind: "column", title: "Jobs closed by month", sub: "Completed job cards, 2026", labels: MONTH_LABELS, h: 220, fmt: v => String(Math.round(v)), series: [{ name: "Jobs closed", data: HIST.workshopJobs }], go: MONTH_LABELS.map(() => G("Garage", "jobs")) },
        { type: "chart", kind: "hbar", title: "Open work by mechanic", sub: "Internal cost of assigned job cards", fmt: eurC,
          items: Object.keys(byMech).sort((a, b) => byMech[b].c - byMech[a].c).map(m => ({ label: m, sub: byMech[m].n + " job cards", value: byMech[m].c, text: eurC(byMech[m].c), go: G("Garage", "jobs", null, { jobStage: "all" }) })) },
        { type: "list", title: "Due within two days", sub: dueSoon.length + " job cards", items: dueSoon.slice(0, 6).map(j => ({ title: j.id + " " + j.fault, sub: j.asset + ", " + j.mech, right: fmtDate(j.due).slice(0, 6), pill: { t: j.due < TODAY ? "past due" : "due soon", tone: j.due < TODAY ? "bad" : "warn" }, tone: dueTone(j.due) || undefined, go: G("Garage", "jobs", j.id) })), empty: "Nothing due in the next two days." }] }
    ]);
  }

  /* ───────── job cards ───────── */
  if (sec === "jobs"){
    const st = U("jobStage", "all");
    const list = jobs.filter(j => st === "all" || j.status === st);
    const cost = sumBy(list, jobCost), dueN = list.filter(j => j.due <= daysFrom(2)).length;
    const byAsset = {}; list.forEach(j => { byAsset[j.asset] = (byAsset[j.asset] || 0) + jobCost(j); });
    const urgent = list.find(j => j.urgent);
    const blocks = [
      chips("Stage", "jobStage", [["all", "All " + jobs.length]].concat(STAGES.map(s => [s, cap(s) + " " + jobs.filter(j => j.status === s).length])), "all"),
      { type: "kpis", items: [
        { label: "Job cards", value: String(list.length), hint: st === "all" ? "all stages" : "stage: " + st, go: G("Garage", "jobs", null, { jobStage: "all" }) },
        { label: "Internal cost", value: eur(cost), hint: "parts " + eur(sumBy(list, j => j.partsCost)) + ", labour " + eur(sumBy(list, labour)), go: repGo },
        { label: "Downtime", value: sumBy(list, j => j.downDays) + " asset-days", hint: "assets out of service", go: G("Plant & Hire", "assets", null, { assetType: "all", assetStatus: "unavailable" }) },
        { label: "Due within two days", value: String(dueN), hint: "past due or due by " + fmtDate(daysFrom(2)), tone: dueN ? "warn" : undefined, go: G("Garage", "overview") },
        { label: "Urgent", value: String(list.filter(j => j.urgent).length), hint: list.filter(j => j.urgent).map(j => j.id + " on " + j.asset).join(", ") || "none in this stage", tone: urgent ? "bad" : undefined, go: urgent ? G("Garage", "jobs", urgent.id) : G("Garage", "jobs") }] },
      { type: "grid", cols: "1fr 1fr", items: [
        { type: "chart", kind: "donut", title: "Stage mix", sub: "All open job cards. Click a stage to filter.", size: 150, fmt: v => String(v), center: { value: String(jobs.length), label: "Jobs" },
          items: STAGES.map(s => ({ label: cap(s), value: jobs.filter(j => j.status === s).length, text: String(jobs.filter(j => j.status === s).length), go: G("Garage", "jobs", null, { jobStage: s }) })) },
        { type: "chart", kind: "hbar", title: "Internal cost by asset", sub: "Selection: " + (st === "all" ? "all stages" : st), fmt: eurC,
          items: Object.keys(byAsset).sort((a, b) => byAsset[b] - byAsset[a]).slice(0, 7).map(a => ({ label: a, sub: assetType(a), value: byAsset[a], text: eurC(byAsset[a]), go: G("Plant & Hire", "assets", a) })) }] },
      tbl("jobs", "Job cards", ["Job", "Asset", "Fault", "Mechanic", "Stage", "Opened", "Due", "Internal cost", "Urgent"],
        list.map(j => ({ id: j.id, onClick: select(j.id), cells: [L(j.id, "Garage", "jobs", j.id), L(j.asset, "Plant & Hire", "assets", j.asset), j.fault, person(j.mech), badge(j.status), fmtDate(j.opened),
          dueTone(j.due) ? Object.assign(pill(fmtDate(j.due), dueTone(j.due)), { v: Date.parse(j.due) }) : fmtDate(j.due), eur(jobCost(j)), j.urgent ? pill("urgent", "bad") : "-"] })),
        { num: [7], note: "Due pill: red when past 1 Oct 2026, amber when due within two days. Cost is internal maintenance, not revenue." })
    ];
    const j = sel ? jobs.find(x => x.id === sel) : null;
    if (j) blocks.push(jobDrawer(j));
    return out("Job Cards", blocks);
  }

  /* ───────── parts ───────── */
  if (sec === "parts"){
    const low = U("partLow", "all");
    const list = fx.parts.filter(p => low === "all" || partAvail(p) < p.min);
    const lowOnly = ph.low - ph.out;
    const bySup = {}; fx.parts.forEach(p => { bySup[p.supplier] = (bySup[p.supplier] || 0) + p.onHand * p.cost; });
    const reservedUnits = sumBy(fx.parts, p => p.reserved);
    const blocks = [
      { type: "kpis", items: [
        { label: "Stocked SKUs", value: String(ph.total), hint: "in the stores catalogue", go: G("Garage", "parts", null, { partLow: "all" }) },
        { label: "Stock value", value: eur(ph.value), hint: sumBy(fx.parts, p => p.onHand) + " units at unit cost", go: G("Garage", "parts", null, { partLow: "all" }) },
        { label: "Low stock", value: String(ph.low), hint: "available below minimum", tone: "warn", go: G("Garage", "parts", null, { partLow: "low" }) },
        { label: "Out of stock", value: String(ph.out), hint: "nothing available to issue", tone: ph.out ? "bad" : undefined, go: G("Garage", "parts", null, { partLow: "low" }) },
        { label: "Reserved units", value: String(reservedUnits), hint: "held for open job cards", go: G("Garage", "jobs") },
        { label: "Open order value", value: eur(sumBy(poList.filter(p => OPEN_PO.indexOf(p.state) > -1), p => p.value)), hint: poList.filter(p => OPEN_PO.indexOf(p.state) > -1).length + " purchase orders", go: G("Garage", "purchasing") }] },
      { type: "grid", cols: "1fr 1fr 1fr", items: [
        { type: "chart", kind: "donut", title: "Stock health", sub: "Available against minimum. Click a slice to filter.", size: 150, fmt: v => String(v), center: { value: String(ph.total), label: "SKUs" },
          items: [{ label: "Healthy", value: ph.ok, text: String(ph.ok), go: G("Garage", "parts", null, { partLow: "all" }) }, { label: "Below minimum", value: lowOnly, text: String(lowOnly), tone: "warn", go: G("Garage", "parts", null, { partLow: "low" }) }, { label: "Out of stock", value: ph.out, text: String(ph.out), tone: "bad", go: G("Garage", "parts", null, { partLow: "low" }) }] },
        { type: "chart", kind: "hbar", title: "Stock value by supplier", sub: "Click a supplier to open the account.", fmt: eurC,
          items: Object.keys(bySup).sort((a, b) => bySup[b] - bySup[a]).map(s => ({ label: shortName(s), value: bySup[s], text: eurC(bySup[s]), sub: fx.parts.filter(p => p.supplier === s).length + " SKUs", go: G("Records", "suppliers", shortName(s)) })) },
        { type: "chart", kind: "hbar", title: "Largest shortfalls", sub: "Units short of minimum", fmt: v => String(v),
          items: lowParts.slice(0, 6).map(p => ({ label: p.sku, sub: p.desc, value: p.min - partAvail(p), text: String(p.min - partAvail(p)), tone: partAvail(p) <= 0 ? "bad" : "warn", go: G("Garage", "parts", p.sku) })) }] },
      chips("Stock", "partLow", [["all", "All " + fx.parts.length], ["low", "Low stock " + ph.low]], "all"),
      tbl("parts", "Parts", ["SKU", "Description", "Stock vs minimum", "On hand", "Reserved", "Available", "Minimum", "Unit cost", "Value", "Supplier"],
        list.map(p => { const av = partAvail(p); return { id: p.sku, onClick: select(p.sku), cells: [L(p.sku, "Garage", "parts", p.sku), p.desc,
          bar(av + " / " + p.min, Math.max(0, Math.min(100, av / (p.min * 2) * 100)), av < p.min * 0.5 ? "bad" : av < p.min ? "warn" : undefined),
          String(p.onHand), String(p.reserved), av < p.min ? tone(av, "bad") : String(av), String(p.min), eur(p.cost), eur(p.onHand * p.cost), L(shortName(p.supplier), "Records", "suppliers", shortName(p.supplier))] }; }),
        { search: true, size: 15, num: [3, 4, 5, 6, 7, 8], note: "The bar shows available stock against twice the minimum. Red below half the minimum, amber below the minimum." })
    ];
    const p = sel ? fx.parts.find(x => x.sku === sel) : null;
    if (p) blocks.push(partDrawer(p));
    return out("Parts", blocks);
  }

  /* ───────── purchasing ───────── */
  const po = fx.pos[0];
  const next = po ? { draft: "Approve (demo)", approved: "Mark ordered (simulated)", ordered: "Simulate receipt" }[po.state] : null;
  const ps = U("poState", "all");
  const shown = poList.filter(p => ps === "all" || p.state === ps);
  const open = poList.filter(p => OPEN_PO.indexOf(p.state) > -1);
  const raised = poList.filter(p => p.state !== "draft");
  const stateCount = s => poList.filter(p => p.state === s).length;
  const bySupplier = {}; raised.forEach(p => { bySupplier[p.supplier] = (bySupplier[p.supplier] || 0) + p.value; });
  const byContract = {}; raised.filter(p => p.contract).forEach(p => { byContract[p.contract] = (byContract[p.contract] || 0) + p.value; });
  const months = [...new Set(raised.map(p => monthKey(p.date)))].sort();
  const firstDate = poList.reduce((m, p) => minDate(m, p.date), "9999-12-31");
  const hf = fx.parts.find(p => p.sku === "HF-220");
  const reqRows = [["REQ-091", "HF-220", "Below minimum (" + partAvail(hf) + " vs " + hf.min + ")", fx.pos.length ? "converted to " + fx.pos[0].id : "open"]];
  const p110 = fx.parts.find(p => p.sku === "P-110");
  if (p110) reqRows.push(["REQ-088", "P-110", "Reorder review (available " + partAvail(p110) + ", minimum " + p110.min + ")", "open"]);
  lowParts.filter(p => p.sku !== "HF-220" && p.sku !== "P-110").slice(0, 4).forEach((p, i) => reqRows.push(["REQ-" + String(87 - i).padStart(3, "0"), p.sku, "Below minimum (" + partAvail(p) + " vs " + p.min + ")", "open"]));
  const blocks = [
    { type: "kpis", items: [
      { label: "Open PO value", value: eur(sumBy(open, p => p.value)), hint: open.length + " orders not yet fully received", go: G("Garage", "purchasing", null, { poState: "all" }) },
      { label: "Drafts and approvals", value: String(stateCount("draft") + stateCount("approved")), hint: stateCount("draft") + " draft, " + stateCount("approved") + " approved", tone: stateCount("draft") ? "warn" : undefined, go: G("Work", "approvals") },
      { label: "Ordered, awaiting goods", value: String(stateCount("ordered") + stateCount("part received")), hint: stateCount("ordered") + " ordered, " + stateCount("part received") + " part received", go: G("Garage", "purchasing", null, { poState: "ordered" }) },
      { label: "PO spend to date", value: eurC(sumBy(raised, p => p.value)), hint: raised.length + " orders raised since " + fmtDate(firstDate).slice(0, 6), go: G("Finance", "payables") },
      { label: "Suppliers used", value: String(Object.keys(bySupplier).length), hint: "of " + SUPPLIERS.length + " approved suppliers", go: G("Records", "suppliers") },
      { label: "Supplier on-time rate", value: Math.round(sumBy(SUPPLIERS, s => s.onTime) / SUPPLIERS.length) + "%", hint: "average across approved suppliers", go: G("Records", "suppliers") }] },
    { type: "grid", cols: "2fr 1fr", items: [
      { type: "chart", kind: "stacked", title: "PO value by month", sub: "Received against still open, orders raised", labels: months.map(monthLabel), h: 240,
        series: [{ name: "Received", data: months.map(m => sumBy(raised.filter(p => monthKey(p.date) === m && p.state === "received"), p => p.value)) }, { name: "Open", data: months.map(m => sumBy(raised.filter(p => monthKey(p.date) === m && p.state !== "received"), p => p.value)), color: "var(--ch3)" }],
        go: months.map(() => G("Garage", "purchasing", null, { poState: "all" })) },
      { type: "chart", kind: "donut", title: "Orders by state", sub: "Click a state to filter the table.", size: 150, fmt: v => String(v), center: { value: String(poList.length), label: "Orders" },
        items: ["draft", "approved", "ordered", "part received", "received"].filter(s => stateCount(s) > 0).map(s => ({ label: cap(s), value: stateCount(s), text: String(stateCount(s)), tone: s === "draft" || s === "part received" ? "warn" : undefined, go: G("Garage", "purchasing", null, { poState: s }) })) }] },
    { type: "grid", cols: "1fr 1fr", items: [
      { type: "chart", kind: "hbar", title: "Spend by supplier", sub: "Orders raised. Click a supplier to open the account.", fmt: eurC,
        items: Object.keys(bySupplier).sort((a, b) => bySupplier[b] - bySupplier[a]).map(s => { const sp = SUPPLIERS.find(x => x.name === s); return { label: s, sub: sp ? sp.category : "", value: bySupplier[s], text: eurC(bySupplier[s]), go: G("Records", "suppliers", s) }; }) },
      { type: "chart", kind: "hbar", title: "Spend by contract", sub: "Orders charged to a contract. Click to open the contract.", fmt: eurC,
        items: Object.keys(byContract).sort((a, b) => byContract[b] - byContract[a]).map(c => ({ label: c, sub: (fx.contracts.find(x => x.id === c) || { name: "" }).name.replace(" (demo project)", ""), value: byContract[c], text: eurC(byContract[c]), go: G("Projects", "contracts", c) })) }] },
    { type: "note", text: "Drafting or approving an order does not add stock. Only a receipt increases physical stock." }
  ];
  if (!fx.pos.length) blocks.push({ type: "note", text: "No workshop stock order yet. HF-220 is at " + hf.onHand + " on hand against a minimum of " + hf.min + ": suggested order 10 units, " + eur(480) + " net.", action: { label: "Prepare purchase order", run: act("draftPO") } });
  if (po && next) blocks.push({ type: "actions", items: [{ label: next + " (" + po.id + ")", run: act("advancePO"), primary: true }] });
  if (po && po.state === "received") blocks.push({ type: "note", tone: "ok", text: "Received in full. HF-220 on hand is now " + hf.onHand + "." });
  blocks.push(chips("State", "poState", [["all", "All " + poList.length]].concat(["draft", "approved", "ordered", "part received", "received"].filter(s => stateCount(s) > 0).map(s => [s, cap(s) + " " + stateCount(s)])), "all"));
  blocks.push(tbl("pos", "Purchase orders", ["PO", "Supplier", "Contract", "Raised", "State", "Value (net)"],
    shown.map(p => ({ id: p.id, onClick: select(p.id), cells: [{ t: p.id, go: G("Garage", "purchasing", p.id), sub: p.what }, L(p.supplier, "Records", "suppliers", p.supplier), p.contract ? L(p.contract, "Projects", "contracts", p.contract) : "Workshop stock", fmtDate(p.date), badge(p.state), eur(p.value)] })),
    { search: true, size: 12, num: [5] }));
  blocks.push(tbl("reqs", "Requisitions", ["Ref", "SKU", "Reason", "State"], reqRows.map(r => ({ cells: [r[0], L(r[1], "Garage", "parts", r[1]), r[2], pill(r[3], r[3] === "open" ? "warn" : "info")] })), { sort: false }));
  const p = sel ? poList.find(x => x.id === sel) : null;
  if (p) blocks.push(poDrawer(p));
  return out("Purchasing", blocks);
}
