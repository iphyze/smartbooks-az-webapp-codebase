import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { formatCurrencyDecimals, formatDateLong } from "../../utils/helper";
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

const DownloadLedger = ({ ledger, journalEntries = [], summary = {} }) => {
    // Destructure ledger properties
    const {
        ledger_name, ledger_number, ledger_class, ledger_class_code,
        ledger_sub_class, ledger_type, created_by, created_at, updated_by, updated_at
    } = ledger || {};

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                <Image src={CompanyLogo} style={styles.logo} />

                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerLeft}>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Ledger Name:</Text>
                            <Text style={styles.metaValue}>{ledger_name || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Ledger Number:</Text>
                            <Text style={styles.metaValue}>{ledger_number || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Ledger Class:</Text>
                            <Text style={styles.metaValue}>{ledger_class || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Class Code:</Text>
                            <Text style={styles.metaValue}>{ledger_class_code || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Sub Class:</Text>
                            <Text style={styles.metaValue}>{ledger_sub_class || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Ledger Type:</Text>
                            <Text style={styles.metaValue}>{ledger_type || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Created By:</Text>
                            <Text style={styles.metaValue}>{created_by || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Created On:</Text>
                            <Text style={styles.metaValue}>{formatDateLong(created_at)}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Updated By:</Text>
                            <Text style={styles.metaValue}>{updated_by || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Updated On:</Text>
                            <Text style={styles.metaValue}>{formatDateLong(updated_at)}</Text>
                        </View>
                    </View>

                    <View style={styles.headerRight}>
                        <Text style={styles.headerTypeText}>LEDGER NUMBER #</Text>
                        <Text style={styles.headerId}>{ledger_number || 'N/A'}</Text>
                    </View>
                </View>

                {/* Financial Summary Cards */}
                {summary && Object.keys(summary).length > 0 && (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.sectionTitle}>Financial Summary by currency</Text>
                        <View style={styles.summaryGrid}>
                            {Object.entries(summary).map(([currency, data]) => (
                                <View key={currency} style={styles.summaryCard}>
                                    <View style={styles.cardHeaderBg}>
                                        <Text style={styles.cardHeaderText}>{currency} Summary ({data.entry_count || 0} Entries)</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <View style={styles.cardRow}>
                                            <Text style={styles.cardLabel}>Total Debit</Text>
                                            <Text style={styles.cardValue}>{formatCurrencyDecimals(data.total_debit || 0, currency)}</Text>
                                        </View>
                                        <View style={styles.cardRow}>
                                            <Text style={styles.cardLabel}>Total Credit</Text>
                                            <Text style={styles.cardValue}>{formatCurrencyDecimals(data.total_credit || 0, currency)}</Text>
                                        </View>
                                        <View style={[styles.cardRow, styles.balanceRow]}>
                                            <Text style={[styles.cardLabel, styles.boldText]}>Net Balance</Text>
                                            <Text style={[styles.cardValue, styles.boldText]}>{formatCurrencyDecimals(data.net_balance || 0, currency)}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Journal Entries Table Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Associated Journal Entries ({journalEntries.length})</Text>
                </View>

                {journalEntries.length > 0 ? (
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableCell, styles.colSn, styles.colColor]}>S/N</Text>
                            <Text style={[styles.tableCell, styles.colId, styles.colColor]}>Journal ID</Text>
                            <Text style={[styles.tableCell, styles.colDate, styles.colColor]}>Date</Text>
                            <Text style={[styles.tableCell, styles.colDesc, styles.colColor]}>Description</Text>
                            <Text style={[styles.tableCell, styles.colType, styles.colColor]}>Type</Text>
                            <Text style={[styles.tableCell, styles.colCur, styles.colColor]}>Cur.</Text>
                            <Text style={[styles.tableCell, styles.colDebit, styles.colColor]}>Debit</Text>
                            <Text style={[styles.tableCell, styles.colCredit, styles.colColor]}>Credit</Text>
                        </View>

                        {journalEntries.map((entry, index) => (
                            <View style={[styles.tableRow, index % 2 !== 0 && styles.tableRowOdd]} key={entry.id || index}>
                                <Text style={[styles.tableCell, styles.colSn]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, styles.colId]}>{entry.journal_id || 'N/A'}</Text>
                                <Text style={[styles.tableCell, styles.colDate]}>{formatDateLong(entry.journal_date)}</Text>
                                <Text style={[styles.tableCell, styles.colDesc]}>{entry.journal_description || 'N/A'}</Text>
                                <Text style={[styles.tableCell, styles.colType]}>{entry.journal_type || 'N/A'}</Text>
                                <Text style={[styles.tableCell, styles.colCur]}>{entry.journal_currency || 'N/A'}</Text>
                                <Text style={[styles.tableCell, styles.colDebit, styles.boldText]}>{formatCurrencyDecimals(entry.debit_ngn || 0, entry.journal_currency)}</Text>
                                <Text style={[styles.tableCell, styles.colCredit, styles.boldText]}>{formatCurrencyDecimals(entry.credit_ngn || 0, entry.journal_currency)}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No journal entries have been posted to this ledger yet.</Text>
                    </View>
                )}

            </Page>
        </Document>
    );
};

export default DownloadLedger;

// Styles
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 10,
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: 30,
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
        width: '65%',
    },
    headerRight: {
        width: '35%',
        alignItems: 'flex-end',
        justifyContent: 'flex-end'
    },
    metaRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    metaLabel: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 8,
        width: 95,
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
    headerTypeText: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 8,
        color: '#000000',
        textTransform: 'uppercase',
        marginBottom: 1,
        alignSelf: 'flex-end'
    },
    headerId: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        color: '#00b196',
        letterSpacing: 0.5,
        marginBottom: 5,
        alignSelf: 'flex-end'
    },

    // Section Headers
    sectionHeader: {
        marginTop: 20,
        marginBottom: 8,
    },
    sectionTitle: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 9,
        color: '#a4acb4',
        marginBottom: 8,
    },

    // Table Styles
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
        alignItems: 'stretch',
    },
    tableHeader: {
        backgroundColor: '#00b196',
        borderBottomWidth: 0,
    },
    tableRowOdd: {
        backgroundColor: '#fbfbfb',
    },
    tableCell: {
        paddingVertical: 6,
        paddingHorizontal: 5,
        fontSize: 8,
        fontFamily: 'Montserrat-Light',
        color: '#000000',
        borderRightWidth: 0.5,
        borderRightColor: '#d3d7dd',
        alignSelf: 'stretch',
        alignContent: 'center',
        lineHeight: 1.4,
    },
    colColor: {
        color: 'white',
        fontFamily: 'Montserrat-Medium',
    },
    boldText: {
        fontFamily: 'Montserrat-SemiBold',
    },
    colSn: { flex: 0.06, textAlign: 'left' },
    colId: { flex: 0.1, textAlign: 'left' },
    colDate: { flex: 0.12, textAlign: 'left' },
    colDesc: { flex: 0.34, textAlign: 'left' },
    colType: { flex: 0.12, textAlign: 'left' },
    colCur: { flex: 0.06, textAlign: 'center' },
    colDebit: { flex: 0.1, textAlign: 'right' },
    colCredit: { flex: 0.1, textAlign: 'right', borderRightWidth: 0 },

    // Empty State
    emptyState: {
        width: '100%',
        padding: 20,
        borderWidth: 1,
        borderColor: '#eaedf1',
        borderStyle: 'dashed',
        borderRadius: 4,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontFamily: 'Montserrat-Light',
        fontSize: 8,
        color: '#a4acb4',
    },

    // Summary Cards
    summaryContainer: {
        marginTop: 15,
        marginBottom: 10,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'flex-start',
    },
    summaryCard: {
        width: '48%',
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: '#eaedf1',
        borderRadius: 4,
        overflow: 'hidden',
    },
    cardHeaderBg: {
        backgroundColor: '#00b196',
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    cardHeaderText: {
        color: 'white',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 8,
        letterSpacing: 0.5,
    },
    cardBody: {
        padding: 10,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    balanceRow: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 0.5,
        borderTopColor: '#eaedf1',
        marginBottom: 0,
    },
    cardLabel: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 8,
        color: '#000000',
    },
    cardValue: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 8,
    }
});