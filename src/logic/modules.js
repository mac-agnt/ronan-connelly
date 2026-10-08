/* Data-driven ERP pages. Everything is derived from the fixture store (fixtures.js).
   This file only routes a page + section to its builder in ./mod/. Builders return
   { title, blocks } using the block types documented in ./mod/kit.js. */
import { makeKit } from "./mod/kit";
import { buildDashboard } from "./mod/dashboard";
import { buildProjects } from "./mod/projects";
import { buildPlant } from "./mod/plant";
import { buildGarage } from "./mod/garage";
import { buildFinance } from "./mod/finance";
import { buildSafety } from "./mod/safety";
import { buildWork } from "./mod/work";
import { buildRecords } from "./mod/records";

export const MODULE_PAGES = ["Dashboard","Projects","Plant & Hire","Garage","Finance","Safety"];
export const TABS = {
  "Dashboard":[["executive","Executive"],["finance","Finance"],["delivery","Delivery"]],
  "Projects":[["overview","Overview"],["contracts","Contracts"],["costs","Costs"],["variations","Variations"],["quotes","Quotes"],["pipeline","Pipeline"]],
  "Plant & Hire":[["overview","Overview"],["assets","Assets"],["schedule","Schedule"],["hire","Hire Orders"]],
  "Garage":[["overview","Overview"],["jobs","Job Cards"],["parts","Parts"],["purchasing","Purchasing"]],
  "Finance":[["overview","Overview"],["invoices","Invoices"],["payables","Payables"],["reports","Reports"],["cash","Cash Outlook"]],
  "Safety":[["overview","Overview"],["checks","Checks"],["defects","Defects"],["incidents","Incidents"],["evidence","Evidence"],["packs","Packs"]]
};
export const WORK_MODULE_SECS = ["timesheets","approvals"];
export const REC_MODULE_SECS = ["clients","suppliers","people"];

const BLURB = {
  "Dashboard":"Executive, finance and delivery views over one shared set of demo records. Every tile opens the records behind it.",
  "Dashboard/executive":"Company position at a glance: revenue, margin, cash, order book, fleet and safety, with a decision queue.",
  "Dashboard/finance":"Receivables, payables, margin by contract and the 90-day cash outlook.",
  "Dashboard/delivery":"Contract programme, fleet allocation, workshop backlog and field submissions.",
  "Projects":"Contracts, costs, variations, quotes and pipeline. Costs separate posted, committed and estimated values.",
  "Plant & Hire":"Fleet availability, allocations and hire orders. Internal project allocation and external hire are shown separately.",
  "Garage":"Internal workshop: job cards, parts and purchasing. Repair cost is an internal cost centre, not company revenue.",
  "Finance":"Receivables, payables, saved reports and a demo cash outlook. QuickBooks Online sample data is the assumed system of record.",
  "Safety":"Checks, defects, incidents, evidence and client packs. Sample data stands in for Flex; integration capability is unverified.",
  "Projects/overview":"Portfolio health: margin against target, cost position, pending variations and the quote and tender pipeline.",
  "Projects/contracts":"Every live contract with forecast margin and progress. Open one for its cost split, progress curve and invoices.",
  "Projects/costs":"Posted actuals, committed orders and further estimates, by contract, category and cost code.",
  "Projects/variations":"Client variations by status. Pending value is not in approved contract value or recognised revenue.",
  "Projects/quotes":"Quotes issued and in preparation, with win chance and expiry. Click a quote to move it through its stages.",
  "Projects/pipeline":"Opportunities from enquiry to award, with the quotes tied to them.",
  "Plant & Hire/overview":"Fleet health, utilisation and hire income, with services due and any allocation conflicts.",
  "Plant & Hire/assets":"The full fleet register: availability, utilisation, hours and next service.",
  "Plant & Hire/schedule":"Seven-day allocation board. Hire order ids are external hire; project references are internal allocation.",
  "Plant & Hire/hire":"External hire orders with rate, value, status and invoice.",
  "Garage/overview":"Workshop load, downtime and cost. Repair cost is an internal cost centre, not company revenue.",
  "Garage/jobs":"Open job cards by stage, with due dates and internal cost.",
  "Garage/parts":"Stock levels against minimums across 120 SKUs, with movements.",
  "Garage/purchasing":"Purchase orders, requisitions and supplier spend. Only a receipt increases physical stock.",
  "Finance/overview":"Receivables, payables and approvals in one view. QuickBooks Online sample data is the assumed system of record.",
  "Finance/invoices":"Every invoice by status, ageing bucket, client and contract.",
  "Finance/payables":"Supplier invoices matched to purchase orders and receipts. No banking or payment integration.",
  "Finance/reports":"Saved reports with grouping and CSV export.",
  "Finance/cash":"A 90-day demo cash outlook. Not a prediction of actual company cash.",
  "Safety/overview":"Checks, defects, incidents, evidence and training in one view.",
  "Safety/checks":"Daily walk-around checks and a simple mobile pre-start form.",
  "Safety/defects":"Open defects and their operating restrictions. Only a human release can return an asset to service.",
  "Safety/incidents":"Near misses, first aid and property damage, with owner and investigation status.",
  "Safety/evidence":"Certificates and documents by expiry, and competency cards due for renewal.",
  "Safety/packs":"Client evidence packs. A partial checklist never earns a compliance badge.",
  "Work/timesheets":"Who has submitted hours, who is missing, and what the gap costs. Approving a timesheet posts cost once.",
  "Work/approvals":"Everything waiting for a human decision, with what changes when you approve.",
  "Records/clients":"Client accounts: credit position, contracts, invoices and quotes in one place.",
  "Records/suppliers":"Supplier accounts: spend, open orders, payables and delivery performance.",
  "Records/people":"Demo workforce by department, with supervisors and work contact only."
};

export function buildModule(page, sec, fx, ui, h){
  const k = makeKit(page, sec, fx, ui, h);
  let r = null;
  if (page === "Dashboard") r = buildDashboard(k);
  else if (page === "Projects") r = buildProjects(k);
  else if (page === "Plant & Hire") r = buildPlant(k);
  else if (page === "Garage") r = buildGarage(k);
  else if (page === "Finance") r = buildFinance(k);
  else if (page === "Safety") r = buildSafety(k);
  else if (page === "Work") r = buildWork(k);
  else if (page === "Records") r = buildRecords(k);
  if (!r) return null;
  r.blurb = BLURB[page + "/" + sec] || BLURB[page] || "";
  return r;
}
