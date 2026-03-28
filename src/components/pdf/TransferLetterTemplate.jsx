import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import MontserratRegular from '../../assets/fonts/Montserrat/Montserrat-Regular.ttf';
import MontserratSemiBold from '../../assets/fonts/Montserrat/Montserrat-SemiBold.ttf';
import MontserratSemiBoldItalic from '../../assets/fonts/Montserrat/Montserrat-SemiBoldItalic.ttf';
import MontserratLight from '../../assets/fonts/Montserrat/Montserrat-Light.ttf';

// Register fonts
Font.register({
  family: 'Montserrat-Regular',
  src: MontserratRegular,
});

Font.register({
  family: 'Montserrat-Light',
  src: MontserratLight,
});

Font.register({
  family: 'Montserrat-SemiBold',
  src: MontserratSemiBold,
});

Font.register({
  family: 'Montserrat-SemiBoldItalic',
  src: MontserratSemiBoldItalic,
});


const TransferLetterTemplate = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.date}>
        <Text>May 12, 2025</Text>
      </View>

      <View style={styles.address}>
        <Text style={styles.addressText}>The Managing Director</Text>
        <Text style={styles.addressText}>Guaranty Trust Bank Plc</Text>
        <Text style={styles.addressText}>635, Akin Adesola Street</Text>
        <Text style={styles.addressText}>Victoria Island, Lagos.</Text>
      </View>

      <View style={styles.attention}>
        <Text>Attn: John Doe</Text>
      </View>

      <Text>Dear Sir,</Text>

      <View style={styles.subject}>
        <Text>Re: Transfer from Domiciliary Account (USD # 123456789)</Text>
      </View>

      <Text>Would you please execute the following transfer:-</Text>

      <View style={{ marginTop: 10 }}>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Benef:</Text>
          <Text style={styles.tableValue}>Sant Marino Company</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Bank:</Text>
          <Text style={styles.tableValue}>Danske Bank</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>IBAN:</Text>
          <Text style={styles.tableValue}>DK083145454556682</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Swift Code:</Text>
          <Text style={styles.tableValue}>BABAKE</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Amount:</Text>
          <Text style={styles.tableValue}>€ 12,280.14 /- Twelve Thousand Two Hundred Eighty Euros & Fourteen Cents Only</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Ref:-</Text>
          <Text style={styles.tableValue}>LEM/PO/2025/03045 and quote number: 18647vl</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Purpose:-</Text>
          <Text style={styles.tableValue}>Payment for Electrical Materials (PO Attached)</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Debit our domiciliary account accordingly. Transfer Fees to be Charged in our Account.</Text>
        <Text style={{ marginTop: 20 }}>Thanking you for your cooperation,</Text>
        <Text style={{ marginTop: 10 }}>Yours Faithfully,</Text>
      </View>

      <View style={styles.signatures}>
        <View>
          <View style={styles.signatureLine} />
          <Text>Authorized Signatory</Text>
        </View>
        <View>
          <View style={styles.signatureLine} />
          <Text>Authorized Signatory</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default TransferLetterTemplate;


// PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Montserrat-Regular',
    fontSize: '10px'
  },
  date: {
    textAlign: 'right',
    marginBottom: 20,
  },
  address: {
    marginBottom: 20,
  },
  addressText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: '10px',
    marginBottom: '10px'
  },
  attention: {
    marginBottom: 10,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: '10px',
    textDecoration: 'underline'
  },
  subject: {
    marginTop: 20,
    marginBottom: 20,
    fontFamily: 'Montserrat-SemiBoldItalic',
    fontSize: '10px',
    textDecoration: 'underline'
  },
  tableRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: '10px'
  },
  tableLabel: {
    width: 80,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: '10px'
  },
  tableValue: {
    flex: 1,
  },
  footer: {
    marginTop: 40,
  },
  signatures: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureLine: {
    borderTop: '1px solid black',
    width: 200,
    marginTop: 40,
  }
});