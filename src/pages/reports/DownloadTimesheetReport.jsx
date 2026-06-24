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
const AMBER = '#ca8a04';
const BLUE = '#2563eb';

const hours = (n) => `${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h`;
const count = (n) => Number(n || 0).toLocaleString('en-US');
const safe = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));
const fmtDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const today = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const PageHeader = ({ meta }) => {
  const safeMeta = meta || {};
  return (
    <View style={S.pageHeader} fixed>
      <Image src={CompanyLogo} style={S.logo} />
      <View style={S.pageHeaderRight}>
        <Text style={S.reportTitle}>Timesheet Report</Text>
        <Text style={S.reportMeta}>{fmtDate(safeMeta.datefrom)} to {fmtDate(safeMeta.dateto)}</Text>
        <Text style={S.reportMetaSmall}>Staff: {safeMeta.staff_filter || 'All Staff'} · Generated {today()}</Text>
      </View>
    </View>
  );
};

const PageFooter = () => (
  <View style={S.pageFooter} fixed>
    <Text style={S.footerLeft}>Smartbooks Timesheet Report · Generated {today()}</Text>
    <Text style={S.footerRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
  </View>
);

const KpiStrip = ({ summary }) => (
  <View style={S.kpiGrid} wrap={false}>
    <View style={[S.kpiCard, S.kpiPrimary]}>
      <Text style={S.kpiLabel}>Total Hours</Text>
      <Text style={S.kpiValue}>{hours(summary?.grand_total_hours)}</Text>
      <Text style={S.kpiNote}>Approved report window</Text>
    </View>
    <View style={S.kpiCard}>
      <Text style={S.kpiLabel}>Entries</Text>
      <Text style={S.kpiValue}>{count(summary?.entry_count)}</Text>
      <Text style={S.kpiNote}>Timesheet lines</Text>
    </View>
    <View style={S.kpiCard}>
      <Text style={S.kpiLabel}>Staff</Text>
      <Text style={[S.kpiValue, { color: BLUE }]}>{count(summary?.staff_count)}</Text>
      <Text style={S.kpiNote}>Contributors</Text>
    </View>
    <View style={S.kpiCard}>
      <Text style={S.kpiLabel}>Clients</Text>
      <Text style={S.kpiValue}>{count(summary?.client_count)}</Text>
      <Text style={S.kpiNote}>Serviced clients</Text>
    </View>
    <View style={S.kpiCard}>
      <Text style={S.kpiLabel}>Avg / Day</Text>
      <Text style={[S.kpiValue, { color: AMBER }]}>{hours(summary?.average_hours_per_day)}</Text>
      <Text style={S.kpiNote}>Active logged days</Text>
    </View>
  </View>
);

const DownloadTimesheetReport = ({ data = [], summary = null, meta = {} }) => {
  const safeMeta = meta || {};
  const rows = Array.isArray(data) ? data : [];

  return (
    <Document title="Timesheet Report" author="Smartbooks" subject="Timesheet Report" creator="Smartbooks Financial System">
      <Page size="A4" orientation="landscape" style={S.page}>
        <PageHeader meta={safeMeta} />
        <View style={S.headerDivider} fixed />

        {summary && <KpiStrip summary={summary} />}

        <View style={S.noteBox} wrap={false}>
          <Text style={S.noteText}>
            Report basis: detailed time entries grouped by staff. Filter: {safeMeta.search ? `Search "${safeMeta.search}"` : 'No search filter'}.
          </Text>
        </View>

        <View style={S.table}>
          <View style={S.tableHeader} fixed>
            <Text style={[S.th, S.colStaff]}>Staff / Date</Text>
            <Text style={[S.th, S.colClient]}>Client</Text>
            <Text style={[S.th, S.colProject]}>Project</Text>
            <Text style={[S.th, S.colTask]}>Task</Text>
            <Text style={[S.th, S.colTime]}>Start</Text>
            <Text style={[S.th, S.colTime]}>Finish</Text>
            <Text style={[S.th, S.colHours, { borderRightWidth: 0 }]}>Hours</Text>
          </View>

          {rows.length === 0 ? (
            <View style={S.emptyRow}>
              <Text style={S.emptyText}>No timesheet entries found for the selected filters.</Text>
            </View>
          ) : rows.map((group, i) => (
            <View key={`${group.staff_id}-${group.staff_name}-${i}`}>
              <View style={S.groupRow} wrap={false}>
                <Text style={[S.groupText, S.colStaff]}>{safe(group.staff_name)}</Text>
                <Text style={[S.groupMeta, S.colClient]}>{count(group.entry_count)} entries</Text>
                <Text style={[S.groupMeta, S.colProject]}>{count(group.client_count)} clients</Text>
                <Text style={[S.groupMeta, S.colTask]}>{fmtDate(group.first_entry_date)} - {fmtDate(group.last_entry_date)}</Text>
                <Text style={[S.groupMeta, S.colTime]}>{count(group.days_logged)} days</Text>
                <Text style={[S.groupMeta, S.colTime]}>Avg {hours(group.average_entry_hours)}</Text>
                <Text style={[S.groupTotal, S.colHours]}>{hours(group.total_hours)}</Text>
              </View>

              {(group.entries || []).map((entry, j) => (
                <View key={`${entry.id}-${j}`} style={[S.tableRow, j % 2 === 0 ? S.rowEven : S.rowOdd]} wrap={false}>
                  <Text style={[S.td, S.colStaff]}>{fmtDate(entry.date)}</Text>
                  <Text style={[S.td, S.colClient]}>{safe(entry.clients_name)}</Text>
                  <Text style={[S.td, S.colProject]}>{safe(entry.project)}</Text>
                  <Text style={[S.td, S.colTask]}>{safe(entry.task)}</Text>
                  <Text style={[S.td, S.colTime]}>{safe(entry.start_time)}</Text>
                  <Text style={[S.td, S.colTime]}>{safe(entry.finish_time)}</Text>
                  <Text style={[S.td, S.colHours, { borderRightWidth: 0, color: TEXT1, fontFamily: 'Montserrat-SemiBold' }]}>{hours(entry.total_hours)}</Text>
                </View>
              ))}
            </View>
          ))}

          {rows.length > 0 && summary && (
            <View style={S.totalsRow} wrap={false}>
              <Text style={[S.totalsTd, S.colStaff]}>Grand Total</Text>
              <Text style={[S.totalsTd, S.colClient]}>{count(summary.staff_count)} staff</Text>
              <Text style={[S.totalsTd, S.colProject]}>{count(summary.project_count)} projects</Text>
              <Text style={[S.totalsTd, S.colTask]}>{count(summary.entry_count)} entries</Text>
              <Text style={[S.totalsTd, S.colTime]} />
              <Text style={[S.totalsTd, S.colTime]} />
              <Text style={[S.totalsTd, S.colHours, { borderRightWidth: 0 }]}>{hours(summary.grand_total_hours)}</Text>
            </View>
          )}
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
};

export default DownloadTimesheetReport;

const S = StyleSheet.create({
  page: { fontFamily: 'Montserrat-Regular', fontSize: 6.7, paddingTop: 68, paddingBottom: 40, paddingHorizontal: 22, backgroundColor: '#ffffff' },
  pageHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 8, backgroundColor: '#ffffff' },
  pageHeaderRight: { alignItems: 'flex-end' },
  logo: { width: 104, height: 'auto', objectFit: 'contain' },
  reportTitle: { fontFamily: 'Montserrat-Bold', fontSize: 11.7, color: TEXT1, letterSpacing: 0.3 },
  reportMeta: { fontFamily: 'Montserrat-Medium', fontSize: 6.3, color: TEXT2, marginTop: 2 },
  reportMetaSmall: { fontFamily: 'Montserrat-Light', fontSize: 6.3, color: TEXT3, marginTop: 2 },
  headerDivider: { position: 'absolute', top: 58, left: 22, right: 22, height: 1.5, backgroundColor: BRAND },
  pageFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 8, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: '#ffffff' },
  footerLeft: { fontFamily: 'Montserrat-Light', fontSize: 6.3, color: TEXT3 },
  footerRight: { fontFamily: 'Montserrat-Medium', fontSize: 6.3, color: TEXT2 },
  kpiGrid: { flexDirection: 'row', marginBottom: 9 },
  kpiCard: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 8, backgroundColor: '#ffffff', marginRight: 6 },
  kpiPrimary: { backgroundColor: 'rgba(0,177,150,0.05)', borderColor: 'rgba(0,177,150,0.25)' },
  kpiLabel: { fontFamily: 'Montserrat-SemiBold', fontSize: 5.8, color: TEXT3, textTransform: 'uppercase', letterSpacing: 0.35, marginBottom: 3 },
  kpiValue: { fontFamily: 'Montserrat-Bold', fontSize: 9.5, color: TEXT1, marginBottom: 2 },
  kpiNote: { fontFamily: 'Montserrat-Light', fontSize: 5.8, color: TEXT3 },
  noteBox: { borderWidth: 1, borderColor: BORDER, borderRadius: 5, backgroundColor: GRAY, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 8 },
  noteText: { fontFamily: 'Montserrat-Light', color: TEXT2, fontSize: 6.4, lineHeight: 1.35 },
  table: { width: '100%', borderWidth: 1, borderColor: BORDER, borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: BRAND2 },
  th: { fontFamily: 'Montserrat-SemiBold', fontSize: 6.2, color: '#ffffff', paddingVertical: 6, paddingHorizontal: 5, textTransform: 'uppercase', letterSpacing: 0.25, borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.22)' },
  groupRow: { flexDirection: 'row', backgroundColor: 'rgba(0,177,150,0.07)', borderBottomWidth: 0.5, borderBottomColor: BORDER, borderTopWidth: 0.5, borderTopColor: BORDER },
  groupText: { fontFamily: 'Montserrat-Bold', fontSize: 6.5, color: BRAND, paddingVertical: 5.5, paddingHorizontal: 5, borderRightWidth: 0.5, borderRightColor: BORDER },
  groupMeta: { fontFamily: 'Montserrat-Medium', fontSize: 6.4, color: TEXT2, paddingVertical: 5.5, paddingHorizontal: 5, borderRightWidth: 0.5, borderRightColor: BORDER },
  groupTotal: { fontFamily: 'Montserrat-Bold', fontSize: 6.5, color: TEXT1, paddingVertical: 5.5, paddingHorizontal: 5, textAlign: 'right' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: GRAY },
  td: { fontFamily: 'Montserrat-Light', fontSize: 6.2, color: TEXT2, paddingVertical: 5, paddingHorizontal: 5, borderRightWidth: 0.5, borderRightColor: BORDER },
  totalsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,177,150,0.08)', borderTopWidth: 2, borderTopColor: BRAND },
  totalsTd: { fontFamily: 'Montserrat-Bold', fontSize: 6.3, color: TEXT1, paddingVertical: 6.5, paddingHorizontal: 5, borderRightWidth: 0.5, borderRightColor: BORDER },
  emptyRow: { paddingVertical: 24, paddingHorizontal: 12, alignItems: 'center' },
  emptyText: { fontFamily: 'Montserrat-Light', fontSize: 7.2, color: TEXT3 },
  colStaff: { width: 82, textAlign: 'left' },
  colClient: { width: 116, textAlign: 'left' },
  colProject: { width: 116, textAlign: 'left' },
  colTask: { flex: 1, textAlign: 'left' },
  colTime: { width: 52, textAlign: 'right' },
  colHours: { width: 58, textAlign: 'right' },
});
