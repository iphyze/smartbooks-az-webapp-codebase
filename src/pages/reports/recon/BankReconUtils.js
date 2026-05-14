export const toISO = (d) => (!d ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);

export const fmtDate = (s) => (
  s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
);

export const fmtAmt = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const safe = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));
export const amountOf = (line) => Math.abs(Number(line?.amount || 0));
export const sumSelected = (lines, ids) => lines
  .filter((x) => ids.includes(Number(x.id)))
  .reduce((s, x) => s + amountOf(x), 0);

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit: { opacity: 0, y: -8 },
};

export const CURRENCY_OPTIONS = ['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'ZAR', 'GHS', 'KES']
  .map((c) => ({ id: c, label: c }));

export const CATEGORY_OPTIONS = [
  'Bank Charge', 'Bank Interest', 'Stamp Duty', 'VAT on Bank Charges', 'LC Commission',
  'LC/Trade Finance', 'WHT Remittance', 'Direct Debit', 'Direct Credit', 'Unposted Debit',
  'Unposted Credit', 'Reversal', 'Correction', 'Other',
].map((x) => ({ id: x, label: x }));

export const CLASSIFICATION_OPTIONS = [
  { id: "We Debit They Don't Credit", label: "We Debit They Don't Credit", hint: 'Debited in ledger, not credited in bank. Adds to adjusted bank.' },
  { id: "They Debit We Don't Credit", label: "They Debit We Don't Credit", hint: 'Debited in bank, not credited in ledger. Deducts from adjusted ledger.' },
  { id: "We Credit They Don't Debit", label: "We Credit They Don't Debit", hint: 'Credited in ledger, not debited in bank. Deducts from adjusted bank.' },
  { id: "They Credit We Don't Debit", label: "They Credit We Don't Debit", hint: 'Credited in bank, not debited in ledger. Adds to adjusted ledger.' },
];

export const AUTO_LEDGERS = {
  'Bank Charge': { dr: 'Bank Charges & Commission', cr: 'Bank Ledger' },
  'Bank Interest': { dr: 'Bank Ledger', cr: 'Interest Income' },
  'Unreconciled DR': { dr: 'Ledger', cr: 'Bank' },
  'Unreconciled CR': { dr: 'Bank', cr: 'Ledger' },
  'Unposted DR': { dr: 'Bank', cr: 'Ledger' },
  'Unposted CR': { dr: 'Ledger', cr: 'Bank' },
  'Stamp Duty': { dr: 'Stamp Duty Expense', cr: 'Bank Ledger' },
  'VAT on Bank Charges': { dr: 'Input VAT / VAT Receivable', cr: 'Bank Ledger' },
  'LC Commission': { dr: 'LC Commission / Bank Charges', cr: 'Bank Ledger' },
  'LC/Trade Finance': { dr: 'Trade Finance Charges', cr: 'Bank Ledger' },
  'WHT Remittance': { dr: 'WHT Payable', cr: 'Bank Ledger' },
  Other: { dr: 'Suspense', cr: 'Bank Ledger' },
};

export const MATCH_MODES = {
  BANK_DEBIT_LEDGER_CREDIT: {
    key: 'BANK_DEBIT_LEDGER_CREDIT',
    label: 'Bank Debit ↔ Ledger Credit',
    shortLabel: 'Bank Dr ↔ Ledger Cr',
    bankDir: 'OUT',
    ledgerDir: 'IN',
    hint: 'Use this when the bank statement is debited and the ledger has the matching credit entry.',
  },
  BANK_CREDIT_LEDGER_DEBIT: {
    key: 'BANK_CREDIT_LEDGER_DEBIT',
    label: 'Bank Credit ↔ Ledger Debit',
    shortLabel: 'Bank Cr ↔ Ledger Dr',
    bankDir: 'IN',
    ledgerDir: 'OUT',
    hint: 'Use this when the bank statement is credited and the ledger has the matching debit entry.',
  },
};

export const directionLabel = (side, direction) => {
  if (side === 'bank') return direction === 'OUT' ? 'Bank Debit' : 'Bank Credit';
  return direction === 'OUT' ? 'Ledger Debit' : 'Ledger Credit';
};
