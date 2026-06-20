import { pdf } from "@react-pdf/renderer";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

/**
 * Builds the same React-PDF document used by the download action, opens it in
 * a temporary browser tab and requests the native print dialog. The generated
 * PDF components remain unchanged.
 */
export const printPdfDocument = async (pdfDocument, loadingTitle = "Preparing document") => {
  if (!pdfDocument) {
    throw new Error("The PDF document is not available for printing.");
  }

  // Open immediately while the click is still a trusted user gesture. This
  // avoids modern browsers treating the print preview as an async pop-up.
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    throw new Error("Please allow pop-ups for Smartbooks to print this PDF.");
  }

  const safeLoadingTitle = escapeHtml(loadingTitle);

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${safeLoadingTitle}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0; min-height: 100vh; display: grid; place-items: center;
            background: #07111f; color: #dbe7f5; font-family: Arial, sans-serif;
          }
          div { display: flex; align-items: center; gap: 12px; font-size: 14px; }
          i {
            width: 20px; height: 20px; border: 2px solid rgba(35, 207, 190, .25);
            border-top-color: #23cfbe; border-radius: 50%; animation: spin .75s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body><div><i></i><span>${safeLoadingTitle}…</span></div></body>
    </html>
  `);
  printWindow.document.close();

  try {
    const blob = await pdf(pdfDocument).toBlob();
    const blobUrl = URL.createObjectURL(blob);

    printWindow.location.replace(blobUrl);

    // PDF viewers do not expose a consistent ready event across browsers.
    // A short delay works for native Chromium/Firefox viewers; if a browser
    // suppresses automatic printing, the generated PDF remains open and the
    // user can use its built-in Print button.
    window.setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (error) {
        // Keep the PDF preview open as a graceful fallback.
      }
    }, 1200);

    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (error) {
    printWindow.close();
    throw error;
  }
};

export default printPdfDocument;
