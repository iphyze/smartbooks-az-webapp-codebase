import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { formatDateLong, formatWithDecimals } from "../../utils/helper";
import MontserratRegular from '../../assets/fonts/Montserrat/Montserrat-Regular.ttf';
import MontserratLight from '../../assets/fonts/Montserrat/Montserrat-Light.ttf';
import MontserratMedium from '../../assets/fonts/Montserrat/Montserrat-Medium.ttf';
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';

Font.register({ family: 'Montserrat-Regular', src: MontserratRegular });
Font.register({ family: 'Montserrat-Light', src: MontserratLight });
Font.register({ family: 'Montserrat-Medium', src: MontserratMedium });

const DownloadJournal = ({ journal }) => {
  // Destructure journal properties
  const {
    journal_date, journal_id, journal_type, journal_currency, 
    transaction_type, journal_description, items, 
    created_by, updated_by,
    debit_ngn, credit_ngn, debit_others, credit_others
  } = journal || {};

  // Helper for voucher type
  const voucherType = (type) => {
    switch (type){
      case 'Sales': return 'SV';
      case 'Payment': return 'PV';
      case 'Journal': return 'JV';
      case 'Receipt': return 'RV';
      case 'Expenses': return 'EV';
      default: return 'V';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <Image src={CompanyLogo} style={styles.logo} />

        {/* Header Section */}
        <View style={styles.headerContainer}>
              <View style={styles.headerLeft}>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Transaction Date:</Text>
                        <Text style={styles.metaValue}>{formatDateLong(journal_date)}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Journal Reference:</Text>
                        <Text style={styles.metaValue}>{journal_id || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Journal Type:</Text>
                        <Text style={styles.metaValue}>{journal_type || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Currency:</Text>
                        <Text style={styles.metaValue}>{journal_currency || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Transaction Type:</Text>
                        <Text style={styles.metaValue}>{transaction_type || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Description:</Text>
                        <Text style={styles.metaValue}>{journal_description || 'N/A'}</Text>
                    </View>
            </View>

            <View style={styles.headerRight}>
                <Text style={styles.voucherTypeText}>{journal_type || ''} Voucher</Text>
                <Text style={styles.voucherId}>{voucherType(journal_type)}-{journal_id || ''}</Text>
            </View>
        </View>

        {/* Table Section */}
        <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.colNum, styles.colColor]}>Number</Text>
                <Text style={[styles.tableCell, styles.colName, styles.colColor]}>Ledger Name</Text>
                <Text style={[styles.tableCell, styles.colDesc, styles.colColor]}>Description</Text>
                <Text style={[styles.tableCell, styles.colSide, styles.colColor]}>D/C</Text>
                <Text style={[styles.tableCell, styles.colCur, styles.colColor]}>Currency</Text>
                <Text style={[styles.tableCell, styles.colAmt, styles.colColor]}>Amount</Text>
            </View>

            {/* Table Body */}
            {items && items.length > 0 && items.map((row, index) => {
                const amount = row.debit === "0" ? row.credit : row.debit;
                const sides = row.debit === "0" ? "C" : "D";

                return (
                    <View style={[styles.tableRow, index % 2 !== 0 && styles.tableRowOdd]} key={row.id}>
                        <Text style={[styles.tableCell, styles.colNum]}>{row.ledger_number || ''}</Text>
                        <Text style={[styles.tableCell, styles.colName]}>{row.ledger_name || ''}</Text>
                        <Text style={[styles.tableCell, styles.colDesc]}>{row.journal_description || ''}</Text>
                        <Text style={[styles.tableCell, styles.colSide, styles.boldText]}>{sides || ''}</Text>
                        <Text style={[styles.tableCell, styles.colCur]}>{row.journal_currency || ''}</Text>
                        <Text style={[styles.tableCell, styles.colAmt, styles.boldText]}>{formatWithDecimals(amount)}</Text>
                    </View>
                );
            })}
        </View>

        {/* Summary / Footer Section */}
        <View style={styles.footerContainer}>
            {/* Signatures */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBlock}>
                    <Text style={styles.signatureLabel}>Prepared By:</Text>
                    <Text style={styles.signatureValue}>{created_by || ''}</Text>
                </View>
                <View style={styles.signatureBlock}>
                    <Text style={styles.signatureLabel}>Updated By:</Text>
                    <Text style={styles.signatureValue}>{updated_by || ''}</Text>
                </View>
                <View style={styles.signatureBlock}>
                    <Text style={styles.signatureLabel}>Approved By:</Text>
                    <Text style={styles.signatureValue}>________________________</Text>
                </View>
            </View>

            {/* Totals Grid */}
            <View style={styles.totalsSection}>
                {/* NGN Column */}
                <View style={styles.totalsCol}>
                    <Text style={styles.totalsHeader}>NGN</Text>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Debit</Text>
                        <Text style={styles.totalsValue}>{formatWithDecimals(debit_ngn)}</Text>
                    </View>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Credit</Text>
                        <Text style={styles.totalsValue}>{formatWithDecimals(credit_ngn)}</Text>
                    </View>
                </View>

                {/* FCY Column */}
                <View style={styles.totalsCol}>
                    <Text style={styles.totalsHeader}>FCY</Text>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Debit</Text>
                        <Text style={styles.totalsValue}>{formatWithDecimals(debit_others)}</Text>
                    </View>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Credit</Text>
                        <Text style={styles.totalsValue}>{formatWithDecimals(credit_others)}</Text>
                    </View>
                </View>
            </View>
        </View>

      </Page>
    </Document>
  );
};

export default DownloadJournal;

// Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 30,
    lineHeight: 1.5,
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 150,
    height: 'auto',
    marginBottom: 20,
    objectFit: 'contain'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
      width: '60%',
  },
  // Metadata
  metaRow: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginBottom: 4,
  },
  metaLabel: {
      fontFamily: 'Montserrat-Medium',
      fontSize: 8,
      width: 100,
      color: '#000000',
      lineHeight: 1.5,
  },
  metaValue: {
      width: '70%',
      fontFamily: 'Montserrat-Light',
      fontSize: 8,
      flex: 1,
      color: '#000000',
      lineHeight: 1.5,
  },
  headerRight: {
      width: '40%',
      alignItems: 'flex-end',
  },
  voucherTypeText: {
      fontFamily: 'Montserrat-Medium',
      fontSize: 11,
      color: '#000000',
      textTransform: 'capitalize',
  },
  voucherId: {
      fontFamily: 'Montserrat-Medium',
      fontSize: 9,
      color: '#00b196',
  },

  table: {
      width: '100%',
      marginBottom: 10,
      borderWidth: 0.5,
      borderColor: '#d3d7dd',
  },
  tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: '#d3d7dd',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      flexWrap: 'wrap'
  },
  tableHeader: {
      backgroundColor: '#00b196',
      borderBottomWidth: 0,
      color: 'white'
  },
  tableRowOdd: {
    backgroundColor: '#fbfbfb',
  },
  tableCell: {
      paddingVertical: 5,
      paddingHorizontal: 5,
      fontSize: 8,
      fontFamily: 'Montserrat-Light',
      color: '#00000',
      borderRightWidth: 0.5,
      borderRightColor: '#d3d7dd',
      alignSelf: 'stretch',
      alignContent: 'center',
      lineHeight: 1.4,
      verticalAlign: 'center',
  },
  colColor: {
    color: 'white',
    fontFamily: 'Montserrat-Medium',
    lineHeight: 1.4,
  },
  colNum: { width: '12%', textAlign: 'left' },
  colName: { width: '22%', textAlign: 'left' },
  colDesc: { width: '35%', textAlign: 'left' },
  colSide: { width: '5%', textAlign: 'left' },
  colCur: { width: '10%', textAlign: 'left' },
  colAmt: { width: '16%', textAlign: 'right', borderRightWidth: 0 },
  boldText: {
    fontFamily: 'Montserrat-Medium',
  },

  // Footer
  footerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
  },
  signatureSection: {
      width: '69%',
  },
  signatureBlock: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      gap: 5,
      marginBottom: 10,
  },
  signatureLabel: {
      width: '15%',
      fontFamily: 'Montserrat-Medium',
      fontSize: 8,
      color: '#000000',
  },
  signatureValue: {
      width: '85%',
      fontFamily: 'Montserrat-Light',
      fontSize: 8,
      color: '#000000',
  },
  
  // Totals
  totalsSection: {
      width: '31%',
      backgroundColor: '#fbfbfb',
  },
  totalsCol: {
      position: 'relative',
      width: '100%',
      // marginBottom: 10,
  },
  totalsHeader: {
      position: 'relative',
      width: '100%',
      backgroundColor: '#00b196',
      color: 'white',
      fontFamily: 'Montserrat-Medium',
      fontSize: 8,
      paddingVertical: 2,
      paddingHorizontal: 4,
      lineHeight: 1.2,
      height: 14,
      marginBottom: 4,
      alignContent: 'center',
      alignSelf: 'center',
      alignItems: 'center'
  },
  totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      paddingHorizontal: 4,
  },
  totalsLabel: {
      fontFamily: 'Montserrat-Regular',
      fontSize: 8,
      color: '#000000',
  },
  totalsValue: {
      fontFamily: 'Montserrat-Medium',
      fontSize: 8,
      color: '#000000',
  },
});