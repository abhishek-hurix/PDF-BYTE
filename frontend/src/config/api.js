/**
 * PDF-BYTE — Backend API Configuration
 * =====================================
 * Hugging Face Spaces backend URL and API helper functions.
 */

// Replace with your actual HF Spaces direct URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://hurix-abhi-pdf-byte.hf.space";
const API_KEY = import.meta.env.VITE_API_KEY || "pdf-byte-secret-key-123";

/**
 * Call a backend API endpoint with a file upload.
 * @param {string} endpoint - API endpoint path (e.g., "/api/compress")
 * @param {File} file - The PDF file to process
 * @param {Object} extraFields - Additional form fields to send
 * @returns {Promise<Blob>} - The processed file as a Blob
 */
export async function processFile(endpoint, file, extraFields = {}) {
  const formData = new FormData();
  formData.append("file", file);

  // Append extra form fields
  for (const [key, value] of Object.entries(extraFields)) {
    formData.append(key, value);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "X-API-Key": API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response;
}

/**
 * Convert PDF to Word
 */
export async function convertToWord(file) {
  const res = await processFile("/api/convert/pdf-to-word", file);
  return await res.blob();
}

/**
 * Convert PDF to Excel
 */
export async function convertToExcel(file) {
  const res = await processFile("/api/convert/pdf-to-excel", file);
  return await res.blob();
}

/**
 * Convert PDF to PowerPoint
 */
export async function convertToPptx(file) {
  const res = await processFile("/api/convert/pdf-to-pptx", file);
  return await res.blob();
}

/**
 * Convert PDF to images
 */
export async function convertToImages(file, format = "png", dpi = 200) {
  const res = await processFile("/api/convert/pdf-to-images", file, { format, dpi });
  return await res.blob();
}

/**
 * Convert Office file to PDF
 */
export async function convertToPdf(file) {
  const res = await processFile("/api/convert/office-to-pdf", file);
  return await res.blob();
}

/**
 * Convert images to PDF
 */
export async function imagesToPdf(files) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const response = await fetch(`${API_BASE_URL}/api/convert/images-to-pdf`, {
    method: "POST",
    headers: {
      "X-API-Key": API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return await response.blob();
}

/**
 * Compress PDF
 */
export async function compressPdf(file, quality = "medium") {
  const res = await processFile("/api/compress", file, { quality });
  return {
    blob: await res.blob(),
    originalSize: res.headers.get("X-Original-Size"),
    compressedSize: res.headers.get("X-Compressed-Size"),
    savings: res.headers.get("X-Savings-Percent"),
  };
}

/**
 * OCR a scanned PDF
 */
export async function ocrPdf(file, language = "eng") {
  const res = await processFile("/api/ocr", file, { language });
  return await res.json();
}

/**
 * Encrypt PDF with password
 */
export async function encryptPdf(file, userPassword, options = {}) {
  const fields = {
    user_password: userPassword,
    owner_password: options.ownerPassword || "",
    allow_print: options.allowPrint ?? true,
    allow_copy: options.allowCopy ?? false,
    allow_modify: options.allowModify ?? false,
  };
  const res = await processFile("/api/security/encrypt", file, fields);
  return await res.blob();
}

/**
 * Decrypt PDF (remove password)
 */
export async function decryptPdf(file, password) {
  const res = await processFile("/api/security/decrypt", file, { password });
  return await res.blob();
}

/**
 * Repair corrupted PDF
 */
export async function repairPdf(file) {
  const res = await processFile("/api/repair", file);
  return await res.blob();
}

/**
 * Convert PDF to grayscale
 */
export async function grayscalePdf(file) {
  const res = await processFile("/api/grayscale", file);
  return await res.blob();
}

/**
 * Check backend health
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await res.json();
  } catch {
    return { status: "offline" };
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default API_BASE_URL;
