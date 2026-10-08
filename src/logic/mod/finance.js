/* Finance: overview, invoices, payables, reports and cash outlook. QuickBooks Online sample data is the assumed
   system of record. Every tile, bar and row opens the records behind it. */
import {
  CLOCK, COST_RATE, WORKSHOP_RATE, HIST, MONTH_LABELS, CLIENTS, eur, pct, fmtDate, daysFrom, hireDays, hireValue,
  receivables, ageing, dso, shortName, nameOf
} from "../fixtures";
import { sumBy, tone, pill, L, G, badge, eurC, delta, cashModel, approvalRows, ST } from "./kit";

const BK = ["nd", "1-30", "31-60", "60+"];
const BKL = { nd: "Not yet due", "1-30": "1-30 days", "31-60": "31-60 days", "60+": "60+ days" };
const PAYDAYS = [12, 25, 38, 52, 70, 85]; /* same schedule as cashModel in kit.js */
const addDays = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
const bucketOf = i => (i.status === "paid" ? null : i.status === "unpaid" ? "nd" : i.overdueDays <= 30 ? "1-30" : i.overdueDays <= 60 ? "31-60" : "60+");
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

export function buildFinance(k){
  const { fx, sec, tbl, out, sel, select, act, chips, detail, U, h } = k;
  const rec = receivables(fx), ag = ageing(fx), cash = cashModel(fx);
  const i9 = HIST.cashIn.length - 1;
  const unpaid = fx.invoices.filter(i => i.status !== "paid"), paid = fx.invoices.filter(i => i.status === "paid");
  const payTotal = sumBy(fx.payables, p => p.amount);
  const payExc = fx.payables.filter(p => p.match !== "matched");
  const clientOf = i => shortName(i.client);
  const contractName = id => (fx.contracts.find(c => c.id === id) || { name: "" }).name.replace(" (demo project)", "");
  const payDue = (p, idx) => daysFrom(PAYDAYS[idx % 6]);
  const poState = id => { const p = fx.poHistory.find(x => x.id === id) || (fx.pos.find(x => x.id === id) && { state: fx.pos.find(x => x.id === id).state }); return p ? p.state : ""; };
  const repGo = (rid, extra) => G("Finance", "reports", null, Object.assign({ repId: rid }, extra || {}));
  const pending = approvalRows(fx).filter(a => a.state === "pending").length;

  /* ───────── invoice drawer ───────── */
  const invDrawer = inv => {
    const r = fx.reminders[inv.id], is48 = inv.id === "INV-1048";
    const cl = CLIENTS.find(c => c.name === clientOf(inv)), terms = cl ? cl.terms : 30, issued = addDays(inv.due, -terms);
    const exp = cash.receipts.find(x => x.id === inv.id);
    const ev = [{ title: "Invoice issued", sub: "Payment terms " + terms + " days", right: eur(inv.amount), tone: "info" }, { title: "Due " + fmtDate(inv.due), sub: fmtDate(issued) + " issued", right: fmtDate(inv.due), tone: "info" }];
    if (inv.status === "overdue") ev.push({ title: "Overdue", sub: inv.overdueDays + " days at " + CLOCK.label, right: fmtDate(addDays(inv.due, 1)), tone: "bad" });
    if (is48 && r !== "none") ev.push({ title: r === "approved" ? "Reminder approved (simulated)" : "Reminder drafted, not sent", sub: r === "approved" ? "Ronan Conneely" : "Niamh Kelly", right: fmtDate("2026-10-01"), tone: "warn" });
    if (inv.status === "paid") { const late = daysBetween(inv.due, inv.paidOn); ev.push({ title: "Payment received", sub: late > 0 ? late + " days after due date" : late === 0 ? "On the due date" : -late + " days before due date", right: fmtDate(inv.paidOn), tone: late > 30 ? "warn" : "info" }); }
    else if (exp) ev.push({ title: "Expected payment", sub: exp.basis, right: fmtDate(exp.exp), tone: "muted" });
    const same = unpaid.filter(x => clientOf(x) === clientOf(inv) && x.id !== inv.id).sort((a, b) => b.overdueDays - a.overdueDays).slice(0, 4);
    const links = [{ label: "Client " + clientOf(inv), go: G("Records", "clients", clientOf(inv)) }, { label: "Contract " + inv.contract, go: G("Projects", "contracts", inv.contract) }];
    if (inv.status !== "paid") links.push({ label: "Cash outlook", go: G("Finance", "cash") });
    if (is48){ links.push({ label: "Variation VAR-009", go: G("Projects", "variations", "VAR-009") }); links.push({ label: "Approvals", go: G("Work", "approvals") }); }
    links.push({ label: "All " + clientOf(inv) + " invoices", go: G("Finance", "invoices", null, { invFilter: "all", invBucket: "all", invClient: clientOf(inv), invContract: "all" }) });
    return detail(inv.id + " " + inv.client, [
      [inv.status === "paid" ? "Amount (paid)" : "Outstanding", eur(inv.amount)], ["Due", fmtDate(inv.due)], ["Overdue", inv.overdueDays ? inv.overdueDays + " days at " + CLOCK.label : inv.status === "paid" ? "Paid" + (inv.paidOn ? " on " + fmtDate(inv.paidOn) : "") : "Not yet due"],
      ["Linked contract", inv.contract + (contractName(inv.contract) ? ", " + contractName(inv.contract) : "")], ["Related work evidence", is48 ? "Valuation 14, SI-014, 6 site photos (PRJ-027)" : "-"], ["Owner", is48 ? "Niamh Kelly (reminder approver: Ronan Conneely)" : "-"], ["Source", inv.source],
      ["Reminder", is48 ? ({ none: "Not drafted", drafted: "Draft ready: to Western Utilities AP (example.com). Not sent.", approved: "Approved in demo. Nothing was sent; invoice remains unpaid." }[r]) : "-"]],
    is48 ? [{ label: "Prepare reminder", run: act("draftReminder"), disabled: r !== "none", primary: true }, { label: "Approve reminder (simulated)", run: act("approveReminder"), disabled: r !== "drafted" }] : [],
    Object.assign({ kicker: "Invoice", status: { t: inv.status, tone: ST[inv.status] || "" }, sub: inv.status === "overdue" ? inv.overdueDays + " days overdue" : undefined, links,
      blocks: [{ type: "list", title: "Timeline", items: ev }, { type: "list", title: "Other open invoices for " + clientOf(inv), items: same.map(x => ({ title: x.id + ", " + eur(x.amount), sub: x.status === "overdue" ? x.overdueDays + " days overdue" : "due " + fmtDate(x.due), pill: { t: x.status, tone: ST[x.status] || "" }, tone: x.status === "overdue" ? "bad" : undefined, go: G("Finance", "invoices", x.id) })), empty: "No other open invoices." }] },
    is48 && r !== "none" ? { preview: "Subject: Invoice INV-1048, " + eur(inv.amount) + " overdue\n\nHello, our records show INV-1048 for " + eur(inv.amount) + " fell due on 20 August 2026 and remains unpaid. Please let us know when payment is expected.\n\nRonan Conneely, Financial Controller (demo draft)" } : {}));
  };

  /* ───────── payable drawer ───────── */
  const payDrawer = (p, idx) => {
    const ps = poState(p.po), exc = p.match !== "matched";
    const rcpt = ps === "received" ? { t: "Receipt recorded", tone: "info", pill: "ok" } : ps === "part received" ? { t: "Part receipt only", tone: "warn", pill: "warn" } : { t: "No receipt recorded", tone: "bad", pill: "open" };
    const price = p.match === "matched" ? { t: "Price agrees with PO", tone: "info", pill: "ok" } : p.match.indexOf("price") > -1 ? { t: "Price differs from PO", tone: "bad", pill: "differs" } : { t: "Price not checked", tone: "muted", pill: "waiting" };
    const links = [{ label: "Supplier " + shortName(p.supplier), go: G("Records", "suppliers", shortName(p.supplier)) }, { label: "Purchase order " + p.po, go: G("Garage", "purchasing", p.po) }, { label: "Contract " + p.contract, go: G("Projects", "contracts", p.contract) }, { label: "Cash outlook", go: G("Finance", "cash") }];
    return detail(p.id + " " + shortName(p.supplier), [["Supplier", p.supplier], ["Purchase order", p.po + " (" + (ps || "unknown") + ")"], ["Cost code", p.cost], ["Contract", p.contract + ", " + contractName(p.contract)], ["Amount", eur(p.amount)], ["Match", p.match], ["Expected payment", fmtDate(payDue(p, idx))]],
      [], { kicker: "Supplier invoice", status: { t: exc ? "exception" : "matched", tone: exc ? "bad" : "ok" }, sub: exc ? "Hold payment until resolved" : "Ready for payment run", links,
        blocks: [{ type: "list", title: "Three-way match", items: [
          { title: "Purchase order " + p.po + " raised", sub: "State: " + (ps || "unknown"), pill: { t: "ok", tone: "ok" }, tone: "info", go: G("Garage", "purchasing", p.po) },
          { title: rcpt.t, sub: "Goods receipt against the order", pill: { t: ps === "received" ? "ok" : ps === "part received" ? "partial" : "open", tone: rcpt.pill === "ok" ? "ok" : rcpt.pill === "warn" ? "warn" : "bad" }, tone: rcpt.tone },
          { title: price.t, sub: "Invoice " + eur(p.amount) + " against order", pill: { t: price.pill, tone: price.pill === "ok" ? "ok" : price.pill === "differs" ? "bad" : "warn" }, tone: price.tone }] }] });
  };

  /* ───────── overview ───────── */
  if (sec === "overview"){
    const debtors = {};
    unpaid.forEach(x => { const n = clientOf(x); debtors[n] = debtors[n] || { total: 0, over: 0 }; debtors[n].total += x.amount; if (x.status === "overdue") debtors[n].over += x.amount; });
    const byContract = {}; unpaid.forEach(x => { byContract[x.contract] = (byContract[x.contract] || 0) + x.amount; });
    const recent = paid.slice().sort((a, b) => b.paidOn.localeCompare(a.paidOn)).slice(0, 6);
    const appr = approvalRows(fx);
    return out("Finance overview", [
      { type: "note", text: "Source: QuickBooks Online sample data, snapshot " + CLOCK.label + ". No live connection." },
      { type: "kpis", items: [
        { label: "Receivables", value: eur(rec.total), hint: rec.count + " unpaid invoices", go: G("Finance", "invoices", null, { invFilter: "all", invBucket: "all" }) },
        { label: "Overdue", value: eur(rec.overTotal), hint: rec.overCount + " invoices, " + (rec.overTotal / rec.total * 100).toFixed(0) + "% of receivables", tone: "bad", go: G("Finance", "invoices", null, { invFilter: "overdue", invBucket: "all" }) },
        { label: "Payables open", value: eur(payTotal), hint: fx.payables.length + " supplier invoices", go: G("Finance", "payables", null, { payF: "all" }) },
        { label: "Matching exceptions", value: String(payExc.length), hint: eur(sumBy(payExc, p => p.amount)) + " held", tone: "warn", go: G("Finance", "payables", null, { payF: "exception" }) },
        { label: "Days to collect", value: dso(fx) + " days", hint: "average over " + paid.length + " paid invoices", go: G("Finance", "invoices", null, { invFilter: "paid", invBucket: "all" }) },
        { label: "Net cash, next 30 days", value: eurC(cash.buckets[0].net), hint: "demo forecast after payroll and overheads", tone: cash.buckets[0].net < 0 ? "bad" : undefined, go: G("Finance", "cash") },
        { label: "Collected, September", value: eurC(HIST.cashIn[i9]), delta: delta(HIST.cashIn[i9], HIST.cashIn[i9 - 1], { label: "vs Aug" }), hint: "paid out " + eurC(HIST.cashOut[i9]), spark: HIST.cashIn, go: G("Dashboard", "finance") },
        { label: "Pending approvals", value: String(pending), hint: "reminders, orders, evidence", go: G("Work", "approvals") }] },
      { type: "grid", cols: "1fr 1fr", items: [
        { type: "chart", kind: "column", title: "Receivables ageing", sub: "As at " + CLOCK.label + ". Click a bar to see those invoices.", labels: ag.map(b => b.label), h: 250, series: [{ name: "Outstanding", data: ag.map(b => b.total) }],
          go: ag.map((b, n) => G("Finance", "invoices", null, { invFilter: n === 0 ? "unpaid" : "overdue", invBucket: BK[n] })) },
        { type: "chart", kind: "column", title: "Collections against payments", sub: "Monthly cash in and cash out, 2026", labels: MONTH_LABELS, h: 250, series: [{ name: "Cash in", data: HIST.cashIn }, { name: "Cash out", data: HIST.cashOut, color: "var(--ch3)" }], go: MONTH_LABELS.map(() => G("Finance", "cash")) }] },
      { type: "grid", cols: "1fr 1fr 1fr", items: [
        { type: "chart", kind: "hbar", title: "Top debtors", sub: "Outstanding by client. Click to filter invoices.", fmt: eurC,
          items: Object.keys(debtors).sort((a, b) => debtors[b].total - debtors[a].total).slice(0, 6).map(n => ({ label: n, value: debtors[n].total, text: eurC(debtors[n].total), sub: debtors[n].over ? eurC(debtors[n].over) + " overdue" : "nothing overdue", tone: debtors[n].over > debtors[n].total * 0.5 ? "bad" : undefined, go: G("Finance", "invoices", null, { invFilter: "all", invBucket: "all", invClient: n }) })) },
        { type: "chart", kind: "hbar", title: "Outstanding by contract", sub: "Unpaid invoices. Click to filter invoices.", fmt: eurC,
          items: Object.keys(byContract).sort((a, b) => byContract[b] - byContract[a]).slice(0, 6).map(c => ({ label: c, sub: contractName(c), value: byContract[c], text: eurC(byContract[c]), go: G("Finance", "invoices", null, { invFilter: "all", invBucket: "all", invContract: c }) })) },
        { type: "progress", title: "Days to pay by client", sub: "Average days from invoice to payment against terms",
          items: CLIENTS.slice(0, 5).map(c => ({ label: c.name, value: Math.min(100, c.pay / 60 * 100), text: c.pay + " days", tone: c.pay > c.terms ? "warn" : undefined, go: G("Records", "clients", c.name) })) }] },
      { type: "grid", cols: "1fr 1fr", items: [
        { type: "list", title: "Cost approvals waiting", sub: pending + " need a decision", items: appr.map(a => ({ title: a.title, sub: a.owner + ", from " + a.from, pill: tone(a.state, ST[a.state] || ""), tone: a.state === "pending" ? "warn" : a.state === "approved" ? "info" : undefined, go: a.go })), action: { label: "All approvals", go: G("Work", "approvals") } },
        { type: "list", title: "Recently paid", sub: "Latest receipts from clients", items: recent.map(x => { const late = daysBetween(x.due, x.paidOn); return { title: x.id + " " + clientOf(x), sub: "Paid " + fmtDate(x.paidOn) + ", " + x.contract, right: eur(x.amount), pill: { t: late > 0 ? late + " days late" : "on time", tone: late > 14 ? "warn" : "ok" }, tone: late > 14 ? "warn" : "info", go: G("Finance", "invoices", x.id) }; }), action: { label: "Paid invoices", go: G("Finance", "invoices", null, { invFilter: "paid", invBucket: "all" }) } }] }
    ]);
  }

  /* ───────── invoices ───────── */
  if (sec === "invoices"){
    const f = U("invFilter", "all"), bk = U("invBucket", "all"), cl = U("invClient", "all"), ct = U("invContract", "all");
    const clients = [...new Set(fx.invoices.map(clientOf))], contracts = [...new Set(fx.invoices.map(i => i.contract))].sort();
    const fChips = chips("Status", "invFilter", [["all", "All"], ["overdue", "Overdue"], ["unpaid", "Unpaid"], ["paid", "Paid"], ["sample", "Sample tax invoice"]], "all");
    if (f === "sample") return out("Invoices", [fChips, sampleTax(fx, h, U)]);
    const scope = fx.invoices.filter(i => (cl === "all" || clientOf(i) === cl) && (ct === "all" || i.contract === ct));
    const list = scope.filter(i => (f === "all" || i.status === f) && (bk === "all" || bucketOf(i) === bk))
      .sort((a, b) => (a.id === "INV-1048" ? -1 : b.id === "INV-1048" ? 1 : b.overdueDays - a.overdueDays));
    const filtered = f !== "all" || bk !== "all" || cl !== "all" || ct !== "all";
    const over = list.filter(i => i.status === "overdue"), pd = list.filter(i => i.status === "paid");
    const biggest = list.slice().sort((a, b) => b.amount - a.amount)[0];
    const aged = BK.map(b => scope.filter(i => bucketOf(i) === b));
    const byCl = {}; scope.filter(i => i.status !== "paid").forEach(i => { byCl[clientOf(i)] = (byCl[clientOf(i)] || 0) + i.amount; });
    const blocks = [fChips,
      chips("Age", "invBucket", [["all", "Any age"]].concat(BK.map(b => [b, BKL[b]])), "all"),
      chips("Client", "invClient", [["all", "All clients"]].concat(clients.map(c => [c, c])), "all"),
      chips("Contract", "invContract", [["all", "All contracts"]].concat(contracts.map(c => [c, c])), "all")];
    if (filtered) blocks.push({ type: "section", title: "Selection: " + list.length + " of " + fx.invoices.length + " invoices", sub: [f !== "all" ? "status " + f : "", bk !== "all" ? "age " + BKL[bk] : "", cl !== "all" ? cl : "", ct !== "all" ? ct : ""].filter(Boolean).join(", "), action: { label: "Clear filters", go: G("Finance", "invoices", null, { invFilter: "all", invBucket: "all", invClient: "all", invContract: "all" }) } });
    blocks.push({ type: "kpis", items: [
      { label: "Invoices", value: String(list.length), hint: eur(sumBy(list, i => i.amount)) + " in total", go: G("Finance", "invoices", null, { invFilter: "all" }) },
      { label: "Overdue in selection", value: eur(sumBy(over, i => i.amount)), hint: over.length + " invoices" + (over.length ? ", average " + Math.round(sumBy(over, i => i.overdueDays) / over.length) + " days late" : ""), tone: over.length ? "bad" : undefined, go: G("Finance", "invoices", null, { invFilter: "overdue" }) },
      { label: "Unpaid, not yet due", value: eur(sumBy(list.filter(i => i.status === "unpaid"), i => i.amount)), hint: list.filter(i => i.status === "unpaid").length + " invoices", go: G("Finance", "invoices", null, { invFilter: "unpaid", invBucket: "nd" }) },
      { label: "Paid in selection", value: eur(sumBy(pd, i => i.amount)), hint: pd.length + " invoices, last 100 days", go: G("Finance", "invoices", null, { invFilter: "paid", invBucket: "all" }) },
      { label: "Largest invoice", value: biggest ? eur(biggest.amount) : "-", hint: biggest ? biggest.id + ", " + clientOf(biggest) : "no invoices", go: biggest ? G("Finance", "invoices", biggest.id) : G("Finance", "invoices") }] });
    blocks.push({ type: "grid", cols: "1fr 1fr", items: [
      { type: "chart", kind: "column", title: "Ageing of outstanding", sub: "Respects the client and contract filters. Click a bar to filter by age.", labels: ag.map(b => b.label), h: 220, series: [{ name: "Outstanding", data: aged.map(l => sumBy(l, i => i.amount)) }],
        go: BK.map((b, n) => G("Finance", "invoices", null, { invFilter: n === 0 ? "unpaid" : "overdue", invBucket: b })) },
      { type: "chart", kind: "hbar", title: "Outstanding by client", sub: "Click a client to filter the table.", fmt: eurC,
        items: Object.keys(byCl).sort((a, b) => byCl[b] - byCl[a]).map(n => ({ label: n, value: byCl[n], text: eurC(byCl[n]), go: G("Finance", "invoices", null, { invClient: n }) })) }] });
    blocks.push(tbl("inv", "Invoices (" + list.length + ")", ["Invoice", "Client", "Contract", "Amount", "Due", "Days overdue", "Status", "Paid on"],
      list.map(i => ({ id: i.id, onClick: select(i.id), cells: [L(i.id, "Finance", "invoices", i.id), L(clientOf(i), "Records", "clients", clientOf(i)), L(i.contract, "Projects", "contracts", i.contract), eur(i.amount), fmtDate(i.due),
        i.overdueDays ? Object.assign(pill(i.overdueDays + " days", i.overdueDays > 30 ? "bad" : "warn"), { v: i.overdueDays }) : { t: "-", v: 0 }, badge(i.status), i.paidOn ? fmtDate(i.paidOn) : "-"] })),
      { size: 12, num: [3], search: true, note: "Amount is the outstanding balance for unpaid invoices and the amount received for paid ones." }));
    const inv = sel ? fx.invoices.find(x => x.id === sel) : null;
    if (inv) blocks.push(invDrawer(inv));
    return out("Invoices", blocks);
  }

  /* ───────── payables ───────── */
  if (sec === "payables"){
    const pf = U("payF", "all"), pc = U("payContract", "all");
    const idx = id => fx.payables.findIndex(x => x.id === id);
    const list = fx.payables.filter(p => (pf === "all" || (pf === "matched" ? p.match === "matched" : p.match !== "matched")) && (pc === "all" || p.contract === pc));
    const sup = {}; fx.payables.forEach(p => { sup[shortName(p.supplier)] = (sup[shortName(p.supplier)] || 0) + p.amount; });
    const price = payExc.filter(p => p.match.indexOf("price") > -1), norc = payExc.filter(p => p.match.indexOf("receipt") > -1);
    const contracts = [...new Set(fx.payables.map(p => p.contract))].sort();
    const blocks = [
      { type: "note", text: "Supplier invoices matched to purchase orders and receipts. No banking or payment integration." },
      { type: "kpis", items: [
        { label: "Payables open", value: eur(payTotal), hint: fx.payables.length + " supplier invoices", go: G("Finance", "payables", null, { payF: "all", payContract: "all" }) },
        { label: "Matched", value: eur(sumBy(fx.payables.filter(p => p.match === "matched"), p => p.amount)), hint: fx.payables.filter(p => p.match === "matched").length + " invoices ready for payment", go: G("Finance", "payables", null, { payF: "matched" }) },
        { label: "Held as exceptions", value: eur(sumBy(payExc, p => p.amount)), hint: payExc.length + " invoices need a decision", tone: "warn", go: G("Finance", "payables", null, { payF: "exception" }) },
        { label: "Due in 30 days", value: eur(cash.buckets[0].out), hint: "expected payments, 0-30 days", go: G("Finance", "cash") },
        { label: "Average invoice", value: eur(payTotal / fx.payables.length), hint: "largest " + eur(Math.max(...fx.payables.map(p => p.amount))), go: G("Finance", "payables", "SI-2206") },
        { label: "Suppliers", value: String(Object.keys(sup).length), hint: "with open invoices", go: G("Records", "suppliers") }] },
      { type: "grid", cols: "1fr 1fr 1fr", items: [
        { type: "chart", kind: "donut", title: "Match status", sub: "Click a slice to filter.", size: 150, fmt: eurC, center: { value: String(fx.payables.length), label: "Invoices" },
          items: [{ label: "Matched", value: sumBy(fx.payables.filter(p => p.match === "matched"), p => p.amount), go: G("Finance", "payables", null, { payF: "matched" }) }, { label: "Price differs", value: sumBy(price, p => p.amount), tone: "warn", go: G("Finance", "payables", null, { payF: "exception" }) }, { label: "No receipt", value: sumBy(norc, p => p.amount), tone: "bad", go: G("Finance", "payables", null, { payF: "exception" }) }].filter(x => x.value > 0) },
        { type: "chart", kind: "hbar", title: "Spend by supplier", sub: "Open invoices. Click to open the account.", fmt: eurC,
          items: Object.keys(sup).sort((a, b) => sup[b] - sup[a]).map(n => ({ label: n, value: sup[n], text: eurC(sup[n]), go: G("Records", "suppliers", n) })) },
        { type: "chart", kind: "column", title: "Payments due", sub: "Expected payments by bucket", labels: cash.buckets.map(b => b.label), h: 190, series: [{ name: "Payments", data: cash.buckets.map(b => b.out) }], go: cash.buckets.map(() => G("Finance", "cash")) }] },
      chips("Match", "payF", [["all", "All"], ["exception", "Exceptions"], ["matched", "Matched"]], "all"),
      chips("Contract", "payContract", [["all", "All contracts"]].concat(contracts.map(c => [c, c])), "all"),
      tbl("pay", "Supplier invoices", ["Invoice", "Supplier", "PO", "Cost code", "Contract", "Expected payment", "Amount", "Match"],
        list.map(p => ({ id: p.id, onClick: select(p.id), cells: [L(p.id, "Finance", "payables", p.id), L(shortName(p.supplier), "Records", "suppliers", shortName(p.supplier)), L(p.po, "Garage", "purchasing", p.po), p.cost, L(p.contract, "Projects", "contracts", p.contract), fmtDate(payDue(p, idx(p.id))), eur(p.amount), pill(p.match, p.match === "matched" ? "ok" : "bad")] })),
        { num: [6], note: "Expected payment follows the same schedule as the cash outlook." })];
    const p = sel ? fx.payables.find(x => x.id === sel) : null;
    if (p) blocks.push(payDrawer(p, idx(p.id)));
    return out("Payables", blocks);
  }

  /* ───────── reports ───────── */
  if (sec === "reports") return out("Reports", reportBlocks(k));

  /* ───────── cash outlook ───────── */
  const b = cash.buckets, recTotal = sumBy(b, x => x.in), payOut = sumBy(b, x => x.out), scn = sumBy(b, x => x.scn), net = recTotal - payOut - scn;
  const cum = [0]; b.forEach(x => cum.push(cum[cum.length - 1] + x.net));
  const bucketN = d => { const n = daysBetween("2026-10-01", d); return n <= 30 ? 0 : n <= 60 ? 1 : n <= 90 ? 2 : -1; };
  const inv = id => fx.invoices.find(x => x.id === id);
  const payRows = fx.payables.map((p, n) => ({ p, exp: payDue(p, n) })).sort((x, y) => x.exp.localeCompare(y.exp));
  return out("Cash Outlook", [
    { type: "note", tone: "warn", text: "Demo forecast, not a prediction of actual company cash. Invoice due date, expected payment date and scenario assumptions are shown separately." },
    { type: "kpis", items: [
      { label: "Expected receipts, 90 days", value: eurC(recTotal), hint: cash.receipts.length + " open invoices", go: G("Finance", "invoices", null, { invFilter: "all" }) },
      { label: "Expected payments", value: eurC(payOut), hint: fx.payables.length + " supplier invoices", go: G("Finance", "payables") },
      { label: "Scenario payroll and overheads", value: eurC(scn), hint: "assumption, 3 x " + eurC(b[0].scn), go: G("Dashboard", "finance") },
      { label: "Net movement, 90 days", value: eurC(net), hint: "receipts less payments and scenario", tone: net < 0 ? "bad" : undefined, go: G("Dashboard", "finance") },
      { label: "Net, next 30 days", value: eurC(b[0].net), hint: "first bucket", tone: b[0].net < 0 ? "bad" : undefined, go: G("Finance", "cash") },
      { label: "Overdue assumed collected", value: eurC(sumBy(cash.receipts.filter(r => inv(r.id).status === "overdue"), r => r.amount)), hint: "assumes a 14-44 day lag from today", tone: "warn", go: G("Finance", "invoices", null, { invFilter: "overdue" }) }] },
    { type: "grid", cols: "1fr 1fr", items: [
      { type: "chart", kind: "stacked", title: "Receipts, payments and scenario", sub: "By 30-day bucket from " + CLOCK.label, labels: b.map(x => x.label), h: 250,
        series: [{ name: "Receipts", data: b.map(x => x.in) }, { name: "Payments", data: b.map(x => x.out), color: "var(--ch3)" }, { name: "Scenario payroll and overheads", data: b.map(x => x.scn), color: "var(--ch5)" }], go: b.map(() => G("Finance", "cash")) },
      { type: "chart", kind: "line", title: "Cumulative net position", sub: "Running total of net movement, starting from zero today", labels: ["Today", "30 days", "60 days", "90 days"], h: 250, target: 0, targetLabel: "Break-even", series: [{ name: "Cumulative net", data: cum }], go: cum.map(() => G("Finance", "cash")),
        note: "Demo forecast, not a prediction of actual company cash." }] },
    tbl("cash-b", "30 / 60 / 90 day buckets from " + CLOCK.label, ["Bucket", "Expected receipts", "Expected payments", "Scenario assumption (payroll and overheads)", "Net"], b.map(x => ({ cells: [x.label, eur(x.in), eur(-x.out), eur(-x.scn), tone(eur(x.net), x.net < 0 ? "bad" : "ok")] })), { num: [1, 2, 3, 4], sort: false }),
    tbl("cash-r", "Expected receipts", ["Invoice", "Client", "Due date", "Expected payment", "Bucket", "Basis", "Amount"],
      cash.receipts.map(r => { const iv = inv(r.id), bi = bucketN(r.exp); return { cells: [L(r.id, "Finance", "invoices", r.id), L(clientOf(iv), "Records", "clients", clientOf(iv)), fmtDate(r.due), fmtDate(r.exp), bi > -1 ? b[bi].label : "beyond 90 days", r.basis, eur(r.amount)] }; }),
      { size: 12, search: true, num: [6], note: cash.receipts.length + " open invoices. Overdue invoices use an assumed collection lag." }),
    tbl("cash-p", "Expected payments", ["Supplier invoice", "Supplier", "PO", "Expected payment", "Bucket", "Match", "Amount"],
      payRows.map(({ p, exp }) => ({ cells: [L(p.id, "Finance", "payables", p.id), L(shortName(p.supplier), "Records", "suppliers", shortName(p.supplier)), L(p.po, "Garage", "purchasing", p.po), fmtDate(exp), bucketN(exp) > -1 ? b[bucketN(exp)].label : "beyond 90 days", pill(p.match === "matched" ? "matched" : "exception", p.match === "matched" ? "ok" : "bad"), eur(p.amount)] })), { num: [6], sort: false })
  ]);
}

function sampleTax(fx, h, U){
  const codes = fx.taxCodes;
  const lines = fx.sampleTax.lines.map((l, i) => { const code = U("taxLine" + i, l.code); return { l, code, vat: l.net * codes[code].rate / 100 }; });
  const byCode = {}; lines.forEach(x => { byCode[x.code] = byCode[x.code] || { net: 0, vat: 0 }; byCode[x.code].net += x.l.net; byCode[x.code].vat += x.vat; });
  const net = sumBy(lines, x => x.l.net), vat = sumBy(lines, x => x.vat);
  return { type: "taxinvoice", title: "Sample tax configuration invoice (external, illustrative)", note: "Demo settings for finance review. Rates and treatments are not a tax conclusion. Both codes are editable.",
    codes: Object.keys(codes).map(k => ({ k, label: codes[k].label, rate: codes[k].rate })),
    lines: lines.map((x, i) => ({ desc: x.l.desc, net: eur(x.l.net), code: x.code, vat: eur(x.vat), pick: c => h.ui("taxLine" + i, c) })),
    summary: Object.keys(byCode).map(k => [k + " (" + codes[k].rate + "%)", eur(byCode[k].net), eur(byCode[k].vat)]), total: [eur(net), eur(vat), eur(net + vat)] };
}

function reportBlocks(k){
  const { fx, U, h, chips, tbl } = k;
  const rid = U("repId", "cost"), grp = U("repGroup", "contract"), st = U("repStatus", "all"), per = U("repPer", "all");
  const reps = [["cost", "Cost by contract, cost code and asset"], ["hire", "Hire income by customer and asset"], ["workshop", "Internal workshop cost by asset"], ["debtor", "Debtor ageing"], ["labour", "Unapproved labour"]];
  let cols = [], rows = [], main = 1, comp = null, home = G("Finance", "reports"), homeLabel = "Open records";
  const title = reps.find(r => r[0] === rid)[1];
  const controls = [chips("Saved report", "repId", reps, "cost")];
  let linkOf = () => null;
  if (rid === "cost"){
    controls.push(chips("Group by", "repGroup", [["contract", "Contract"], ["code", "Cost code"], ["asset", "Asset"]], "contract"), chips("Status", "repStatus", [["all", "All"], ["posted", "Posted"], ["committed", "Committed"], ["estimate", "Estimate"]], "all"), chips("Posted period", "repPer", [["all", "All"], ["2026-07", "Jul"], ["2026-08", "Aug"], ["2026-09", "Sep"]], "all"));
    const src = fx.costs.filter(r => (st === "all" || r.status === st) && (per === "all" || r.status !== "posted" || r.month === per));
    const g = {}; src.forEach(r => { const key = grp === "contract" ? r.contract : grp === "code" ? r.code : (r.asset || "(no asset)"); g[key] = g[key] || { posted: 0, committed: 0, estimate: 0, n: 0 }; g[key][r.status] += r.amount; g[key].n++; });
    cols = [grp === "contract" ? "Contract" : grp === "code" ? "Cost code" : "Asset", "Posted", "Committed", "Estimate", "Total", "Lines"];
    rows = Object.keys(g).sort().map(key => [key, g[key].posted, g[key].committed, g[key].estimate, g[key].posted + g[key].committed + g[key].estimate, g[key].n]);
    main = 4; home = G("Projects", "costs"); homeLabel = "Open costs";
    linkOf = n => (grp === "contract" ? G("Projects", "contracts", n) : grp === "asset" && n !== "(no asset)" ? G("Plant & Hire", "assets", n) : null);
    comp = { title: "Cost status", items: [["Posted", sumBy(rows, r => r[1])], ["Committed", sumBy(rows, r => r[2])], ["Estimate", sumBy(rows, r => r[3])]] };
  } else if (rid === "hire"){
    controls.push(chips("Group by", "repGroup", [["customer", "Customer"], ["asset", "Asset"]], "customer"));
    const byAsset = U("repGroup", "customer") === "asset";
    const g = {}; fx.hires.forEach(x => { const key = byAsset ? x.asset : x.customer; g[key] = g[key] || { d: 0, v: 0, n: 0 }; g[key].d += hireDays(x); g[key].v += hireValue(x); g[key].n++; });
    cols = [byAsset ? "Asset" : "Customer", "Hire days", "Scheduled value", "Orders"];
    rows = Object.keys(g).map(key => [key, g[key].d, g[key].v, g[key].n]);
    main = 2; home = G("Plant & Hire", "hire"); homeLabel = "Open hire orders";
    linkOf = n => (byAsset ? G("Plant & Hire", "assets", n) : G("Records", "clients", shortName(n)));
    comp = { title: "Hire status", items: [["Dispatched", sumBy(fx.hires.filter(x => x.status === "dispatched"), hireValue)], ["Scheduled", sumBy(fx.hires.filter(x => x.status === "scheduled"), hireValue)]] };
  } else if (rid === "workshop"){
    cols = ["Asset", "Job cards", "Parts", "Labour hours", "Internal cost"];
    const g = {}; fx.jobcards.forEach(j => { g[j.asset] = g[j.asset] || { n: 0, p: 0, h: 0 }; g[j.asset].n++; g[j.asset].p += j.partsCost; g[j.asset].h += j.hours; });
    rows = Object.keys(g).map(key => [key, g[key].n, g[key].p, g[key].h, g[key].p + g[key].h * WORKSHOP_RATE]);
    main = 4; home = G("Garage", "jobs"); homeLabel = "Open job cards";
    linkOf = n => G("Plant & Hire", "assets", n);
    comp = { title: "Parts against labour", items: [["Parts", sumBy(rows, r => r[2])], ["Labour", sumBy(rows, r => r[3]) * WORKSHOP_RATE]] };
  } else if (rid === "debtor"){
    controls.push(chips("Group by", "repGroup", [["client", "Client"], ["bucket", "Ageing bucket"]], "client"));
    const byBucket = U("repGroup", "client") === "bucket";
    const bk = i => (i.status !== "overdue" ? "Not yet due" : i.overdueDays <= 30 ? "1-30" : i.overdueDays <= 60 ? "31-60" : "60+");
    const g = {}; fx.invoices.filter(i => i.status !== "paid").forEach(i => { const key = byBucket ? bk(i) : i.client; g[key] = g[key] || { n: 0, a: 0 }; g[key].n++; g[key].a += i.amount; });
    cols = [byBucket ? "Bucket" : "Client", "Invoices", "Outstanding"];
    rows = Object.keys(g).map(key => [key, g[key].n, g[key].a]);
    main = 2; home = G("Finance", "invoices", null, { invFilter: "all", invBucket: "all" }); homeLabel = "Open invoices";
    linkOf = n => (byBucket ? G("Finance", "invoices", null, { invFilter: n === "Not yet due" ? "unpaid" : "overdue", invBucket: n === "Not yet due" ? "nd" : n }) : G("Records", "clients", shortName(n)));
    const un = fx.invoices.filter(i => i.status !== "paid");
    comp = { title: "Ageing", items: [["Not yet due", sumBy(un.filter(i => i.status === "unpaid"), i => i.amount)], ["Overdue 1-30 days", sumBy(un.filter(i => i.status === "overdue" && i.overdueDays <= 30), i => i.amount)], ["Overdue 31-60 days", sumBy(un.filter(i => i.status === "overdue" && i.overdueDays > 30 && i.overdueDays <= 60), i => i.amount)], ["Overdue 60+ days", sumBy(un.filter(i => i.status === "overdue" && i.overdueDays > 60), i => i.amount)]] };
  } else {
    controls.push(chips("Status", "repStatus", [["all", "All"], ["missing", "Missing (estimate)"], ["entered", "Entered, not approved"]], "all"));
    cols = ["Worker", "Status", "Hours", "Cost at demo rate"];
    rows = fx.timesheets.filter(t => t.status !== "approved" && (st === "all" || t.status === st)).map(t => [nameOf(fx, t.emp), t.status, t.status === "missing" ? t.est : t.hrs, (t.status === "missing" ? t.est : t.hrs) * COST_RATE]);
    main = 3; home = G("Work", "timesheets"); homeLabel = "Open timesheets";
    comp = { title: "Missing against entered", items: [["Missing (estimate)", sumBy(rows.filter(r => r[1] === "missing"), r => r[3])], ["Entered, not approved", sumBy(rows.filter(r => r[1] === "entered"), r => r[3])]] };
  }
  const money = c => /Posted|Committed|Estimate|Total|value|Outstanding|cost|Parts/i.test(c) && !/Lines|days|hours|Invoices|Orders|cards/i.test(c);
  const totals = cols.map((c, i) => (i === 0 ? "Total" : typeof (rows[0] || [])[i] === "number" ? rows.reduce((a, r) => a + r[i], 0) : ""));
  const fmt = (c, v) => (typeof v === "number" ? (money(c) ? eur(v) : String(v)) : v);
  const csv = [cols].concat(rows).concat([totals]).map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(",")).join("\n");
  const isMoney = money(cols[main]);
  const fm = v => (isMoney ? eur(v) : String(v));
  const ranked = rows.slice().sort((a, b) => b[main] - a[main]);
  const top = ranked[0], total = totals[main] || 0;
  const cellOf = (r, i) => {
    if (i === 0){ const g = linkOf(r[0]); return g ? { t: r[0], go: g } : r[0]; }
    if (rid === "labour" && i === 1) return badge(r[1]);
    return fmt(cols[i], r[i]);
  };
  const blocks = controls.concat([
    { type: "kpis", items: [
      { label: "Rows in report", value: String(rows.length), hint: title, go: home },
      { label: cols[main], value: fm(total), hint: "report total", go: home },
      { label: "Largest row", value: top ? fm(top[main]) : "-", hint: top ? top[0] : "no rows", go: top && linkOf(top[0]) ? linkOf(top[0]) : home },
      { label: "Average per row", value: rows.length ? fm(total / rows.length) : "-", hint: "total divided by rows", go: home },
      { label: "Share of the largest row", value: total ? pct(top ? top[main] / total * 100 : 0) : "-", hint: top ? top[0] : "no rows", go: home }] },
    { type: "grid", cols: "2fr 1fr", items: [
      { type: "chart", kind: "hbar", title: "Largest rows", sub: "Top " + Math.min(8, ranked.length) + " by " + cols[main].toLowerCase() + ". Click to open the record.", fmt: v => (isMoney ? eurC(v) : String(v)),
        items: ranked.slice(0, 8).map(r => ({ label: r[0], value: Math.max(0, r[main]), text: isMoney ? eurC(r[main]) : String(r[main]), go: linkOf(r[0]) || home })) },
      { type: "chart", kind: "donut", title: comp.title, sub: "Composition of the report total", size: 140, fmt: eurC, center: { value: eurC(sumBy(comp.items, x => x[1])), label: "Total" },
        items: comp.items.filter(x => x[1] > 0).map(x => ({ label: x[0], value: x[1], go: home })) }] },
    tbl("rep", title + " (layout proposed; replace once legacy examples are supplied)", cols, rows.map(r => ({ cells: r.map((v, i) => cellOf(r, i)) })).concat([{ cells: totals.map((v, i) => fmt(cols[i], v)), total: true }]),
      { num: cols.map((c, i) => i).slice(1), empty: "No rows.", sort: false, csv: { label: "Export CSV", run: () => h.download("report-" + rid + ".csv", csv, "text/csv") } })]);
  return blocks;
}
