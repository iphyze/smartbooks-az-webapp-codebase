import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import MontserratRegular  from '../../assets/fonts/Montserrat/Montserrat-Regular.ttf';
import MontserratLight    from '../../assets/fonts/Montserrat/Montserrat-Light.ttf';
import MontserratMedium   from '../../assets/fonts/Montserrat/Montserrat-Medium.ttf';
import MontserratBold     from '../../assets/fonts/Montserrat/Montserrat-Bold.ttf';
import MontserratSemiBold from '../../assets/fonts/Montserrat/Montserrat-SemiBold.ttf';
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';

Font.register({ family:'Montserrat-Regular',  src:MontserratRegular  });
Font.register({ family:'Montserrat-Light',     src:MontserratLight    });
Font.register({ family:'Montserrat-Medium',    src:MontserratMedium   });
Font.register({ family:'Montserrat-Bold',      src:MontserratBold     });
Font.register({ family:'Montserrat-SemiBold',  src:MontserratSemiBold });

/* ─── Palette ────────────────────────────────────── */
const BRAND   = '#00b196';
const BRAND2  = '#009e87';
const BORDER  = '#deeee9';
const GRAY    = '#f8fcfb';
const TEXT1   = '#0d1f1b';
const TEXT2   = '#3d5752';
const TEXT3   = '#7aada6';
const GREEN   = '#16a34a';
const RED     = '#f47c7c';
const AMBER   = '#ca8a04';

/* ─── Helpers ────────────────────────────────────── */
const fmtAmt = (n) => {
  const v = Number(n || 0);
  const a = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  return v < 0 ? '(' + a + ')' : a;
};
const fmtDate = (s) => s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const today   = () => new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const safe    = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));

/* ─── Fixed header ────────────────────────────────── */
const PageHeader = ({ recon }) => (
  <View style={S.pageHeader} fixed>
    <Image src={CompanyLogo} style={S.logo} />
    <View style={S.headerRight}>
      <Text style={S.reportTitle}>Bank Reconciliation Report</Text>
      <Text style={S.reportMeta}>{safe(recon?.company_name)}</Text>
      <Text style={S.reportSub}>
        {[recon?.bank_name, recon?.account_name, recon?.account_number, recon?.currency].filter(Boolean).join(' · ')}
      </Text>
      <Text style={S.reportSub}>
        {fmtDate(recon?.period_from)} to {fmtDate(recon?.period_to)} · Generated {today()}
      </Text>
    </View>
  </View>
);

/* ─── Fixed footer ────────────────────────────────── */
const PageFooter = ({ recon }) => (
  <View style={S.pageFooter} fixed>
    <Text style={S.footerL}>{'Bank Reconciliation — ' + safe(recon?.recon_number)}</Text>
    <Text style={S.footerR} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
  </View>
);

/* ─── Section heading ────────────────────────────── */
const SectionHead = ({ title }) => (
  <View style={S.secHead} wrap={false}>
    <Text style={S.secHeadText}>{title}</Text>
  </View>
);

/* ─── KPI row ────────────────────────────────────── */
const KpiRow = ({ recon }) => {
  const diff = Number(recon?.unreconciled_difference || 0);
  const ok   = Math.abs(diff) < 0.01;
  return (
    <View style={S.kpiRow} wrap={false}>
      {[
        ['Bank Closing',    recon?.bank_closing,   false],
        ['Ledger Closing',  recon?.ledger_closing,  false],
        ['Adjusted Bank',   recon?.adjusted_bank_balance, false],
        ['Adjusted Ledger', recon?.adjusted_ledger_balance, false],
        ['Difference',      recon?.unreconciled_difference, true],
      ].map(([label, value, isDiff]) => (
        <View key={label} style={[S.kpiCell, isDiff && (ok ? S.kpiCellOk : S.kpiCellWarn)]}>
          <Text style={S.kpiLabel}>{label}</Text>
          <Text style={[S.kpiValue, isDiff && { color: ok ? GREEN : RED }]}>{fmtAmt(value)}</Text>
        </View>
      ))}
    </View>
  );
};

/* ─── Formula box ────────────────────────────────── */
const FormulaBox = ({ recon }) => (
  <View style={S.formulaBox} wrap={false}>
    <Text style={S.formulaTitle}>Reconciliation Formula</Text>
    {[
      ['Balance per Bank Statement (closing)',               recon?.bank_closing,                false],
      ['+ Deposits in transit (ledger IN, unmatched)',       null,                              false],
      ['− Outstanding payments (ledger OUT, unmatched)',     null,                              false],
      ['+ Bank interest / direct credits (bank-only IN)',    null,                              false],
      ['− Bank charges / stamps / WHT (bank-only OUT)',      null,                              false],
      ['= Adjusted Bank Balance',                           recon?.adjusted_bank_balance,       true],
      ['Balance per Ledger (closing)',                      recon?.ledger_closing,              false],
      ['= Unreconciled Difference (target: 0)',             recon?.unreconciled_difference,     true],
    ].map(([label, value, bold]) => (
      <View key={label} style={S.formulaRow}>
        <Text style={[S.formulaLabel, bold && S.formulaBold]}>{label}</Text>
        {value !== null && value !== undefined && (
          <Text style={[S.formulaValue, bold && S.formulaBold,
            bold && { color: Math.abs(Number(value)) < 0.01 ? GREEN : TEXT1 }]}>
            {fmtAmt(value)}
          </Text>
        )}
      </View>
    ))}
  </View>
);

/* ─── Line table ─────────────────────────────────── */
const LineTable = ({ title, rows, columns, accent }) => (
  <View style={S.section}>
    <SectionHead title={title} />
    <View style={S.table}>
      {/* Header */}
      <View style={[S.tableHead, { backgroundColor: accent || BRAND2 }]}>
        {columns.map((col) => (
          <Text key={col.key} style={[S.th, { width: col.w, textAlign: col.align || 'left' }]}>
            {col.label}
          </Text>
        ))}
      </View>
      {/* Rows */}
      {rows.length === 0 && (
        <View style={S.emptyRow}><Text style={S.emptyText}>No items.</Text></View>
      )}
      {rows.map((row, i) => (
        <View key={i} style={[S.tableRow, i % 2 === 1 && S.rowAlt]} wrap={false}>
          {columns.map((col) => (
            <Text
              key={col.key}
              style={[
                S.td,
                { width: col.w, textAlign: col.align || 'left' },
                col.style ? col.style(row) : {},
              ]}
            >
              {col.render ? col.render(row) : safe(row[col.key])}
            </Text>
          ))}
        </View>
      ))}
    </View>
  </View>
);

/* ─── Main document ──────────────────────────────── */
const DownloadBankRecon = ({ recon = {}, bankLines = [], ledgerLines = [] }) => {
  const bankOnly    = bankLines.filter((l) => l.match_status === 'Bank-Only');
  const bankMatched = bankLines.filter((l) => l.match_status === 'Matched');
  const unmatchedBank   = bankLines.filter((l) => l.match_status === 'Unmatched');
  const unmatchedLedger = ledgerLines.filter((l) => l.match_status === 'Unmatched');

  const bankCols = [
    { key:'sn',          label:'#',        w:18,  render:(_,i)=>String(i+1), align:'right' },
    { key:'txn_date',    label:'Date',     w:55,  render:(r)=>fmtDate(r.txn_date) },
    { key:'description', label:'Narration',w:null, style:(r)=>({flex:1}) },
    { key:'direction',   label:'Dir',      w:26,  align:'center',
      style:(r)=>({ color: r.direction==='OUT' ? RED : BRAND, fontFamily:'Montserrat-SemiBold' }) },
    { key:'amount',      label:'Amount',   w:70,  align:'right',
      render:(r)=>fmtAmt(r.amount),
      style:(r)=>({ color: r.direction==='OUT' ? RED : BRAND, fontFamily:'Montserrat-SemiBold' }) },
    { key:'match_group', label:'Match Ref',w:70,  render:(r)=>r.match_group||'—',
      style:(r)=>({ color: TEXT3, fontSize:6 }) },
  ];

  const ledgerCols = [
    { key:'sn',          label:'#',        w:18,  render:(_,i)=>String(i+1), align:'right' },
    { key:'txn_date',    label:'Date',     w:55,  render:(r)=>fmtDate(r.txn_date) },
    { key:'description', label:'Narration',w:null, style:(r)=>({flex:1}) },
    { key:'ledger_name', label:'Ledger',   w:70,  render:(r)=>r.ledger_name||'—', style:(r)=>({color:TEXT3}) },
    { key:'direction',   label:'Dir',      w:26,  align:'center',
      style:(r)=>({ color: r.direction==='OUT' ? RED : BRAND, fontFamily:'Montserrat-SemiBold' }) },
    { key:'amount',      label:'Amount',   w:70,  align:'right',
      render:(r)=>fmtAmt(r.amount),
      style:(r)=>({ color: r.direction==='OUT' ? RED : BRAND, fontFamily:'Montserrat-SemiBold' }) },
    { key:'match_group', label:'Match Ref',w:70,  render:(r)=>r.match_group||'—', style:(r)=>({color:TEXT3,fontSize:6}) },
  ];

  const bankOnlyCols = [
    { key:'txn_date',             label:'Date',       w:55,  render:(r)=>fmtDate(r.txn_date) },
    { key:'description',          label:'Description',w:null, style:(r)=>({flex:1}) },
    { key:'bank_only_type',       label:'Type',       w:70,  style:(r)=>({color:AMBER,fontFamily:'Montserrat-SemiBold'}) },
    { key:'amount',               label:'Amount',     w:60,  align:'right', render:(r)=>fmtAmt(r.amount), style:(r)=>({color:RED,fontFamily:'Montserrat-SemiBold'}) },
    { key:'suggested_dr_ledger',  label:'Dr',         w:80,  style:(r)=>({color:TEXT2}) },
    { key:'suggested_cr_ledger',  label:'Cr',         w:80,  style:(r)=>({color:TEXT2}) },
    { key:'journal_note',         label:'Note',       w:70,  style:(r)=>({color:TEXT3,fontSize:6}) },
  ];

  return (
    <Document
      title={`Bank Reconciliation — ${safe(recon?.recon_number)}`}
      author="Smartbooks"
      subject="Bank Reconciliation Report"
      creator="Smartbooks Financial System"
    >
      <Page size="A4" orientation="landscape" style={S.page}>
        <PageHeader recon={recon} />
        <View style={S.divider} fixed />

        {/* KPI strip */}
        <KpiRow recon={recon} />

        {/* Balance formula */}
        <FormulaBox recon={recon} />

        {/* Bank statement lines */}
        <LineTable
          title={`Bank Statement Lines  (${bankLines.length} total · ${bankMatched.length} matched · ${unmatchedBank.length} unmatched · ${bankOnly.length} bank-only)`}
          rows={bankLines.slice(0, 120)}
          columns={bankCols}
          accent={BRAND2}
        />

        {/* Ledger lines */}
        <LineTable
          title={`Ledger Lines  (${ledgerLines.length} total · ${ledgerLines.filter(l=>l.match_status==='Matched').length} matched · ${unmatchedLedger.length} unmatched / timing differences)`}
          rows={ledgerLines.slice(0, 80)}
          columns={ledgerCols}
          accent={BRAND2}
        />

        {/* Suggested journals */}
        {bankOnly.length > 0 && (
          <LineTable
            title={`Suggested Journal Entries — Bank-Only Items  (${bankOnly.length} items)`}
            rows={bankOnly}
            columns={bankOnlyCols}
            accent={AMBER}
          />
        )}

        {/* Unmatched ledger (timing differences) */}
        {unmatchedLedger.length > 0 && (
          <LineTable
            title={`Timing Differences — Ledger Items Not Yet Cleared in Bank  (${unmatchedLedger.length} items)`}
            rows={unmatchedLedger}
            columns={ledgerCols}
            accent="#8b5cf6"
          />
        )}

        <PageFooter recon={recon} />
      </Page>
    </Document>
  );
};

export default DownloadBankRecon;

/* ─── Styles ─────────────────────────────────────── */
const S = StyleSheet.create({
  page: { fontFamily:'Montserrat-Regular', fontSize: 6.3, paddingTop:68, paddingBottom:36, paddingHorizontal:22, backgroundColor:'#ffffff' },

  pageHeader: { position:'absolute', top:0, left:0, right:0, paddingHorizontal:22, paddingTop:12, paddingBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#ffffff' },
  logo:       { width:100, height:'auto', objectFit:'contain' },
  headerRight:{ alignItems:'flex-end' },
  reportTitle:{ fontFamily:'Montserrat-Bold', fontSize: 11.7, color:TEXT1, letterSpacing:.3 },
  reportMeta: { fontFamily:'Montserrat-SemiBold', fontSize: 6.8, color:TEXT2, marginTop:2 },
  reportSub:  { fontFamily:'Montserrat-Light', fontSize: 5.9, color:TEXT3, marginTop:2 },
  divider:    { position:'absolute', top:58, left:22, right:22, height:1.5, backgroundColor:BRAND },

  pageFooter: { position:'absolute', bottom:0, left:0, right:0, paddingHorizontal:22, paddingVertical:8, borderTopWidth:1, borderTopColor:BORDER, flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#ffffff' },
  footerL:    { fontFamily:'Montserrat-Light', fontSize: 5.9, color:TEXT3 },
  footerR:    { fontFamily:'Montserrat-Medium', fontSize: 5.9, color:TEXT2 },

  /* KPI */
  kpiRow:     { flexDirection:'row', marginBottom:10, gap:6 },
  kpiCell:    { flex:1, borderWidth:1, borderColor:BORDER, borderRadius:6, padding:8 },
  kpiCellOk:  { backgroundColor:'rgba(0,177,150,0.06)', borderColor:'rgba(0,177,150,0.25)' },
  kpiCellWarn:{ backgroundColor:'rgba(244,124,124,0.06)', borderColor:'rgba(244,124,124,0.25)' },
  kpiLabel:   { fontFamily:'Montserrat-Medium', fontSize:6, color:TEXT3, textTransform:'uppercase', letterSpacing:.5, marginBottom:3 },
  kpiValue:   { fontFamily:'Montserrat-Bold', fontSize: 9, color:TEXT1 },

  /* Formula */
  formulaBox:   { borderWidth:1, borderColor:BORDER, borderRadius:8, padding:10, marginBottom:10, backgroundColor:GRAY },
  formulaTitle: { fontFamily:'Montserrat-Bold', fontSize: 7.2, color:BRAND, marginBottom:6, textTransform:'uppercase', letterSpacing:.5 },
  formulaRow:   { flexDirection:'row', justifyContent:'space-between', paddingVertical:3, borderBottomWidth:.5, borderBottomColor:BORDER },
  formulaLabel: { fontFamily:'Montserrat-Light', fontSize: 6.3, color:TEXT2, flex:1 },
  formulaValue: { fontFamily:'Montserrat-Regular', fontSize: 6.3, color:TEXT1, width:80, textAlign:'right' },
  formulaBold:  { fontFamily:'Montserrat-Bold', fontSize: 6.8 },

  /* Section */
  section:    { marginBottom:12 },
  secHead:    { backgroundColor:BRAND, paddingVertical:6, paddingHorizontal:10, marginBottom:0 },
  secHeadText:{ fontFamily:'Montserrat-Bold', fontSize: 7.2, color:'#ffffff', letterSpacing:.4 },

  /* Table */
  table:     { borderWidth:1, borderColor:BORDER, overflow:'hidden' },
  tableHead: { flexDirection:'row', backgroundColor:BRAND2 },
  th:        { fontFamily:'Montserrat-SemiBold', fontSize: 5.9, color:'#ffffff', paddingVertical:5, paddingHorizontal:5, borderRightWidth:.5, borderRightColor:'rgba(255,255,255,0.2)' },
  tableRow:  { flexDirection:'row', borderBottomWidth:.5, borderBottomColor:BORDER },
  rowAlt:    { backgroundColor:GRAY },
  td:        { fontFamily:'Montserrat-Light', fontSize: 6.3, color:TEXT2, paddingVertical:5, paddingHorizontal:5, borderRightWidth:.5, borderRightColor:BORDER },
  emptyRow:  { padding:12 },
  emptyText: { fontFamily:'Montserrat-Light', fontSize: 6.3, color:TEXT3, textAlign:'center' },
});
