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

const BRAND  = '#00b196';
const BRAND2 = '#009e87';
const BORDER = '#deeee9';
const GRAY   = '#f8fcfb';
const TEXT1  = '#0d1f1b';
const TEXT2  = '#3d5752';
const TEXT3  = '#7aada6';
const NEG    = '#f47c7c';

const CATEGORIES = [
  { key: 'Revenue',        label: 'Revenue',                     color: '#00b196', lightBg: '#ECFDF5', borderColor: '#6EE7B7' },
  { key: 'CostOfServices', label: 'Cost of Services',            color: '#2563eb', lightBg: '#EEF2FF', borderColor: '#BFDBFE' },
  { key: 'Administrative', label: 'Administrative Expenses',     color: '#7c3aed', lightBg: '#F5F3FF', borderColor: '#DDD6FE' },
  { key: 'Selling',        label: 'Selling Expenses',            color: '#d97706', lightBg: '#FFFBEB', borderColor: '#FDE68A' },
  { key: 'OtherIncome',    label: 'Other Income',                color: '#0891b2', lightBg: '#ECFEFF', borderColor: '#A5F3FC' },
  { key: 'Depreciation',   label: 'Depreciation & Amortization', color: '#6b7280', lightBg: '#F9FAFB', borderColor: '#E5E7EB' },
  { key: 'FinanceCost',    label: 'Finance Cost',                color: '#dc2626', lightBg: '#FEF2F2', borderColor: '#FECACA' },
  { key: 'Taxation',       label: 'Income & Other Taxes',        color: '#9333ea', lightBg: '#FAF5FF', borderColor: '#E9D5FF' },
];

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
      <Text style={S.reportTitle}>Profit & Loss</Text>
      <Text style={S.reportMeta}>
        {fmtDate(meta && meta.datefrom)} to {fmtDate(meta && meta.dateto)}
        {'  -  '}Currency: {meta && meta.currency}
      </Text>
    </View>
  </View>
);

const PageFooter = () => (
  <View style={S.pageFooter} fixed>
    <Text style={S.footerLeft}>{'Profit & Loss  -  Generated ' + new Date().toLocaleDateString('en-GB')}</Text>
    <Text style={S.footerRight} render={({ pageNumber, totalPages }) => 'Page ' + pageNumber + ' of ' + totalPages} />
  </View>
);

/* PAT summary card shown at the top of page 1 */
const SummaryCards = ({ summary, currency }) => {
  if (!summary) return null;
  const pat = Number(summary.profit_after_tax || 0);
  const ebitda = Number(summary.ebitda || 0);
  const opProfit = Number(summary.operating_profit || 0);
  const pbt = Number(summary.profit_before_tax || 0);

  const cards = [
    { label: 'EBITDA',              value: ebitda,   color: BRAND,    lightBg: '#ECFDF5', borderColor: '#6EE7B7' },
    { label: 'Operating Profit',    value: opProfit, color: '#2563eb', lightBg: '#EEF2FF', borderColor: '#BFDBFE' },
    { label: 'Profit Before Tax',   value: pbt,      color: '#7c3aed', lightBg: '#F5F3FF', borderColor: '#DDD6FE' },
    { label: 'Profit After Tax',    value: pat,      color: pat < 0 ? NEG : BRAND, lightBg: pat < 0 ? '#FEF2F2' : '#ECFDF5', borderColor: pat < 0 ? '#FECACA' : '#6EE7B7' },
  ];

  return (
    <View style={S.summaryRow}>
      {cards.map((card, i) => (
        <View key={i} style={[S.summaryCard, { backgroundColor: card.lightBg, borderColor: card.borderColor }, i < cards.length - 1 && { marginRight: 7 }]}>
          <Text style={[S.summaryLabel, { color: card.color }]}>{card.label}</Text>
          <Text style={[S.summaryValue, { color: card.value < 0 ? NEG : card.color }]}>{fmt(card.value)}</Text>
          <Text style={[S.summaryCur, { color: card.color }]}>{currency}</Text>
        </View>
      ))}
    </View>
  );
};

/* Category section */
const CategorySection = ({ cfg, group }) => {
  const records = (group && group.records) || [];
  const total   = (group && group.total)   || 0;
  if (records.length === 0) return null;

  return (
    <View style={S.catSection}>
      {/* Header */}
      <View style={[S.catHeader, { backgroundColor: cfg.lightBg, borderLeftColor: cfg.color }]}>
        <View style={S.catHeaderLeft}>
          <View style={[S.catAccent, { backgroundColor: cfg.color }]} />
          <Text style={[S.catName, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={S.catCount}>{records.length} ledger{records.length !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={[S.catTotalVal, { color: Number(total) < 0 ? NEG : cfg.color }]}>{fmt(total)}</Text>
      </View>

      {/* Table header */}
      <View style={[S.tableHeader, { backgroundColor: cfg.color }]}>
        <Text style={[S.th, S.colSn]}>#</Text>
        <Text style={[S.th, S.colNum]}>Ledger No.</Text>
        <Text style={[S.th, S.colName]}>Ledger Name</Text>
        <Text style={[S.th, S.colAmt, { borderRightWidth: 0 }]}>Balance</Text>
      </View>

      {/* Records */}
      {records.map((row, i) => (
        <View key={row.ledger_number || i} style={[S.tableRow, i % 2 === 0 ? S.rowEven : S.rowOdd]} wrap={false}>
          <Text style={[S.td, S.colSn]}>{i + 1}</Text>
          <Text style={[S.td, S.colNum, { color: BRAND, fontFamily: 'Montserrat-Medium' }]}>{row.ledger_number}</Text>
          <Text style={[S.td, S.colName]}>{row.ledger_name}</Text>
          <Text style={[S.td, S.colAmt, { borderRightWidth: 0, fontFamily: 'Montserrat-SemiBold', color: Number(row.balance) < 0 ? NEG : TEXT1 }]}>
            {fmt(row.balance)}
          </Text>
        </View>
      ))}

      {/* Subtotal */}
      <View style={[S.subtotalRow, { borderTopColor: cfg.color }]} wrap={false}>
        <Text style={[S.subTd, S.colSn]} />
        <Text style={[S.subTd, S.colNum]} />
        <Text style={[S.subTd, S.colName, { color: cfg.color }]}>{'Total ' + cfg.label}</Text>
        <Text style={[S.subTd, S.colAmt, { borderRightWidth: 0, color: Number(total) < 0 ? NEG : cfg.color }]}>{fmt(total)}</Text>
      </View>
    </View>
  );
};

/* Milestone row between sections */
const MilestoneRow = ({ label, value, isPAT }) => {
  const isNeg = Number(value || 0) < 0;
  return (
    <View style={[
      S.milestone,
      isNeg && S.milestoneNeg,
      isPAT && S.milestonePAT,
      isPAT && isNeg && S.milestonePATNeg,
    ]} wrap={false}>
      <Text style={[S.milestoneLabel, { color: isNeg ? NEG : BRAND }]}>{label}</Text>
      <Text style={[S.milestoneVal, { color: isNeg ? NEG : TEXT1 }]}>{fmt(value)}</Text>
    </View>
  );
};

const DownloadProfitLoss = ({ data = {}, summary = null, meta = {} }) => (
  <Document title={'Profit & Loss ' + (meta.currency || '')} author="Smartbooks" subject="Profit & Loss Report" creator="Smartbooks Financial System">
    <Page size="A4" orientation="portrait" style={S.page}>
      <PageHeader meta={meta} />
      <View style={S.headerDivider} fixed />

      {/* Summary */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>Financial Summary</Text>
        <SummaryCards summary={summary} currency={meta.currency} />
      </View>

      <View style={S.sectionDivider} />

      <Text style={S.sectionLabel}>Income Statement Detail</Text>

      {CATEGORIES.map((cfg) => {
        const group = data[cfg.key];
        return (
          <React.Fragment key={cfg.key}>
            {group && group.records && group.records.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <CategorySection cfg={cfg} group={group} />
              </View>
            )}
            {cfg.key === 'OtherIncome'  && <MilestoneRow label="EBITDA"            value={summary && summary.ebitda}             />}
            {cfg.key === 'Depreciation' && <MilestoneRow label="Operating Profit"  value={summary && summary.operating_profit}   />}
            {cfg.key === 'FinanceCost'  && <MilestoneRow label="Profit Before Tax" value={summary && summary.profit_before_tax}  />}
            {cfg.key === 'Taxation'     && <MilestoneRow label="Profit After Tax"  value={summary && summary.profit_after_tax} isPAT />}
          </React.Fragment>
        );
      })}

      <PageFooter />
    </Page>
  </Document>
);

export default DownloadProfitLoss;

const S = StyleSheet.create({
  page:           { fontFamily: 'Montserrat-Regular', fontSize: 7.2, paddingTop: 66, paddingBottom: 40, paddingHorizontal: 26, backgroundColor: '#ffffff' },
  pageHeader:     { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 26, paddingTop: 13, paddingBottom: 9, backgroundColor: '#ffffff' },
  pageHeaderRight:{ alignItems: 'flex-end' },
  logo:           { width: 100, height: 'auto', objectFit: 'contain' },
  reportTitle:    { fontFamily: 'Montserrat-Bold', fontSize: 10.8, color: TEXT1, letterSpacing: 0.3 },
  reportMeta:     { fontFamily: 'Montserrat-Light', fontSize: 5.9, color: TEXT3, marginTop: 2 },
  headerDivider:  { position: 'absolute', top: 55, left: 26, right: 26, height: 1.5, backgroundColor: BRAND },
  pageFooter:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 26, paddingVertical: 9, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: '#ffffff' },
  footerLeft:     { fontFamily: 'Montserrat-Light', fontSize: 5.9, color: TEXT3 },
  footerRight:    { fontFamily: 'Montserrat-Medium', fontSize: 5.9, color: TEXT2 },
  section:        { marginBottom: 10 },
  sectionDivider: { height: 1, backgroundColor: BORDER, marginBottom: 10 },
  sectionLabel:   { fontFamily: 'Montserrat-Medium', fontSize: 6.3, color: TEXT3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 },
  summaryRow:     { flexDirection: 'row' },
  summaryCard:    { flex: 1, borderRadius: 4, paddingVertical: 9, paddingHorizontal: 10, borderWidth: 0.5 },
  summaryLabel:   { fontFamily: 'Montserrat-Medium', fontSize: 5.9, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  summaryValue:   { fontFamily: 'Montserrat-Bold', fontSize: 9.9, color: TEXT1, marginBottom: 2 },
  summaryCur:     { fontFamily: 'Montserrat-Medium', fontSize: 5.9 },
  catSection:     { borderWidth: 0.5, borderColor: BORDER, borderRadius: 4, overflow: 'hidden', marginBottom: 0 },
  catHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 10, borderLeftWidth: 3, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  catHeaderLeft:  { flexDirection: 'row', alignItems: 'center' },
  catAccent:      { width: 3, height: 18, borderRadius: 2, marginRight: 7 },
  catName:        { fontFamily: 'Montserrat-Bold', fontSize: 7.7, marginRight: 8 },
  catCount:       { fontFamily: 'Montserrat-Light', fontSize: 5.9, color: TEXT3 },
  catTotalVal:    { fontFamily: 'Montserrat-Bold', fontSize: 9 },
  tableHeader:    { flexDirection: 'row' },
  th:             { fontFamily: 'Montserrat-SemiBold', fontSize: 5.9, color: '#ffffff', paddingVertical: 5, paddingHorizontal: 6, textTransform: 'uppercase', letterSpacing: 0.3, borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.25)' },
  tableRow:       { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  rowEven:        { backgroundColor: '#ffffff' },
  rowOdd:         { backgroundColor: GRAY },
  td:             { fontFamily: 'Montserrat-Light', fontSize: 6.8, color: TEXT2, paddingVertical: 5, paddingHorizontal: 6, borderRightWidth: 0.5, borderRightColor: BORDER },
  subtotalRow:    { flexDirection: 'row', backgroundColor: GRAY, borderTopWidth: 1.5 },
  subTd:          { fontFamily: 'Montserrat-Bold', fontSize: 7.2, color: TEXT1, paddingVertical: 6, paddingHorizontal: 6, borderRightWidth: 0.5, borderRightColor: BORDER },
  milestone:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, paddingHorizontal: 12, backgroundColor: 'rgba(0,177,150,0.05)', borderTopWidth: 1, borderBottomWidth: 1, borderTopColor: 'rgba(0,177,150,0.2)', borderBottomColor: 'rgba(0,177,150,0.2)', borderLeftWidth: 4, borderLeftColor: BRAND, marginVertical: 5 },
  milestoneNeg:   { backgroundColor: 'rgba(244,124,124,0.05)', borderTopColor: 'rgba(244,124,124,0.2)', borderBottomColor: 'rgba(244,124,124,0.2)', borderLeftColor: NEG },
  milestonePAT:   { paddingVertical: 13, borderTopWidth: 2, borderBottomWidth: 2, borderLeftWidth: 6, backgroundColor: 'rgba(0,177,150,0.07)' },
  milestonePATNeg:{ backgroundColor: 'rgba(244,124,124,0.07)', borderTopColor: NEG, borderBottomColor: NEG, borderLeftColor: NEG },
  milestoneLabel: { fontFamily: 'Montserrat-Bold', fontSize: 7.2, textTransform: 'uppercase', letterSpacing: 0.5 },
  milestoneVal:   { fontFamily: 'Montserrat-Bold', fontSize: 9.9 },
  colSn:          { width: 24, textAlign: 'right' },
  colNum:         { width: 68, textAlign: 'left' },
  colName:        { flex: 1, textAlign: 'left' },
  colAmt:         { width: 85, textAlign: 'right' },
});