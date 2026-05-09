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
import { fmt, fmtDate } from '../../utils/helper';

Font.register({ family: 'Montserrat-Regular', src: MontserratRegular });
Font.register({ family: 'Montserrat-Light', src: MontserratLight });
Font.register({ family: 'Montserrat-Medium', src: MontserratMedium });
Font.register({ family: 'Montserrat-Bold', src: MontserratBold });
Font.register({ family: 'Montserrat-SemiBold', src: MontserratSemiBold });


/* ─────────────────────────────────────────────
   STYLES MOVED TO TOP TO FIX "Undefined" ERRORS
───────────────────────────────────────────── */
const BRAND = '#00b196';
const GRAY_BG = '#f8fcfb';
const BORDER = '#deeee9';
const TEXT1 = '#0d1f1b';
const TEXT2 = '#3d5752';
const TEXT3 = '#7aada6';

const styles = StyleSheet.create({

  /* ── Page ── */
  page: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 9,
    paddingTop: 72,
    paddingBottom: 44,
    paddingHorizontal: 30,
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
    paddingHorizontal: 30,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },

  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 110,
    height: 'auto',
    objectFit: 'contain',
  },

  pageHeaderRight: {
    alignItems: 'flex-end',
  },

  reportTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
    color: TEXT1,
    letterSpacing: 0.3,
  },

  reportMeta: {
    fontFamily: 'Montserrat-Light',
    fontSize: 7.5,
    color: TEXT3,
    marginTop: 2,
  },

  headerDivider: {
    position: 'absolute',
    top: 60,
    left: 30,
    right: 30,
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
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#ffffff',
  },

  footerLeft: {
    fontFamily: 'Montserrat-Light',
    fontSize: 7,
    color: TEXT3,
  },

  footerRight: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 7,
    color: TEXT2,
  },

  /* ── Sections ── */
  section: {
    marginBottom: 14,
  },

  sectionLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 7.5,
    color: TEXT3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 14,
  },

  /* ── Summary row ── */
  summaryRow: {
    flexDirection: 'row',
    // gap: 8, // Removed gap for better compatibility in some PDF renderers, using flex/width instead
  },

  summaryCard: {
    flex: 1,
    borderRadius: 6, // Now defined before usage
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    marginRight: 8, // Replacing gap
  },

  summaryCardLast: {
    marginRight: 0,
  },

  summaryCardDebit: {
    backgroundColor: '#EEF2FF',
    borderColor: '#BFDBFE',
  },

  summaryCardCredit: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },

  summaryCardBalance: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },

  summaryCardNeg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  summaryCardLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 7,
    color: TEXT3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },

  summaryCardValue: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
    color: TEXT1,
    marginBottom: 2,
  },

  summaryCardCurrency: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 7,
    color: BRAND,
  },

  /* ── Table header (repeats on each page) ── */
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    // borderRadius: 0, // Removed to be safe, 0 is default anyway
  },

  th: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 7.5,
    color: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    borderRightWidth: 0.5,
    borderRightColor: '#009e87',
  },

  /* ── Table rows ── */
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },

  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: GRAY_BG },
  rowZero: { opacity: 0.5 },

  td: {
    fontFamily: 'Montserrat-Light',
    fontSize: 8,
    color: TEXT2,
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },

  /* ── Grand total row ── */
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,177,150,0.06)',
    borderTopWidth: 1.5,
    borderTopColor: BRAND,
    borderBottomWidth: 0,
  },

  grandTd: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 8.5,
    color: TEXT1,
    paddingVertical: 8,
    paddingHorizontal: 7,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },

  /* ── Column widths ── */
  colSn: { width: 30, textAlign: 'right' },
  colNum: { width: 75, textAlign: 'left' },
  colName: { flex: 1, textAlign: 'left' },
  colAmt: { width: 85, textAlign: 'right' },

  /* ── Empty state ── */
  emptyRow: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: BORDER,
    borderStyle: 'dashed',
    borderRadius: 4, // Now defined before usage
  },

  emptyText: {
    fontFamily: 'Montserrat-Light',
    fontSize: 8,
    color: TEXT3,
  },
});

/* ─────────────────────────────────────────────
   SHARED HEADER  (logo + report title + meta)
   Rendered on every page via fixed positioning
───────────────────────────────────────────── */
const PageHeader = ({ meta }) => (
  <View style={styles.pageHeader} fixed>
    <View style={styles.pageHeaderLeft}>
      <Image src={CompanyLogo} style={styles.logo} />
    </View>
    <View style={styles.pageHeaderRight}>
      <Text style={styles.reportTitle}>General Ledger</Text>
      <Text style={styles.reportMeta}>
        {fmtDate(meta?.datefrom)} — {fmtDate(meta?.dateto)}{'  ·  '}Currency: {meta?.currency}
      </Text>
    </View>
  </View>
);

/* ─────────────────────────────────────────────
   SHARED FOOTER  (page numbers + watermark)
───────────────────────────────────────────── */
const PageFooter = ({ meta }) => (
  <View style={styles.pageFooter} fixed>
    <Text style={styles.footerLeft}>
      General Ledger  ·  Generated {new Date().toLocaleDateString('en-GB')}
    </Text>
    <Text
      style={styles.footerRight}
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
    />
  </View>
);

/* ─────────────────────────────────────────────
   TOTALS SUMMARY SECTION (one-time, first page)
───────────────────────────────────────────── */
const TotalsSummary = ({ totals, currency }) => {
  if (!totals) return null;
  const bal = Number(totals.grand_total_balance || 0);

  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryCard, styles.summaryCardDebit]}>
        <Text style={[styles.summaryCardLabel, { color: '#3B82F6' }]}>Total Debit</Text>
        <Text style={[styles.summaryCardValue, { color: '#2563EB' }]}>{fmt(totals.grand_total_debit)}</Text>
        <Text style={[styles.summaryCardCurrency, { color: '#2563EB' }]}>{currency}</Text>
      </View>
      <View style={[styles.summaryCard, styles.summaryCardCredit]}>
        <Text style={[styles.summaryCardLabel, { color: '#F59E0B' }]}>Total Credit</Text>
        <Text style={[styles.summaryCardValue, { color: '#D97706' }]}>{fmt(totals.grand_total_credit)}</Text>
        <Text style={[styles.summaryCardCurrency, { color: '#D97706' }]}>{currency}</Text>
      </View>
      <View style={[styles.summaryCard, bal < 0 ? styles.summaryCardNeg : styles.summaryCardBalance, styles.summaryCardLast]}>
        <Text style={[styles.summaryCardLabel, { color: bal < 0 ? '#EF4444' : '#00b196' }]}>Net Balance</Text>
        <Text style={[styles.summaryCardValue, bal < 0 && { color: '#dc2626' }]}>{fmt(bal)}</Text>
        <Text style={[styles.summaryCardCurrency, { color: '#dc2626' }]}>{currency}</Text>
      </View>
    </View>
  );
};

/* ─────────────────────────────────────────────
   MAIN DOCUMENT
───────────────────────────────────────────── */
const DownloadGeneralLedger = ({ data = [], totals = null, meta = {} }) => {
  const ROWS_PER_CHUNK = 500;

  // Chunk data if very large
  const rows = data.slice(0, ROWS_PER_CHUNK);

  return (
    <Document
      title={`General Ledger ${meta?.currency || ''} ${meta?.datefrom || ''}`}
      author="Smartbooks"
      subject="General Ledger Report"
      creator="Smartbooks Financial System"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>

        {/* ── Fixed header on every page ── */}
        <PageHeader meta={meta} />

        {/* ── Divider line under header ── */}
        <View style={styles.headerDivider} fixed />

        {/* ── Summary cards (first page only) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Summary</Text>
          <TotalsSummary totals={totals} currency={meta?.currency} />
        </View>

        {/* ── Divider ── */}
        <View style={styles.sectionDivider} />

        {/* ── Table ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Ledger Accounts  ({data.length.toLocaleString()} total
            {data.length > ROWS_PER_CHUNK ? `, showing first ${ROWS_PER_CHUNK}` : ''})
          </Text>

          {/* Table header — repeats on each page */}
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.th, styles.colSn]}>#</Text>
            <Text style={[styles.th, styles.colNum]}>Ledger No.</Text>
            <Text style={[styles.th, styles.colName]}>Ledger Name</Text>
            <Text style={[styles.th, styles.colAmt]}>Debit</Text>
            <Text style={[styles.th, styles.colAmt]}>Credit</Text>
            <Text style={[styles.th, styles.colAmt, { borderRightWidth: 0 }]}>Balance</Text>
          </View>

          {/* Data rows */}
          {rows.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No ledger data for this period.</Text>
            </View>
          ) : (
            rows.map((row, i) => {
              const bal = Number(row.balance || 0);
              const isActive = Number(row.total_debit) !== 0 || Number(row.total_credit) !== 0;
              const isEven = i % 2 === 0;

              return (
                <View
                  key={row.ledger_number || i}
                  style={[
                    styles.tableRow,
                    isEven ? styles.rowEven : styles.rowOdd,
                    !isActive && styles.rowZero,
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.td, styles.colSn]}>{i + 1}</Text>
                  <Text style={[styles.td, styles.colNum]}>{row.ledger_number}</Text>
                  <Text style={[styles.td, styles.colName]}>
                    {row.ledger_name}
                  </Text>
                  <Text style={[styles.td, styles.colAmt]}>{fmt(row.total_debit)}</Text>
                  <Text style={[styles.td, styles.colAmt]}>{fmt(row.total_credit)}</Text>
                  <Text
                    style={[
                      styles.td,
                      styles.colAmt,
                      { borderRightWidth: 0, fontFamily: 'Montserrat-SemiBold' },
                      bal < 0 && { color: '#dc2626' },
                      bal > 0 && { color: BRAND },
                    ]}
                  >
                    {fmt(bal)}
                  </Text>
                </View>
              );
            })
          )}

          {/* Grand total footer row */}
          {rows.length > 0 && totals && (
            <View style={styles.grandTotalRow} wrap={false}>
              <Text style={[styles.grandTd, styles.colSn]} />
              <Text style={[styles.grandTd, styles.colNum]} />
              <Text style={[styles.grandTd, styles.colName, { color: BRAND }]}>
                Grand Total
              </Text>
              <Text style={[styles.grandTd, styles.colAmt]}>{fmt(totals.grand_total_debit)}</Text>
              <Text style={[styles.grandTd, styles.colAmt]}>{fmt(totals.grand_total_credit)}</Text>
              <Text
                style={[
                  styles.grandTd,
                  styles.colAmt,
                  { borderRightWidth: 0 },
                  Number(totals.grand_total_balance) < 0 && { color: '#dc2626' },
                  Number(totals.grand_total_balance) > 0 && { color: BRAND },
                ]}
              >
                {fmt(totals.grand_total_balance)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Fixed footer on every page ── */}
        <PageFooter meta={meta} />

      </Page>
    </Document>
  );
};

export default DownloadGeneralLedger;