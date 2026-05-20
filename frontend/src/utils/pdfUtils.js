/**
 * PDF-BYTE — PDF Utility Functions
 * ==================================
 * Helper functions for PDF.js rendering and pdf-lib operations.
 */

import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";

import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Load a PDF file and return the PDF.js document proxy
 * @param {File|ArrayBuffer|Uint8Array} source - PDF source
 * @returns {Promise<PDFDocumentProxy>}
 */
export async function loadPdf(source) {
  let data;

  if (source instanceof File) {
    data = await source.arrayBuffer();
  } else {
    data = source;
  }

  const loadingTask = pdfjsLib.getDocument({ data });
  return await loadingTask.promise;
}

/**
 * Render a single PDF page to a canvas element
 * @param {PDFDocumentProxy} pdfDoc - PDF.js document
 * @param {number} pageNum - Page number (1-indexed)
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {number} scale - Render scale
 */
export async function renderPage(pdfDoc, pageNum, canvas, scale = 1.5) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const ctx = canvas.getContext("2d");
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return viewport;
}

/**
 * Generate a thumbnail for a page
 * @param {PDFDocumentProxy} pdfDoc - PDF.js document
 * @param {number} pageNum - Page number (1-indexed)
 * @param {number} width - Thumbnail width in pixels
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export async function generateThumbnail(pdfDoc, pageNum, width = 150) {
  const page = await pdfDoc.getPage(pageNum);
  const originalViewport = page.getViewport({ scale: 1 });
  const scale = width / originalViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;

  return canvas.toDataURL("image/png");
}

/**
 * Merge multiple PDF files into one
 * @param {File[]} files - Array of PDF files
 * @returns {Promise<Uint8Array>} - Merged PDF bytes
 */
export async function mergePdfs(files) {
  const mergedDoc = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => mergedDoc.addPage(page));
  }

  return await mergedDoc.save();
}

/**
 * Split a PDF by page ranges
 * @param {ArrayBuffer} pdfBytes - PDF file bytes
 * @param {number[][]} ranges - Array of [start, end] page ranges (0-indexed)
 * @returns {Promise<Uint8Array[]>} - Array of split PDF bytes
 */
export async function splitPdf(pdfBytes, ranges) {
  const sourceDoc = await PDFDocument.load(pdfBytes);
  const results = [];

  for (const [start, end] of ranges) {
    const newDoc = await PDFDocument.create();
    const indices = [];
    for (let i = start; i <= end; i++) indices.push(i);

    const pages = await newDoc.copyPages(sourceDoc, indices);
    pages.forEach((page) => newDoc.addPage(page));
    results.push(await newDoc.save());
  }

  return results;
}

/**
 * Delete pages from a PDF
 * @param {ArrayBuffer} pdfBytes - PDF file bytes
 * @param {number[]} pageIndices - Page indices to remove (0-indexed)
 * @returns {Promise<Uint8Array>} - Modified PDF bytes
 */
export async function deletePages(pdfBytes, pageIndices) {
  const doc = await PDFDocument.load(pdfBytes);
  // Remove from end to start to maintain indices
  const sorted = [...pageIndices].sort((a, b) => b - a);
  sorted.forEach((idx) => doc.removePage(idx));
  return await doc.save();
}

/**
 * Rotate a page in a PDF
 * @param {ArrayBuffer} pdfBytes - PDF file bytes
 * @param {number} pageIndex - Page index (0-indexed)
 * @param {number} degrees - Rotation degrees (90, 180, 270)
 * @returns {Promise<Uint8Array>} - Modified PDF bytes
 */
export async function rotatePage(pdfBytes, pageIndex, degrees) {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(pageIndex);
  const currentRotation = page.getRotation().angle;
  page.setRotation({ type: "degrees", angle: (currentRotation + degrees) % 360 });
  return await doc.save();
}

/**
 * Reorder pages in a PDF
 * @param {ArrayBuffer} pdfBytes - PDF file bytes
 * @param {number[]} newOrder - New page order as array of original indices (0-indexed)
 * @returns {Promise<Uint8Array>} - Reordered PDF bytes
 */
export async function reorderPages(pdfBytes, newOrder) {
  const sourceDoc = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(sourceDoc, newOrder);
  pages.forEach((page) => newDoc.addPage(page));
  return await newDoc.save();
}

/**
 * Add a blank page to a PDF
 * @param {ArrayBuffer} pdfBytes - PDF file bytes
 * @param {number} afterIndex - Insert after this page index (-1 for beginning)
 * @returns {Promise<Uint8Array>} - Modified PDF bytes
 */
export async function addBlankPage(pdfBytes, afterIndex = -1) {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.insertPage(afterIndex + 1);
  return await doc.save();
}

/**
 * Extract text from a PDF page
 * @param {PDFDocumentProxy} pdfDoc - PDF.js document
 * @param {number} pageNum - Page number (1-indexed)
 * @returns {Promise<string>} - Extracted text
 */
export async function extractPageText(pdfDoc, pageNum) {
  const page = await pdfDoc.getPage(pageNum);
  const textContent = await page.getTextContent();
  return textContent.items.map((item) => item.str).join(" ");
}

/**
 * Get PDF metadata
 * @param {PDFDocumentProxy} pdfDoc - PDF.js document
 * @returns {Promise<Object>} - PDF metadata
 */
export async function getPdfMetadata(pdfDoc) {
  const metadata = await pdfDoc.getMetadata();
  return {
    title: metadata.info?.Title || "",
    author: metadata.info?.Author || "",
    subject: metadata.info?.Subject || "",
    creator: metadata.info?.Creator || "",
    producer: metadata.info?.Producer || "",
    creationDate: metadata.info?.CreationDate || "",
    modDate: metadata.info?.ModDate || "",
    pageCount: pdfDoc.numPages,
  };
}
