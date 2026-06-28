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
const BORDER = '#deeee9';
const TEXT1 = '#0d1f1b';
const TEXT2 = '#3d5752';
const TEXT3 = '#7aada6';
const NEG = '#f47c7c';
const GRAY = '#f8fcfb';
const DEBIT = '#2563eb';
const CREDIT = '#d97706';
const PURPLE = '#7c3aed';

const CLASS_CONFIG = {
  Asset: { label: 'Assets', color: '#2563eb', lightBg: '#EEF2FF', borderColor: '#BFDBFE' },
  Equity: { label: 'Equity', color: '#7c3aed', lightBg: '#F5F3FF', borderColor: '#DDD6FE' },
  Revenue: { label: 'Revenue', color: '#00b196', lightBg: '#ECFDF5', borderColor: '#6EE7B7' },
  Liability: { label: 'Liabilities', color: '#d97706', lightBg: '#FFFBEB', borderColor: '#FDE68A' },
  Expense: { label: 'Expenses', color: '#f47c7c', lightBg: '#FEF2F2', borderColor: '#FECACA' },
};
const CLASS_ORDER = ['Asset', 'Equity', 'Revenue', 'Liability', 'Expense'];

const fmt = (value) => {
  const number = Number(value || 0);
  const absolute = Math.abs(number).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return number < 0 ? `(${absolute})` : absolute;
};

const fmtDate = (value) => {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PageHeader = ({ meta }) => (
  <View style={styles.pageHeader} fixed>
    <Image src={CompanyLogo} style={styles.logo} />
    <View style={styles.pageHeaderRight}>
      <Text style={styles.reportTitle}>Trial Balance</Text>
      <Text style={styles.reportMeta}>
        {fmtDate(meta?.datefrom)} to {fmtDate(meta?.dateto)}
        {'  -  '}Currency: {meta?.currency}
        {'  -  '}Zero balances: {meta?.zerobal === 'Yes' ? 'Included' : 'Excluded'}
      </Text>
    </View>
  </View>
);

const PageFooter = () => (
  <View style={styles.pageFooter} fixed>
    <Text style={styles.footerLeft}>{`Trial Balance  -  Generated ${new Date().toLocaleDateString('en-GB')}`}</Text>
    <Text
      style={styles.footerRight}
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
    />
  </View>
);

const PhaseSummaryCard = ({ label, debit, credit, color, backgroundColor, borderColor }) => (
  <View style={[styles.summaryCard, { backgroundColor, borderColor }]}>
    <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    <View style={styles.summaryPair}>
      <View style={styles.summarySide}>
        <Text style={styles.summarySideLabel}>DR</Text>
        <Text style={[styles.summarySideValue, { color: DEBIT }]}>{fmt(debit)}</Text>
      </View>
      <View style={styles.summarySideDivider} />
      <View style={[styles.summarySide, styles.summarySideRight]}>
        <Text style={styles.summarySideLabel}>CR</Text>
        <Text style={[styles.summarySideValue, { color: CREDIT }]}>{fmt(credit)}</Text>
      </View>
    </View>
  </View>
);

const TotalsSummary = ({ totals, currency }) => {
  if (!totals) return null;
  const difference = Number(totals.grand_closing_difference ?? totals.grand_total_balance ?? 0);
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <View style={styles.summaryRow}>
      <PhaseSummaryCard
        label="Opening Balance"
        debit={totals.grand_total_opening_debit}
        credit={totals.grand_total_opening_credit}
        color={DEBIT}
        backgroundColor="#EEF2FF"
        borderColor="#BFDBFE"
      />
      <PhaseSummaryCard
        label="Period Movement"
        debit={totals.grand_total_movement_debit}
        credit={totals.grand_total_movement_credit}
        color={BRAND}
        backgroundColor="#ECFDF5"
        borderColor="#6EE7B7"
      />
      <PhaseSummaryCard
        label="Closing Balance"
        debit={totals.grand_total_closing_debit}
        credit={totals.grand_total_closing_credit}
        color={PURPLE}
        backgroundColor="#F5F3FF"
        borderColor="#DDD6FE"
      />
      <View
        style={[
          styles.balanceCard,
          isBalanced
            ? { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }
            : { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
        ]}
      >
        <Text style={[styles.balanceLabel, { color: isBalanced ? BRAND : NEG }]}>
          {isBalanced ? 'Closing Agrees' : 'Closing Difference'}
        </Text>
        <Text style={[styles.balanceValue, { color: isBalanced ? BRAND : NEG }]}>
          {isBalanced ? '0.00' : fmt(difference)}
        </Text>
        <Text style={[styles.balanceCurrency, { color: isBalanced ? BRAND : NEG }]}>{currency}</Text>
      </View>
    </View>
  );
};

const sum = (records, field) => records.reduce((total, record) => total + (Number(record[field]) || 0), 0);

const AmountCell = ({ children, style, noBorder = false }) => {
  const styleList = Array.isArray(style) ? style : [style];
  return <Text style={[...styleList, noBorder && styles.noRightBorder]}>{children}</Text>;
};

const ClassSection = ({ className, group }) => {
  const config = CLASS_CONFIG[className] || {
    label: className,
    color: TEXT3,
    lightBg: GRAY,
    borderColor: BORDER,
  };
  const records = group?.records || [];
  if (records.length === 0) return null;

  const subtotals = {
    openingDebit: sum(records, 'opening_debit'),
    openingCredit: sum(records, 'opening_credit'),
    movementDebit: sum(records, 'movement_debit'),
    movementCredit: sum(records, 'movement_credit'),
    closingDebit: sum(records, 'closing_debit'),
    closingCredit: sum(records, 'closing_credit'),
  };

  const chunks = [];
  const rowsPerChunk = 15;
  for (let index = 0; index < records.length; index += rowsPerChunk) {
    chunks.push(records.slice(index, index + rowsPerChunk));
  }

  return (
    <>
      {chunks.map((chunk, chunkIndex) => {
        const isLastChunk = chunkIndex === chunks.length - 1;
        const startNumber = chunkIndex * rowsPerChunk;

        return (
          <View
            key={`${className}-${chunkIndex}`}
            style={[styles.classSection, styles.classChunk]}
            wrap={false}
          >
            <View style={[styles.classHeader, { backgroundColor: config.lightBg, borderLeftColor: config.color }]}>
              <View style={styles.classHeaderLeft}>
                <View style={[styles.classAccent, { backgroundColor: config.color }]} />
                <View>
                  <Text style={[styles.className, { color: config.color }]}>
                    {config.label}{chunkIndex > 0 ? ' (continued)' : ''}
                  </Text>
                  <Text style={styles.classCount}>
                    {records.length} ledger{records.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.classClosingSummary}>
                <Text style={styles.classClosingTitle}>Closing</Text>
                <Text style={[styles.classClosingValue, { color: DEBIT }]}>DR {fmt(subtotals.closingDebit)}</Text>
                <Text style={[styles.classClosingValue, { color: CREDIT }]}>CR {fmt(subtotals.closingCredit)}</Text>
              </View>
            </View>

            <View style={styles.tableGroupHeader}>
              <Text style={[styles.thGroupStatic, styles.colSn]}>#</Text>
              <Text style={[styles.thGroupStatic, styles.colNum]}>Ledger No.</Text>
              <Text style={[styles.thGroupStatic, styles.colName]}>Ledger Name</Text>
              <Text style={[styles.thGroup, styles.openingGroup]}>Opening Balance</Text>
              <Text style={[styles.thGroup, styles.movementGroup]}>Period Movement</Text>
              <Text style={[styles.thGroup, styles.closingGroup]}>Closing Balance</Text>
            </View>

            <View style={styles.tableSubHeader}>
              <Text style={[styles.thSubSpacer, styles.colSn]} />
              <Text style={[styles.thSubSpacer, styles.colNum]} />
              <Text style={[styles.thSubSpacer, styles.colName]} />
              <Text style={[styles.thSub, styles.colAmt, styles.openingSub]}>Debit</Text>
              <Text style={[styles.thSub, styles.colAmt, styles.openingSub]}>Credit</Text>
              <Text style={[styles.thSub, styles.colAmt, styles.movementSub]}>Debit</Text>
              <Text style={[styles.thSub, styles.colAmt, styles.movementSub]}>Credit</Text>
              <Text style={[styles.thSub, styles.colAmt, styles.closingSub]}>Debit</Text>
              <Text style={[styles.thSub, styles.colAmt, styles.closingSub, styles.noRightBorder]}>Credit</Text>
            </View>

            {chunk.map((row, rowIndex) => {
              const isActive = [
                row.opening_debit,
                row.opening_credit,
                row.movement_debit,
                row.movement_credit,
                row.closing_debit,
                row.closing_credit,
              ].some((value) => Math.abs(Number(value) || 0) >= 0.005);

              return (
                <View
                  key={row.ledger_number || rowIndex}
                  style={[
                    styles.tableRow,
                    rowIndex % 2 === 0 ? styles.rowEven : styles.rowOdd,
                    !isActive && styles.rowZero,
                  ]}
                >
                  <Text style={[styles.td, styles.colSn]}>{startNumber + rowIndex + 1}</Text>
                  <Text style={[styles.td, styles.colNum, styles.ledgerNumber]}>{row.ledger_number}</Text>
                  <Text style={[styles.td, styles.colName]}>{row.ledger_name}</Text>
                  <AmountCell style={[styles.td, styles.colAmt, styles.openingCell]}>{fmt(row.opening_debit)}</AmountCell>
                  <AmountCell style={[styles.td, styles.colAmt, styles.openingCell]}>{fmt(row.opening_credit)}</AmountCell>
                  <AmountCell style={[styles.td, styles.colAmt, styles.movementCell]}>{fmt(row.movement_debit)}</AmountCell>
                  <AmountCell style={[styles.td, styles.colAmt, styles.movementCell]}>{fmt(row.movement_credit)}</AmountCell>
                  <AmountCell style={[styles.td, styles.colAmt, styles.closingCell]}>{fmt(row.closing_debit)}</AmountCell>
                  <AmountCell style={[styles.td, styles.colAmt, styles.closingCell]} noBorder>{fmt(row.closing_credit)}</AmountCell>
                </View>
              );
            })}

            {isLastChunk && (
              <View style={[styles.subtotalRow, { borderTopColor: config.color }]}>
                <Text style={[styles.subTd, styles.colSn]} />
                <Text style={[styles.subTd, styles.colNum]} />
                <Text style={[styles.subTd, styles.colName, { color: config.color }]}>Total {config.label}</Text>
                <AmountCell style={[styles.subTd, styles.colAmt]}>{fmt(subtotals.openingDebit)}</AmountCell>
                <AmountCell style={[styles.subTd, styles.colAmt]}>{fmt(subtotals.openingCredit)}</AmountCell>
                <AmountCell style={[styles.subTd, styles.colAmt]}>{fmt(subtotals.movementDebit)}</AmountCell>
                <AmountCell style={[styles.subTd, styles.colAmt]}>{fmt(subtotals.movementCredit)}</AmountCell>
                <AmountCell style={[styles.subTd, styles.colAmt, styles.closingTotal]}>{fmt(subtotals.closingDebit)}</AmountCell>
                <AmountCell style={[styles.subTd, styles.colAmt, styles.closingTotal]} noBorder>{fmt(subtotals.closingCredit)}</AmountCell>
              </View>
            )}
          </View>
        );
      })}
    </>
  );
};

const GrandTotalRow = ({ totals }) => {
  if (!totals) return null;

  return (
    <View style={styles.grandTotalRow} wrap={false}>
      <Text style={[styles.grandTd, styles.colSn]} />
      <Text style={[styles.grandTd, styles.colNum]} />
      <Text style={[styles.grandTd, styles.colName, { color: BRAND }]}>Grand Total</Text>
      <AmountCell style={[styles.grandTd, styles.colAmt]}>{fmt(totals.grand_total_opening_debit)}</AmountCell>
      <AmountCell style={[styles.grandTd, styles.colAmt]}>{fmt(totals.grand_total_opening_credit)}</AmountCell>
      <AmountCell style={[styles.grandTd, styles.colAmt]}>{fmt(totals.grand_total_movement_debit)}</AmountCell>
      <AmountCell style={[styles.grandTd, styles.colAmt]}>{fmt(totals.grand_total_movement_credit)}</AmountCell>
      <AmountCell style={[styles.grandTd, styles.colAmt, styles.closingTotal]}>{fmt(totals.grand_total_closing_debit)}</AmountCell>
      <AmountCell style={[styles.grandTd, styles.colAmt, styles.closingTotal]} noBorder>{fmt(totals.grand_total_closing_credit)}</AmountCell>
    </View>
  );
};

const DownloadTrialBalance = ({ data = {}, totals = null, meta = {} }) => (
  <Document
    title={`Trial Balance ${meta.currency || ''}`}
    author="Smartbooks"
    subject="Trial Balance Report"
    creator="Smartbooks Financial System"
  >
    <Page size="A4" orientation="landscape" style={styles.page}>
      <PageHeader meta={meta} />
      <View style={styles.headerDivider} fixed />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Report Summary</Text>
        <TotalsSummary totals={totals} currency={meta.currency} />
      </View>

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionLabel}>Ledger Accounts by Class</Text>

      {CLASS_ORDER.map((className) => (
        data[className] ? (
          <ClassSection key={className} className={className} group={data[className]} />
        ) : null
      ))}

      <GrandTotalRow totals={totals} />
      <PageFooter />
    </Page>
  </Document>
);

export default DownloadTrialBalance;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 5.7,
    paddingTop: 60,
    paddingBottom: 34,
    paddingHorizontal: 24,
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  pageHeaderRight: { alignItems: 'flex-end' },
  logo: { width: 94, height: 'auto', objectFit: 'contain' },
  reportTitle: { fontFamily: 'Montserrat-Bold', fontSize: 10, color: TEXT1, letterSpacing: 0.25 },
  reportMeta: { fontFamily: 'Montserrat-Light', fontSize: 5.4, color: TEXT3, marginTop: 2 },
  headerDivider: {
    position: 'absolute',
    top: 51,
    left: 24,
    right: 24,
    height: 1.2,
    backgroundColor: BRAND,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 7,
    borderTopWidth: 0.7,
    borderTopColor: BORDER,
    backgroundColor: '#ffffff',
  },
  footerLeft: { fontFamily: 'Montserrat-Light', fontSize: 5.2, color: TEXT3 },
  footerRight: { fontFamily: 'Montserrat-Medium', fontSize: 5.2, color: TEXT2 },
  section: { marginBottom: 8 },
  sectionDivider: { height: 0.7, backgroundColor: BORDER, marginBottom: 9 },
  sectionLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 5.8,
    color: TEXT3,
    textTransform: 'uppercase',
    letterSpacing: 0.55,
    marginBottom: 6,
  },
  summaryRow: { flexDirection: 'row' },
  summaryCard: {
    flex: 1,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    marginRight: 6,
  },
  summaryLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 5.5,
    textTransform: 'uppercase',
    letterSpacing: 0.42,
    marginBottom: 5,
  },
  summaryPair: { flexDirection: 'row', alignItems: 'stretch' },
  summarySide: { flex: 1 },
  summarySideRight: { alignItems: 'flex-end' },
  summarySideDivider: { width: 0.5, backgroundColor: BORDER, marginHorizontal: 6 },
  summarySideLabel: { fontFamily: 'Montserrat-Medium', fontSize: 4.8, color: TEXT3, marginBottom: 2 },
  summarySideValue: { fontFamily: 'Montserrat-Bold', fontSize: 7.2 },
  balanceCard: {
    width: 132,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderWidth: 0.5,
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 5.3,
    textTransform: 'uppercase',
    letterSpacing: 0.38,
  },
  balanceValue: { fontFamily: 'Montserrat-Bold', fontSize: 10.2, marginTop: 4 },
  balanceCurrency: { fontFamily: 'Montserrat-Medium', fontSize: 5.1, marginTop: 1 },
  classSection: { borderWidth: 0.5, borderColor: BORDER, borderRadius: 4, overflow: 'hidden' },
  classChunk: { marginBottom: 8 },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderLeftWidth: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  classHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  classAccent: { width: 3, height: 18, borderRadius: 2, marginRight: 7 },
  className: { fontFamily: 'Montserrat-Bold', fontSize: 7.1 },
  classCount: { fontFamily: 'Montserrat-Light', fontSize: 5.3, color: TEXT3, marginTop: 1 },
  classClosingSummary: { flexDirection: 'row', alignItems: 'center' },
  classClosingTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 5,
    color: TEXT3,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    marginRight: 8,
  },
  classClosingValue: { fontFamily: 'Montserrat-Bold', fontSize: 6.2, marginLeft: 8 },
  tableGroupHeader: { flexDirection: 'row', backgroundColor: '#132238' },
  thGroupStatic: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 5.2,
    color: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.22,
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  thGroup: {
    width: 178,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 5.2,
    textAlign: 'center',
    paddingVertical: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.22,
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  openingGroup: { backgroundColor: '#25427a', color: '#ffffff' },
  movementGroup: { backgroundColor: '#087f72', color: '#ffffff' },
  closingGroup: { backgroundColor: '#5b3ca8', color: '#ffffff', borderRightWidth: 0 },
  tableSubHeader: { flexDirection: 'row', backgroundColor: '#f5f8fb' },
  thSubSpacer: { borderRightWidth: 0.5, borderRightColor: BORDER, paddingVertical: 4 },
  thSub: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 4.9,
    color: TEXT2,
    paddingVertical: 4,
    paddingHorizontal: 5,
    textAlign: 'right',
    textTransform: 'uppercase',
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },
  openingSub: { backgroundColor: '#f4f7ff', color: DEBIT },
  movementSub: { backgroundColor: '#f0fbf8', color: BRAND },
  closingSub: { backgroundColor: '#f8f5ff', color: PURPLE },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: GRAY },
  rowZero: { opacity: 0.45 },
  td: {
    fontFamily: 'Montserrat-Light',
    fontSize: 5.4,
    color: TEXT2,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },
  ledgerNumber: { color: BRAND, fontFamily: 'Montserrat-SemiBold' },
  openingCell: { backgroundColor: '#fbfcff', textAlign: 'right' },
  movementCell: { backgroundColor: '#fbfefd', textAlign: 'right' },
  closingCell: { backgroundColor: '#fdfcff', textAlign: 'right', fontFamily: 'Montserrat-Medium', color: TEXT1 },
  subtotalRow: { flexDirection: 'row', backgroundColor: GRAY, borderTopWidth: 1.2 },
  subTd: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 5.5,
    color: TEXT1,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },
  closingTotal: { backgroundColor: '#f8f5ff' },
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,177,150,0.06)',
    borderTopWidth: 1.5,
    borderTopColor: BRAND,
    marginTop: 4,
  },
  grandTd: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 5.8,
    color: TEXT1,
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },
  colSn: { width: 22, textAlign: 'right' },
  colNum: { width: 58, textAlign: 'left' },
  colName: { width: 180, textAlign: 'left' },
  colAmt: { width: 89, textAlign: 'right' },
  noRightBorder: { borderRightWidth: 0 },
});
