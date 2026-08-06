import { PDFParse } from "pdf-parse";

export type PdfProcesado = {
  texto: string;
  imagenPrimeraPagina: Buffer | null;
};

// Extrae el texto completo y renderiza la primera pagina como PNG.
// Se guardan ambos: no sabemos de antemano si el PDF es un guion de texto
// o un mockup visual, asi que conservamos los dos formatos.
export async function procesarPdf(buffer: Buffer): Promise<PdfProcesado> {
  const parser = new PDFParse({ data: buffer });
  try {
    const textoResult = await parser.getText();
    const screenshotResult = await parser.getScreenshot({ scale: 1.5, first: 1 });
    const dataPagina = screenshotResult.pages[0]?.data;
    const imagenPrimeraPagina = dataPagina ? Buffer.from(dataPagina) : null;
    return { texto: textoResult.text || "", imagenPrimeraPagina };
  } finally {
    await parser.destroy();
  }
}
