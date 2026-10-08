/* Work: timesheets and approvals. Missing hours, who they belong to, and everything waiting for a human decision. */
import { eur, pct, missingStats, COST_RATE, HIST } from "../fixtures";
import { sumBy, L, G, person, badge, delta, approvalRows, ST } from "./kit";

const W = "Work";
const THIN = n => (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";

export function buildWork(k){
  const { fx, sec, tbl, out, detail, U, chips, act, h } = k;
  const ms = missingStats(fx);
  const byId = {}; fx.employees.forEach(e => { byId[e.id] = e; });
  const ts = fx.timesheets;
  const cnt = s => ts.filter(t => t.status === s).length;
  const n9 = HIST.weeklyHours.length - 1;

  /* ───────── Timesheets ───────── */
  if (sec === "timesheets"){
    const field = U("tsField", false), sf = U("tsStatus", "all");
    const unposted = ts.filter(t => t.status !== "approved");
    const posted = sumBy(fx.costs.filter(c => c.overlay), c => c.amount);
    const rate = ms.received / ms.expected * 100;
    const cleared = cnt("entered") + cnt("approved");
    const depts = [...new Set(fx.employees.map(e => e.dept))];
    const missingBy = f => ts.filter(t => t.status === "missing" && f(byId[t.emp])).length;
    const supers = [...new Set(fx.employees.map(e => e.supervisor).filter(s => s && s !== "-"))];
    const otPct = HIST.weeklyOvertime.map((o, i) => o / HIST.weeklyHours[i] * 100);
    const events = fx.events.filter(e => /hours|timesheet|reminder|paper|Approved \d/i.test(e.text)).slice(0, 6);
    const toTs = (status, fieldView) => G(W, "timesheets", null, {tsStatus:status || "all", tsField:!!fieldView});
    const peopleBy = patch => G("Records", "people", null, Object.assign({peopleDept:"all", peopleGroup:"all", "q:ppl":"", "pg:ppl":0}, patch));

    const blocks = [
      {type:"kpis", min:185, items:[
        {label:"Expected", value:String(ms.expected), hint:"field and workshop, 30 Sep", go:peopleBy({peopleGroup:"Field"})},
        {label:"Received", value:String(ms.received), hint:Math.round(rate) + "% submission rate", go:toTs("all")},
        {label:"Missing", value:String(ms.missing), tone:ms.missing ? "bad" : undefined, hint:ms.estHours + " est. hours = " + eur(ms.estCost) + " at " + eur(COST_RATE) + "/h", go:toTs("missing")},
        {label:"Entered, awaiting approval", value:String(cnt("entered")), tone:cnt("entered") ? "warn" : undefined, hint:"approve to post cost once", go:toTs("entered")},
        {label:"Approved posted to PRJ-027", value:eur(posted), hint:"scenario overlay, once per timesheet", go:G("Projects", "contracts", "PRJ-027")},
        {label:"Hours this week", value:HIST.weeklyHours[n9].toLocaleString("en-IE") + "h", delta:delta(HIST.weeklyHours[n9], HIST.weeklyHours[n9 - 1], {label:"vs last week"}), spark:HIST.weeklyHours, hint:"short because of missing timesheets", go:toTs("all")},
        {label:"Overtime share", value:pct(otPct[n9]), delta:delta(otPct[n9], otPct[n9 - 1], {abs:true, fmt:n => n.toFixed(1) + " pts", label:"vs last week", good:"down"}), spark:otPct, hint:HIST.weeklyOvertime[n9] + " overtime hours", go:toTs("all")}]},
      {type:"note", text:"Missing hours are an estimate, not an assertion that anyone worked them. Submission received and submission approved are separate statuses."},
      {type:"grid", cols:"2fr 1fr", items:[
        {type:"chart", kind:"stacked", title:"Hours submitted by week", sub:"Standard hours with overtime on top. This week is short because of missing timesheets.", labels:HIST.weekLabels, h:250, fmt:THIN,
          series:[{name:"Standard hours", data:HIST.weeklyHours.map((v, i) => v - HIST.weeklyOvertime[i])}, {name:"Overtime", data:HIST.weeklyOvertime, color:"var(--warn)"}],
          go:HIST.weekLabels.map(() => toTs("all"))},
        {type:"chart", kind:"rings", title:"Submission status", sub:"30 Sep. Click a ring to filter the queue.", size:104,
          items:[
            {label:"Submitted", value:rate, text:Math.round(rate) + "%", sub:ms.received + " of " + ms.expected, go:toTs("all")},
            {label:"Entered or approved", value:ts.length ? cleared / ts.length * 100 : 100, text:cleared + " of " + ts.length, sub:"missing cleared", tone:cleared < ts.length ? "warn" : undefined, go:toTs("entered")},
            {label:"Posted to cost", value:ts.length ? cnt("approved") / ts.length * 100 : 0, text:cnt("approved") + " of " + ts.length, sub:"approved", go:toTs("approved")}]}]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"hbar", title:"Expected hours by department", sub:"Headcount x 40 hours. Amber marks departments with missing timesheets.", fmt:v => v.toLocaleString("en-IE") + " h",
          items:depts.map(d => { const n = fx.employees.filter(e => e.dept === d).length, m = missingBy(e => e.dept === d);
            return {label:d, value:n * 40, text:(n * 40).toLocaleString("en-IE") + " h", sub:m ? m + " missing, " + m * 8 + " est. hours" : "none missing", tone:m ? "warn" : undefined, go:peopleBy({peopleDept:d})}; }).sort((a, b) => b.value - a.value)},
        {type:"progress", title:"Missing by supervisor", sub:"Share of each team's expected submissions still missing. Click to open the team.",
          items:supers.map(s => { const team = fx.employees.filter(e => e.supervisor === s), m = ts.filter(t => t.status === "missing" && byId[t.emp].supervisor === s).length;
            return {label:s, value:team.length ? m / team.length * 100 : 0, text:m + " of " + team.length, tone:m ? "warn" : undefined, go:peopleBy({"q:ppl":s})}; })}]},
      {type:"grid", cols:"1fr 1fr", items:[
        {type:"chart", kind:"line", title:"Overtime share by week", sub:"Overtime hours as a share of submitted hours", labels:HIST.weekLabels, series:[{name:"Overtime share", data:otPct}], fmt:v => v.toFixed(1) + "%", h:200, go:HIST.weekLabels.map(() => toTs("all"))},
        {type:"list", title:"Recent timesheet activity", sub:"Latest entries, approvals and reminders", items:events.map(e => ({title:e.text, sub:e.who + ", " + e.at})), empty:"No timesheet actions yet. Enter or approve hours below."}]},
      chips("View", "tsField", [[false, "Office exception queue"], [true, "Field view"]], false)
    ];
    if (field){
      blocks.push({type:"form", title:"Field timesheet (touch-friendly)", big:true, fields:[["Date", "30 Sep 2026"], ["Worker", "Select from queue"], ["Site / contract", "PRJ-027"], ["Hours", "8"], ["Note (optional)", ""]],
        submit:{label:"Submit hours", run:act("enterHours", {emp:(unposted.find(t => t.status === "missing") || ts[0]).emp, hrs:8, by:"Self-submitted (field view)"})}});
    }
    blocks.push({type:"actions", items:[{label:"Preview bulk reminder (simulated)", run:act("remindMissing")}]});
    blocks.push(chips("Status", "tsStatus", [["all", "All"], ["missing", "Missing"], ["entered", "Entered"], ["approved", "Approved"]], "all"));
    const rows = ts.filter(t => sf === "all" || t.status === sf);
    blocks.push(tbl("ts", "Missing-submission queue", ["Worker","Department","Supervisor","Estimated","Entered","Entered by / for","Status","Record","Action"],
      rows.map(t => { const e = byId[t.emp];
        return {cells:[Object.assign(person(e.name), {sub:e.role}), e.dept, e.supervisor, t.est + " h", t.hrs ? t.hrs + " h" : "-", t.by ? "Entered by " + t.by + " for " + e.name : "-", badge(t.status), L(e.id, "Records", "people", e.id),
          t.status === "missing" ? {t:"Enter 8h as supervisor", run:act("enterHours", {emp:t.emp, hrs:8}), button:true} : t.status === "entered" ? {t:"Approve and post", run:act("approveTimesheet", {emp:t.emp}), button:true} : "-"]}; }),
      {size:10, search:true, num:[3, 4], note:rows.length + " of " + ts.length + " workers in the queue."}));
    const pa = fx.paper;
    blocks.push(detail("Paper timesheet (simulated extraction)", pa.fields.map(f => [f.k, f.v + "   (confidence " + Math.round(f.conf * 100) + "%" + (f.ambiguous ? ", ambiguous: pending review" : "") + ")"]),
      [{label:pa.state === "approved" ? "Approved" : "Approve extracted fields", run:act("approvePaper"), disabled:pa.state === "approved", primary:true}],
      {noClose:true, sub:pa.state === "approved" ? "Approved" : "Pending review", preview:"[Sample scan] Handwritten sheet, 30 Sep 2026. Hours entry reads 8.5 or 6.5.", note:"Extraction is simulated. Ambiguous entries stay pending until a person approves."}));
    return out("Timesheets", blocks);
  }

  /* ───────── Approvals ───────── */
  const rows = approvalRows(fx);
  const n = s => rows.filter(a => a.state === s).length;
  const firstPending = rows.find(a => a.state === "pending");
  return out("Approvals", [
    {type:"kpis", min:190, items:[
      {label:"Pending", value:String(n("pending")), tone:n("pending") ? "warn" : undefined, hint:"waiting for a human decision", go:firstPending ? firstPending.go : G(W, "approvals")},
      {label:"Approved", value:String(n("approved")), hint:"decided in this demo", go:G(W, "approvals")},
      {label:"Not ready", value:String(n("not ready")), hint:"nothing prepared yet", go:G(W, "approvals")},
      {label:"Timesheets entered", value:String(cnt("entered")), tone:cnt("entered") ? "warn" : undefined, hint:"awaiting review before posting", go:G(W, "timesheets", null, {tsStatus:"entered", tsField:false})},
      {label:"Reminder drafted", value:fx.reminders["INV-1048"] === "none" ? "No" : "Yes", hint:"INV-1048, " + eur(fx.invoices.find(i => i.id === "INV-1048").amount) + " overdue", go:G("Finance", "invoices", "INV-1048")}]},
    {type:"note", text:"Each approval shows what changes. All actions are local demo actions; nothing is sent or posted externally."},
    {type:"grid", cols:"1fr 2fr", items:[
      {type:"chart", kind:"donut", title:"Approvals by state", sub:rows.length + " decisions in the queue", size:150, fmt:v => String(v), center:{value:String(rows.length), label:"Decisions"},
        items:[{label:"Pending", value:n("pending"), text:String(n("pending")), tone:"warn"}, {label:"Approved", value:n("approved"), text:String(n("approved"))}, {label:"Not ready", value:n("not ready"), text:String(n("not ready")), tone:"muted"}].filter(x => x.value > 0)},
      {type:"list", title:"Approval queue", sub:"Click a row to open the record behind it",
        items:rows.map(a => ({title:a.title, sub:a.owner + ", from " + a.from, pill:{t:a.state, tone:ST[a.state]}, tone:a.state === "pending" ? "warn" : undefined, go:a.go}))}]},
    ...rows.map(a => detail(a.title, [["State", a.state], ["Owner", a.owner], ["On approval", a.effect], ["Source", a.from]],
      (a.state === "pending" ? [{label:"Approve (demo)", run:act(a.act), primary:true}] : []).concat([{label:"Open " + a.from, run:() => h.nav(a.go[0], a.go[1], a.go[2], a.go[3])}]),
      {noClose:true, sub:a.state, note:a.state === "not ready" ? "Not yet prepared. Start from " + a.from + "." : ""}))
  ]);
}
