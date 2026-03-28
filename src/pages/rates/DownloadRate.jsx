import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { formatCurrencyDecimals, formatDateLong, formatWithDecimals } from "../../utils/helper";
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

const DownloadInvoice = ({ invoice }) => {
    // Destructure invoice properties
    const {
        invoice_date, due_date, invoice_number, invoice_type, currency,
        items, status, tin_number, company_data, clients_name, clients_data,
        bank_name, account_name, account_number, account_currency, invoice_amount
    } = invoice || {};

    // Calculations for column visibility
    const total_discount = (items || []).reduce((sum, item) => sum + parseFloat(item.discount || 0), 0);
    const total_vat = (items || []).reduce((sum, item) => sum + parseFloat(item.vat || 0), 0);
    const total_amount = (items || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    const showDiscount = total_discount > 0;
    const showVat = total_vat > 0;

    // Helper for status styles
    const getStatusStyle = (type) => {
        switch (type) {
            case 'Paid': return { backgroundColor: '#e6f7e6', color: '#155724', borderWidth: 0.5, borderColor: '#c3e6cb' };
            case 'Pending': return { backgroundColor: '#fff8e1', color: '#856404', borderWidth: 0.5, borderColor: '#ffeeba' };
            case 'Overdue': return { backgroundColor: '#fbe7e8', color: '#a94442', borderWidth: 0.5, borderColor: '#f5c6cb' };
            case 'Cancelled': return { backgroundColor: '#f4f4f4', color: '#6c757d', borderWidth: 0.5, borderColor: '#e2e3e5' };
            default: return { backgroundColor: '#f4f4f4', color: '#6c757d', borderWidth: 0.5, borderColor: '#e2e3e5' };
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
                            <Text style={styles.metaLabel}>Invoice Date:</Text>
                            <Text style={styles.metaValue}>{formatDateLong(invoice_date)}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Invoice Due Date:</Text>
                            <Text style={styles.metaValue}>{formatDateLong(due_date)}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Office:</Text>
                            <Text style={styles.metaValue}>{company_data?.office_address || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Email:</Text>
                            <Text style={styles.metaValue}>{company_data?.email || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Tel:</Text>
                            <Text style={styles.metaValue}>{company_data?.tel || 'N/A'}</Text>
                        </View>
                        <View style={[styles.metaRow, styles.metaRowMg]}>
                            <Text style={[styles.metaLabel, styles.titleColor]}>Billed To</Text>
                            {/* <Text style={styles.metaValue}>{transaction_type || 'N/A'}</Text> */}
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Company's Name:</Text>
                            <Text style={styles.metaValue}>{clients_name || 'N/A'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Company's Address:</Text>
                            <Text style={styles.metaValue}>{clients_data?.clients_address || 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.headerRight}>
                        <Text style={styles.invoiceTypeText}>SALES INVOICE #</Text>
                        <Text style={styles.invoiceId}>AZ-{invoice_number || ''}</Text>
                        <Text style={[styles.invoiceStatus, getStatusStyle(status)]}>{status || ''}</Text>
                        {tin_number === "Yes" &&
                            <Text style={[styles.invoiceTin]}>TIN: {company_data?.tin || ''}</Text>
                        }
                    </View>
                </View>

                {/* Table Section */}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.colSn, styles.colColor]}>S/N</Text>
                        <Text style={[styles.tableCell, styles.colDesc, styles.colColor]}>Description of Services</Text>
                        {showDiscount &&
                            <Text style={[styles.tableCell, styles.colDisc, styles.colColor]}>Discount</Text>
                        }
                        {showVat &&
                            <Text style={[styles.tableCell, styles.colVat, styles.colColor]}>Vat</Text>
                        }
                        <Text style={[styles.tableCell, styles.colAmt, styles.colColor]}>Amount</Text>
                    </View>

                    {/* Table Body */}
                    {items && items.length > 0 && items.map((row, index) => {
                        const { id, invoice_number, clients_name, description, amount,
                            discount, discount_percent, vat, vat_percent, total } = row;
                        return (
                            <View style={[styles.tableRow, index % 2 !== 0 && styles.tableRowOdd]} key={index + 1}>
                                <Text style={[styles.tableCell, styles.colSn]}>{index + 1 || ''}</Text>
                                <Text style={[styles.tableCell, styles.colDesc]}>{description || ''}</Text>
                                {showDiscount &&
                                    <Text style={[styles.tableCell, styles.colDisc]}>{formatWithDecimals(discount_percent) || ''}%</Text>
                                }
                                {showVat &&
                                    <Text style={[styles.tableCell, styles.colVat]}>{formatWithDecimals(vat_percent) || ''}%</Text>
                                }
                                <Text style={[styles.tableCell, styles.colAmt, styles.boldText]}>{formatCurrencyDecimals(amount, currency) || ''}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Summary / Footer Section */}
                <View style={styles.footerContainer}>
                    {/* Signatures */}
                    <View style={styles.signatureSection} />

                    {/* Totals Grid */}
                    <View style={styles.totalsSection}>

                        {showVat && showDiscount &&
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Subtotal</Text>
                            <Text style={styles.totalsValue}>{formatWithDecimals(total_amount)}</Text>
                        </View>
                        }

                        {showDiscount &&
                            <View style={styles.totalsRow}>
                                <Text style={styles.totalsLabel}>Discount</Text>
                                <Text style={styles.totalsValue}>{formatWithDecimals(total_discount)}</Text>
                            </View>
                        }

                        {showVat && 
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>VAT (7.5%)</Text>
                            <Text style={styles.totalsValue}>{formatWithDecimals(total_vat)}</Text>
                        </View>
                        }

                        <View style={styles.totalsRow}>
                            <Text style={[styles.totalsLabel, styles.totalsMain]}>Total</Text>
                            <Text style={[styles.totalsValue, styles.totalsMain]}>{formatCurrencyDecimals(invoice_amount, currency)}</Text>
                        </View>

                    </View>
                </View>


                {bank_name !== "" && bank_name !== "N/A" && 

                    <View style={styles.vcPaymentDetailsBox}>
                        <Text style={styles.vcPaymentHeading}>Kindly make your payment into:</Text>

                        <View style={styles.vcPaymentGroup}>
                            <Text style={styles.vcPaymentTitle}>Account Name:</Text>
                            <Text style={styles.vcPaymentText}>{account_name}</Text>
                        </View>

                        <View style={styles.vcPaymentGroup}>
                            <Text style={styles.vcPaymentTitle}>Account Number:</Text>
                            <Text style={styles.vcPaymentText}>{account_number}</Text>
                        </View>

                        <View style={styles.vcPaymentGroup}>
                            <Text style={styles.vcPaymentTitle}>Bank Name:</Text>
                            <Text style={styles.vcPaymentText}>{bank_name}</Text>
                        </View>

                        <View style={styles.vcPaymentGroup}>
                            <Text style={styles.vcPaymentTitle}>Currency:</Text>
                            <Text style={styles.vcPaymentText}>{account_currency}</Text>
                        </View>

                    </View>
                
                }

                <View style={styles.vcSignatureBox}>
                    <View style={styles.vcSignatureGroup}>
                        <Text style={styles.vcSigLine}>______________________</Text>
                        <Text style={styles.vcSigText}>Authorized Signatory</Text>
                    </View>

                    <View style={[styles.vcSignatureGroup, styles.vcSignatureGroupRight]}>
                        <Text style={styles.vcSigLine}>______________________</Text>
                        <Text style={styles.vcSigText}>Authorized Signatory</Text>
                    </View>
                </View>

                <Text style={styles.vcThanksText}>Thank you for doing business with us!</Text>

            </Page>
        </Document>
    );
};

export default DownloadInvoice;

// Styles
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 10,
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: 30,
        // lineHeight: 1.5,
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
        position: 'relative',
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
    metaRowMg: {
        marginTop: 10,
    },
    metaLabel: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 8,
        width: 100,
        color: '#000000',
        lineHeight: 1.5,
    },
    titleColor: {
        color: '#00b196',
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
        position: 'relative',
        width: '40%',
        alignItems: 'flex-end',
        justifyContent: 'flex-end'
    },
    invoiceTypeText: {
        position: 'relative',
        fontFamily: 'Montserrat-Medium',
        fontSize: 8,
        color: '#000000',
        textTransform: 'capitalize',
        marginBottom: 1,
        alignSelf: 'flex-end'
    },
    invoiceId: {
        position: 'relative',
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        color: '#00b196',
        letterSpacing: 0.5,
        marginBottom: 5,
        alignSelf: 'flex-end'
    },
    invoiceStatus: {
        position: 'relative',
        marginBottom: 5,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 8,
        fontFamily: 'Montserrat-Medium',
        alignSelf: 'flex-end',
        alignItems: 'center',
        textAlign: 'center'
    },
    invoiceTin: {
        position: 'relative',
        fontSize: 8,
        letterSpacing: 0.5,
        color: '#bcc7d1',
        fontFamily: 'Montserrat-SemiBold',
        alignSelf: 'flex-end'
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
    colSn: { flex: 0.1, textAlign: 'left' },
    colDesc: { flex: 1.65, textAlign: 'left' },
    colDisc: { flex: 0.5, textAlign: 'left' },
    colVat: { flex: 0.5, textAlign: 'left' },
    colCur: { flex: 0.5, textAlign: 'left' },
    colAmt: { flex: 0.5, textAlign: 'right', borderRightWidth: 0, fontFamily: 'Montserrat-SemiBold', },
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
        width: '68%',
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
        width: '32%',
        backgroundColor: '#eaedf1',
        padding: 5,
        borderRadius: 2,
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
        paddingHorizontal: 5,
        paddingVertical: 8,
    },
    totalsLabel: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 8,
        color: '#627976',
    },
    totalsValue: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 8,
        color: '#627976',
    },
    totalsMain: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 8,
        color: '#627976',
    },
    vcPaymentDetailsBox: {
        position: 'relative',
        width: '100%',
        marginVertical: 30,
        marginBottom: 40,
    },
    vcPaymentHeading: {
        position: 'relative',
        width: '100%',
        height: 'auto',
        lineHeight: 1.5,
        fontFamily: 'Montserrat-Medium',
        fontSize: 8,
        color: '#a4acb4',
        marginBottom: 8
    },
    vcPaymentGroup: {
        position: 'relative',
        width: 400,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 5,
    },
    vcPaymentTitle: {
        position: 'relative',
        width: 70,
        lineHeight: 1.5,
        fontFamily: 'Montserrat-Regular',
        fontSize: 8,
        color: '#373c40',
    },
    vcPaymentText: {
        position: 'relative',
        width: '50%',
        lineHeight: 1.5,
        fontFamily: 'Montserrat-Light',
        fontSize: 8,
        color: '#373c40',
    },
    vcSignatureBox: {
        position: 'relative',
        width: '100%',
        height: 'auto',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginBottom: 40,
    },
    vcSignatureGroup: {
        position: 'relative',
        textAlign: 'left'
    },
    vcSignatureGroupRight: {
        position: 'relative',
        textAlign: 'right',
        alignSelf: 'flex-end'
    },
    vcSigLine: {
        position: 'relative',
        color: '#373c40',
        marginBottom: 8
    },
    vcSigText: {
        position: 'relative',
        color: '#373c40',
        fontFamily: 'Montserrat-Medium',
        fontSize: 8
    },
    vcThanksText: {
        position: 'relative',
        color: '#373c40',
        fontFamily: 'Montserrat-Light',
        fontSize: 8,
        marginVertical: 20,
        marginBottom: 40
    }
});