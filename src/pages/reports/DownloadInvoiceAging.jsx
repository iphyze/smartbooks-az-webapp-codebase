import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import MontserratRegular  from '../../assets/fonts/Montserrat/Montserrat-Regular.ttf';
import MontserratLight    from '../../assets/fonts/Montserrat/Montserrat-Light.ttf';
import MontserratMedium   from '../../assets/fonts/Montserrat/Montserrat-Medium.ttf';
import MontserratBold     from '../../assets/fonts/Montserrat/Montserrat-Bold.ttf';
import MontserratSemiBold from '../../assets/fonts/Montserrat/Montserrat-SemiBold.ttf';
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';

Font.register({ family: 'Montserrat-Regular',  src: MontserratRegular  });
Font.register({ family: 'Montserrat-Light',     src: MontserratLight    });
Font.register({ family: 'Montserrat-Medium',    src: MontserratMedium   });
Font.register({ family: 'Montserrat-Bold',      src: MontserratBold     });
Font.register({ family: 'Montserrat-SemiBold',  src: MontserratSemiBold });

/* ── Colour palette (matches DownloadBalanceSheet exactly) ── */
const BRAND  = '#00b196';
const BRAND2 = '#009e87';
const BORDER = '#deeee9';
const GRAY   = '#f8fcfb';
const TEXT1  = '#0d1f1b';
const TEXT2  = '#3d5752';
const TEXT3  = '#7aada6';

/* Age-band accent colours */
const WATCH   = '#ca8a04';
const CONCERN = '#ea580c';
const OVERDUE = '#f47c7c';

/* ── Helpers ── */
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
  if (num === 0) return '—';
  const abs = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? '(' + abs + ')' : abs;
};

const today = () =>
  new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

/* ─────────────────────────────────────────────
   FIXED PAGE HEADER
───────────────────────────────────────────── */
const PageHeader = ({ currency }) => (
  <View style={S.pageHeader} fixed>
    <Image src={CompanyLogo} style={S.logo} />
    <View style={S.pageHeaderRight}>
      <Text style={S.reportTitle}>Invoice Aging Report</Text>
      <Text style={S.reportMeta}>
        {'Currency: ' + currency + '  ·  As at ' + today()}
      </Text>
    </View>
  </View>
);

/* ─────────────────────────────────────────────
   FIXED PAGE FOOTER
───────────────────────────────────────────── */
const PageFooter = () => (
  <View style={S.pageFooter} fixed>
    <Text style={S.footerLeft}>
      {'Invoice Aging Report  ·  Generated ' + today()}
    </Text>
    <Text
      style={S.footerRight}
      render={({ pageNumber, totalPages }) =>
        'Page ' + pageNumber + ' of ' + totalPages
      }
    />
  </View>
);

/* ─────────────────────────────────────────────
   SUMMARY STRIP  (four buckets + grand total)
───────────────────────────────────────────── */
const SummaryStrip = ({ totals }) => (
  <View style={S.summaryStrip} wrap={false}>
    <View style={[S.summaryCell, S.summaryCellBorder]}>
      <Text style={S.summaryCellLabel}>0 – 30 Days</Text>
      <Text style={[S.summaryCellValue, { color: BRAND }]}>
        {fmtTotal(totals.total_bucket_0_30)}
      </Text>
      <Text style={[S.summaryCellPill, { color: BRAND }]}>Current</Text>
    </View>
    <View style={[S.summaryCell, S.summaryCellBorder]}>
      <Text style={S.summaryCellLabel}>31 – 60 Days</Text>
      <Text style={[S.summaryCellValue, { color: WATCH }]}>
        {fmtTotal(totals.total_bucket_31_60)}
      </Text>
      <Text style={[S.summaryCellPill, { color: WATCH }]}>Watch</Text>
    </View>
    <View style={[S.summaryCell, S.summaryCellBorder]}>
      <Text style={S.summaryCellLabel}>61 – 90 Days</Text>
      <Text style={[S.summaryCellValue, { color: CONCERN }]}>
        {fmtTotal(totals.total_bucket_61_90)}
      </Text>
      <Text style={[S.summaryCellPill, { color: CONCERN }]}>Concern</Text>
    </View>
    <View style={[S.summaryCell, S.summaryCellBorder]}>
      <Text style={S.summaryCellLabel}>91+ Days</Text>
      <Text style={[S.summaryCellValue, { color: Number(totals.total_bucket_91_plus) > 0 ? OVERDUE : TEXT1 }]}>
        {fmtTotal(totals.total_bucket_91_plus)}
      </Text>
      <Text style={[S.summaryCellPill, { color: OVERDUE }]}>Overdue</Text>
    </View>
    <View style={[S.summaryCell, { backgroundColor: 'rgba(0,177,150,0.06)' }]}>
      <Text style={[S.summaryCellLabel, { color: BRAND }]}>Total Outstanding</Text>
      <Text style={[S.summaryCellValue, { color: TEXT1 }]}>
        {fmtTotal(totals.grand_total_outstanding)}
      </Text>
      <Text style={[S.summaryCellPill, { color: BRAND }]}>All Pending</Text>
    </View>
  </View>
);

/* ─────────────────────────────────────────────
   MAIN DOCUMENT
───────────────────────────────────────────── */
const DownloadInvoiceAging = ({ data = [], totals = null, meta = {} }) => (
  <Document
    title={'Invoice Aging Report - ' + (meta.currency || '')}
    author="Smartbooks"
    subject="Invoice Aging Report"
    creator="Smartbooks Financial System"
  >
    <Page size="A4" orientation="landscape" style={S.page}>
      <PageHeader currency={meta.currency || '—'} />
      <View style={S.headerDivider} fixed />

      {/* Summary strip */}
      {totals && <SummaryStrip totals={totals} />}

      {/* Table */}
      <View style={S.table}>

        {/* Table header */}
        <View style={S.tableHeader} fixed>
          <Text style={[S.th, S.colSn]}>#</Text>
          <Text style={[S.th, S.colName]}>Client Name</Text>
          <Text style={[S.th, S.colAmt, { color: '#ffffff' }]}>0 – 30 Days</Text>
          <Text style={[S.th, S.colAmt, { backgroundColor: 'rgba(0,0,0,0.10)', color: '#ffffff' }]}>31 – 60 Days</Text>
          <Text style={[S.th, S.colAmt, { backgroundColor: 'rgba(0,0,0,0.18)', color: '#ffffff' }]}>61 – 90 Days</Text>
          <Text style={[S.th, S.colAmt, { backgroundColor: 'rgba(0,0,0,0.28)', color: '#ffffff' }]}>91+ Days</Text>
          <Text style={[S.th, S.colAmt, { borderRightWidth: 0 }]}>Total Outstanding</Text>
        </View>

        {/* Data rows */}
        {data.length === 0 ? (
          <View style={S.emptyRow}>
            <Text style={S.emptyText}>
              No pending invoices found for {meta.currency || '—'}.
            </Text>
          </View>
        ) : (
          data.map((row, i) => {
            const b0  = Number(row.bucket_0_30)       || 0;
            const b31 = Number(row.bucket_31_60)      || 0;
            const b61 = Number(row.bucket_61_90)      || 0;
            const b91 = Number(row.bucket_91_plus)    || 0;
            const tot = Number(row.total_outstanding) || 0;

            return (
              <View
                key={row.clients_id || i}
                style={[S.tableRow, i % 2 === 0 ? S.rowEven : S.rowOdd]}
                wrap={false}
              >
                <Text style={[S.td, S.colSn, { color: TEXT3 }]}>{i + 1}</Text>
                <Text style={[S.td, S.colName, { fontFamily: 'Montserrat-SemiBold', color: TEXT1 }]}>
                  {row.clients_name}
                </Text>
                {/* 0-30: teal */}
                <Text style={[S.td, S.colAmt, { color: b0 === 0 ? TEXT3 : BRAND }]}>
                  {fmtCell(b0)}
                </Text>
                {/* 31-60: amber */}
                <Text style={[S.td, S.colAmt, { color: b31 === 0 ? TEXT3 : WATCH }]}>
                  {fmtCell(b31)}
                </Text>
                {/* 61-90: orange */}
                <Text style={[S.td, S.colAmt, { color: b61 === 0 ? TEXT3 : CONCERN }]}>
                  {fmtCell(b61)}
                </Text>
                {/* 91+: red */}
                <Text style={[S.td, S.colAmt, { color: b91 === 0 ? TEXT3 : OVERDUE, fontFamily: b91 > 0 ? 'Montserrat-SemiBold' : 'Montserrat-Light' }]}>
                  {fmtCell(b91)}
                </Text>
                {/* Total */}
                <Text style={[S.td, S.colAmt, { borderRightWidth: 0, fontFamily: 'Montserrat-SemiBold', color: TEXT1 }]}>
                  {fmtTotal(tot)}
                </Text>
              </View>
            );
          })
        )}

        {/* Totals row */}
        {data.length > 0 && totals && (
          <View style={S.totalsRow} wrap={false}>
            <Text style={[S.totalsTd, S.colSn]} />
            <Text style={[S.totalsTd, S.colName, { color: BRAND }]}>Grand Total</Text>
            <Text style={[S.totalsTd, S.colAmt, { color: BRAND }]}>
              {fmtTotal(totals.total_bucket_0_30)}
            </Text>
            <Text style={[S.totalsTd, S.colAmt, { color: WATCH }]}>
              {fmtTotal(totals.total_bucket_31_60)}
            </Text>
            <Text style={[S.totalsTd, S.colAmt, { color: CONCERN }]}>
              {fmtTotal(totals.total_bucket_61_90)}
            </Text>
            <Text style={[S.totalsTd, S.colAmt, { color: Number(totals.total_bucket_91_plus) > 0 ? OVERDUE : TEXT1 }]}>
              {fmtTotal(totals.total_bucket_91_plus)}
            </Text>
            <Text style={[S.totalsTd, S.colAmt, { borderRightWidth: 0, color: TEXT1 }]}>
              {fmtTotal(totals.grand_total_outstanding)}
            </Text>
          </View>
        )}
      </View>

      <PageFooter />
    </Page>
  </Document>
);

export default DownloadInvoiceAging;

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const S = StyleSheet.create({
  /* Page */
  page: {
    fontFamily:       'Montserrat-Regular',
    fontSize:         8,
    paddingTop:       64,
    paddingBottom:    40,
    paddingHorizontal:24,
    backgroundColor:  '#ffffff',
  },

  /* Fixed header */
  pageHeader: {
    position:         'absolute',
    top:              0, left: 0, right: 0,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal:24,
    paddingTop:       13,
    paddingBottom:    9,
    backgroundColor:  '#ffffff',
  },
  pageHeaderRight: { alignItems: 'flex-end' },
  logo:            { width: 100, height: 'auto', objectFit: 'contain' },
  reportTitle:     { fontFamily: 'Montserrat-Bold', fontSize: 12, color: TEXT1, letterSpacing: 0.3 },
  reportMeta:      { fontFamily: 'Montserrat-Light', fontSize: 6.5, color: TEXT3, marginTop: 2 },
  headerDivider:   { position: 'absolute', top: 54, left: 24, right: 24, height: 1.5, backgroundColor: BRAND },

  /* Fixed footer */
  pageFooter: {
    position:         'absolute',
    bottom:           0, left: 0, right: 0,
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingHorizontal:24,
    paddingVertical:  8,
    borderTopWidth:   1,
    borderTopColor:   BORDER,
    backgroundColor:  '#ffffff',
  },
  footerLeft:  { fontFamily: 'Montserrat-Light',  fontSize: 6.5, color: TEXT3 },
  footerRight: { fontFamily: 'Montserrat-Medium', fontSize: 6.5, color: TEXT2 },

  /* Summary strip */
  summaryStrip: {
    flexDirection:   'row',
    borderWidth:      1,
    borderColor:      BORDER,
    borderRadius:     6,
    overflow:         'hidden',
    marginBottom:     12,
    backgroundColor:  '#ffffff',
  },
  summaryCell: {
    flex:             1,
    paddingVertical:  10,
    paddingHorizontal:10,
  },
  summaryCellBorder: {
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  summaryCellLabel: {
    fontFamily:    'Montserrat-Medium',
    fontSize:       6.5,
    color:          TEXT3,
    textTransform:  'uppercase',
    letterSpacing:  0.5,
    marginBottom:   4,
  },
  summaryCellValue: {
    fontFamily:    'Montserrat-Bold',
    fontSize:       11,
    marginBottom:   3,
  },
  summaryCellPill: {
    fontFamily:    'Montserrat-SemiBold',
    fontSize:       6,
    textTransform:  'uppercase',
    letterSpacing:  0.4,
  },

  /* Table */
  table: {
    width:           '100%',
    borderWidth:      1,
    borderColor:      BORDER,
    borderRadius:     4,
    overflow:         'hidden',
  },
  tableHeader: {
    flexDirection:   'row',
    backgroundColor:  BRAND2,
  },
  th: {
    fontFamily:      'Montserrat-SemiBold',
    fontSize:         6.5,
    color:            '#ffffff',
    paddingVertical:  6,
    paddingHorizontal:8,
    textTransform:    'uppercase',
    letterSpacing:    0.3,
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  tableRow: {
    flexDirection:   'row',
    borderBottomWidth:0.5,
    borderBottomColor:BORDER,
  },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd:  { backgroundColor: GRAY },
  td: {
    fontFamily:      'Montserrat-Light',
    fontSize:         7.5,
    color:            TEXT2,
    paddingVertical:  6,
    paddingHorizontal:8,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },

  /* Totals row */
  totalsRow: {
    flexDirection:   'row',
    backgroundColor:  'rgba(0,177,150,0.06)',
    borderTopWidth:   2,
    borderTopColor:   BRAND,
  },
  totalsTd: {
    fontFamily:      'Montserrat-Bold',
    fontSize:         7.5,
    color:            TEXT1,
    paddingVertical:  7,
    paddingHorizontal:8,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },

  /* Empty state */
  emptyRow: {
    paddingVertical:  24,
    paddingHorizontal:12,
    alignItems:       'center',
  },
  emptyText: {
    fontFamily: 'Montserrat-Light',
    fontSize:    8,
    color:       TEXT3,
  },

  /* Column widths */
  colSn:   { width: 24,  textAlign: 'right'  },
  colName: { flex: 1,    textAlign: 'left'   },
  colAmt:  { width: 90,  textAlign: 'right'  },
});