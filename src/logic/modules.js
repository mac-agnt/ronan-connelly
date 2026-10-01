/* Data-driven pages for the business modules. Everything is derived from the fixture store. */
import {
  CLOCK, COST_RATE, WORKSHOP_RATE, eur, pct, fmtDate, daysFrom, contractFin, assetStatus, hireDays, hireValue,
  jobCost, partAvail, missingStats, receivables, packProgress, nameOf
} from "./fixtures";

export const MODULE_PAGES = ["Dashboard","Projects","Plant & Hire","Garage","Finance","Safety"];
export const TABS = {
  "Dashboard":[["executive","Executive"],["finance","Finance"],["delivery","Delivery"]],
  "Projects":[["overview","Overview"],["contracts","Contracts"],["costs","Costs"],["variations","Variations"],["pipeline","Pipeline"]],
  "Plant & Hire":[["overview","Overview"],["assets","Assets"],["schedule","Schedule"],["hire","Hire Orders"]],
  "Garage":[["overview","Overview"],["jobs","Job Cards"],["parts","Parts"],["purchasing","Purchasing"]],
  "Finance":[["overview","Overview"],["invoices","Invoices"],["payables","Payables"],["reports","Reports"],["cash","Cash Outlook"]],
  "Safety":[["overview","Overview"],["checks","Checks"],["defects","Defects"],["evidence","Evidence"],["packs","Packs"]]
};
export const WORK_MODULE_SECS = ["timesheets","approvals"];
export const REC_MODULE_SECS = ["clients","suppliers","people"];
const BLURB = {
  "Dashboard":"Executive, finance and delivery views over one shared set of demo records.",
  "Projects":"Contracts, costs, variations and pipeline. Costs separate posted, committed and estimated values.",
  "Plant & Hire":"Fleet availability, allocations and hire orders. Internal project allocation and external hire are shown separately.",
  "Garage":"Internal workshop: job cards, parts and purchasing. Repair cost is an internal cost centre, not company revenue.",
  "Finance":"Receivables, payables, saved reports and a demo cash outlook. QuickBooks Online sample data is the assumed system of record.",
  "Safety":"Checks, defects, evidence and client packs. Sample data stands in for Flex; integration capability is unverified."
};

const tone = (t, x) => ({t:String(t), tone:x});
const L = (t, page, sec, id) => ({t:String(t), go:[page, sec, id]});
const ST = {overdue:"bad", unpaid:"warn", paid:"ok", missing:"bad", entered:"warn", approved:"ok", failed:"bad", reviewed:"ok", submitted:"warn", scheduled:"", unavailable:"bad", available:"ok", allocated:"", pending:"warn", rejected:"bad", draft:"warn", ordered:"warn", received:"ok", incomplete:"warn", ready:"warn", attached:"warn", high:"bad", medium:"warn", low:""};
const badge = s => tone(s, ST[s] || "");
const sumBy = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

export function buildModule(page, sec, fx, ui, h){
  const U = (k, d) => (ui[k] === undefined ? d : ui[k]);
  const setU = (k, v) => () => h.ui(k, v);
  const selKey = "sel:" + page + "/" + sec;
  const sel = U(selKey, null);
  const select = id => () => h.ui(selKey, sel === id ? null : id);
  const chips = (label, key, opts, def) => ({type:"chips", label, options:opts, value:U(key, def), set:v => h.ui(key, v)});
  const tbl = (key, title, cols, rows, o) => {
    o = o || {};
    let list = rows;
    const q = o.search ? String(U("q:" + key, "")).toLowerCase() : "";
    if (q) list = list.filter(r => r.cells.some(c => String(c.t !== undefined ? c.t : c).toLowerCase().indexOf(q) > -1));
    let pager = null;
    if (o.size){
      const pages = Math.max(1, Math.ceil(list.length / o.size));
      const pg = Math.min(U("pg:" + key, 0), pages - 1);
      pager = {page:pg, pages, total:list.length, prev:() => h.ui("pg:" + key, Math.max(0, pg - 1)), next:() => h.ui("pg:" + key, Math.min(pages - 1, pg + 1))};
      list = list.slice(pg * o.size, pg * o.size + o.size);
    }
    return {type:"table", title, cols, rows:list, pager, num:o.num || [], empty:o.empty || "No records match.",
      search: o.search ? {value:U("q:" + key, ""), set:v => { h.ui("q:" + key, v); h.ui("pg:" + key, 0); }} : null, note:o.note, csv:o.csv, count:o.count};
  };
  const detail = (title, fields, actions, extra) => Object.assign({type:"detail", title, fields, actions:actions || [], close:select(sel)}, extra || {});
  const act = (name, p) => () => h.act(name, p);
  const out = (title, blocks) => ({title, blurb:BLURB[page] || "", blocks});
  const rec = receivables(fx), as = assetStatus(fx), ms = missingStats(fx), pp = packProgress(fx.pack);
  const fin = id => contractFin(fx, id);
  const portfolio = fx.contracts.map(c => fin(c.id));
  const cashRows = cashModel(fx);

  /* ───────── Dashboard ───────── */
  if (page === "Dashboard"){
    const f27 = fin("PRJ-027");
    const civil = 1060000, hire = 180000;
    if (sec === "executive") return out("Executive", [
      {type:"cards", items:[
        {label:"September revenue (net)", value:eur(civil + hire), hint:"civil " + eur(civil) + " + plant hire " + eur(hire), go:["Finance","reports"]},
        {label:"Outstanding invoices", value:eur(rec.total), hint:rec.count + " unpaid, QuickBooks Online sample", go:["Finance","invoices"]},
        {label:"PRJ-027 forecast margin", value:pct(f27.marginPct), hint:eur(f27.margin) + " vs 18% target", tone:"bad", go:["Projects","costs","PRJ-027"]},
        {label:"Missing timesheets", value:ms.missing + " of " + ms.expected, hint:ms.estHours + " est. hours, " + eur(ms.estCost) + " potential unposted", tone:"warn", go:["Work","timesheets"]}]},
      {type:"bars", title:"September 2026 external revenue (net)", unit:"EUR", items:[{label:"Civil engineering", value:civil, text:eur(civil)},{label:"Plant hire", value:hire, text:eur(hire)}],
        note:"The internal garage is a cost centre. Internal repair charges are not extra revenue."},
      tbl("exec-review", "Contracts needing review", ["Contract","Forecast margin","Target","Pending variation","Flag"],
        portfolio.filter(p => p.marginPct < 18).sort((a,b) => a.marginPct - b.marginPct).slice(0, 5).map(p => ({cells:[L(p.c.id + " " + p.c.name.replace(" (demo project)",""), "Projects","contracts",p.c.id), tone(pct(p.marginPct), p.marginPct < 12 ? "bad" : "warn"), "18.0%", p.pending ? eur(p.pending) : "-", p.marginPct < 12 ? tone("below 12%","bad") : tone("below target","warn")]}))),
      tbl("exec-queue", "Decision queue", ["Decision","Record","Owner","Where"],
        [["Follow up overdue invoice (" + eur(42600) + ")","INV-1048","Niamh Kelly","Finance","invoices","INV-1048"],
         ["Chase missing timesheets","PRJ-027","Liam Joyce","Work","timesheets",""],
         ["Reassign tomorrow's hire","HIRE-084","Patrick Moran","Plant & Hire","schedule",""],
         ["Approve hydraulic filter order (" + eur(480) + ")","HF-220","Seán Duffy","Garage","purchasing",""],
         ["Review variation submission","VAR-009","Eoin Burke","Projects","variations","VAR-009"],
         ["Complete evidence pack","SAFE-031","Fiona McHale","Safety","packs",""]].map(r => ({cells:[r[0], L(r[1], r[3], r[4], r[5]), r[2], r[3]]}))),
      activityBlock(fx)]);
    if (sec === "finance"){
      const buckets = [["Not yet due", fx.invoices.filter(i => i.status === "unpaid")],["1-30 days overdue", fx.invoices.filter(i => i.status === "overdue" && i.overdueDays <= 30)],["31-60 days overdue", fx.invoices.filter(i => i.status === "overdue" && i.overdueDays > 30 && i.overdueDays <= 60)],["60+ days overdue", fx.invoices.filter(i => i.status === "overdue" && i.overdueDays > 60)]];
      const pendingApprovals = approvalRows(fx).filter(a => a.state === "pending").length;
      return out("Finance", [
        {type:"cards", items:[{label:"Receivables", value:eur(rec.total), hint:rec.count + " invoices", go:["Finance","invoices"]},{label:"Overdue", value:eur(rec.overTotal), hint:rec.overCount + " invoices", tone:"bad", go:["Finance","invoices"]},{label:"Payables open", value:eur(sumBy(fx.payables, p => p.amount)), hint:fx.payables.filter(p => p.match !== "matched").length + " matching exceptions", tone:"warn", go:["Finance","payables"]},{label:"Pending approvals", value:String(pendingApprovals), hint:"reminders, orders, evidence", go:["Work","approvals"]}]},
        {type:"bars", title:"Receivables ageing as at " + CLOCK.label, unit:"EUR", items:buckets.map(b => ({label:b[0], value:sumBy(b[1], i => i.amount), text:eur(sumBy(b[1], i => i.amount)) + " (" + b[1].length + ")", go:["Finance","invoices"]}))},
        tbl("fin-margin", "Contract margin summary (forecast, net of VAT)", ["Contract","Forecast margin","Margin %","Target"], portfolio.map(p => ({cells:[L(p.c.id, "Projects","contracts",p.c.id), eur(p.margin), tone(pct(p.marginPct), p.marginPct < 12 ? "bad" : p.marginPct < 18 ? "warn" : "ok"), "18.0%"]})), {num:[1,2,3]}),
        {type:"bars", title:"Cash outlook, demo forecast (net movement)", unit:"EUR", items:cashRows.buckets.map(b => ({label:b.label, value:Math.abs(b.net), text:eur(b.net), go:["Finance","cash"]})), note:"Demo forecast, not a prediction of actual company cash."}]);
    }
    return out("Delivery", [
      {type:"cards", items:[{label:"Active contracts", value:String(fx.contracts.length), hint:"8 in delivery", go:["Projects","contracts"]},{label:"Fleet allocated", value:pct(as.allocated / as.total * 100), hint:as.allocated + " of " + as.total + " assets (denominator: total fleet)", go:["Plant & Hire","assets"]},{label:"Open job cards", value:String(fx.jobcards.length), hint:"internal workshop backlog", go:["Garage","jobs"]},{label:"Field submissions", value:ms.received + " of " + ms.expected, hint:ms.missing + " missing", tone:"warn", go:["Work","timesheets"]}]},
      tbl("del-alloc", "Today's allocations", ["Asset","Type","Allocated to","Status"], fx.assets.filter(a => a.status === "allocated").slice(0, 10).map(a => ({cells:[L(a.id, "Plant & Hire","assets",a.id), a.type, L(a.alloc, "Projects","contracts",a.alloc), badge("allocated")]})), {note:"First 10 of " + as.allocated + " allocated assets."}),
      tbl("del-jobs", "Workshop backlog by stage", ["Stage","Job cards"], ["waiting assessment","awaiting parts","in progress","ready for review"].map(s => ({cells:[s, String(fx.jobcards.filter(j => j.status === s).length)]})), {num:[1]})]);
  }

  /* ───────── Projects ───────── */
  if (page === "Projects"){
    const contractRow = p => ({id:p.c.id, cells:[L(p.c.id, "Projects","contracts",p.c.id), p.c.name, p.c.client, eur(p.c.value), tone(pct(p.marginPct), p.marginPct < 12 ? "bad" : p.marginPct < 18 ? "warn" : "ok"), p.c.progress + "%", p.c.mgr, flags(fx, p.c.id)]});
    if (sec === "overview") return out("Projects overview", [
      {type:"cards", items:[{label:"Active contracts", value:"8", hint:"approved value " + eur(sumBy(fx.contracts, c => c.value)), go:["Projects","contracts"]},{label:"Portfolio forecast margin", value:pct(sumBy(portfolio, p => p.margin) / sumBy(fx.contracts, c => c.value) * 100), hint:"target 18%", tone:"warn"},{label:"Pending variations", value:eur(sumBy(fx.variations.filter(v => v.status === "pending"), v => v.amount)), hint:"not in approved value", go:["Projects","variations"]},{label:"Open opportunities", value:String(fx.opportunities.length), hint:"pipeline", go:["Projects","pipeline"]}]},
      tbl("proj-over", "Portfolio", ["Ref","Contract","Client","Approved value","Forecast margin","Progress","Manager","Flags"], portfolio.map(contractRow), {num:[3,4,5]})]);
    if (sec === "contracts"){
      const blocks = [tbl("contracts", "Contracts", ["Ref","Contract","Client","Approved value","Forecast margin","Progress","Manager","Flags"], portfolio.map(contractRow), {search:true, num:[3,4,5]})];
      if (sel){ const p = fin(sel), c = p.c;
        blocks.push(detail(c.id + " " + c.name, [["Client", c.client],["Approved contract value (net)", eur(c.value)],["Contract manager", c.mgr],["Timeline", fmtDate(c.start) + " to " + fmtDate(c.end)],["Forecast margin", eur(p.margin) + " / " + pct(p.marginPct)],["Pending variations (separate)", eur(p.pending)],
          ["Labour, posted", eur(catSum(fx, c.id, "labour", "posted"))],["Plant allocated", fx.assets.filter(a => a.alloc === c.id).length + " assets"],["Documents", fx.evidence.filter(e => e.group === c.id).length + " evidence files"],["Invoices", fx.invoices.filter(i => i.contract === c.id).map(i => i.id).join(", ") || "-"]],
          [{label:"Open costs", run:() => h.nav("Projects","costs",c.id), primary:true},{label:"Open variations", run:() => h.nav("Projects","variations")}]));
      }
      return out("Contracts", blocks);
    }
    if (sec === "costs"){
      const cid = U("costContract", "PRJ-027"), cat = U("costCat", "all"), code = U("costCode", "all"), per = U("costPer", "all");
      const rows = fx.costs.filter(r => (cid === "all" || r.contract === cid) && (cat === "all" || r.category === cat) && (code === "all" || r.code === code) && (per === "all" || r.status !== "posted" || r.month === per) && !r.overlay);
      const f = cid === "all" ? null : fin(cid);
      const blocks = [chips("Contract", "costContract", [["all","All"]].concat(fx.contracts.map(c => [c.id, c.id])), "PRJ-027"),
        chips("Category", "costCat", [["all","All"],["labour","Labour"],["materials","Materials"],["plant","Plant"],["subcontract","Subcontract"]], "all"),
        chips("Cost code", "costCode", [["all","All"],["LAB","LAB"],["MAT","MAT"],["PLT","PLT"],["PLT-REP","PLT-REP"],["SUB","SUB"]], "all"),
        chips("Posted period", "costPer", [["all","All"],["2026-07","Jul 2026"],["2026-08","Aug 2026"],["2026-09","Sep 2026"]], "all")];
      if (f){
        blocks.push({type:"cards", items:[{label:"Posted actual", value:eur(sumBy(rows, r => r.status === "posted" ? r.amount : 0)), hint:"in selection"},{label:"Committed, not in actuals", value:eur(sumBy(rows, r => r.status === "committed" ? r.amount : 0)), hint:"in selection"},{label:"Further estimate", value:eur(sumBy(rows, r => r.status === "estimate" ? r.amount : 0)), hint:"excludes commitments"},{label:"Forecast final cost", value:eur(f.forecast), hint:"contract total, net of VAT"},{label:"Forecast margin", value:eur(f.margin) + " / " + pct(f.marginPct), hint:"target 18%", tone:f.marginPct < 18 ? "bad" : "ok"}]});
        if (f.overlay) blocks.push({type:"note", tone:"warn", text:"Scenario overlay: " + eur(f.overlay) + " of approved timesheet cost posted in this demo. Not included in the starting posted figures above. With overlay the forecast margin would be " + eur(f.margin - f.overlay) + " / " + pct((f.margin - f.overlay) / f.c.value * 100) + "."});
        else if (cid === "PRJ-027") blocks.push({type:"note", text:"Scenario overlay: the " + eur(ms.estCost) + " of estimated missing labour (Work → Timesheets) is not in posted costs. Approved timesheet hours will appear here once, as an overlay."});
      }
      blocks.push(tbl("costs", "Cost lines", ["Status","Category","Code","Asset","Month","Source","Amount"], rows.map(r => ({cells:[badge(r.status), r.category, r.code, r.asset ? L(r.asset, "Plant & Hire","assets",r.asset) : "-", r.month, r.source, eur(r.amount)]})), {size:14, num:[6], count:rows.length}));
      return out("Costs", blocks);
    }
    if (sec === "variations"){
      const sv = sel ? fx.variations.find(v => v.id === sel) : null;
      const blocks = [tbl("vars", "Variations", ["Ref","Contract","Title","Status","Amount","Potential cost","Owner","Submitted","Next action"], fx.variations.map(v => ({id:v.id, onClick:select(v.id), cells:[v.id, L(v.contract, "Projects","contracts",v.contract), v.title, badge(v.status), eur(v.amount), eur(v.cost), v.owner, fmtDate(v.submitted), v.next]})), {num:[4,5]})];
      if (sv) blocks.push(detail(sv.id + " " + sv.title, [["Contract", sv.contract],["Status", sv.status + (sv.status === "pending" ? " (not in approved contract value or recognised revenue)" : "")],["Value", eur(sv.amount)],["Potential associated cost", eur(sv.cost)],["Evidence", sv.evidence || "Site instruction on file"],["Site instruction", sv.id === "VAR-009" ? "SI-014: divert 90m of existing 150mm main at chainage 420 following a service strike. Issued 22 Sep 2026 by the client's site representative (demo)." : "On file"],["Next action", sv.next]],
        sv.id === "VAR-009" ? [{label:sv.drafted ? "Draft prepared" : "Prepare draft submission and approval task", run:act("draftVariation"), disabled:sv.drafted, primary:true},{label:"Approve draft (simulated)", run:act("approveVariationDraft"), disabled:!sv.drafted || sv.sent}] : []));
      return out("Variations", blocks);
    }
    return out("Pipeline", [{type:"note", text:"Six illustrative opportunities. No tender scraping or submission integrations."}, ...["enquiry","tender","review","awarded"].map(s => tbl("pipe-" + s, s.charAt(0).toUpperCase() + s.slice(1), ["Ref","Opportunity","Client","Value","Next action","Owner"], fx.opportunities.filter(o => o.stage === s).map(o => ({id:o.id, onClick:select(o.id), cells:[o.id, o.name, L(o.client.replace(" (demo record)",""), "Records","clients",o.client), eur(o.value), o.next, o.owner]})), {empty:"None at this stage.", num:[3]})),
      ...(sel && fx.opportunities.find(o => o.id === sel) ? [detail(sel, [["Opportunity", fx.opportunities.find(o => o.id === sel).name],["Next action", fx.opportunities.find(o => o.id === sel).next],["Context", fx.opportunities.find(o => o.id === sel).note || "No notes yet."]], [{label:"Create follow-up task", run:act("addTask", {title:"Follow up " + sel, owner:fx.opportunities.find(o => o.id === sel).owner, related:sel}), primary:true}])] : [])]);
  }

  /* ───────── Plant & Hire ───────── */
  if (page === "Plant & Hire"){
    const hire084 = fx.hires.find(x => x.id === "HIRE-084");
    const conflict = hire084.asset === "EX-014" && fx.assets.find(a => a.id === "EX-014").status === "unavailable";
    if (sec === "overview") return out("Plant & Hire overview", [
      {type:"cards", items:[{label:"Fleet", value:String(as.total), hint:"assets", go:["Plant & Hire","assets"]},{label:"Allocated", value:as.allocated, hint:pct(as.allocated / as.total * 100) + " of total fleet (" + as.allocated + "/" + as.total + ")"},{label:"Available", value:String(as.available), hint:"ready to allocate", tone:"ok"},{label:"Unavailable", value:String(as.unavailable), hint:as.service + " planned service, " + as.defect + " defect", tone:"bad"}]},
      conflict ? {type:"note", tone:"bad", text:"Conflict: HIRE-084 (2 to 4 Oct) is allocated to EX-014, which is unavailable (DEF-028, WO-0184). EX-022 is available for the same dates.", action:{label:"Open schedule", run:() => h.nav("Plant & Hire","schedule")}} : {type:"note", text:"No allocation conflicts in the next 7 days."},
      tbl("pl-upcoming", "Upcoming hire allocations", ["Order","Customer","Asset","Dates","Value (scheduled)"], fx.hires.filter(x => x.status === "scheduled").map(x => ({cells:[L(x.id, "Plant & Hire","hire",x.id), x.customer, L(x.asset, "Plant & Hire","assets",x.asset), fmtDate(x.from) + " to " + fmtDate(x.to), eur(hireValue(x))]})), {num:[4]})]);
    if (sec === "assets"){
      const ty = U("assetType", "all");
      const list = fx.assets.filter(a => ty === "all" || a.type === ty);
      const blocks = [chips("Type", "assetType", [["all","All"]].concat([...new Set(fx.assets.map(a => a.type))].map(t => [t, t])), "all"),
        tbl("assets", "Assets", ["ID","Type","Location","Serviceability","Allocation","Next service"], list.map(a => ({id:a.id, onClick:select(a.id), cells:[a.id, a.type, a.location, tone(a.status + (a.reason ? " (" + a.reason + ")" : ""), ST[a.status]), a.alloc || (a.status === "available" ? "Free" : "-"), a.next]})), {search:true, size:12})];
      const a = sel ? fx.assets.find(x => x.id === sel) : null;
      if (a){ const jobs = fx.jobcards.filter(j => j.asset === a.id);
        blocks.push(detail(a.id + " " + a.name, [["Serviceability", a.status + (a.reason ? ": " + a.reason : "")],["Location", a.location],["Current allocation", a.alloc || "None"],["Next service", a.next],["Repair history", jobs.length ? jobs.map(j => j.id + " (" + eur(jobCost(j)) + ")").join(", ") : "None open"],["Repair cost (parts + labour, counted once)", eur(sumBy(jobs, jobCost))]], jobs.length ? [{label:"Open job card " + jobs[0].id, run:() => h.nav("Garage","jobs",jobs[0].id), primary:true}] : []));
      }
      return out("Assets", blocks);
    }
    if (sec === "schedule"){
      const ty = U("schedType", "all"), loc = U("schedLoc", "all");
      const days = [0,1,2,3,4,5,6].map(d => daysFrom(d));
      const rowsA = fx.assets.filter(a => (ty === "all" || a.type === ty) && (loc === "all" || a.location === loc));
      const cell = (a, d) => { const ho = fx.hires.find(x => x.asset === a.id && d >= x.from && d <= x.to);
        if (ho) return {t:ho.id + (a.status === "unavailable" ? " conflict" : ""), tone:a.status === "unavailable" ? "bad" : "ok", go:["Plant & Hire","hire",ho.id]};
        if (a.status === "unavailable") return tone("Down","bad");
        if (a.status === "available") return "Free";
        return tone(a.alloc, ""); };
      const ex22 = fx.assets.find(a => a.id === "EX-022");
      const ex22free = ex22.status === "available" && !fx.hires.some(x => x.asset === "EX-022" && x.from <= hire084.to && x.to >= hire084.from);
      return out("Schedule", [
        chips("Type", "schedType", [["all","All"]].concat([...new Set(fx.assets.map(a => a.type))].map(t => [t, t])), "all"),
        chips("Location", "schedLoc", [["all","All"]].concat([...new Set(fx.assets.map(a => a.location))].map(t => [t, t.replace(" (demo location)","")])), "all"),
        conflict ? detail("Conflict: HIRE-084 needs EX-014", [["Hire","HIRE-084, 2 to 4 Oct, " + eur(hireValue(hire084)) + " net scheduled (not recognised lost revenue)"],["Defect","DEF-028"],["Job card","WO-0184, " + eur(jobCost(fx.jobcards[0])) + " internal"],["EX-022", ex22free ? "Available and free for those dates" : "Not free"],["EX-014","Stays unavailable until a human workshop release and check are recorded"]],
          [{label:"Reassign HIRE-084 to EX-022", run:act("reassignHire"), disabled:!ex22free, primary:true},{label:"Open WO-0184", run:() => h.nav("Garage","jobs","WO-0184")}], {noClose:true}) : {type:"note", text:"HIRE-084 is now on EX-022 for 2 to 4 Oct. The hire order and schedule are updated."},
        tbl("sched", "Allocation board, next 7 days (ID = external hire, project ref = internal allocation)", ["Asset"].concat(days.map(d => fmtDate(d).slice(0, 6))), rowsA.map(a => ({cells:[L(a.id, "Plant & Hire","assets",a.id)].concat(days.map(d => cell(a, d)))})), {size:16})]);
    }
    return out("Hire Orders", [
      {type:"actions", items:[{label:"Create sample hire (HIRE-085)", run:act("addHire"), disabled:!!fx.hires.find(x => x.id === "HIRE-085")}]},
      tbl("hires", "External hire orders", ["Order","Customer","Asset","Dates","Days","Rate / day","Est. value","Status","Invoice"], fx.hires.map(x => ({id:x.id, onClick:select(x.id), cells:[x.id, x.customer, L(x.asset, "Plant & Hire","assets",x.asset), fmtDate(x.from) + " to " + fmtDate(x.to), String(hireDays(x)), eur(x.rate), eur(hireValue(x)), badge(x.status), x.invoice]})), {num:[4,5,6]}),
      ...(sel && fx.hires.find(x => x.id === sel) ? [detail(sel, [["Customer", fx.hires.find(x => x.id === sel).customer],["Asset", fx.hires.find(x => x.id === sel).asset],["Estimated value (net)", eur(hireValue(fx.hires.find(x => x.id === sel)))],["Type","External hire (not an internal project allocation)"]], [])] : [])]);
  }

  /* ───────── Garage ───────── */
  if (page === "Garage"){
    const j84 = fx.jobcards[0];
    const stageRows = s => fx.jobcards.filter(j => j.status === s);
    if (sec === "overview") return out("Garage overview", [
      {type:"cards", items:[{label:"Open job cards", value:String(fx.jobcards.length), hint:"internal workshop", go:["Garage","jobs"]},{label:"Urgent", value:String(fx.jobcards.filter(j => j.urgent).length), hint:"WO-0184 on EX-014", tone:"bad"},{label:"Downtime", value:sumBy(fx.jobcards, j => j.downDays) + " asset-days", hint:"across open jobs"},{label:"Low stock SKUs", value:String(fx.parts.filter(p => partAvail(p) < p.min).length), hint:"of " + fx.parts.length + " stocked", tone:"warn", go:["Garage","parts"]}]},
      tbl("g-stage", "Open jobs by stage", ["Stage","Jobs","Examples"], ["waiting assessment","awaiting parts","in progress","ready for review"].map(s => ({cells:[s, String(stageRows(s).length), stageRows(s).slice(0, 3).map(j => j.id).join(", ")]})), {num:[1]})]);
    if (sec === "jobs"){
      const blocks = [tbl("jobs", "Job cards", ["Job","Asset","Fault","Mechanic","Stage","Cost (internal)","Urgent"], fx.jobcards.map(j => ({id:j.id, onClick:select(j.id), cells:[j.id, L(j.asset, "Plant & Hire","assets",j.asset), j.fault, j.mech, badge(j.status), eur(jobCost(j)), j.urgent ? tone("urgent","bad") : "-"]})), {num:[5]})];
      const j = sel ? fx.jobcards.find(x => x.id === sel) : null;
      if (j) blocks.push(detail(j.id + " on " + j.asset, [["Reported fault", j.fault],["Mechanic", j.mech],["Parts used", eur(j.partsCost) + (j.id === "WO-0184" ? " (HF-220 and seals)" : "")],["Labour", j.hours + " h x " + eur(WORKSHOP_RATE) + " = " + eur(j.hours * WORKSHOP_RATE)],["Total internal cost", eur(jobCost(j)) + " (internal maintenance; no external invoice, no garage revenue)"],["Linked defect", j.id === "WO-0184" ? "DEF-028" : "-"],["Workshop release", j.id === "WO-0184" ? (j.release ? "Recorded by Seán Duffy" : "Not recorded") : "-"],["Required check", j.id === "WO-0184" ? (j.check ? "Recorded by Fiona McHale" : "Not recorded") : "-"]],
        j.id === "WO-0184" ? [{label:"Record workshop release (human)", run:act("releaseJob"), disabled:j.release, primary:true},{label:"Record required check (human)", run:act("recordCheck"), disabled:j.check},{label:"Open defect DEF-028", run:() => h.nav("Safety","defects","DEF-028")}] : []));
      return out("Job Cards", blocks);
    }
    if (sec === "parts"){
      const low = U("partLow", "all");
      const list = fx.parts.filter(p => low === "all" || partAvail(p) < p.min);
      const blocks = [chips("Stock", "partLow", [["all","All 120"],["low","Low stock"]], "all"),
        tbl("parts", "Parts", ["SKU","Description","On hand","Reserved","Available","Minimum","Bin","Supplier"], list.map(p => ({id:p.sku, onClick:select(p.sku), cells:[p.sku, p.desc, String(p.onHand), String(p.reserved), tone(partAvail(p), partAvail(p) < p.min ? "bad" : ""), String(p.min), p.bin, p.supplier]})), {search:true, size:15, num:[2,3,4,5]})];
      const p = sel ? fx.parts.find(x => x.sku === sel) : null;
      if (p) blocks.push(tbl("moves", "Stock movements for " + p.sku, ["Date","Type","Qty","Reference"], fx.movements.filter(m => m.sku === p.sku).map(m => ({cells:[fmtDate(m.when), m.kind, String(m.qty), m.ref]})), {num:[2]}), detail(p.sku + " " + p.desc, [["Physical stock", p.onHand],["Reserved", p.reserved],["Available", partAvail(p)],["Minimum", p.min],["Unit cost", eur(p.cost)],["Supplier", p.supplier]], p.sku === "HF-220" ? [{label:"Prepare purchase order (10 units)", run:act("draftPO"), disabled:fx.pos.length > 0, primary:true}] : []));
      return out("Parts", blocks);
    }
    const po = fx.pos[0];
    const next = po ? {draft:"Approve (demo)", approved:"Mark ordered (simulated)", ordered:"Simulate receipt"}[po.state] : null;
    return out("Purchasing", [
      {type:"note", text:"Drafting or approving an order does not add stock. Only a receipt increases physical stock."},
      fx.pos.length ? tbl("pos", "Purchase orders", ["PO","SKU","Qty","Value (net)","Supplier","State"], fx.pos.map(p => ({cells:[p.id, L(p.sku, "Garage","parts",p.sku), String(p.qty), eur(p.qty * p.unit), p.supplier, badge(p.state)]})), {num:[2,3]}) : {type:"note", text:"No purchase orders yet. HF-220 is at 2 on hand against a minimum of 6: suggested order 10 units, " + eur(480) + " net.", action:{label:"Prepare purchase order", run:act("draftPO")}},
      ...(po && next ? [{type:"actions", items:[{label:next, run:act("advancePO"), primary:true}]}] : []),
      ...(po && po.state === "received" ? [{type:"note", tone:"ok", text:"Received in full. HF-220 on hand is now " + fx.parts.find(p => p.sku === "HF-220").onHand + "."}] : []),
      tbl("reqs", "Requisitions", ["Ref","SKU","Reason","State"], [["REQ-091","HF-220","Below minimum (2 vs 6)", fx.pos.length ? "converted to PO-0420" : "open"],["REQ-088","P-110","Below minimum","open"]].map(r => ({cells:r})))]);
  }

  /* ───────── Finance ───────── */
  if (page === "Finance"){
    if (sec === "overview") return out("Finance overview", [
      {type:"note", text:"Source: QuickBooks Online sample data, snapshot " + CLOCK.label + ". No live connection."},
      {type:"cards", items:[{label:"Receivables", value:eur(rec.total), hint:rec.count + " unpaid invoices", go:["Finance","invoices"]},{label:"Overdue", value:eur(rec.overTotal), hint:rec.overCount + " invoices", tone:"bad", go:["Finance","invoices"]},{label:"Payables", value:eur(sumBy(fx.payables, p => p.amount)), hint:fx.payables.length + " supplier invoices", go:["Finance","payables"]},{label:"Invoice exceptions", value:String(fx.payables.filter(p => p.match !== "matched").length), hint:"matching exceptions", tone:"warn", go:["Finance","payables"]}]},
      tbl("fin-ov", "Cost approvals waiting", ["Approval","State","Owner"], approvalRows(fx).map(a => ({cells:[a.title, badge(a.state), a.owner]})))]);
    if (sec === "invoices"){
      const f = U("invFilter", "all");
      const list = fx.invoices.filter(i => f === "all" || i.status === f).sort((a, b) => (a.id === "INV-1048" ? -1 : b.id === "INV-1048" ? 1 : b.overdueDays - a.overdueDays));
      const blocks = [chips("Status", "invFilter", [["all","All"],["overdue","Overdue"],["unpaid","Unpaid"],["paid","Paid"],["sample","Sample tax invoice"]], "all")];
      if (f === "sample"){ blocks.push(sampleTax(fx, h, U)); return out("Invoices", blocks); }
      blocks.push(tbl("inv", "Invoices (" + list.length + ")", ["Invoice","Client","Contract","Amount (outstanding)","Due","Days overdue","Status"], list.map(i => ({id:i.id, onClick:select(i.id), cells:[i.id === "INV-1048" ? tone(i.id, "bad") : i.id, i.client, L(i.contract, "Projects","contracts",i.contract), eur(i.amount), fmtDate(i.due), String(i.overdueDays || "-"), badge(i.status)]})), {size:12, num:[3,5], search:true}));
      const inv = sel ? fx.invoices.find(x => x.id === sel) : null;
      if (inv){ const r = fx.reminders[inv.id]; const is48 = inv.id === "INV-1048";
        blocks.push(detail(inv.id + " " + inv.client, [["Outstanding", eur(inv.amount)],["Due", fmtDate(inv.due)],["Overdue", inv.overdueDays ? inv.overdueDays + " days at " + CLOCK.label : "Not yet due"],["Linked contract", inv.contract],["Related work evidence", is48 ? "Valuation 14, SI-014, 6 site photos (PRJ-027)" : "-"],["Owner", is48 ? "Niamh Kelly (reminder approver: Ronan Conneely)" : "-"],["Source", inv.source],["Reminder", is48 ? ({none:"Not drafted", drafted:"Draft ready: to Western Utilities AP (example.com). Not sent.", approved:"Approved in demo. Nothing was sent; invoice remains unpaid."}[r]) : "-"]],
          is48 ? [{label:"Prepare reminder", run:act("draftReminder"), disabled:r !== "none", primary:true},{label:"Approve reminder (simulated)", run:act("approveReminder"), disabled:r !== "drafted"}] : [], is48 && r !== "none" ? {preview:"Subject: Invoice INV-1048, " + eur(inv.amount) + " overdue\n\nHello, our records show INV-1048 for " + eur(inv.amount) + " fell due on 20 August 2026 and remains unpaid. Please let us know when payment is expected.\n\nRonan Conneely, Financial Controller (demo draft)"} : {}));
      }
      return out("Invoices", blocks);
    }
    if (sec === "payables") return out("Payables", [
      {type:"note", text:"Supplier invoices matched to purchase orders and receipts. No banking or payment integration."},
      tbl("pay", "Supplier invoices", ["Invoice","Supplier","PO","Cost code","Contract","Amount","Match"], fx.payables.map(p => ({cells:[p.id, p.supplier, p.po, p.cost, L(p.contract, "Projects","contracts",p.contract), eur(p.amount), tone(p.match, p.match === "matched" ? "ok" : "bad")]})), {num:[5]})]);
    if (sec === "reports") return out("Reports", reportBlocks(fx, U, h, chips, tbl));
    return out("Cash Outlook", [
      {type:"note", tone:"warn", text:"Demo forecast, not a prediction of actual company cash. Invoice due date, expected payment date and scenario assumptions are shown separately."},
      tbl("cash-b", "30 / 60 / 90 day buckets from " + CLOCK.label, ["Bucket","Expected receipts","Expected payments","Scenario assumption (payroll and overheads)","Net"], cashRows.buckets.map(b => ({cells:[b.label, eur(b.in), eur(-b.out), eur(-b.scn), tone(eur(b.net), b.net < 0 ? "bad" : "ok")]})), {num:[1,2,3,4]}),
      tbl("cash-r", "Expected receipts", ["Invoice","Due date","Expected payment","Basis","Amount"], cashRows.receipts.slice(0, 14).map(r => ({cells:[r.id, fmtDate(r.due), fmtDate(r.exp), r.basis, eur(r.amount)]})), {num:[4], note:"First 14 of " + cashRows.receipts.length + " receipts."})]);
  }

  /* ───────── Safety ───────── */
  if (page === "Safety"){
    if (sec === "overview") return out("Safety overview", [
      {type:"cards", items:[{label:"Overdue / missing checks", value:String(fx.checks.filter(c => c.status === "missing").length), hint:"walk-around checks", tone:"bad", go:["Safety","checks"]},{label:"Open defects", value:String(fx.defects.length), hint:"DEF-028 restricts EX-014", go:["Safety","defects"]},{label:"Evidence expiring in 60 days", value:String(fx.evidence.filter(e => e.expiry <= daysFrom(60)).length), hint:"documents", tone:"warn", go:["Safety","evidence"]},{label:"Pack readiness", value:pp.done + " / " + pp.total, hint:"SAFE-031 for PRJ-027", tone:"warn", go:["Safety","packs"]}]}]);
    if (sec === "checks"){
      const f = U("chkF", "all");
      return out("Checks", [chips("Status", "chkF", [["all","All"],["scheduled","Scheduled"],["submitted","Submitted"],["reviewed","Reviewed"],["failed","Failed"],["missing","Missing"]], "all"),
        tbl("chk", "Walk-around checks", ["Check","Asset","Site","Operator","Timestamp","Status","Source"], fx.checks.filter(c => f === "all" || c.status === f).map(c => ({cells:[c.id, L(c.asset, "Plant & Hire","assets",c.asset), c.site, c.operator, c.at, badge(c.status), c.source]}))),
        {type:"form", title:"Simple mobile pre-start form (demo)", fields:[["Asset","EX-022"],["Operator","Declan Moran"],["Tyres, lights, hydraulics checked","Yes"],["Notes (optional)",""]], submit:{label:"Submit check (local demo)", run:act("addTask", {title:"Pre-start check submitted for EX-022 (demo)", related:"EX-022"})}}]);
    }
    if (sec === "defects") return out("Defects", [tbl("def", "Defects", ["Defect","Asset","Severity","Owner","Reported","Restriction","Workshop link"], fx.defects.map(d => ({cells:[d.id, L(d.asset, "Plant & Hire","assets",d.asset), badge(d.severity), d.owner, d.reported, d.restriction, L(d.job, "Garage","jobs",d.job)]}))),
      {type:"note", text:"Release requires a human workshop release and check on the job card. AI cannot mark an asset safe."}]);
    if (sec === "evidence"){
      return out("Evidence", [{type:"note", text:"Sample documents are mock previews. No file links."}, tbl("ev", "Evidence by contract or asset", ["Ref","Title","Contract / asset","Review status","Expiry","Source"], fx.evidence.map(e => ({cells:[e.id, e.title, e.group, tone(e.status, e.status === "reviewed" ? "ok" : "warn"), fmtDate(e.expiry), e.source]})), {size:10, search:true})]);
    }
    const p = fx.pack;
    return out("Packs", [
      {type:"cards", items:[{label:p.id + " for " + p.contract, value:pp.done + " of " + pp.total, hint:"required items reviewed", tone:p.state === "approved" ? "ok" : "warn"},{label:"State", value:p.state === "incomplete" ? "Incomplete" : p.state === "ready" ? "Ready for approval" : "Approved", hint:"no compliance badge from a partial checklist"}]},
      tbl("pack", "Required checklist", ["#","Item","State","Evidence","Action"], p.items.map((it, i) => ({cells:[String(i + 1), it.t, badge(it.state), it.ev || "-", it.state === "missing" ? {t:"Attach sample evidence", run:act("attachEvidence", {i}), button:true} : it.state === "attached" ? {t:"Mark reviewed", run:act("reviewEvidence", {i}), button:true} : "-"]}))),
      {type:"actions", items:[{label:"Approve pack (authorised human)", run:act("approvePack"), disabled:p.state !== "ready", primary:true},{label:"Export manifest (.json)", run:() => h.download("SAFE-031-manifest.json", JSON.stringify({pack:p.id, contract:p.contract, state:p.state, snapshot:CLOCK.label, progress:pp.done + "/" + pp.total, items:p.items.map(i => ({item:i.t, state:i.state, evidence:i.ev || null})), note:"Demo sample manifest"}, null, 2), "application/json")}]}]);
  }

  /* ───────── Work extras ───────── */
  if (page === "Work" && sec === "timesheets"){
    const field = U("tsField", false);
    const unposted = fx.timesheets.filter(t => t.status !== "approved");
    const blocks = [{type:"cards", items:[{label:"Expected", value:String(ms.expected), hint:"field and workshop, 30 Sep"},{label:"Received", value:String(ms.received), hint:"submission received"},{label:"Missing", value:String(ms.missing), hint:ms.estHours + " est. hours = " + eur(ms.estCost) + " at " + eur(COST_RATE) + "/h", tone:"bad"},{label:"Approved posted to PRJ-027", value:eur(sumBy(fx.costs.filter(c => c.overlay), c => c.amount)), hint:"scenario overlay, once per timesheet"}]},
      {type:"note", text:"Missing hours are an estimate, not an assertion that anyone worked them. Submission received and submission approved are separate statuses."},
      chips("View", "tsField", [[false,"Office exception queue"],[true,"Field view"]], false)];
    if (field){
      blocks.push({type:"form", title:"Field timesheet (touch-friendly)", big:true, fields:[["Date","30 Sep 2026"],["Worker","Select from queue"],["Site / contract","PRJ-027"],["Hours","8"],["Note (optional)",""]], submit:{label:"Submit hours", run:act("enterHours", {emp:(unposted.find(t => t.status === "missing") || fx.timesheets[0]).emp, hrs:8, by:"Self-submitted (field view)"})}});
    }
    blocks.push({type:"actions", items:[{label:"Preview bulk reminder (simulated)", run:act("remindMissing")}]});
    blocks.push(tbl("ts", "Missing-submission queue", ["Worker","Role","Supervisor","Estimated","Entered","Entered by / for","Status","Action"], fx.timesheets.map(t => { const e = fx.employees.find(x => x.id === t.emp);
      return {cells:[e.name, e.role, e.supervisor, t.est + " h", t.hrs ? t.hrs + " h" : "-", t.by ? "Entered by " + t.by + " for " + e.name : "-", badge(t.status),
        t.status === "missing" ? {t:"Enter 8h as supervisor", run:act("enterHours", {emp:t.emp, hrs:8}), button:true} : t.status === "entered" ? {t:"Approve and post", run:act("approveTimesheet", {emp:t.emp}), button:true} : "-"]}; }), {size:14}));
    const pa = fx.paper;
    blocks.push({type:"detail", title:"Paper timesheet (simulated extraction)", noClose:true, fields:pa.fields.map(f => [f.k, f.v + "   (confidence " + Math.round(f.conf * 100) + "%" + (f.ambiguous ? ", ambiguous: pending review" : "") + ")"]), preview:"[Sample scan] Handwritten sheet, 30 Sep 2026. Hours entry reads 8.5 or 6.5.", actions:[{label:pa.state === "approved" ? "Approved" : "Approve extracted fields", run:act("approvePaper"), disabled:pa.state === "approved", primary:true}], note:"Extraction is simulated. Ambiguous entries stay pending until a person approves."});
    return out("Timesheets", blocks);
  }
  if (page === "Work" && sec === "approvals"){
    const rows = approvalRows(fx);
    return out("Approvals", [{type:"note", text:"Each approval shows what changes. All actions are local demo actions; nothing is sent or posted externally."},
      ...rows.map(a => ({type:"detail", title:a.title, noClose:true, fields:[["State", a.state],["Owner", a.owner],["On approval", a.effect]], actions:a.state === "pending" ? [{label:"Approve (demo)", run:act(a.act), primary:true}] : [], note:a.state === "not ready" ? "Not yet prepared. Start from " + a.from + "." : ""}))]);
  }

  /* ───────── Records extras ───────── */
  if (page === "Records" && sec === "clients"){
    const names = [...new Set(fx.contracts.map(c => c.client).concat(fx.opportunities.map(o => o.client)))];
    const blocks = [tbl("cl", "Clients (demo records)", ["Client","Contracts","Opportunities","Outstanding","Label"], names.map(n => ({id:n, onClick:select(n), cells:[n, String(fx.contracts.filter(c => c.client === n).length), String(fx.opportunities.filter(o => o.client === n).length), eur(sumBy(fx.invoices.filter(i => i.client.indexOf(n.replace(" (demo record)","")) === 0), i => i.amount)), "Demo record"]})), {num:[1,2,3]})];
    if (sel) blocks.push(tbl("cl-tl", "Timeline: " + sel, ["When","Event","Linked"], timeline(fx, sel).map(t => ({cells:t}))));
    return out("Clients", blocks);
  }
  if (page === "Records" && sec === "suppliers") return out("Suppliers", [tbl("sup", "Suppliers (demo records)", ["Supplier","Open POs","Payables","Label"], [...new Set(fx.parts.map(p => p.supplier).concat(fx.payables.map(p => p.supplier)))].map(s => ({cells:[s, String(fx.pos.filter(p => p.supplier === s).length), eur(sumBy(fx.payables.filter(p => p.supplier === s), p => p.amount)), "Demo record"]})), {num:[1,2]})]);
  if (page === "Records" && sec === "people") return out("People", [{type:"note", text:"112 demo staff: 18 office and 94 field/workshop. Only Ronan Conneely is a confirmed named client employee. Work contact only."},
    tbl("ppl", "People (" + fx.employees.length + ")", ["ID","Name","Role","Department","Group","Supervisor","Profile"], fx.employees.map(e => ({cells:[e.id, e.name, e.role, e.dept, e.group, e.supervisor, e.note]})), {search:true, size:15})]);
  return null;
}

function flags(fx, id){
  const f = [];
  if (fx.variations.some(v => v.contract === id && v.status === "pending")) f.push("variation pending");
  if (id === "PRJ-027") f.push("evidence 8/10");
  return f.length ? tone(f.join(", "), "warn") : "-";
}
function catSum(fx, id, cat, st){ return sumBy(fx.costs.filter(r => r.contract === id && r.category === cat && r.status === st && !r.overlay), r => r.amount); }
function activityBlock(fx){ return {type:"table", title:"Recent demo actions", cols:["When","Who","What"], rows:fx.events.slice(0, 8).map(e => ({cells:[e.at, e.who, e.text]})), empty:"No actions yet."}; }
function timeline(fx, n){
  const rows = [];
  fx.contracts.filter(c => c.client === n).forEach(c => rows.push([fmtDate(c.start), "Contract started", c.id]));
  fx.opportunities.filter(o => o.client === n).forEach(o => { rows.push(["Sep 2026", "Opportunity: " + o.name, o.id]); rows.push(["Next", o.next, o.owner]); if (o.note) rows.push(["Sep 2026", o.note, "MN-0912, server documents"]); });
  fx.invoices.filter(i => i.client.indexOf(n.replace(" (demo record)","")) === 0 && i.status === "overdue").slice(0, 2).forEach(i => rows.push([fmtDate(i.due), "Invoice overdue " + eur(i.amount), i.id]));
  return rows;
}
export function approvalRows(fx){
  const po = fx.pos[0], v = fx.variations.find(x => x.id === "VAR-009"), r = fx.reminders["INV-1048"], entered = fx.timesheets.filter(t => t.status === "entered").length;
  return [
    {title:"Client reminder for INV-1048", state:r === "drafted" ? "pending" : r === "approved" ? "approved" : "not ready", owner:"Niamh Kelly, approver Ronan", effect:"Creates a local Activity event. Nothing is sent and the invoice is not marked paid.", act:"approveReminder", from:"Finance → Invoices"},
    {title:"Purchase order for HF-220 (" + eur(480) + ")", state:!po ? "not ready" : po.state === "draft" ? "pending" : "approved", owner:"Seán Duffy, approver Ronan", effect:"Moves the order to approved. Physical stock does not change until a receipt.", act:"advancePO", from:"Garage → Parts"},
    {title:"Timesheet review (" + entered + " entered)", state:entered ? "pending" : "not ready", owner:"Liam Joyce, reviewer Ronan", effect:"Approve each entered timesheet in Work → Timesheets to post cost once to PRJ-027.", act:"remindMissing", from:"Work → Timesheets"},
    {title:"VAR-009 draft submission", state:!v.drafted ? "not ready" : v.sent ? "approved" : "pending", owner:"Eoin Burke, reviewer Ronan", effect:"Marks the draft approved (simulated). Variation stays pending; not in contract value.", act:"approveVariationDraft", from:"Projects → Variations"},
    {title:"SAFE-031 evidence pack", state:fx.pack.state === "ready" ? "pending" : fx.pack.state === "approved" ? "approved" : "not ready", owner:"Fiona McHale", effect:"Authorised human approval of the reviewed pack.", act:"approvePack", from:"Safety → Packs"}
  ];
}
function cashModel(fx){
  const receipts = fx.invoices.filter(i => i.status !== "paid").map((i, k) => { const due = Date.parse(i.due);
    const lag = i.status === "overdue" ? (i.id === "INV-1048" ? 25 : 14 + (k * 7) % 31) : 7;
    const exp = new Date(i.status === "overdue" ? Date.UTC(2026,9,1) + lag * 86400000 : due + lag * 86400000).toISOString().slice(0,10);
    return {id:i.id, due:i.due, exp, amount:i.amount, basis:i.status === "overdue" ? "assumed +" + lag + " days from today" : "due date + 7 days"}; }).sort((a,b) => a.exp.localeCompare(b.exp));
  const pays = fx.payables.map((p, k) => ({amount:p.amount, exp:daysFrom([12,25,38,52,70,85][k % 6])}));
  const bucketOf = d => { const n = Math.round((Date.parse(d) - Date.UTC(2026,9,1)) / 86400000); return n < 0 ? 0 : n <= 30 ? 0 : n <= 60 ? 1 : n <= 90 ? 2 : -1; };
  const buckets = [{label:"0-30 days"},{label:"31-60 days"},{label:"61-90 days"}].map(b => Object.assign(b, {in:0, out:0, scn:310000}));
  receipts.forEach(r => { const i = bucketOf(r.exp); if (i > -1) buckets[i].in += r.amount; });
  pays.forEach(p => { const i = bucketOf(p.exp); if (i > -1) buckets[i].out += p.amount; });
  buckets.forEach(b => { b.net = b.in - b.out - b.scn; });
  return {buckets, receipts};
}
function sampleTax(fx, h, U){
  const codes = fx.taxCodes;
  const lines = fx.sampleTax.lines.map((l, i) => { const code = U("taxLine" + i, l.code); return {l, code, vat:l.net * codes[code].rate / 100}; });
  const byCode = {}; lines.forEach(x => { byCode[x.code] = byCode[x.code] || {net:0, vat:0}; byCode[x.code].net += x.l.net; byCode[x.code].vat += x.vat; });
  const net = sumBy(lines, x => x.l.net), vat = sumBy(lines, x => x.vat);
  return {type:"taxinvoice", title:"Sample tax configuration invoice (external, illustrative)", note:"Demo settings for finance review. Rates and treatments are not a tax conclusion. Both codes are editable.",
    codes:Object.keys(codes).map(k => ({k, label:codes[k].label, rate:codes[k].rate})),
    lines:lines.map((x, i) => ({desc:x.l.desc, net:eur(x.l.net), code:x.code, vat:eur(x.vat), pick:c => h.ui("taxLine" + i, c)})),
    summary:Object.keys(byCode).map(k => [k + " (" + codes[k].rate + "%)", eur(byCode[k].net), eur(byCode[k].vat)]), total:[eur(net), eur(vat), eur(net + vat)]};
}
function reportBlocks(fx, U, h, chips, tbl){
  const rid = U("repId", "cost"), grp = U("repGroup", "contract"), st = U("repStatus", "all"), per = U("repPer", "all");
  const reps = [["cost","Cost by contract, cost code and asset"],["hire","Hire income by customer and asset"],["workshop","Internal workshop cost by asset"],["debtor","Debtor ageing"],["labour","Unapproved labour"]];
  let cols = [], rows = [], title = reps.find(r => r[0] === rid)[1], controls = [chips("Saved report", "repId", reps, "cost")];
  if (rid === "cost"){
    controls.push(chips("Group by", "repGroup", [["contract","Contract"],["code","Cost code"],["asset","Asset"]], "contract"), chips("Status", "repStatus", [["all","All"],["posted","Posted"],["committed","Committed"],["estimate","Estimate"]], "all"), chips("Posted period", "repPer", [["all","All"],["2026-07","Jul"],["2026-08","Aug"],["2026-09","Sep"]], "all"));
    const src = fx.costs.filter(r => (st === "all" || r.status === st) && (per === "all" || r.status !== "posted" || r.month === per));
    const g = {}; src.forEach(r => { const k = grp === "contract" ? r.contract : grp === "code" ? r.code : (r.asset || "(no asset)"); g[k] = g[k] || {posted:0, committed:0, estimate:0, n:0}; g[k][r.status] += r.amount; g[k].n++; });
    cols = [grp === "contract" ? "Contract" : grp === "code" ? "Cost code" : "Asset", "Posted", "Committed", "Estimate", "Total", "Lines"];
    rows = Object.keys(g).sort().map(k => [k, g[k].posted, g[k].committed, g[k].estimate, g[k].posted + g[k].committed + g[k].estimate, g[k].n]);
  } else if (rid === "hire"){
    controls.push(chips("Group by", "repGroup", [["customer","Customer"],["asset","Asset"]], "customer"));
    const g = {}; fx.hires.forEach(x => { const k = U("repGroup","customer") === "asset" ? x.asset : x.customer; g[k] = g[k] || {d:0, v:0}; g[k].d += hireDays(x); g[k].v += hireValue(x); });
    cols = [U("repGroup","customer") === "asset" ? "Asset" : "Customer", "Hire days", "Scheduled value", "Orders"];
    rows = Object.keys(g).map(k => [k, g[k].d, g[k].v, fx.hires.filter(x => (U("repGroup","customer") === "asset" ? x.asset : x.customer) === k).length]);
  } else if (rid === "workshop"){
    cols = ["Asset", "Job cards", "Parts", "Labour hours", "Internal cost"];
    const g = {}; fx.jobcards.forEach(j => { g[j.asset] = g[j.asset] || {n:0, p:0, h:0}; g[j.asset].n++; g[j.asset].p += j.partsCost; g[j.asset].h += j.hours; });
    rows = Object.keys(g).map(k => [k, g[k].n, g[k].p, g[k].h, g[k].p + g[k].h * WORKSHOP_RATE]);
  } else if (rid === "debtor"){
    controls.push(chips("Group by", "repGroup", [["client","Client"],["bucket","Ageing bucket"]], "client"));
    const bk = i => i.status !== "overdue" ? "Not yet due" : i.overdueDays <= 30 ? "1-30" : i.overdueDays <= 60 ? "31-60" : "60+";
    const g = {}; fx.invoices.filter(i => i.status !== "paid").forEach(i => { const k = U("repGroup","client") === "bucket" ? bk(i) : i.client; g[k] = g[k] || {n:0, a:0}; g[k].n++; g[k].a += i.amount; });
    cols = [U("repGroup","client") === "bucket" ? "Bucket" : "Client", "Invoices", "Outstanding"];
    rows = Object.keys(g).map(k => [k, g[k].n, g[k].a]);
  } else {
    controls.push(chips("Status", "repStatus", [["all","All"],["missing","Missing (estimate)"],["entered","Entered, not approved"]], "all"));
    cols = ["Worker", "Status", "Hours", "Cost at demo rate"];
    rows = fx.timesheets.filter(t => t.status !== "approved" && (st === "all" || t.status === st)).map(t => [nameOf(fx, t.emp), t.status, t.status === "missing" ? t.est : t.hrs, (t.status === "missing" ? t.est : t.hrs) * COST_RATE]);
  }
  const money = c => /Posted|Committed|Estimate|Total|value|Outstanding|cost|Parts/i.test(c) && !/Lines|days|hours|Invoices|Orders|cards/i.test(c);
  const totals = cols.map((c, i) => i === 0 ? "Total" : typeof (rows[0] || [])[i] === "number" ? rows.reduce((a, r) => a + r[i], 0) : "");
  const fmt = (c, v) => typeof v === "number" ? (money(c) ? eur(v) : String(v)) : v;
  const csv = [cols].concat(rows).concat([totals]).map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(",")).join("\n");
  return controls.concat([{type:"table", title:title + " (layout proposed; replace once legacy examples are supplied)", cols, rows:rows.map(r => ({cells:r.map((v, i) => fmt(cols[i], v))})).concat([{cells:totals.map((v, i) => fmt(cols[i], v)), total:true}]), num:cols.map((c, i) => i).slice(1), empty:"No rows.", csv:{label:"Export CSV", run:() => h.download("report-" + rid + ".csv", csv, "text/csv")}}]);
}
