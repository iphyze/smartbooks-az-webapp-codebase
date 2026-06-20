export const toISO = (d) => (!d ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);

export const fmtDate = (s) => (
  s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
);

export const fmtAmt = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const safe = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));
export const amountOf = (line) => Math.abs(Number(line?.outstanding_amount ?? line?.remaining_amount ?? line?.amount ?? 0));
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

// "Prior Period Item" is a special pass-through — it does NOT affect any balance calculation.
// All other four classifications feed the adjusted bank / adjusted ledger formula.
export const CLASSIFICATION_OPTIONS = [
  { id: "We Debit They Don't Credit",  label: "We Debit They Don't Credit",  hint: 'Debited in ledger, not credited in bank. Adds to adjusted bank.' },
  { id: "They Debit We Don't Credit",  label: "They Debit We Don't Credit",  hint: 'Debited in bank, not credited in ledger. Deducts from adjusted ledger.' },
  { id: "We Credit They Don't Debit",  label: "We Credit They Don't Debit",  hint: 'Credited in ledger, not debited in bank. Deducts from adjusted bank.' },
  { id: "They Credit We Don't Debit",  label: "They Credit We Don't Debit",  hint: 'Credited in bank, not debited in ledger. Adds to adjusted ledger.' },
  { id: "Prior Period Item",            label: "Prior Period Item",            hint: 'Reconciling item from a prior period (e.g. reversal, already treated). Has NO effect on the current adjusted balance.' },
];

export const AUTO_LEDGERS = {
  'Bank Charge':         { dr: 'Bank Charges & Commission', cr: 'Bank Ledger' },
  'Bank Interest':       { dr: 'Bank Ledger',               cr: 'Interest Income' },
  'Unreconciled DR':     { dr: 'Ledger',                    cr: 'Bank' },
  'Unreconciled CR':     { dr: 'Bank',                      cr: 'Ledger' },
  'Unposted DR':         { dr: 'Bank',                      cr: 'Ledger' },
  'Unposted CR':         { dr: 'Ledger',                    cr: 'Bank' },
  'Stamp Duty':          { dr: 'Stamp Duty Expense',        cr: 'Bank Ledger' },
  'VAT on Bank Charges': { dr: 'Input VAT / VAT Receivable', cr: 'Bank Ledger' },
  'LC Commission':       { dr: 'LC Commission / Bank Charges', cr: 'Bank Ledger' },
  'LC/Trade Finance':    { dr: 'Trade Finance Charges',     cr: 'Bank Ledger' },
  'WHT Remittance':      { dr: 'WHT Payable',               cr: 'Bank Ledger' },
  'Reversal':            { dr: 'Suspense',                  cr: 'Suspense' },
  Other:                 { dr: 'Suspense',                  cr: 'Bank Ledger' },
};

// Internal direction is stored as cash-flow direction:
//   OUT = money paid out of the bank account
//   IN  = money received into the bank account
// Accounting presentation is side-specific:
//   Bank:   OUT = Debit,  IN = Credit
//   Ledger: OUT = Credit, IN = Debit
// Therefore the correct recon pairs are Bank Debit ↔ Ledger Credit and
// Bank Credit ↔ Ledger Debit. The stored direction remains the same on both
// sides so matching and auto-matching can compare OUT with OUT, IN with IN.
export const MATCH_MODES = {
  BANK_DEBIT_LEDGER_CREDIT: {
    key: 'BANK_DEBIT_LEDGER_CREDIT',
    label: 'Bank Debit ↔ Ledger Credit',
    shortLabel: 'Bank Dr ↔ Ledger Cr',
    bankDir: 'OUT',
    ledgerDir: 'OUT',
    hint: 'Use this when the bank statement is debited and the ledger has the matching credit entry.',
  },
  BANK_CREDIT_LEDGER_DEBIT: {
    key: 'BANK_CREDIT_LEDGER_DEBIT',
    label: 'Bank Credit ↔ Ledger Debit',
    shortLabel: 'Bank Cr ↔ Ledger Dr',
    bankDir: 'IN',
    ledgerDir: 'IN',
    hint: 'Use this when the bank statement is credited and the ledger has the matching debit entry.',
  },
};

export const entrySide = (side, direction) => {
  if (side === 'ledger') return direction === 'OUT' ? 'Cr' : 'Dr';
  return direction === 'OUT' ? 'Dr' : 'Cr';
};

export const entrySideLong = (side, direction) => (entrySide(side, direction) === 'Dr' ? 'Debit' : 'Credit');

export const directionLabel = (side, direction) => {
  const source = side === 'ledger' ? 'Ledger' : 'Bank';
  return `${source} ${entrySideLong(side, direction)}`;
};

export const directionPillClass = (side, direction) => (entrySide(side, direction) === 'Dr' ? 'br-dir-out' : 'br-dir-in');

export const directionTabsFor = (side) => ([
  { key: 'all', label: 'All' },
  ...(side === 'ledger'
    ? [{ key: 'IN', label: 'Dr' }, { key: 'OUT', label: 'Cr' }]
    : [{ key: 'OUT', label: 'Dr' }, { key: 'IN', label: 'Cr' }]),
]);

export const directionSortOptionsFor = (side) => ([
  { key: 'date_asc',  label: 'Date ↑',   icon: 'fa-arrow-up-wide-short' },
  { key: 'date_desc', label: 'Date ↓',   icon: 'fa-arrow-down-wide-short' },
  { key: 'amt_desc',  label: 'Amount ↓', icon: 'fa-arrow-down-9-1' },
  { key: 'amt_asc',   label: 'Amount ↑', icon: 'fa-arrow-up-1-9' },
  ...(side === 'ledger'
    ? [
        { key: 'dir_in',  label: 'Debits first',  icon: 'fa-arrow-down-left' },
        { key: 'dir_out', label: 'Credits first', icon: 'fa-arrow-up-right' },
      ]
    : [
        { key: 'dir_out', label: 'Debits first',  icon: 'fa-arrow-up-right' },
        { key: 'dir_in',  label: 'Credits first', icon: 'fa-arrow-down-left' },
      ]),
  { key: 'desc_az', label: 'A → Z', icon: 'fa-arrow-down-a-z' },
]);

/** Returns true if this classification affects the reconciliation balance. */
export const affectsBalance = (classification) => classification !== 'Prior Period Item';
