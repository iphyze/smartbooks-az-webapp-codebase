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
const BRAND_LIGHT = 'rgba(0,177,150,0.08)';
const BORDER = '#deeee9';
const GRAY   = '#f8fcfb';
const TEXT1  = '#0d1f1b';
const TEXT2  = '#3d5752';
const TEXT3  = '#7aada6';
const NEG    = '#f47c7c';

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

/* Fixed header */
const PageHeader = ({ meta }) => (
  <View style={S.pageHeader} fixed>
    <Image src={CompanyLogo} style={S.logo} />
    <View style={S.pageHeaderRight}>
      <Text style={S.reportTitle}>Balance Sheet</Text>
      <Text style={S.reportMeta}>
        {'FY ' + (meta && meta.period) + '  -  '}
        {fmtDate(meta && meta.datefrom)} to {fmtDate(meta && meta.dateto)}
        {'  -  Currency: ' + (meta && meta.currency)}
      </Text>
    </View>
  </View>
);

/* Fixed footer */
const PageFooter = () => (
  <View style={S.pageFooter} fixed>
    <Text style={S.footerLeft}>{'Balance Sheet  -  Generated ' + new Date().toLocaleDateString('en-GB')}</Text>
    <Text style={S.footerRight} render={({ pageNumber, totalPages }) => 'Page ' + pageNumber + ' of ' + totalPages} />
  </View>
);

/* Section heading bar (Assets / Equity / Liabilities) */
const SectionHeading = ({ label }) => (
  <View style={S.sectionHeading} wrap={false}>
    <Text style={S.sectionHeadingText}>{label}</Text>
  </View>
);

/* Subsection heading */
const SubHeading = ({ label }) => (
  <View style={S.subHeading} wrap={false}>
    <Text style={S.subHeadingText}>{label}</Text>
  </View>
);

/* Summary row (subtotals / grand totals) */
const SummaryRow = ({ label, value, isGrand }) => (
  <View style={[S.summaryRow, isGrand && S.summaryRowGrand]} wrap={false}>
    <Text style={[S.summaryLabel, isGrand && S.summaryLabelGrand]}>{label}</Text>
    <Text style={[S.summaryVal, isGrand && S.summaryValGrand, Number(value) < 0 && { color: NEG }]}>{fmt(value)}</Text>
  </View>
);

/* Section divider */
const Divider = () => <View style={S.divider} />;

/* Category block */
const CategoryBlock = ({ title, group, isLess }) => {
  if (!group || !group.records || group.records.length === 0) return null;
  return (
    <View style={S.catBlock}>
      <View style={[S.catTitle, isLess && S.catTitleLess]} wrap={false}>
        <Text style={[S.catTitleText, isLess && S.catTitleLessText]}>{title}</Text>
      </View>
      {/* Table header */}
      <View style={S.tableHeader} fixed={false}>
        <Text style={[S.th, S.colSn]}>#</Text>
        <Text style={[S.th, S.colNum]}>Ledger No.</Text>
        <Text style={[S.th, S.colName]}>Ledger Name</Text>
        <Text style={[S.th, S.colAmt, { borderRightWidth: 0 }]}>Balance</Text>
      </View>
      {/* Rows */}
      {group.records.map((row, i) => (
        <View key={row.ledger_number || i} style={[S.tableRow, i % 2 === 0 ? S.rowEven : S.rowOdd]} wrap={false}>
          <Text style={[S.td, S.colSn]}>{i + 1}</Text>
          <Text style={[S.td, S.colNum, { color: BRAND, fontFamily: 'Montserrat-Medium' }]}>{row.ledger_number}</Text>
          <Text style={[S.td, S.colName]}>{row.ledger_name}</Text>
          <Text style={[S.td, S.colAmt, { borderRightWidth: 0, fontFamily: 'Montserrat-SemiBold', color: Number(row.section_value) < 0 ? NEG : TEXT1 }]}>
            {fmt(row.section_value)}
          </Text>
        </View>
      ))}
      {/* Subtotal */}
      <View style={S.subtotalRow} wrap={false}>
        <Text style={[S.subTd, S.colSn]} />
        <Text style={[S.subTd, S.colNum]} />
        <Text style={[S.subTd, S.colName, { color: BRAND }]}>{'Total ' + title}</Text>
        <Text style={[S.subTd, S.colAmt, { borderRightWidth: 0, color: Number(group.total) < 0 ? NEG : BRAND }]}>{fmt(group.total)}</Text>
      </View>
    </View>
  );
};

/* Current Year Earnings row */
const CurrentYearEarnings = ({ value }) => (
  <View style={S.cyeRow} wrap={false}>
    <Text style={S.cyeLabel}>Current Year Earnings</Text>
    <Text style={[S.cyeVal, Number(value) < 0 && { color: NEG }]}>{fmt(value)}</Text>
  </View>
);

/* Main document */
const DownloadBalanceSheet = ({ data = {}, summary = null, meta = {} }) => (
  <Document title={'Balance Sheet FY' + (meta.period || '')} author="Smartbooks" subject="Balance Sheet Report" creator="Smartbooks Financial System">
    <Page size="A4" orientation="portrait" style={S.page}>
      <PageHeader meta={meta} />
      <View style={S.headerDivider} fixed />

      {/* ── ASSETS ── */}
      <SectionHeading label="ASSETS" />

      <SubHeading label="Non-Current Assets" />
      <CategoryBlock title="Intangible Assets"                             group={data.IntangibleAssets} />
      <CategoryBlock title="Tangible Assets"                               group={data.TangibleAssets} />
      <CategoryBlock title="Less: Depreciation & Amortization"             group={data.DepreciationAsset} isLess />
      <CategoryBlock title="Capital Work in Progress (CWIP)"               group={data.CWIP} />
      <SummaryRow    label="Total Non-Current Assets"                      value={summary && summary.total_non_current_assets} />

      <SubHeading label="Current Assets" />
      <CategoryBlock title="Service Customers"                             group={data.ServiceCustomers} />
      <CategoryBlock title="Less: Allowance for Doubtful Debts"            group={data.AllowanceDoubtfulDebts} isLess />
      <SummaryRow    label="Service Customers (Net)"                       value={summary && summary.net_service_customers} />
      <CategoryBlock title="Strategic Partners"                            group={data.StrategicPartners} />
      <CategoryBlock title="Agents"                                        group={data.Agents} />
      <View style={S.treasuryHeading} wrap={false}>
        <Text style={S.treasuryText}>Treasury Accounts</Text>
      </View>
      <CategoryBlock title="Short Term Investments"                        group={data.ShortTermInvestments} />
      <CategoryBlock title="Bank Accounts"                                 group={data.BankAccounts} />
      <CategoryBlock title="Petty Cash"                                    group={data.PettyCash} />
      <CategoryBlock title="Offshore Bank Accounts"                        group={data.OffshoreBankAccounts} />
      <SummaryRow    label="Total Current Assets"                          value={summary && summary.total_current_assets} />
      <SummaryRow    label="Total Assets"                                  value={summary && summary.total_assets} isGrand />

      <Divider />

      {/* ── EQUITY ── */}
      <SectionHeading label="EQUITY" />
      <CategoryBlock title="Capital"           group={data.Capital} />
      <CategoryBlock title="Retained Earnings" group={data.RetainedEarnings} />
      <CurrentYearEarnings value={summary && summary.current_year_earnings} />
      <SummaryRow label="Total Equity" value={summary && summary.total_equity} isGrand />

      <Divider />

      {/* ── LIABILITIES ── */}
      <SectionHeading label="LIABILITIES" />

      <SubHeading label="Non-Current Liabilities" />
      <CategoryBlock title="Deferred Tax Payable"    group={data.DeferredTaxPayable} />
      <CategoryBlock title="Loans and Similar Debts" group={data.LoansAndSimilarDebts} />
      <SummaryRow    label="Total Non-Current Liabilities" value={summary && summary.total_non_current_liability} />

      <SubHeading label="Current Liabilities" />
      <CategoryBlock title="Suppliers / Creditors"        group={data.SuppliersCreditors} />
      <CategoryBlock title="Payroll and Similar Accounts" group={data.PayrollSimilarAccounts} />
      <CategoryBlock title="Outsourcing Agents"           group={data.OutsourcingAgents} />
      <CategoryBlock title="Govt Agencies Payable / Receivable" group={data.GovernmentTax} />
      <SummaryRow    label="Total Current Liabilities"    value={summary && summary.total_current_liabilities} />
      <SummaryRow    label="Total Liabilities"            value={summary && summary.total_liabilities} isGrand />

      <Divider />
      <SummaryRow label="Total Equity & Liabilities" value={summary && summary.total_equity_liabilities} isGrand />

      <PageFooter />
    </Page>
  </Document>
);

export default DownloadBalanceSheet;

const S = StyleSheet.create({
  page:           { fontFamily: 'Montserrat-Regular', fontSize: 7.2, paddingTop: 64, paddingBottom: 40, paddingHorizontal: 24, backgroundColor: '#ffffff' },
  pageHeader:     { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 13, paddingBottom: 9, backgroundColor: '#ffffff' },
  pageHeaderRight:{ alignItems: 'flex-end' },
  logo:           { width: 100, height: 'auto', objectFit: 'contain' },
  reportTitle:    { fontFamily: 'Montserrat-Bold', fontSize: 10.8, color: TEXT1, letterSpacing: 0.3 },
  reportMeta:     { fontFamily: 'Montserrat-Light', fontSize: 5.9, color: TEXT3, marginTop: 2 },
  headerDivider:  { position: 'absolute', top: 54, left: 24, right: 24, height: 1.5, backgroundColor: BRAND },
  pageFooter:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 8, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: '#ffffff' },
  footerLeft:     { fontFamily: 'Montserrat-Light', fontSize: 5.9, color: TEXT3 },
  footerRight:    { fontFamily: 'Montserrat-Medium', fontSize: 5.9, color: TEXT2 },

  sectionHeading:     { backgroundColor: BRAND, paddingVertical: 8, paddingHorizontal: 12, marginTop: 6 },
  sectionHeadingText: { fontFamily: 'Montserrat-Bold', fontSize: 8.1, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.6 },

  subHeading:     { backgroundColor: 'rgba(0,177,150,0.08)', paddingVertical: 5, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,177,150,0.15)', marginTop: 2 },
  subHeadingText: { fontFamily: 'Montserrat-SemiBold', fontSize: 6.8, color: BRAND, textTransform: 'uppercase', letterSpacing: 0.5 },

  treasuryHeading:{ backgroundColor: GRAY, paddingVertical: 4, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  treasuryText:   { fontFamily: 'Montserrat-Medium', fontSize: 6.3, color: TEXT3, textTransform: 'uppercase', letterSpacing: 0.4 },

  divider:        { height: 6, backgroundColor: 'rgba(0,177,150,0.05)', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderTopColor: BORDER, borderBottomColor: BORDER, marginVertical: 4 },

  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, backgroundColor: 'rgba(0,177,150,0.05)', borderTopWidth: 1, borderBottomWidth: 1, borderTopColor: 'rgba(0,177,150,0.15)', borderBottomColor: 'rgba(0,177,150,0.15)', marginVertical: 2 },
  summaryRowGrand: { backgroundColor: 'rgba(0,177,150,0.1)', borderTopWidth: 1.5, borderBottomWidth: 1.5, borderTopColor: BRAND, borderBottomColor: BRAND, paddingVertical: 9 },
  summaryLabel:    { fontFamily: 'Montserrat-Bold', fontSize: 6.8, color: BRAND, textTransform: 'uppercase', letterSpacing: 0.4 },
  summaryLabelGrand:{ fontFamily: 'Montserrat-Bold', fontSize: 7.7, color: BRAND },
  summaryVal:      { fontFamily: 'Montserrat-Bold', fontSize: 8.1, color: TEXT1 },
  summaryValGrand: { fontFamily: 'Montserrat-Bold', fontSize: 9.9, color: TEXT1 },

  catBlock:        { borderBottomWidth: 0.5, borderBottomColor: BORDER },
  catTitle:        { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: GRAY, borderLeftWidth: 3, borderLeftColor: BRAND },
  catTitleLess:    { borderLeftColor: 'rgba(0,177,150,0.3)' },
  catTitleText:    { fontFamily: 'Montserrat-SemiBold', fontSize: 7.2, color: TEXT1 },
  catTitleLessText:{ fontFamily: 'Montserrat-Light', fontSize: 6.8, color: TEXT3 },

  tableHeader:     { flexDirection: 'row', backgroundColor: BRAND2 },
  th:              { fontFamily: 'Montserrat-SemiBold', fontSize: 5.9, color: '#ffffff', paddingVertical: 5, paddingHorizontal: 6, textTransform: 'uppercase', letterSpacing: 0.3, borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.25)' },
  tableRow:        { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  rowEven:         { backgroundColor: '#ffffff' },
  rowOdd:          { backgroundColor: GRAY },
  td:              { fontFamily: 'Montserrat-Light', fontSize: 6.8, color: TEXT2, paddingVertical: 5, paddingHorizontal: 6, borderRightWidth: 0.5, borderRightColor: BORDER },
  subtotalRow:     { flexDirection: 'row', backgroundColor: 'rgba(0,177,150,0.05)', borderTopWidth: 1.5, borderTopColor: BRAND },
  subTd:           { fontFamily: 'Montserrat-Bold', fontSize: 6.8, color: TEXT1, paddingVertical: 6, paddingHorizontal: 6, borderRightWidth: 0.5, borderRightColor: BORDER },

  cyeRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  cyeLabel:        { fontFamily: 'Montserrat-SemiBold', fontSize: 7.2, color: TEXT2 },
  cyeVal:          { fontFamily: 'Montserrat-Bold', fontSize: 8.1, color: TEXT1 },

  colSn:           { width: 22, textAlign: 'right' },
  colNum:          { width: 65, textAlign: 'left' },
  colName:         { flex: 1, textAlign: 'left' },
  colAmt:          { width: 80, textAlign: 'right' },
});