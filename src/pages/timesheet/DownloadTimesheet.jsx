import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import MontserratRegular from '../../assets/fonts/Montserrat/Montserrat-Regular.ttf';
import MontserratLight from '../../assets/fonts/Montserrat/Montserrat-Light.ttf';
import MontserratMedium from '../../assets/fonts/Montserrat/Montserrat-Medium.ttf';
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';

Font.register({ family: 'Montserrat-Regular', src: MontserratRegular });
Font.register({ family: 'Montserrat-Light', src: MontserratLight });
Font.register({ family: 'Montserrat-Medium', src: MontserratMedium });

const DownloadTimesheet = ({ timesheet }) => {
  if (!timesheet) return null;

  const {
    id, date, staff_name, clients_name, project, task, 
    start_time, finish_time, total_hours, 
    created_by, updated_by
  } = timesheet;

  // Simple PDF-safe formatters
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const parts = timeStr.split(':');
    if (parts.length < 2) return '—';
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <Image src={CompanyLogo} style={styles.logo} />

        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Entry ID:</Text>
              <Text style={styles.metaValue}>{id || 'N/A'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Work Date:</Text>
              <Text style={styles.metaValue}>{formatDate(date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Staff Member:</Text>
              <Text style={styles.metaValue}>{staff_name || 'N/A'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Client:</Text>
              <Text style={styles.metaValue}>{clients_name || 'N/A'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Project:</Text>
              <Text style={styles.metaValue}>{project || '—'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Task:</Text>
              <Text style={styles.metaValue}>{task || '—'}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.voucherTypeText}>Timesheet Entry</Text>
            <Text style={styles.voucherId}>TS-{id || ''}</Text>
          </View>
        </View>

        {/* Table Section */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.colTime, styles.colColor]}>Start Time</Text>
            <Text style={[styles.tableCell, styles.colTime, styles.colColor]}>Finish Time</Text>
            <Text style={[styles.tableCell, styles.colHours, styles.colColor]}>Total Hours</Text>
          </View>

          {/* Table Body */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colTime]}>{formatTime(start_time)}</Text>
            <Text style={[styles.tableCell, styles.colTime]}>{formatTime(finish_time)}</Text>
            <Text style={[styles.tableCell, styles.colHours, styles.boldText]}>{formatHours(parseFloat(total_hours))}</Text>
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footerContainer}>
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
        </View>

      </Page>
    </Document>
  );
};

export default DownloadTimesheet;

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
  tableCell: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontSize: 8,
    fontFamily: 'Montserrat-Light',
    color: '#00000',
    borderRightWidth: 0.5,
    borderRightColor: '#d3d7dd',
    alignSelf: 'stretch',
    alignContent: 'center',
    lineHeight: 1.4,
  },
  colColor: {
    color: 'white',
    fontFamily: 'Montserrat-Medium',
    lineHeight: 1.4,
  },
  colTime: { width: '30%', textAlign: 'center' },
  colHours: { width: '40%', textAlign: 'center', borderRightWidth: 0 },
  boldText: {
    fontFamily: 'Montserrat-Medium',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  signatureSection: {
    width: '100%',
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
});