import React from 'react';
import { previewStyles } from './previewStyles';

const PreviewContent = () => (
  <div style={previewStyles.container}>
    <p style={{ textAlign: 'right' }}>May 12, 2025</p>

    <p>
      The Managing Director<br />
      Guaranty Trust Bank Plc<br />
      635, Akin Adesola Street<br />
      Victoria Island, Lagos.
    </p>

    <p><strong>Attn: John Doe</strong></p>
    <p>Dear Sir,</p>
    <p><strong>Re: Transfer from Domiciliary Account (USD # 123456789)</strong></p>
    <p>Would you please execute the following transfer:-</p>

    <table style={previewStyles.table}>
      <tbody>
        <tr><td><strong>Benef:</strong></td><td>Sant Marino Company</td></tr>
        <tr><td><strong>Bank:</strong></td><td>Danske Bank</td></tr>
        <tr><td><strong>IBAN:</strong></td><td>DK083145454556682</td></tr>
        <tr><td><strong>Swift Code:</strong></td><td>BABAKE</td></tr>
        <tr><td><strong>Amount:</strong></td><td>€ 12,280.14 /- Twelve Thousand Two Hundred Eighty Euros & Fourteen Cents Only</td></tr>
        <tr><td><strong>Ref:-</strong></td><td>LEM/PO/2025/03045 and quote number: 18647vl</td></tr>
        <tr><td><strong>Purpose:-</strong></td><td>Payment for Electrical Materials (PO Attached)</td></tr>
      </tbody>
    </table>

    <p style={{ marginTop: '20px' }}>
      Debit our domiciliary account accordingly. Transfer Fees to be Charged in our Account.
    </p>

    <p>Thanking you for your cooperation,</p>
    <p>Yours Faithfully,</p>

    <p style={{ marginTop: '40px' }}>
      For: Lambert Electromec Limited<br /><br />
      ___________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      ___________________________<br />
      Authorized Signatory &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      Authorized Signatory
    </p>
  </div>
);

export default PreviewContent;