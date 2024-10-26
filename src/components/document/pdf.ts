import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Buffer } from "buffer";
import qrcode from "qrcode";

async function getPDFDocument(pdfBuffer: Buffer): Promise<PDFDocument> {
  return await PDFDocument.load(pdfBuffer);
}

async function embedPDFVerificationBlockchain(input_doc: File, issuer: string, txUrl: string): Promise<File> {
  const document = await getPDFDocument(Buffer.from(await input_doc.arrayBuffer()));
  const page = document.getPage(0);
  const { width, height } = page.getSize();

  const textProps = {
    font: await document.embedFont(StandardFonts.CourierBold), // Font
    size: 12, // Text Size
    color: rgb(0, 0, 0) // Text Color
  }

  const textHeightY = 135;
  const posX = width - 155;
  const qrHeight = textHeightY - 25;

  const qrCode = await qrcode.toString(txUrl, {type: 'svg'});

  // Embed signed text
  page.drawText(`Signed by ${issuer}\nVerify at`, {
    ...textProps,
    x: posX,
    y: textHeightY,
    lineHeight: 15,
    maxWidth: width - posX - 10
  });

  // Embed QR Code of the hash
  page.drawSvgPath(qrCode, {
    x: posX,
    y: qrHeight,
    scale: 2.4
  })

  return new File([await document.save()], "signed_doc.pdf",  { type: "application/pdf" });
}

export {
  getPDFDocument,
  embedPDFVerificationBlockchain
};