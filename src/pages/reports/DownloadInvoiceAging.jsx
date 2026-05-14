import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
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

const BRAND = '#00b196';
const BRAND2 = '#009e87';
const BORDER = '#deeee9';
const GRAY = '#f8fcfb';
const TEXT1 = '#0d1f1b';
const TEXT2 = '#3d5752';
const TEXT3 = '#7aada6';
const WATCH = '#ca8a04';
const CONCERN = '#ea580c';
const OVERDUE = '#f47c7c';

const fmtTotal = (n) => {
  const num = Number(n || 0);
  const abs = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? '(' + abs + ')' : abs;
};

const fmtCell = (n) => {
  const num = Number(n || 0);
  if (num === 0) return '-';
  return fmtTotal(num);
};

const pct = (n) => `${Number(n || 0).toFixed(2)}%`;
const count = (n) => Number(n || 0).toLocaleString('en-US');

const today = () =>
  new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const PageHeader = ({ currency, meta }) => (
  <View style={S.pageHeader} fixed>
    <Image src={CompanyLogo} style={S.logo} />
    <View style={S.pageHeaderRight}>
      <Text style={S.reportTitle}>Invoice Aging Report</Text>
      <Text style={S.reportMeta}>{'Currency: ' + currency + '  |  As at ' + (meta?.as_of_date || today())}</Text>
      <Text style={S.reportMetaSmall}>Open receivables only: Pending, Partially Paid and Overdue</Text>
    </View>
  </View>
);

const PageFooter = () => (
  <View style={S.pageFooter} fixed>
    <Text style={S.footerLeft}>{'Smartbooks Invoice Aging Report  |  Generated ' + today()}</Text>
    <Text style={S.footerRight} render={({ pageNumber, totalPages }) => 'Page ' + pageNumber + ' of ' + totalPages} />
  </View>
);

const ExecutiveSummary = ({ totals }) => (
  <View style={S.kpiGrid} wrap={false}>
    <View style={[S.kpiCard, S.kpiPrimary]}>
      <Text style={S.kpiLabel}>Total Receivables</Text>
      <Text style={S.kpiValue}>{fmtTotal(totals.grand_total_outstanding)}</Text>
      <Text style={S.kpiNote}>Open customer balances</Text>
    </View>
    <View style={S.kpiCard}>
      <Text style={S.kpiLabel}>Clients Owing</Text>
      <Text style={S.kpiValue}>{count(totals.client_count)}</Text>
      <Text style={S.kpiNote}>Grouped by client</Text>
    </View>
    <View style={S.kpiCard}>
      <Text style={S.kpiLabel}>Open Invoices</Text>
      <Text style={S.kpiValue}>{count(totals.invoice_count)}</Text>
      <Text style={S.kpiNote}>Pending + partial + overdue</Text>
    </View>
    <View style={S.kpiCard}>
      <Text style={S.kpiLabel}>Overdue Exposure</Text>
      <Text style={[S.kpiValue, { color: CONCERN }]}>{pct(totals.overdue_exposure_percent)}</Text>
      <Text style={S.kpiNote}>31+ days outstanding</Text>
    </View>
    <View style={S.kpiCard}>
      <Text style={S.kpiLabel}>High Risk</Text>
      <Text style={[S.kpiValue, { color: OVERDUE }]}>{pct(totals.high_risk_exposure_percent)}</Text>
      <Text style={S.kpiNote}>91+ days outstanding</Text>
    </View>
  </View>
);

const SummaryStrip = ({ totals }) => (
  <View style={S.summaryStrip} wrap={false}>
    <View style={[S.summaryCell, S.summaryCellBorder]}>
      <Text style={S.summaryCellLabel}>0-30 Days</Text>
      <Text style={[S.summaryCellValue, { color: BRAND }]}>{fmtTotal(totals.total_bucket_0_30)}</Text>
      <Text style={[S.summaryCellPill, { color: BRAND }]}>Current</Text>
    </View>
    <View style={[S.summaryCell, S.summaryCellBorder]}>
      <Text style={S.summaryCellLabel}>31-60 Days</Text>
      <Text style={[S.summaryCellValue, { color: WATCH }]}>{fmtTotal(totals.total_bucket_31_60)}</Text>
      <Text style={[S.summaryCellPill, { color: WATCH }]}>Watch</Text>
    </View>
    <View style={[S.summaryCell, S.summaryCellBorder]}>
      <Text style={S.summaryCellLabel}>61-90 Days</Text>
      <Text style={[S.summaryCellValue, { color: CONCERN }]}>{fmtTotal(totals.total_bucket_61_90)}</Text>
      <Text style={[S.summaryCellPill, { color: CONCERN }]}>Concern</Text>
    </View>
    <View style={[S.summaryCell, S.summaryCellBorder]}>
      <Text style={S.summaryCellLabel}>91+ Days</Text>
      <Text style={[S.summaryCellValue, { color: Number(totals.total_bucket_91_plus) > 0 ? OVERDUE : TEXT1 }]}>{fmtTotal(totals.total_bucket_91_plus)}</Text>
      <Text style={[S.summaryCellPill, { color: OVERDUE }]}>High Risk</Text>
    </View>
    <View style={[S.summaryCell, { backgroundColor: 'rgba(0,177,150,0.06)' }]}>
      <Text style={[S.summaryCellLabel, { color: BRAND }]}>Total Outstanding</Text>
      <Text style={[S.summaryCellValue, { color: TEXT1 }]}>{fmtTotal(totals.grand_total_outstanding)}</Text>
      <Text style={[S.summaryCellPill, { color: BRAND }]}>Receivables</Text>
    </View>
  </View>
);

const DownloadInvoiceAging = ({ data = [], totals = null, meta = {} }) => {
  const safeMeta = meta || {};

  return(
  <Document
    title={'Invoice Aging Report - ' + (safeMeta.currency || '')}
    author="Smartbooks"
    subject="Invoice Aging Report"
    creator="Smartbooks Financial System"
  >
    <Page size="A4" orientation="landscape" style={S.page}>
      <PageHeader currency={safeMeta.currency || '-'} meta={meta} />
      <View style={S.headerDivider} fixed />

      {totals && <ExecutiveSummary totals={totals} />}
      {totals && <SummaryStrip totals={totals} />}

      <View style={S.noteBox} wrap={false}>
        <Text style={S.noteText}>
          Aging basis: {meta.aging_basis || 'due_date / invoice_date fallback'}. Excludes Paid and Cancelled invoices. Values are based on outstanding balances.
        </Text>
      </View>

      <View style={S.table}>
        <View style={S.tableHeader} fixed>
          <Text style={[S.th, S.colSn]}>#</Text>
          <Text style={[S.th, S.colName]}>Client Name</Text>
          <Text style={[S.th, S.colAmt]}>0-30</Text>
          <Text style={[S.th, S.colAmt]}>31-60</Text>
          <Text style={[S.th, S.colAmt]}>61-90</Text>
          <Text style={[S.th, S.colAmt]}>91+</Text>
          <Text style={[S.th, S.colAmt]}>Total</Text>
          <Text style={[S.th, S.colCount]}>Invoices</Text>
          <Text style={[S.th, S.colCount, { borderRightWidth: 0 }]}>Oldest</Text>
        </View>

        {data.length === 0 ? (
          <View style={S.emptyRow}>
            <Text style={S.emptyText}>No open receivables found for {safeMeta.currency || '-'}.</Text>
          </View>
        ) : (
          data.map((row, i) => {
            const b0 = Number(row.bucket_0_30) || 0;
            const b31 = Number(row.bucket_31_60) || 0;
            const b61 = Number(row.bucket_61_90) || 0;
            const b91 = Number(row.bucket_91_plus) || 0;
            const tot = Number(row.total_outstanding) || 0;
            const oldest = Number(row.oldest_age_days) || 0;

            return (
              <View key={row.clients_id || i} style={[S.tableRow, i % 2 === 0 ? S.rowEven : S.rowOdd]} wrap={false}>
                <Text style={[S.td, S.colSn, { color: TEXT3 }]}>{i + 1}</Text>
                <Text style={[S.td, S.colName, { fontFamily: 'Montserrat-SemiBold', color: TEXT1 }]}>{row.clients_name}</Text>
                <Text style={[S.td, S.colAmt, { color: b0 === 0 ? TEXT3 : BRAND }]}>{fmtCell(b0)}</Text>
                <Text style={[S.td, S.colAmt, { color: b31 === 0 ? TEXT3 : WATCH }]}>{fmtCell(b31)}</Text>
                <Text style={[S.td, S.colAmt, { color: b61 === 0 ? TEXT3 : CONCERN }]}>{fmtCell(b61)}</Text>
                <Text style={[S.td, S.colAmt, { color: b91 === 0 ? TEXT3 : OVERDUE, fontFamily: b91 > 0 ? 'Montserrat-SemiBold' : 'Montserrat-Light' }]}>{fmtCell(b91)}</Text>
                <Text style={[S.td, S.colAmt, { fontFamily: 'Montserrat-SemiBold', color: TEXT1 }]}>{fmtTotal(tot)}</Text>
                <Text style={[S.td, S.colCount]}>{count(row.invoice_count)}</Text>
                <Text style={[S.td, S.colCount, { borderRightWidth: 0, color: oldest > 90 ? OVERDUE : TEXT2 }]}>{oldest}d</Text>
              </View>
            );
          })
        )}

        {data.length > 0 && totals && (
          <View style={S.totalsRow} wrap={false}>
            <Text style={[S.totalsTd, S.colSn]} />
            <Text style={[S.totalsTd, S.colName, { color: BRAND }]}>Grand Total</Text>
            <Text style={[S.totalsTd, S.colAmt, { color: BRAND }]}>{fmtTotal(totals.total_bucket_0_30)}</Text>
            <Text style={[S.totalsTd, S.colAmt, { color: WATCH }]}>{fmtTotal(totals.total_bucket_31_60)}</Text>
            <Text style={[S.totalsTd, S.colAmt, { color: CONCERN }]}>{fmtTotal(totals.total_bucket_61_90)}</Text>
            <Text style={[S.totalsTd, S.colAmt, { color: Number(totals.total_bucket_91_plus) > 0 ? OVERDUE : TEXT1 }]}>{fmtTotal(totals.total_bucket_91_plus)}</Text>
            <Text style={[S.totalsTd, S.colAmt, { color: TEXT1 }]}>{fmtTotal(totals.grand_total_outstanding)}</Text>
            <Text style={[S.totalsTd, S.colCount]}>{count(totals.invoice_count)}</Text>
            <Text style={[S.totalsTd, S.colCount, { borderRightWidth: 0 }]}>-</Text>
          </View>
        )}
      </View>

      <PageFooter />
    </Page>
  </Document>
  )
};

export default DownloadInvoiceAging;

const S = StyleSheet.create({
  page: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 8,
    paddingTop: 68,
    paddingBottom: 40,
    paddingHorizontal: 22,
    backgroundColor: '#ffffff',
  },
  pageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  pageHeaderRight: { alignItems: 'flex-end' },
  logo: { width: 104, height: 'auto', objectFit: 'contain' },
  reportTitle: { fontFamily: 'Montserrat-Bold', fontSize: 13, color: TEXT1, letterSpacing: 0.3 },
  reportMeta: { fontFamily: 'Montserrat-Medium', fontSize: 6.8, color: TEXT2, marginTop: 2 },
  reportMetaSmall: { fontFamily: 'Montserrat-Light', fontSize: 6.4, color: TEXT3, marginTop: 2 },
  headerDivider: { position: 'absolute', top: 58, left: 22, right: 22, height: 1.5, backgroundColor: BRAND },
  pageFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#ffffff',
  },
  footerLeft: { fontFamily: 'Montserrat-Light', fontSize: 6.5, color: TEXT3 },
  footerRight: { fontFamily: 'Montserrat-Medium', fontSize: 6.5, color: TEXT2 },
  kpiGrid: { flexDirection: 'row', gap: 7, marginBottom: 9 },
  kpiCard: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 8, backgroundColor: '#ffffff' },
  kpiPrimary: { backgroundColor: 'rgba(0,177,150,0.05)', borderColor: 'rgba(0,177,150,0.25)' },
  kpiLabel: { fontFamily: 'Montserrat-SemiBold', fontSize: 5.8, color: TEXT3, textTransform: 'uppercase', letterSpacing: 0.35, marginBottom: 3 },
  kpiValue: { fontFamily: 'Montserrat-Bold', fontSize: 10.5, color: TEXT1, marginBottom: 2 },
  kpiNote: { fontFamily: 'Montserrat-Light', fontSize: 5.8, color: TEXT3 },
  summaryStrip: { flexDirection: 'row', borderWidth: 1, borderColor: BORDER, borderRadius: 6, overflow: 'hidden', marginBottom: 8, backgroundColor: '#ffffff' },
  summaryCell: { flex: 1, paddingVertical: 8, paddingHorizontal: 8 },
  summaryCellBorder: { borderRightWidth: 1, borderRightColor: BORDER },
  summaryCellLabel: { fontFamily: 'Montserrat-Medium', fontSize: 6, color: TEXT3, textTransform: 'uppercase', letterSpacing: 0.35, marginBottom: 3 },
  summaryCellValue: { fontFamily: 'Montserrat-Bold', fontSize: 10, marginBottom: 2 },
  summaryCellPill: { fontFamily: 'Montserrat-SemiBold', fontSize: 5.8, textTransform: 'uppercase', letterSpacing: 0.35 },
  noteBox: { borderWidth: 1, borderColor: BORDER, borderRadius: 5, backgroundColor: GRAY, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 8 },
  noteText: { fontFamily: 'Montserrat-Light', color: TEXT2, fontSize: 6.4, lineHeight: 1.35 },
  table: { width: '100%', borderWidth: 1, borderColor: BORDER, borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: BRAND2 },
  th: { fontFamily: 'Montserrat-SemiBold', fontSize: 6.2, color: '#ffffff', paddingVertical: 6, paddingHorizontal: 6, textTransform: 'uppercase', letterSpacing: 0.25, borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.22)' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: GRAY },
  td: { fontFamily: 'Montserrat-Light', fontSize: 7, color: TEXT2, paddingVertical: 5.5, paddingHorizontal: 6, borderRightWidth: 0.5, borderRightColor: BORDER },
  totalsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,177,150,0.06)', borderTopWidth: 2, borderTopColor: BRAND },
  totalsTd: { fontFamily: 'Montserrat-Bold', fontSize: 7, color: TEXT1, paddingVertical: 6.5, paddingHorizontal: 6, borderRightWidth: 0.5, borderRightColor: BORDER },
  emptyRow: { paddingVertical: 24, paddingHorizontal: 12, alignItems: 'center' },
  emptyText: { fontFamily: 'Montserrat-Light', fontSize: 8, color: TEXT3 },
  colSn: { width: 22, textAlign: 'right' },
  colName: { flex: 1, textAlign: 'left' },
  colAmt: { width: 77, textAlign: 'right' },
  colCount: { width: 48, textAlign: 'right' },
});
