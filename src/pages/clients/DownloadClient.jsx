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

const DownloadClient = ({ client, invoices = [], summary = {} }) => {
    // Destructure client properties
    const {
        clients_id, clients_name, clients_email, clients_number,
        clients_address, created_by, created_at
    } = client || {};

    // Helper for status styles
    // const getStatusStyle = (type) => {
    //     switch (type) {
    //         case 'Paid': return { backgroundColor: '#e6f7e6', color: '#155724' };
    //         case 'Pending': return { backgroundColor: '#fff8e1', color: '#856404' };
    //         case 'Overdue': return { backgroundColor: '#fbe7e8', color: '#a94442' };
    //         case 'Cancelled': return { backgroundColor: '#f4f4f4', color: '#6c757d' };
    //         default: return { backgroundColor: '#f4f4f4', color: '#6c757d' };
    //     }
    // };

    const getStatusStyle = (type) => {
        switch (type) {
            case 'Paid': return {color: '#155724' };
            case 'Pending': return {color: '#856404' };
            case 'Overdue': return {color: '#a94442' };
            case 'Cancelled': return {color: '#6c757d' };
            default: return {color:'#6c757d' };
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
                            <Text style={styles.metaLabel}>Client Name:</Text>
                            <Text style={styles.metaValue}>{clients_name || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Client ID:</Text>
                            <Text style={styles.metaValue}>{clients_id || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Email Address:</Text>
                            <Text style={styles.metaValue}>{clients_email || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Phone Number:</Text>
                            <Text style={styles.metaValue}>{clients_number || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Office Address:</Text>
                            <Text style={styles.metaValue}>{clients_address || 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.headerRight}>
                        <Text style={styles.invoiceTypeText}>CLIENT ID #</Text>
                        <Text style={styles.invoiceId}>{clients_id || 'N/A'}</Text>
                    </View>
                </View>


                {/* Financial Summary Cards */}
                {summary && Object.keys(summary).length > 0 && (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.sectionTitle}>Financial Summary by Currency</Text>
                        <View style={styles.summaryGrid}>
                            {Object.entries(summary).map(([currency, data]) => (
                                <View key={currency} style={styles.summaryCard}>
                                    <View style={styles.cardHeaderBg}>
                                        <Text style={styles.cardHeaderText}>{currency} Invoices</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <View style={styles.cardRow}>
                                            <Text style={styles.cardLabel}>Pending ({data.pending_count || 0})</Text>
                                            <Text style={[styles.cardValue, { color: '#856404' }]}>{formatCurrencyDecimals(data.pending_total || 0, currency)}</Text>
                                        </View>
                                        <View style={styles.cardRow}>
                                            <Text style={styles.cardLabel}>Paid ({data.paid_count || 0})</Text>
                                            <Text style={[styles.cardValue, { color: '#155724' }]}>{formatCurrencyDecimals(data.paid_total || 0, currency)}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Invoices Table Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Associated Invoices ({invoices.length})</Text>
                </View>

                {invoices.length > 0 ? (
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableCell, styles.colSn, styles.colColor]}>S/N</Text>
                            <Text style={[styles.tableCell, styles.colInv, styles.colColor]}>Invoice #</Text>
                            <Text style={[styles.tableCell, styles.colDate, styles.colColor]}>Date</Text>
                            <Text style={[styles.tableCell, styles.colCur, styles.colColor]}>Currency</Text>
                            <Text style={[styles.tableCell, styles.colAmt, styles.colColor]}>Amount</Text>
                            <Text style={[styles.tableCell, styles.colStatus, styles.colColor]}>Status</Text>
                        </View>

                        {invoices.map((inv, index) => (
                            <View style={[styles.tableRow, index % 2 !== 0 && styles.tableRowOdd]} key={inv.id || index}>
                                <Text style={[styles.tableCell, styles.colSn]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, styles.colInv]}>AZ-{inv.invoice_number}</Text>
                                <Text style={[styles.tableCell, styles.colDate]}>{formatDateLong(inv.invoice_date)}</Text>
                                <Text style={[styles.tableCell, styles.colCur]}>{inv.currency}</Text>
                                <Text style={[styles.tableCell, styles.colAmt, styles.boldText]}>{formatCurrencyDecimals(inv.invoice_amount, inv.currency)}</Text>
                                <Text style={[styles.tableCell, styles.colStatus, getStatusStyle(inv.status), styles.statusBadge]}>
                                    {inv.status}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No invoices have been generated for this client yet.</Text>
                    </View>
                )}

            </Page>
        </Document>
    );
};

export default DownloadClient;

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
        width: 90,
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
    invoiceTypeText: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 8,
        color: '#000000',
        textTransform: 'capitalize',
        marginBottom: 1,
        alignSelf: 'flex-end'
    },
    invoiceId: {
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
    colSn: { flex: 0.1, textAlign: 'left' },
    colInv: { flex: 0.2, textAlign: 'left' },
    colDate: { flex: 0.25, textAlign: 'left' },
    colCur: { flex: 0.15, textAlign: 'left' },
    colAmt: { flex: 0.2, textAlign: 'right', fontFamily: 'Montserrat-SemiBold', borderRightWidth: 0.5 },
    colStatus: { flex: 0.2, textAlign: 'center', borderRightWidth: 0 },
    boldText: {
        fontFamily: 'Montserrat-Medium',
    },
    statusBadge: {
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 2,
        fontSize: 7,
        textTransform: 'uppercase',
        fontFamily: 'Montserrat-SemiBold',
        alignSelf: 'center'
    },

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
        gap: 10, // Note: gap might require newer react-pdf versions, using margins as fallback
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