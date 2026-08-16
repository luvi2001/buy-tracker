/**
 * Imports orders from the original buy_tracker_FINAL.xlsx TRACKER sheet
 * straight into the database.
 *
 * Usage:
 *   npm run import:excel -- /path/to/buy_tracker_FINAL.xlsx
 *   (if no path is given, it looks for ./buy_tracker_FINAL.xlsx in the project root)
 *
 * Column mapping (TRACKER sheet, columns A–V):
 *   A  BUY ORDER NAME        -> Order.buyOrderName
 *   B  RESPONSIBLE           -> Order.responsible
 *   C  BUY QTY                -> Order.buyQty
 *   D  TOTAL SO                -> Order.totalSO
 *   E  TOTAL FG                -> Order.totalFG
 *   F  REF ACTIVE FG           -> Order.refActiveFG
 *   G  DEADLINE (DD.MM.YYYY)  -> Order.deadline
 *   H  OVERALL STATUS         -> Order.overallStatus
 *   I  CURRENT STEP            -> (informational only in the sheet, not stored —
 *                                   it's derivable from the 6 step statuses below)
 *   J/K  Step 1 DATE DONE / STATUS -> ACTIVE SO & FG CREATION
 *   L/M  Step 2 DATE DONE / STATUS -> BOM CREATION
 *   N/O  Step 3 DATE DONE / STATUS -> SMV UPDATE
 *   P/Q  Step 4 DATE DONE / STATUS -> PLANT EXT & CODE CHANGE
 *   R/S  Step 5 DATE DONE / STATUS -> CR RELEASE
 *   T/U  Step 6 DATE DONE / STATUS -> PO
 *   V  REMARKS / NOTES        -> Order.remarks
 *
 * Data rows start at row 3 (row 1 is the merged section header, row 2 is
 * the column header). Import stops at the first row with no order name —
 * that's the sheet's totals row, right before the legend section.
 */
import * as XLSX from "xlsx";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { STEP_NAMES } from "../src/lib/steps";

const prisma = new PrismaClient();

const OVERALL_STATUS_MAP: Record<string, string> = {
  COMPLETE: "COMPLETE",
  "IN PROGRESS": "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  PENDING: "NOT_STARTED", // the sheet uses "⏳ PENDING" for not-yet-started buys
  "NOT STARTED": "NOT_STARTED",
  OVERDUE: "OVERDUE",
};

const STEP_STATUS_MAP: Record<string, string> = {
  DONE: "DONE",
  "IN PROGRESS": "IN_PROGRESS",
  PENDING: "PENDING",
  BLOCKED: "BLOCKED",
};

// Strips emoji / extra whitespace so "  ❌ BLOCKED" -> "BLOCKED"
function normalize(raw: unknown): string {
  if (!raw) return "";
  return String(raw)
    .replace(/[^\x00-\x7F]/g, "") // strip emoji / non-ascii
    .trim()
    .toUpperCase();
}

function mapOverallStatus(raw: unknown): "COMPLETE" | "IN_PROGRESS" | "BLOCKED" | "NOT_STARTED" | "OVERDUE" {
  const key = normalize(raw);
  return (OVERALL_STATUS_MAP[key] as any) || "NOT_STARTED";
}

function mapStepStatus(raw: unknown): "DONE" | "IN_PROGRESS" | "PENDING" | "BLOCKED" {
  const key = normalize(raw);
  return (STEP_STATUS_MAP[key] as any) || "PENDING";
}

// Parses "DD.MM.YYYY" (the format used throughout the sheet). Returns null if unparseable.
function parseDate(raw: unknown): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  const s = String(raw).trim();
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

function toInt(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function toStr(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

async function main() {
  const filePath = process.argv[2] || path.join(process.cwd(), "buy_tracker_FINAL.xlsx");
  console.log(`Reading ${filePath} ...`);

  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets["TRACKER"];
  if (!sheet) throw new Error('No "TRACKER" sheet found in this workbook.');

  // header: 1 -> array-of-arrays, same shape as the raw sheet rows
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Data starts at row 3 in the sheet, which is index 2 in this array.
  const dataRows = rows.slice(2);

  let imported = 0;
  let skipped = 0;

  for (const row of dataRows) {
    const buyOrderName = toStr(row[0]);

    // Stop at the totals row / anything past the real data (blank name, or a
    // bare number in column A like the "35" totals row).
    if (!buyOrderName || /^\d+$/.test(buyOrderName)) {
      if (!buyOrderName) continue; // skip blank spacer rows quietly
      break;
    }

    const stepStatusesRaw = [row[10], row[12], row[14], row[16], row[18], row[20]];
    const stepDatesRaw = [row[9], row[11], row[13], row[15], row[17], row[19]];

    try {
      const order = await prisma.order.create({
        data: {
          buyOrderName,
          responsible: toStr(row[1]),
          buyQty: toInt(row[2]),
          totalSO: toInt(row[3]),
          totalFG: toInt(row[4]),
          refActiveFG: toStr(row[5]),
          deadline: parseDate(row[6]),
          overallStatus: mapOverallStatus(row[7]) as any,
          remarks: toStr(row[21]),
          steps: {
            create: STEP_NAMES.map((name, i) => ({
              stepNumber: i + 1,
              stepName: name,
              status: mapStepStatus(stepStatusesRaw[i]) as any,
              dateDone: parseDate(stepDatesRaw[i]),
            })),
          },
        },
      });
      imported++;
      console.log(`  imported: ${order.buyOrderName}`);
    } catch (err) {
      skipped++;
      console.error(`  skipped "${buyOrderName}":`, (err as Error).message);
    }
  }

  console.log(`\nDone. Imported ${imported} orders, skipped ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
