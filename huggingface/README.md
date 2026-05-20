---
title: PDF-BYTE Backend
emoji: 📄
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# PDF-BYTE — Backend API

Heavy PDF processing backend for the PDF-BYTE editor.

## Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/api/convert/pdf-to-word` | POST | Convert PDF to Word (.docx) |
| `/api/convert/pdf-to-excel` | POST | Convert PDF to Excel (.xlsx) |
| `/api/convert/pdf-to-pptx` | POST | Convert PDF to PowerPoint (.pptx) |
| `/api/convert/pdf-to-images` | POST | Convert PDF pages to images |
| `/api/convert/office-to-pdf` | POST | Convert Word/Excel/PPT to PDF |
| `/api/convert/images-to-pdf` | POST | Convert images to PDF |
| `/api/convert/html-to-pdf` | POST | Convert HTML to PDF |
| `/api/compress` | POST | Compress/optimize PDF |
| `/api/ocr` | POST | OCR — scanned PDF to searchable text |
| `/api/security/encrypt` | POST | Password protect PDF |
| `/api/security/decrypt` | POST | Remove password from PDF |
| `/api/repair` | POST | Repair corrupted PDF |
| `/api/grayscale` | POST | Convert PDF to grayscale |

## Tech Stack

- **FastAPI** — Python web framework
- **LibreOffice** — PDF ↔ Office conversion
- **Tesseract OCR** — Optical character recognition
- **Ghostscript** — PDF compression & optimization
- **qpdf** — PDF encryption, decryption, repair
- **pikepdf** — PDF manipulation (Python)
- **Pillow** — Image processing
