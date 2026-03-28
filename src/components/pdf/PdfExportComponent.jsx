import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TransferLetterTemplate from './TransferLetterTemplate';
import PreviewContent from './PreviewContent';
import { previewStyles } from './previewStyles';

const PdfExportComponent = () => {
  return (
    <>
      <div style={previewStyles.exportButton}>
        <PDFDownloadLink
          document={<TransferLetterTemplate />}
          fileName="transfer-letter.pdf"
          style={previewStyles.button}
        >
          {({ loading }) => (loading ? 'Generating PDF...' : 'Export to PDF')}
        </PDFDownloadLink>
      </div>
      <PreviewContent />
    </>
  );
};

export default PdfExportComponent;