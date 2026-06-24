import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import MontserratRegular from '../../../../assets/fonts/Montserrat/Montserrat-Regular.ttf';
import MontserratLight from '../../../../assets/fonts/Montserrat/Montserrat-Light.ttf';
import MontserratMedium from '../../../../assets/fonts/Montserrat/Montserrat-Medium.ttf';
import MontserratBold from '../../../../assets/fonts/Montserrat/Montserrat-Bold.ttf';
import CompanyLogo from '../../../../assets/images/smartbooks/az-logo.png';

Font.register({ family: 'Montserrat-Regular', src: MontserratRegular });
Font.register({ family: 'Montserrat-Light', src: MontserratLight });
Font.register({ family: 'Montserrat-Medium', src: MontserratMedium });
Font.register({ family: 'Montserrat-Bold', src: MontserratBold });

const BRAND = '#00b196';
const TEXT1 = '#0d1f1b';
const TEXT2 = '#3d5752';
const TEXT3 = '#7aada6';
const BORDER = '#deeee9';
const GRAY = '#f8fcfb';
const RED = '#dc2626';
const AMBER = '#ca8a04';

const money = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safe = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));
const fmtDate = (d) => d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const today = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const DownloadBankReconciliation = ({ reconciliation = {}, bankLines = [], ledgerLines = [], adjustments = [] }) => {
  const recon = reconciliation || {};
  const unmatchedBank = (bankLines || []).filter((l) => l.match_status !== 'Matched').slice(0, 70);
  const unmatchedLedger = (ledgerLines || []).filter((l) => l.match_status !== 'Matched').slice(0, 70);
  return (
    <Document title={`Bank Reconciliation - ${recon.reconciliation_number || ''}`} author="Smartbooks">
      <Page size="A4" orientation="landscape" style={S.page}>
        <View style={S.header} fixed>
          <Image src={CompanyLogo} style={S.logo} />
          <View style={S.headerRight}>
            <Text style={S.title}>Bank Reconciliation Report</Text>
            <Text style={S.meta}>{safe(recon.company_name)}</Text>
            <Text style={S.metaLight}>{[recon.bank_name, recon.account_name, recon.account_number, recon.currency].filter(Boolean).join(' · ') || safe(recon.currency)}</Text>
            <Text style={S.metaLight}>{fmtDate(recon.date_from)} to {fmtDate(recon.date_to)} · Generated {today()}</Text>
          </View>
        </View>
        <View style={S.divider} fixed />

        <View style={S.kpiRow} wrap={false}>
          <View style={S.kpi}><Text style={S.kpiLabel}>Statement Closing</Text><Text style={S.kpiValue}>{money(recon.statement_closing_balance)}</Text></View>
          <View style={S.kpi}><Text style={S.kpiLabel}>Ledger Closing</Text><Text style={S.kpiValue}>{money(recon.ledger_closing_balance)}</Text></View>
          <View style={S.kpi}><Text style={S.kpiLabel}>Adjusted Bank</Text><Text style={S.kpiValue}>{money(recon.adjusted_bank_balance)}</Text></View>
          <View style={S.kpi}><Text style={S.kpiLabel}>Adjusted Ledger</Text><Text style={S.kpiValue}>{money(recon.adjusted_ledger_balance)}</Text></View>
          <View style={[S.kpi, Math.abs(Number(recon.unreconciled_difference || 0)) > 0.01 ? S.kpiWarn : S.kpiOk]}><Text style={S.kpiLabel}>Difference</Text><Text style={S.kpiValue}>{money(recon.unreconciled_difference)}</Text></View>
        </View>

        <Text style={S.sectionTitle}>Suggested Accounting Treatment</Text>
        <View style={S.note}><Text style={S.noteText}>Bank charges should be posted as Dr Finance Cost / Bank Charges and Cr Bank. Bank interest should be posted as Dr Bank and Cr Other Income / Interest Income. Ledger items not appearing on the bank statement are normally timing differences: outstanding deposits or outstanding payments.</Text></View>

        <Text style={S.sectionTitle}>Suggested Adjustments</Text>
        <View style={S.table}>
          <View style={S.trHead}><Text style={[S.th,S.c1]}>Type</Text><Text style={[S.th,S.c2]}>Amount</Text><Text style={[S.th,S.c3]}>Debit</Text><Text style={[S.th,S.c3]}>Credit</Text><Text style={[S.th,S.c4]}>Narration</Text></View>
          {adjustments.length === 0 ? <Text style={S.empty}>No suggested adjustments.</Text> : adjustments.slice(0,80).map((a,i)=>(
            <View style={[S.tr, i%2?S.alt:null]} key={i}><Text style={[S.td,S.c1]}>{safe(a.adjustment_type)}</Text><Text style={[S.td,S.c2]}>{money(a.amount)}</Text><Text style={[S.td,S.c3]}>{safe(a.recommended_debit_ledger)}</Text><Text style={[S.td,S.c3]}>{safe(a.recommended_credit_ledger)}</Text><Text style={[S.td,S.c4]}>{safe(a.narration)}</Text></View>
          ))}
        </View>

        <Text style={S.sectionTitle}>Unmatched Bank Statement Lines</Text>
        <View style={S.table}><View style={S.trHead}><Text style={[S.th,S.d1]}>Date</Text><Text style={[S.th,S.d2]}>Description</Text><Text style={[S.th,S.d3]}>Amount</Text><Text style={[S.th,S.d4]}>Status</Text></View>{unmatchedBank.length===0?<Text style={S.empty}>No unmatched bank lines.</Text>:unmatchedBank.map((l,i)=><View style={[S.tr,i%2?S.alt:null]} key={i}><Text style={[S.td,S.d1]}>{fmtDate(l.transaction_date)}</Text><Text style={[S.td,S.d2]}>{safe(l.description)}</Text><Text style={[S.td,S.d3]}>{money(l.amount)}</Text><Text style={[S.td,S.d4]}>{safe(l.suggested_type || l.match_status)}</Text></View>)}</View>

        <Text style={S.sectionTitle}>Unmatched Ledger Lines</Text>
        <View style={S.table}><View style={S.trHead}><Text style={[S.th,S.d1]}>Date</Text><Text style={[S.th,S.d2]}>Description</Text><Text style={[S.th,S.d3]}>Amount</Text><Text style={[S.th,S.d4]}>Status</Text></View>{unmatchedLedger.length===0?<Text style={S.empty}>No unmatched ledger lines.</Text>:unmatchedLedger.map((l,i)=><View style={[S.tr,i%2?S.alt:null]} key={i}><Text style={[S.td,S.d1]}>{fmtDate(l.transaction_date)}</Text><Text style={[S.td,S.d2]}>{safe(l.description)}</Text><Text style={[S.td,S.d3]}>{money(l.amount)}</Text><Text style={[S.td,S.d4]}>{safe(l.suggested_type || l.match_status)}</Text></View>)}</View>

        <View style={S.footer} fixed><Text>Smartbooks Accounting · Consultancy Bank Reconciliation</Text><Text render={({pageNumber,totalPages}) => `Page ${pageNumber} of ${totalPages}`} /></View>
      </Page>
    </Document>
  );
};

export default DownloadBankReconciliation;

const S = StyleSheet.create({
  page:{fontFamily:'Montserrat-Regular',fontSize:6.3,paddingTop:66,paddingBottom:36,paddingHorizontal:22,backgroundColor:'#fff'},
  header:{position:'absolute',top:0,left:0,right:0,paddingHorizontal:22,paddingTop:12,paddingBottom:8,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},logo:{width:104},headerRight:{alignItems:'flex-end'},title:{fontFamily:'Montserrat-Bold',fontSize:11.7,color:TEXT1},meta:{fontFamily:'Montserrat-Medium',fontSize:6.3,color:TEXT2,marginTop:2},metaLight:{fontFamily:'Montserrat-Light',fontSize:6.2,color:TEXT3,marginTop:2},divider:{position:'absolute',top:58,left:22,right:22,height:1.5,backgroundColor:BRAND},
  kpiRow:{flexDirection:'row',marginBottom:10},kpi:{flex:1,borderWidth:1,borderColor:BORDER,borderRadius:6,padding:8,marginRight:6},kpiOk:{backgroundColor:'rgba(0,177,150,0.06)'},kpiWarn:{backgroundColor:'rgba(220,38,38,0.06)',borderColor:'rgba(220,38,38,0.25)'},kpiLabel:{fontFamily:'Montserrat-Medium',fontSize:5.8,color:TEXT3,textTransform:'uppercase'},kpiValue:{fontFamily:'Montserrat-Bold',fontSize:9,color:TEXT1,marginTop:3},
  note:{borderWidth:1,borderColor:BORDER,backgroundColor:GRAY,borderRadius:5,padding:7,marginBottom:8},noteText:{fontFamily:'Montserrat-Light',color:TEXT2,lineHeight:1.35},sectionTitle:{fontFamily:'Montserrat-Bold',fontSize:7.7,color:TEXT1,marginBottom:5,marginTop:5},table:{borderWidth:1,borderColor:BORDER,borderRadius:4,overflow:'hidden',marginBottom:8},trHead:{flexDirection:'row',backgroundColor:'#009e87'},tr:{flexDirection:'row',borderBottomWidth:0.5,borderBottomColor:BORDER},alt:{backgroundColor:GRAY},th:{fontFamily:'Montserrat-Bold',fontSize:6,color:'#fff',padding:5},td:{fontFamily:'Montserrat-Light',fontSize:6.4,color:TEXT2,padding:5,borderRightWidth:0.5,borderRightColor:BORDER},empty:{padding:10,color:TEXT3},c1:{width:86},c2:{width:70,textAlign:'right'},c3:{width:92},c4:{flex:1},d1:{width:64},d2:{flex:1},d3:{width:76,textAlign:'right'},d4:{width:95},footer:{position:'absolute',bottom:0,left:0,right:0,paddingHorizontal:22,paddingVertical:8,borderTopWidth:1,borderTopColor:BORDER,flexDirection:'row',justifyContent:'space-between',color:TEXT3,fontSize:6.2}
});
