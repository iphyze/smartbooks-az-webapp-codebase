import * as XLSX from "xlsx";

const HEADER_ALIASES = {
  journal_date: ["journaldate", "headerdate", "date"],
  journal_type: ["journaltype", "type"],
  transaction_type: ["transactiontype", "transactionmethod", "transaction"],
  journal_currency: ["journalcurrency", "basecurrency", "headercurrency"],
  main_journal_description: ["mainjournaldescription", "maindescription", "journalnarration", "headerdescription"],
  cost_center: ["costcenter", "costcentre"],
  rate_date: ["ratedate", "exchangeratedate"],
};

const LINE_ALIASES = {
  ledger_name: ["ledgername", "ledger", "accountname"],
  ledger_number: ["ledgernumber", "accountnumber", "accountcode"],
  journal_description: ["linedescription", "linenarration", "description", "narration"],
  journal_date: ["linedate", "postingdate", "entrydate"],
  sides: ["side", "drcr", "debitcredit", "entryside"],
  jcurrency: ["linecurrency", "currency"],
  amount: ["amount", "value"],
  debit: ["debit", "dr", "debitamount"],
  credit: ["credit", "cr", "creditamount"],
};

const normalizeKey = (key) => String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function indexedRow(row) {
  return Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => [normalizeKey(key), value])
  );
}

function findValue(row, aliases) {
  for (const alias of aliases) {
    const value = row[alias];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function firstValue(rows, aliases) {
  for (const row of rows) {
    const value = findValue(row, aliases);
    if (value !== "") return value;
  }
  return "";
}

export async function parseJournalImportFile(file) {
  if (!file) throw new Error("Choose an Excel or CSV file first.");

  const extension = String(file.name || "").split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(extension)) {
    throw new Error("Only .xlsx, .xls and .csv journal files are supported.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    dateNF: "yyyy-mm-dd",
  });

  const preferredSheet = workbook.SheetNames.find((name) => /journal\s*(import|lines)/i.test(name));
  const sheetName = preferredSheet || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) throw new Error("The uploaded workbook does not contain a readable worksheet.");

  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd",
  });

  if (!rawRows.length) throw new Error("The import worksheet is empty.");

  const rows = rawRows.map(indexedRow);
  const header = Object.fromEntries(
    Object.entries(HEADER_ALIASES).map(([field, aliases]) => [field, firstValue(rows, aliases)])
  );

  const lineRows = rows
    .map((row) => {
      const mapped = Object.fromEntries(
        Object.entries(LINE_ALIASES).map(([field, aliases]) => [field, findValue(row, aliases)])
      );

      const debit = Number(String(mapped.debit || "").replace(/[, ]/g, "")) || 0;
      const credit = Number(String(mapped.credit || "").replace(/[, ]/g, "")) || 0;
      if (!mapped.sides && (debit > 0 || credit > 0)) {
        mapped.sides = debit > 0 ? "Debit" : "Credit";
        mapped.amount = debit > 0 ? debit : credit;
      }

      delete mapped.debit;
      delete mapped.credit;
      return mapped;
    })
    .filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));

  if (!lineRows.length) {
    throw new Error("No journal lines were found. Use the Smartbooks import template headings.");
  }

  return {
    sheetName,
    sourceRows: rawRows.length,
    header,
    rows: lineRows,
  };
}

export function formatImportNumber(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const JOURNAL_TEMPLATE_HEADERS = [
  "Journal Date",
  "Journal Type",
  "Transaction Type",
  "Journal Currency",
  "Main Journal Description",
  "Cost Center",
  "Rate Date",
  "Ledger Name",
  "Ledger Number",
  "Line Description",
  "Line Date",
  "Side",
  "Line Currency",
  "Amount",
];

const JOURNAL_TEMPLATE_ROWS = [
  [
    "2026-06-20",
    "Expenses",
    "Bank Transfer",
    "NGN",
    "June office electricity expense",
    "Overhead",
    "2026-05-08",
    "Electricity Expense",
    "61000000",
    "Electricity bill for June 2026",
    "2026-06-20",
    "Debit",
    "NGN",
    50000,
  ],
  [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Head Office Bank",
    "52000001",
    "Payment for June electricity bill",
    "2026-06-20",
    "Credit",
    "NGN",
    50000,
  ],
];

const JOURNAL_TEMPLATE_INSTRUCTIONS = [
  ["Smartbooks Journal Import Guide"],
  [],
  ["Step", "What to do", "Important note"],
  ["1", "Keep the column headings exactly as provided.", "Do not rename or remove required columns."],
  ["2", "Enter the journal header details on the first populated line.", "Header details apply to all imported lines."],
  ["3", "Enter one debit or credit line per row.", "Debit and credit totals must balance."],
  ["4", "Use either Ledger Name or Ledger Number.", "Smartbooks validates the ledger before loading the form."],
  ["5", "Use dates in YYYY-MM-DD format.", "Example: 2026-06-20."],
  ["6", "Upload the completed file from Create Journal.", "The import fills the form for review and does not submit automatically."],
];

function triggerTemplateDownload(content, filename, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildJournalTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();
  const journalSheet = XLSX.utils.aoa_to_sheet([
    JOURNAL_TEMPLATE_HEADERS,
    ...JOURNAL_TEMPLATE_ROWS,
  ]);

  journalSheet["!cols"] = [
    { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 18 },
    { wch: 32 }, { wch: 18 }, { wch: 15 }, { wch: 24 },
    { wch: 16 }, { wch: 32 }, { wch: 15 }, { wch: 12 },
    { wch: 16 }, { wch: 16 },
  ];
  journalSheet["!autofilter"] = { ref: `A1:N${JOURNAL_TEMPLATE_ROWS.length + 1}` };

  const instructionsSheet = XLSX.utils.aoa_to_sheet(JOURNAL_TEMPLATE_INSTRUCTIONS);
  instructionsSheet["!cols"] = [{ wch: 10 }, { wch: 46 }, { wch: 52 }];

  XLSX.utils.book_append_sheet(workbook, journalSheet, "Journal Import");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
  return workbook;
}

export function downloadJournalImportTemplate(format = "xlsx") {
  const normalizedFormat = String(format || "xlsx").toLowerCase();
  const workbook = buildJournalTemplateWorkbook();
  const journalSheet = workbook.Sheets["Journal Import"];

  if (normalizedFormat === "csv") {
    const csv = XLSX.utils.sheet_to_csv(journalSheet, { FS: ",", RS: "\r\n" });
    triggerTemplateDownload(
      `\ufeff${csv}`,
      "smartbooks_journal_import_template.csv",
      "text/csv;charset=utf-8"
    );
    return;
  }

  if (normalizedFormat !== "xlsx") {
    throw new Error("Choose either the Excel or CSV journal template.");
  }

  const workbookBytes = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    compression: true,
  });
  triggerTemplateDownload(
    workbookBytes,
    "smartbooks_journal_import_template.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

