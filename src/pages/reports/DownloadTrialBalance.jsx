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

const BRAND = '#00b196'; const BORDER = '#deeee9';
const TEXT1 = '#0d1f1b'; const TEXT2 = '#3d5752'; const TEXT3 = '#7aada6';
const NEG = '#f47c7c'; const GRAY = '#f8fcfb';

const CLASS_CONFIG = {
  Asset:     { label: 'Assets',      color: '#2563eb', lightBg: '#EEF2FF', borderColor: '#BFDBFE' },
  Equity:    { label: 'Equity',      color: '#7c3aed', lightBg: '#F5F3FF', borderColor: '#DDD6FE' },
  Revenue:   { label: 'Revenue',     color: '#00b196', lightBg: '#ECFDF5', borderColor: '#6EE7B7' },
  Liability: { label: 'Liabilities', color: '#d97706', lightBg: '#FFFBEB', borderColor: '#FDE68A' },
  Expense:   { label: 'Expenses',    color: '#f47c7c', lightBg: '#FEF2F2', borderColor: '#FECACA' },
};
const CLASS_ORDER = ['Asset', 'Equity', 'Revenue', 'Liability', 'Expense'];

const fmt = (n) => {
  const num = Number(n || 0);
  const abs = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? '(' + abs + ')' : abs;
};

const fmtDate = (d) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PageHeader = ({ meta }) => (
  <View style={S.pageHeader} fixed>
    <Image src={CompanyLogo} style={S.logo} />
    <View style={S.pageHeaderRight}>
      <Text style={S.reportTitle}>Trial Balance</Text>
      <Text style={S.reportMeta}>
        {fmtDate(meta && meta.datefrom)} to {fmtDate(meta && meta.dateto)}
        {'  -  '}Currency: {meta && meta.currency}
        {'  -  '}Zero balances: {meta && meta.zerobal === 'Yes' ? 'Included' : 'Excluded'}
      </Text>
    </View>
  </View>
);

const PageFooter = () => (
  <View style={S.pageFooter} fixed>
    <Text style={S.footerLeft}>{'Trial Balance  -  Generated ' + new Date().toLocaleDateString('en-GB')}</Text>
    <Text style={S.footerRight} render={({ pageNumber, totalPages }) => 'Page ' + pageNumber + ' of ' + totalPages} />
  </View>
);

const TotalsSummary = ({ totals, currency }) => {
  if (!totals) return null;
  const bal = Number(totals.grand_total_balance || 0);
  const isBalanced = Math.abs(bal) < 0.01;
  return (
    <View style={S.summaryRow}>
      <View style={[S.summaryCard, { backgroundColor: '#EEF2FF', borderColor: '#BFDBFE' }]}>
        <Text style={[S.summaryLabel, { color: '#2563eb' }]}>Total Debit</Text>
        <Text style={[S.summaryValue, { color: '#2563eb' }]}>{fmt(totals.grand_total_debit)}</Text>
        <Text style={[S.summaryCur, { color: '#2563eb' }]}>{currency}</Text>
      </View>
      <View style={[S.summaryCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
        <Text style={[S.summaryLabel, { color: '#d97706' }]}>Total Credit</Text>
        <Text style={[S.summaryValue, { color: '#d97706' }]}>{fmt(totals.grand_total_credit)}</Text>
        <Text style={[S.summaryCur, { color: '#d97706' }]}>{currency}</Text>
      </View>
      <View style={[S.summaryCard, S.summaryCardLast,
        isBalanced
          ? { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }
          : { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }
      ]}>
        <Text style={[S.summaryLabel, { color: isBalanced ? BRAND : NEG }]}>
          {isBalanced ? 'Balanced' : 'Difference'}
        </Text>
        <Text style={[S.summaryValue, { color: isBalanced ? BRAND : NEG }]}>
          {isBalanced ? '0.00' : fmt(bal)}
        </Text>
        <Text style={[S.summaryCur, { color: isBalanced ? BRAND : NEG }]}>{currency}</Text>
      </View>
    </View>
  );
};

const ClassSection = ({ className, group }) => {
  const cfg = CLASS_CONFIG[className] || { label: className, color: TEXT3, lightBg: GRAY, borderColor: BORDER };
  const records = (group && group.records) || [];
  if (records.length === 0) return null;
  const subDr = records.reduce((s, r) => s + (parseFloat(r.total_debit) || 0), 0);
  const subCr = records.reduce((s, r) => s + (parseFloat(r.total_credit) || 0), 0);

  return (
    <View style={S.classSection}>
      {/* Class header */}
      <View style={[S.classHeader, { backgroundColor: cfg.lightBg, borderLeftColor: cfg.color }]}>
        <View style={S.classHeaderLeft}>
          <View style={[S.classAccent, { backgroundColor: cfg.color }]} />
          <View>
            <Text style={[S.className, { color: cfg.color }]}>{cfg.label}</Text>
            <Text style={S.classCount}>{records.length} ledger{records.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <View style={S.classSubtotals}>
          <View style={[S.classSubBox, { borderColor: cfg.borderColor, backgroundColor: cfg.lightBg }]}>
            <Text style={[S.classSubLabel, { color: '#2563eb' }]}>Debit</Text>
            <Text style={[S.classSubVal, { color: '#2563eb' }]}>{fmt(subDr)}</Text>
          </View>
          <View style={[S.classSubBox, S.classSubBoxLast, { borderColor: cfg.borderColor, backgroundColor: cfg.lightBg }]}>
            <Text style={[S.classSubLabel, { color: '#d97706' }]}>Credit</Text>
            <Text style={[S.classSubVal, { color: '#d97706' }]}>{fmt(subCr)}</Text>
          </View>
        </View>
      </View>

      {/* Table header */}
      <View style={[S.tableHeader, { backgroundColor: cfg.color }]}>
        <Text style={[S.th, S.colSn]}>#</Text>
        <Text style={[S.th, S.colNum]}>Ledger No.</Text>
        <Text style={[S.th, S.colName]}>Ledger Name</Text>
        <Text style={[S.th, S.colAmt]}>Debit</Text>
        <Text style={[S.th, S.colAmt, { borderRightWidth: 0 }]}>Credit</Text>
      </View>

      {/* Records */}
      {records.map((row, i) => {
        const isActive = Number(row.total_debit) !== 0 || Number(row.total_credit) !== 0;
        return (
          <View key={row.ledger_number || i} style={[S.tableRow, i % 2 === 0 ? S.rowEven : S.rowOdd, !isActive && S.rowZero]} wrap={false}>
            <Text style={[S.td, S.colSn]}>{i + 1}</Text>
            <Text style={[S.td, S.colNum, { color: BRAND, fontFamily: 'Montserrat-Medium' }]}>{row.ledger_number}</Text>
            <Text style={[S.td, S.colName]}>{row.ledger_name}</Text>
            <Text style={[S.td, S.colAmt]}>{fmt(row.total_debit)}</Text>
            <Text style={[S.td, S.colAmt, { borderRightWidth: 0 }]}>{fmt(row.total_credit)}</Text>
          </View>
        );
      })}

      {/* Subtotal row */}
      <View style={[S.subtotalRow, { borderTopColor: cfg.color }]} wrap={false}>
        <Text style={[S.subTd, S.colSn]} />
        <Text style={[S.subTd, S.colNum]} />
        <Text style={[S.subTd, S.colName, { color: cfg.color }]}>{'Total ' + cfg.label}</Text>
        <Text style={[S.subTd, S.colAmt, { color: '#2563eb' }]}>{fmt(subDr)}</Text>
        <Text style={[S.subTd, S.colAmt, { borderRightWidth: 0, color: '#d97706' }]}>{fmt(subCr)}</Text>
      </View>
    </View>
  );
};

const DownloadTrialBalance = ({ data = {}, totals = null, meta = {} }) => (
  <Document title={'Trial Balance ' + (meta.currency || '')} author="Smartbooks" subject="Trial Balance Report" creator="Smartbooks Financial System">
    <Page size="A4" orientation="portrait" style={S.page}>
      <PageHeader meta={meta} />
      <View style={S.headerDivider} fixed />

      <View style={S.section}>
        <Text style={S.sectionLabel}>Summary</Text>
        <TotalsSummary totals={totals} currency={meta.currency} />
      </View>

      <View style={S.sectionDivider} />

      <Text style={S.sectionLabel}>Ledger Accounts by Class</Text>

      {CLASS_ORDER.map((cls) =>
        data[cls] ? (
          <View key={cls} style={{ marginBottom: 10 }}>
            <ClassSection className={cls} group={data[cls]} />
          </View>
        ) : null
      )}

      {/* Grand total */}
      {totals && (
        <View style={S.grandTotalRow} wrap={false}>
          <Text style={[S.grandTd, S.colSn]} />
          <Text style={[S.grandTd, S.colNum]} />
          <Text style={[S.grandTd, S.colName, { color: BRAND }]}>Grand Total</Text>
          <Text style={[S.grandTd, S.colAmt, { color: '#2563eb' }]}>{fmt(totals.grand_total_debit)}</Text>
          <Text style={[S.grandTd, S.colAmt, { borderRightWidth: 0, color: '#d97706' }]}>{fmt(totals.grand_total_credit)}</Text>
        </View>
      )}

      <PageFooter />
    </Page>
  </Document>
);

export default DownloadTrialBalance;

const S = StyleSheet.create({
  page:           { fontFamily: 'Montserrat-Regular', fontSize: 8.5, paddingTop: 68, paddingBottom: 42, paddingHorizontal: 28, backgroundColor: '#ffffff' },
  pageHeader:     { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingTop: 14, paddingBottom: 10, backgroundColor: '#ffffff' },
  pageHeaderRight:{ alignItems: 'flex-end' },
  logo:           { width: 100, height: 'auto', objectFit: 'contain' },
  reportTitle:    { fontFamily: 'Montserrat-Bold', fontSize: 12, color: TEXT1, letterSpacing: 0.3 },
  reportMeta:     { fontFamily: 'Montserrat-Light', fontSize: 6.5, color: TEXT3, marginTop: 2 },
  headerDivider:  { position: 'absolute', top: 57, left: 28, right: 28, height: 1.5, backgroundColor: BRAND },
  pageFooter:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 9, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: '#ffffff' },
  footerLeft:     { fontFamily: 'Montserrat-Light', fontSize: 6.5, color: TEXT3 },
  footerRight:    { fontFamily: 'Montserrat-Medium', fontSize: 6.5, color: TEXT2 },
  section:        { marginBottom: 10 },
  sectionDivider: { height: 1, backgroundColor: BORDER, marginBottom: 12 },
  sectionLabel:   { fontFamily: 'Montserrat-Medium', fontSize: 7, color: TEXT3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  summaryRow:     { flexDirection: 'row' },
  summaryCard:    { flex: 1, borderRadius: 4, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 0.5, marginRight: 8 },
  summaryCardLast:{ marginRight: 0 },
  summaryLabel:   { fontFamily: 'Montserrat-Medium', fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  summaryValue:   { fontFamily: 'Montserrat-Bold', fontSize: 13, color: TEXT1, marginBottom: 2 },
  summaryCur:     { fontFamily: 'Montserrat-Medium', fontSize: 7 },
  classSection:   { borderWidth: 0.5, borderColor: BORDER, borderRadius: 4, overflow: 'hidden' },
  classHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, borderLeftWidth: 3, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  classHeaderLeft:{ flexDirection: 'row', alignItems: 'center' },
  classAccent:    { width: 3, height: 22, borderRadius: 2, marginRight: 8 },
  className:      { fontFamily: 'Montserrat-Bold', fontSize: 9 },
  classCount:     { fontFamily: 'Montserrat-Light', fontSize: 7, color: TEXT3, marginTop: 1 },
  classSubtotals: { flexDirection: 'row' },
  classSubBox:    { paddingVertical: 5, paddingHorizontal: 10, borderWidth: 0.5, borderRadius: 4, marginRight: 6, alignItems: 'flex-end' },
  classSubBoxLast:{ marginRight: 0 },
  classSubLabel:  { fontFamily: 'Montserrat-Medium', fontSize: 6.5, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  classSubVal:    { fontFamily: 'Montserrat-Bold', fontSize: 9 },
  tableHeader:    { flexDirection: 'row' },
  th:             { fontFamily: 'Montserrat-SemiBold', fontSize: 7, color: '#ffffff', paddingVertical: 6, paddingHorizontal: 7, textTransform: 'uppercase', letterSpacing: 0.3, borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.25)' },
  tableRow:       { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  rowEven:        { backgroundColor: '#ffffff' },
  rowOdd:         { backgroundColor: GRAY },
  rowZero:        { opacity: 0.45 },
  td:             { fontFamily: 'Montserrat-Light', fontSize: 8, color: TEXT2, paddingVertical: 5, paddingHorizontal: 7, borderRightWidth: 0.5, borderRightColor: BORDER },
  subtotalRow:    { flexDirection: 'row', backgroundColor: GRAY, borderTopWidth: 1.5 },
  subTd:          { fontFamily: 'Montserrat-Bold', fontSize: 8, color: TEXT1, paddingVertical: 7, paddingHorizontal: 7, borderRightWidth: 0.5, borderRightColor: BORDER },
  grandTotalRow:  { flexDirection: 'row', backgroundColor: 'rgba(0,177,150,0.06)', borderTopWidth: 2, borderTopColor: BRAND, marginTop: 6 },
  grandTd:        { fontFamily: 'Montserrat-Bold', fontSize: 9, color: TEXT1, paddingVertical: 9, paddingHorizontal: 7, borderRightWidth: 0.5, borderRightColor: BORDER },
  colSn:          { width: 28, textAlign: 'right' },
  colNum:         { width: 72, textAlign: 'left' },
  colName:        { flex: 1, textAlign: 'left' },
  colAmt:         { width: 90, textAlign: 'right' },
});