import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, Image,
} from '@react-pdf/renderer';
import MontserratRegular from '../../assets/fonts/Montserrat/Montserrat-Regular.ttf';
import MontserratLight from '../../assets/fonts/Montserrat/Montserrat-Light.ttf';
import MontserratMedium from '../../assets/fonts/Montserrat/Montserrat-Medium.ttf';
import MontserratBold from '../../assets/fonts/Montserrat/Montserrat-Bold.ttf';
import MontserratSemiBold from '../../assets/fonts/Montserrat/Montserrat-SemiBold.ttf';
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';

Font.register({ family: 'Montserrat-Regular', src: MontserratRegular });
Font.register({ family: 'Montserrat-Light', src: MontserratLight });
Font.register({ family: 'Montserrat-Medium', src: MontserratMedium });
Font.register({ family: 'Montserrat-Bold', src: MontserratBold });
Font.register({ family: 'Montserrat-SemiBold', src: MontserratSemiBold });

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const BRAND = '#00b196';
const BRAND2 = '#009e87';
const GRAY = '#f8fcfb';
const BORDER = '#deeee9';
const TEXT1 = '#0d1f1b';
const TEXT2 = '#3d5752';
const TEXT3 = '#7aada6';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const fmt = (n) => {
  const num = Number(n || 0);
  const abs = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `(${abs})` : abs;
};

const fmtDate = (d) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(`${d}T00:00:00`) : d;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isNeg = (n) => Number(n || 0) < 0;

/* ─────────────────────────────────────────────
   FIXED PAGE HEADER  (repeats on every page)
───────────────────────────────────────────── */
const PageHeader = ({ title, meta }) => (
  <View style={styles.pageHeader} fixed>
    <View style={styles.pageHeaderLeft}>
      <Image src={CompanyLogo} style={styles.logo} />
    </View>
    <View style={styles.pageHeaderRight}>
      <Text style={styles.reportTitle}>{title || 'Account Statement'}</Text>
      <Text style={styles.reportMeta}>
        {fmtDate(meta?.datefrom)} — {fmtDate(meta?.dateto)}
        {'   ·   '}
        Ledgers: {meta?.fromledger} to {meta?.toledger}
      </Text>
    </View>
  </View>
);

/* ─────────────────────────────────────────────
   FIXED PAGE FOOTER  (page numbers)
───────────────────────────────────────────── */
const PageFooter = ({ title }) => (
  <View style={styles.pageFooter} fixed>
    <Text style={styles.footerLeft}>
      {title || 'Ledger Statement'}  ·  Generated {new Date().toLocaleDateString('en-GB')}
    </Text>
    <Text
      style={styles.footerRight}
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
    />
  </View>
);

/* ─────────────────────────────────────────────
   REPORT META SECTION  (period + ledger range)
───────────────────────────────────────────── */
const ReportMeta = ({ meta, title }) => (
  <View style={styles.metaCard}>
    <Text style={styles.metaCardTitle}>{title || 'Account Statement'}</Text>
    <View style={styles.metaGrid}>
      {/* Transaction Period */}
      <View style={styles.metaSection}>
        <Text style={styles.metaSectionLabel}>Transaction Period</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>From</Text>
          <Text style={styles.metaVal}>{fmtDate(meta?.datefrom)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>To</Text>
          <Text style={styles.metaVal}>{fmtDate(meta?.dateto)}</Text>
        </View>
      </View>
      {/* Ledger Range */}
      <View style={styles.metaSection}>
        <Text style={styles.metaSectionLabel}>Transaction Ledger(s)</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>From</Text>
          <Text style={styles.metaVal}>{meta?.fromledger}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>To</Text>
          <Text style={styles.metaVal}>{meta?.toledger}</Text>
        </View>
      </View>
    </View>
  </View>
);

/* ─────────────────────────────────────────────
   SINGLE LEDGER BLOCK
───────────────────────────────────────────── */
const LedgerBlock = ({ ledger }) => {
  const { summary, transactions, ledger_number, ledger_name, ledger_currency } = ledger;
  const prev = Number(summary?.previous_balance || 0);
  const closing = Number(summary?.closing_balance || 0);
  const netMov = Number(summary?.period_net_movement || 0);
  const totDr = Number(summary?.period_total_debit || 0);
  const totCr = Number(summary?.period_total_credit || 0);

  return (
    <View style={styles.ledgerBlock}>

      {/* ── Ledger info header strip ── */}
      <View style={styles.ledgerHeader} wrap={false}>
        <View style={styles.ledgerHeaderLeft}>
          <View style={styles.ledgerInfoGroup}>
            <View style={styles.ledgerInfoItem}>
              <Text style={styles.ledgerInfoLabel}>Ledger Number</Text>
              <Text style={styles.ledgerInfoVal}>{ledger_number}</Text>
            </View>
            <View style={styles.ledgerInfoItem}>
              <Text style={styles.ledgerInfoLabel}>Ledger Name</Text>
              <Text style={styles.ledgerInfoVal}>{ledger_name}</Text>
            </View>
            <View style={styles.ledgerInfoItem}>
              <Text style={styles.ledgerInfoLabel}>Currency</Text>
              <View style={styles.currencyPill}>
                <Text style={styles.currencyPillText}>{ledger_currency}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.ledgerHeaderRight}>
          <Text style={styles.ledgerInfoLabel}>Previous Balance</Text>
          <Text style={[styles.prevBalVal, isNeg(prev) && { color: '#f47c7c' }]}>
            {fmt(prev)}
          </Text>
        </View>
      </View>

      {/* ── Transactions table ── */}
      <View style={styles.table}>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colDate]}>Date</Text>
          <Text style={[styles.th, styles.colType]}>Type</Text>
          <Text style={[styles.th, styles.colRef]}>Ref</Text>
          <Text style={[styles.th, styles.colDesc]}>Description</Text>
          <Text style={[styles.th, styles.colAmt]}>Debit</Text>
          <Text style={[styles.th, styles.colAmt]}>Credit</Text>
          <Text style={[styles.th, styles.colAmt, { borderRightWidth: 0 }]}>Balance</Text>
        </View>

        {/* Opening Balance row */}
        <View style={styles.openingRow} wrap={false}>
          <Text style={[styles.td, styles.colDate, styles.openingCell]} />
          <Text style={[styles.td, styles.colType, styles.openingCell]} />
          <Text style={[styles.td, styles.colRef, styles.openingCell]} />
          <Text style={[styles.td, styles.colDesc, styles.openingCell, { fontFamily: 'Montserrat-SemiBold', color: BRAND }]}>
            Opening Balance — brought forward
          </Text>
          <Text style={[styles.td, styles.colAmt, styles.openingCell]}>—</Text>
          <Text style={[styles.td, styles.colAmt, styles.openingCell]}>—</Text>
          <Text style={[
            styles.td, styles.colAmt, styles.openingCell,
            { borderRightWidth: 0, fontFamily: 'Montserrat-SemiBold' },
            isNeg(prev) ? { color: '#dc2626' } : { color: BRAND },
          ]}>
            {fmt(prev)}
          </Text>
        </View>

        {/* Transactions or empty notice */}
        {!transactions || transactions.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No transactions recorded for this period</Text>
          </View>
        ) : (
          transactions.map((t, i) => {
            const isEven = i % 2 === 0;
            const bal = Number(t.balance || 0);
            const dr = Number(t.debit || 0);
            const cr = Number(t.credit || 0);
            return (
              <View
                key={i}
                style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}
                wrap={false}
              >
                <Text style={[styles.td, styles.colDate]}>{t.date}</Text>
                <Text style={[styles.td, styles.colType]}>{t.type}</Text>
                <Text style={[styles.td, styles.colRef, { color: BRAND, fontFamily: 'Montserrat-Medium' }]}>
                  {t.ref}
                </Text>
                <Text style={[styles.td, styles.colDesc]}>{t.description}</Text>
                <Text style={[styles.td, styles.colAmt]}>
                  {dr !== 0 ? fmt(dr) : '—'}
                </Text>
                <Text style={[styles.td, styles.colAmt]}>
                  {cr !== 0 ? fmt(cr) : '—'}
                </Text>
                <Text style={[
                  styles.td, styles.colAmt,
                  { borderRightWidth: 0, fontFamily: 'Montserrat-SemiBold' },
                  isNeg(bal) ? { color: '#f47c7c' } : { color: TEXT1 },
                ]}>
                  {fmt(bal)}
                </Text>
              </View>
            );
          })
        )}

      </View>

      {/* ── Totals footer ── */}
      <View style={styles.totalsRow} wrap={false}>
        {/* Total Period */}
        <View style={styles.totalPeriodBlock}>
          <Text style={styles.totalLabel}>Total Period</Text>
          <View style={styles.totalPeriodVals}>
            <Text style={styles.totalSub}>Dr: {fmt(totDr)}</Text>
            <Text style={styles.totalDivider}> | </Text>
            <Text style={styles.totalSub}>Cr: {fmt(totCr)}</Text>
            <Text style={styles.totalDivider}> | </Text>
            <Text style={[styles.totalNet, isNeg(netMov) && { color: '#f47c7c' }]}>
              Net: {fmt(netMov)}
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <Text style={styles.totalsArrow}>›</Text>

        {/* Closing Balance */}
        <View style={[styles.totalClosingBlock, isNeg(closing) && styles.totalClosingNeg]}>
          <Text style={styles.totalClosingLabel}>Closing Balance</Text>
          <Text style={styles.totalClosingVal}>{fmt(closing)}</Text>
        </View>
      </View>

    </View>
  );
};

/* ─────────────────────────────────────────────
   MAIN DOCUMENT
───────────────────────────────────────────── */
const DownloadLedgerStatement = ({ data = [], title = 'Account Statement', meta = {} }) => (
  <Document
    title={`${title} ${meta?.datefrom || ''}`}
    author="Smartbooks"
    subject="Ledger Statement Report"
    creator="Smartbooks Financial System"
  >
    <Page size="A4" orientation="portrait" style={styles.page}>

      {/* Fixed header every page */}
      <PageHeader title={title} meta={meta} />

      {/* Fixed brand divider every page */}
      <View style={styles.headerDivider} fixed />

      {/* Report meta (period + ledger range) */}
      <View style={styles.section}>
        <ReportMeta meta={meta} title={title} />
      </View>

      {/* Ledger count */}
      <Text style={styles.sectionLabel}>
        {data.length} Ledger Account{data.length !== 1 ? 's' : ''}
      </Text>

      {/* Ledger blocks */}
      {data.length === 0 ? (
        <View style={styles.pageEmptyState}>
          <Text style={styles.pageEmptyText}>
            No ledger entries found for the selected period and range.
          </Text>
        </View>
      ) : (
        data.map((ledger, i) => (
          <View key={`${ledger.ledger_number}-${ledger.ledger_currency}-${i}`} style={styles.ledgerBlockWrap}>
            <LedgerBlock ledger={ledger} />
            {/* Spacer between ledger blocks */}
            {i < data.length - 1 && <View style={styles.ledgerSpacer} />}
          </View>
        ))
      )}

      {/* Fixed footer every page */}
      <PageFooter title={title} />

    </Page>
  </Document>
);

export default DownloadLedgerStatement;

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = StyleSheet.create({

  /* ── Page (landscape for wide tables) ── */
  page: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 6.8,
    paddingTop: 64,
    paddingBottom: 38,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },

  /* ── Fixed header ── */
  pageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },

  pageHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  pageHeaderRight: { alignItems: 'flex-end' },

  logo: { width: 100, height: 'auto', objectFit: 'contain' },

  reportTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10.8,
    color: TEXT1,
    letterSpacing: 0.3,
  },

  reportMeta: {
    fontFamily: 'Montserrat-Light',
    fontSize: 6.3,
    color: TEXT3,
    marginTop: 2,
  },

  headerDivider: {
    position: 'absolute',
    top: 57,
    left: 28,
    right: 28,
    height: 1.5,
    backgroundColor: BRAND,
  },

  /* ── Fixed footer ── */
  pageFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#ffffff',
  },

  footerLeft: {
    fontFamily: 'Montserrat-Light',
    fontSize: 5.9,
    color: TEXT3,
  },

  footerRight: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 5.9,
    color: TEXT2,
  },

  /* ── Sections ── */
  section: { marginBottom: 10 },

  sectionLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 6.3,
    color: TEXT3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  /* ── Meta card ── */
  metaCard: {
    backgroundColor: '#f8fcfb',
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 12,
  },

  metaCardTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 9.9,
    color: TEXT1,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },

  metaGrid: {
    flexDirection: 'row',
    gap: 40,
  },

  metaSection: { flex: 1 },

  metaSectionLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 6.3,
    color: BRAND,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  metaKey: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 6.8,
    color: TEXT2,
    width: 28,
  },

  metaVal: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 6.8,
    color: TEXT1,
  },

  /* ── Ledger block wrapper ── */
  ledgerBlockWrap: {},

  ledgerSpacer: {
    height: 8,
  },

  ledgerBlock: {
  borderWidth: 0.5,
  borderColor: BORDER,
  borderRadius: 4,
  overflow: 'hidden',
  marginBottom: 2,
},

  /* ── Ledger header strip ── */
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f7f5',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  ledgerHeaderLeft: { flex: 1 },
  ledgerHeaderRight: { alignItems: 'flex-end', minWidth: 110 },

  ledgerInfoGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },

  ledgerInfoItem: {
    flexDirection: 'column',
    gap: 2,
  },

  ledgerInfoLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 5.9,
    color: TEXT3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  ledgerInfoVal: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 6.8,
    color: TEXT1,
  },

  currencyPill: {
    backgroundColor: 'rgba(0,177,150,0.1)',
    borderWidth: 0.5,
    borderColor: BRAND,
    borderRadius: 10,
    paddingVertical: 1,
    paddingHorizontal: 6,
    marginTop: 2,
    textAlign: 'center'
  },

  currencyPillText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 6.3,
    color: TEXT2,
    alignSelf: 'center',
    textAlign: 'center'
  },

  prevBalVal: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 8.1,
    color: BRAND,
    marginTop: 1,
  },

  /* ── Table ── */
  table: {
    width: '100%',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND,
  },

  th: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 6,
    color: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    borderRightWidth: 0.5,
    borderRightColor: BRAND2,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },

  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: GRAY },

  td: {
    fontFamily: 'Montserrat-Light',
    fontSize: 6,
    color: TEXT2,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },

  /* ── Opening balance row ── */
  openingRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,177,150,0.05)',
    borderBottomWidth: 0.75,
    borderBottomColor: '#7aada6',
    borderBottomStyle: 'dashed',
  },

  openingCell: {
    fontFamily: 'Montserrat-Light',
    fontSize: 6.8,
    color: TEXT2,
  },

  /* ── Empty state ── */
  emptyRow: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fcfb',
  },

  emptyText: {
    fontFamily: 'Montserrat-Light',
    fontSize: 6.8,
    color: TEXT3,
  },

  /* ── Totals footer ── */
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#f8fcfb',
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },

  totalPeriodBlock: {
    backgroundColor: 'rgba(0,177,150,0.06)',
    borderWidth: 0.5,
    borderColor: '#7aada6',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  totalLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 5.9,
    color: BRAND,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  totalPeriodVals: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  totalSub: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 7.2,
    color: TEXT2,
  },

  totalDivider: {
    fontFamily: 'Montserrat-Light',
    fontSize: 7.2,
    color: BORDER,
    marginHorizontal: 4,
  },

  totalNet: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 7.2,
    color: TEXT1,
  },

  totalsArrow: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12.6,
    color: TEXT3,
    marginHorizontal: 4,
  },

  totalClosingBlock: {
    backgroundColor: BRAND,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'flex-end',
    minWidth: 130,
  },

  totalClosingNeg: {
  backgroundColor: '#f47c7c',
},

  totalClosingLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 5.9,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },

  totalClosingVal: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 9.9,
    color: '#ffffff',
  },

  /* ── Column widths (landscape A4 = ~770pt usable) ── */
  colDate: { width: 48 },
  colType: { width: 42 },
  colRef: { width: 30 },
  colDesc: { flex: 1 },
  colAmt: { width: 68, textAlign: 'right' },

  /* ── Page-level empty ── */
  pageEmptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: BORDER,
    borderStyle: 'dashed',
    borderRadius: 4,
  },

  pageEmptyText: {
    fontFamily: 'Montserrat-Light',
    fontSize: 7.2,
    color: TEXT3,
  },
});