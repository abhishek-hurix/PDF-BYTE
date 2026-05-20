"""
PDF-BYTE Backend API
====================
Heavy PDF processing backend powered by FastAPI.
Handles: Conversion, Compression, OCR, Encryption, Repair.

Deployed on Hugging Face Spaces via Docker.
"""

import os
import uuid
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import uvicorn

# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PDF-BYTE Backend API",
    description="Heavy PDF processing backend for the PDF-BYTE editor",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend to call our API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key Security
API_KEY = os.environ.get("API_KEY", "pdf-byte-secret-key-123")

@app.middleware("http")
async def verify_api_key_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        # Let preflight requests pass
        if request.method == "OPTIONS":
            return await call_next(request)
            
        api_key = request.headers.get("X-API-Key")
        if api_key != API_KEY:
            return JSONResponse(status_code=403, content={"detail": "Invalid API Key"})
    return await call_next(request)

# Temp directories
TEMP_DIR = Path("/app/temp")
UPLOAD_DIR = Path("/app/uploads")
OUTPUT_DIR = Path("/app/outputs")

for d in [TEMP_DIR, UPLOAD_DIR, OUTPUT_DIR]:
    d.mkdir(parents=True, exist_ok=True)


# ─── Utility Functions ───────────────────────────────────────────────────────

def generate_id() -> str:
    """Generate a unique file ID."""
    return str(uuid.uuid4())[:8]


async def save_upload(file: UploadFile, directory: Path) -> Path:
    """Save an uploaded file to the specified directory."""
    file_id = generate_id()
    ext = Path(file.filename).suffix if file.filename else ".pdf"
    filepath = directory / f"{file_id}{ext}"
    
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    
    return filepath


def cleanup(*paths: Path):
    """Remove temporary files."""
    for p in paths:
        try:
            if p.exists():
                if p.is_dir():
                    shutil.rmtree(p)
                else:
                    p.unlink()
        except Exception:
            pass


def run_command(cmd: list[str], timeout: int = 300) -> subprocess.CompletedProcess:
    """Run a shell command with timeout."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Command failed: {result.stderr[:500]}"
            )
        return result
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Processing timed out")


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "PDF-BYTE Backend",
        "version": "1.0.0",
        "tools": {
            "libreoffice": shutil.which("libreoffice") is not None,
            "tesseract": shutil.which("tesseract") is not None,
            "ghostscript": shutil.which("gs") is not None,
            "qpdf": shutil.which("qpdf") is not None,
        }
    }


@app.get("/")
async def root():
    """Root endpoint — redirect to docs."""
    return {"message": "PDF-BYTE Backend API", "docs": "/docs"}


# ─── CONVERSION ENDPOINTS ────────────────────────────────────────────────────

@app.post("/api/convert/pdf-to-word")
async def convert_pdf_to_word(file: UploadFile = File(...)):
    """Convert PDF to Word (.docx) using LibreOffice."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    input_path = await save_upload(file, UPLOAD_DIR)
    output_dir = OUTPUT_DIR / generate_id()
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        run_command([
            "libreoffice", "--headless", "--convert-to", "docx",
            "--outdir", str(output_dir), str(input_path)
        ])
        
        # Find the output file
        output_files = list(output_dir.glob("*.docx"))
        if not output_files:
            raise HTTPException(status_code=500, detail="Conversion failed — no output file")
        
        return FileResponse(
            output_files[0],
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=Path(file.filename).stem + ".docx",
        )
    finally:
        cleanup(input_path)
        # Note: output_dir cleanup happens after response is sent


@app.post("/api/convert/pdf-to-excel")
async def convert_pdf_to_excel(file: UploadFile = File(...)):
    """Convert PDF to Excel (.xlsx) using LibreOffice."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    input_path = await save_upload(file, UPLOAD_DIR)
    output_dir = OUTPUT_DIR / generate_id()
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        run_command([
            "libreoffice", "--headless", "--convert-to", "xlsx",
            "--outdir", str(output_dir), str(input_path)
        ])
        
        output_files = list(output_dir.glob("*.xlsx"))
        if not output_files:
            raise HTTPException(status_code=500, detail="Conversion failed")
        
        return FileResponse(
            output_files[0],
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=Path(file.filename).stem + ".xlsx",
        )
    finally:
        cleanup(input_path)


@app.post("/api/convert/pdf-to-pptx")
async def convert_pdf_to_pptx(file: UploadFile = File(...)):
    """Convert PDF to PowerPoint (.pptx) using LibreOffice."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    input_path = await save_upload(file, UPLOAD_DIR)
    output_dir = OUTPUT_DIR / generate_id()
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        run_command([
            "libreoffice", "--headless", "--convert-to", "pptx",
            "--outdir", str(output_dir), str(input_path)
        ])
        
        output_files = list(output_dir.glob("*.pptx"))
        if not output_files:
            raise HTTPException(status_code=500, detail="Conversion failed")
        
        return FileResponse(
            output_files[0],
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=Path(file.filename).stem + ".pptx",
        )
    finally:
        cleanup(input_path)


@app.post("/api/convert/pdf-to-images")
async def convert_pdf_to_images(
    file: UploadFile = File(...),
    format: str = Form(default="png"),
    dpi: int = Form(default=200),
):
    """Convert PDF pages to images (PNG/JPEG) using pdftoppm."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    if format not in ("png", "jpeg", "jpg"):
        raise HTTPException(status_code=400, detail="Format must be png or jpeg")
    
    input_path = await save_upload(file, UPLOAD_DIR)
    output_dir = OUTPUT_DIR / generate_id()
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        fmt_flag = "-png" if format == "png" else "-jpeg"
        run_command([
            "pdftoppm", fmt_flag, "-r", str(dpi),
            str(input_path), str(output_dir / "page")
        ])
        
        # Collect all generated images
        ext = "png" if format == "png" else "jpg"
        images = sorted(output_dir.glob(f"*.{ext}")) + sorted(output_dir.glob("*.ppm"))
        
        if not images:
            raise HTTPException(status_code=500, detail="No images generated")
        
        # If single page, return the image directly
        if len(images) == 1:
            return FileResponse(images[0], media_type=f"image/{format}")
        
        # Multiple pages — zip them
        import zipfile
        zip_path = output_dir / "pages.zip"
        with zipfile.ZipFile(zip_path, "w") as zf:
            for img in images:
                zf.write(img, img.name)
        
        return FileResponse(
            zip_path,
            media_type="application/zip",
            filename=Path(file.filename).stem + "_images.zip",
        )
    finally:
        cleanup(input_path)


@app.post("/api/convert/office-to-pdf")
async def convert_office_to_pdf(file: UploadFile = File(...)):
    """Convert Word/Excel/PPT to PDF using LibreOffice."""
    allowed_exts = {".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt", ".odt", ".ods", ".odp"}
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Accepted formats: {', '.join(allowed_exts)}"
        )
    
    input_path = await save_upload(file, UPLOAD_DIR)
    output_dir = OUTPUT_DIR / generate_id()
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        run_command([
            "libreoffice", "--headless", "--convert-to", "pdf",
            "--outdir", str(output_dir), str(input_path)
        ])
        
        output_files = list(output_dir.glob("*.pdf"))
        if not output_files:
            raise HTTPException(status_code=500, detail="Conversion failed")
        
        return FileResponse(
            output_files[0],
            media_type="application/pdf",
            filename=Path(file.filename).stem + ".pdf",
        )
    finally:
        cleanup(input_path)


@app.post("/api/convert/images-to-pdf")
async def convert_images_to_pdf(files: list[UploadFile] = File(...)):
    """Convert multiple images to a single PDF."""
    from PIL import Image
    
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    saved_paths = []
    try:
        # Save all uploaded images
        for f in files:
            path = await save_upload(f, UPLOAD_DIR)
            saved_paths.append(path)
        
        # Convert images to PDF using Pillow
        images = []
        for path in saved_paths:
            img = Image.open(path)
            if img.mode == "RGBA":
                img = img.convert("RGB")
            images.append(img)
        
        output_path = OUTPUT_DIR / f"{generate_id()}.pdf"
        
        if len(images) == 1:
            images[0].save(str(output_path), "PDF")
        else:
            images[0].save(str(output_path), "PDF", save_all=True, append_images=images[1:])
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename="converted.pdf",
        )
    finally:
        for p in saved_paths:
            cleanup(p)


# ─── COMPRESSION ENDPOINT ────────────────────────────────────────────────────

@app.post("/api/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    quality: str = Form(default="medium"),
):
    """
    Compress/optimize PDF using Ghostscript.
    Quality levels: low (smallest), medium (balanced), high (best quality)
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    quality_map = {
        "low": "/screen",       # 72 dpi — smallest size
        "medium": "/ebook",     # 150 dpi — balanced
        "high": "/printer",     # 300 dpi — high quality
    }
    
    if quality not in quality_map:
        raise HTTPException(status_code=400, detail="Quality must be: low, medium, or high")
    
    input_path = await save_upload(file, UPLOAD_DIR)
    output_path = OUTPUT_DIR / f"{generate_id()}_compressed.pdf"
    
    try:
        run_command([
            "gs", "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={quality_map[quality]}",
            "-dNOPAUSE", "-dQUIET", "-dBATCH",
            f"-sOutputFile={output_path}",
            str(input_path)
        ])
        
        original_size = input_path.stat().st_size
        compressed_size = output_path.stat().st_size
        savings = round((1 - compressed_size / original_size) * 100, 1)
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=Path(file.filename).stem + "_compressed.pdf",
            headers={
                "X-Original-Size": str(original_size),
                "X-Compressed-Size": str(compressed_size),
                "X-Savings-Percent": str(savings),
            }
        )
    finally:
        cleanup(input_path)


# ─── OCR ENDPOINT ────────────────────────────────────────────────────────────

@app.post("/api/ocr")
async def ocr_pdf(
    file: UploadFile = File(...),
    language: str = Form(default="eng"),
):
    """
    OCR a scanned PDF — extract text and return searchable PDF.
    Supported languages: eng (English), hin (Hindi), eng+hin (both)
    """
    import pytesseract
    from PIL import Image
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    input_path = await save_upload(file, UPLOAD_DIR)
    work_dir = TEMP_DIR / generate_id()
    work_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        # Step 1: Convert PDF pages to images using pdftoppm
        run_command([
            "pdftoppm", "-png", "-r", "300",
            str(input_path), str(work_dir / "page")
        ])
        
        # Step 2: Run OCR on each page image
        page_images = sorted(work_dir.glob("*.png"))
        if not page_images:
            raise HTTPException(status_code=500, detail="Could not extract pages from PDF")
        
        extracted_text = []
        for i, img_path in enumerate(page_images, 1):
            img = Image.open(img_path)
            text = pytesseract.image_to_string(img, lang=language)
            extracted_text.append(f"--- Page {i} ---\n{text}")
        
        # Step 3: Create searchable PDF using Tesseract
        output_path = OUTPUT_DIR / f"{generate_id()}_ocr.pdf"
        
        # Use tesseract to create searchable PDF from first image
        # For multi-page, we concatenate with qpdf
        pdf_pages = []
        for img_path in page_images:
            page_pdf = work_dir / f"{img_path.stem}_ocr"
            run_command([
                "tesseract", str(img_path), str(page_pdf),
                "-l", language, "pdf"
            ])
            pdf_pages.append(page_pdf.with_suffix(".pdf"))
        
        if len(pdf_pages) == 1:
            shutil.copy2(pdf_pages[0], output_path)
        else:
            # Merge all OCR'd pages with qpdf
            run_command([
                "qpdf", "--empty", "--pages",
                *[str(p) for p in pdf_pages],
                "--", str(output_path)
            ])
        
        return JSONResponse(content={
            "text": "\n\n".join(extracted_text),
            "pages": len(page_images),
            "language": language,
            "download_url": f"/api/download/{output_path.name}",
        })
    finally:
        cleanup(input_path, work_dir)


# ─── SECURITY ENDPOINTS ──────────────────────────────────────────────────────

@app.post("/api/security/encrypt")
async def encrypt_pdf(
    file: UploadFile = File(...),
    user_password: str = Form(...),
    owner_password: str = Form(default=""),
    allow_print: bool = Form(default=True),
    allow_copy: bool = Form(default=False),
    allow_modify: bool = Form(default=False),
):
    """Password protect and set permissions on a PDF using qpdf."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    input_path = await save_upload(file, UPLOAD_DIR)
    output_path = OUTPUT_DIR / f"{generate_id()}_encrypted.pdf"
    
    if not owner_password:
        owner_password = user_password
    
    try:
        cmd = [
            "qpdf", "--encrypt",
            user_password, owner_password, "256",
            "--",
            str(input_path), str(output_path)
        ]
        
        # Add permission flags
        if not allow_print:
            cmd.insert(-2, "--print=none")
        if not allow_modify:
            cmd.insert(-2, "--modify=none")
        if not allow_copy:
            cmd.insert(-2, "--extract=n")
        
        run_command(cmd)
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=Path(file.filename).stem + "_protected.pdf",
        )
    finally:
        cleanup(input_path)


@app.post("/api/security/decrypt")
async def decrypt_pdf(
    file: UploadFile = File(...),
    password: str = Form(...),
):
    """Remove password protection from a PDF using qpdf."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    input_path = await save_upload(file, UPLOAD_DIR)
    output_path = OUTPUT_DIR / f"{generate_id()}_unlocked.pdf"
    
    try:
        run_command([
            "qpdf", "--password=" + password, "--decrypt",
            str(input_path), str(output_path)
        ])
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=Path(file.filename).stem + "_unlocked.pdf",
        )
    except HTTPException:
        raise HTTPException(status_code=401, detail="Incorrect password")
    finally:
        cleanup(input_path)


# ─── REPAIR ENDPOINT ─────────────────────────────────────────────────────────

@app.post("/api/repair")
async def repair_pdf(file: UploadFile = File(...)):
    """Attempt to repair a corrupted PDF using qpdf."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    input_path = await save_upload(file, UPLOAD_DIR)
    output_path = OUTPUT_DIR / f"{generate_id()}_repaired.pdf"
    
    try:
        run_command([
            "qpdf", "--replace-input",
            str(input_path)
        ])
        
        # Copy repaired file
        shutil.copy2(input_path, output_path)
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=Path(file.filename).stem + "_repaired.pdf",
        )
    finally:
        cleanup(input_path)


# ─── GRAYSCALE ENDPOINT ──────────────────────────────────────────────────────

@app.post("/api/grayscale")
async def convert_to_grayscale(file: UploadFile = File(...)):
    """Convert a PDF to grayscale using Ghostscript."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    input_path = await save_upload(file, UPLOAD_DIR)
    output_path = OUTPUT_DIR / f"{generate_id()}_grayscale.pdf"
    
    try:
        run_command([
            "gs", "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            "-dColorConversionStrategy=/Gray",
            "-dProcessColorModel=/DeviceGray",
            "-dNOPAUSE", "-dQUIET", "-dBATCH",
            f"-sOutputFile={output_path}",
            str(input_path)
        ])
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=Path(file.filename).stem + "_grayscale.pdf",
        )
    finally:
        cleanup(input_path)


# ─── FILE DOWNLOAD ───────────────────────────────────────────────────────────

@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """Download a processed file from the output directory."""
    filepath = OUTPUT_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(filepath, media_type="application/pdf")


# ─── CLEANUP CRON (runs on startup) ──────────────────────────────────────────

@app.on_event("startup")
async def startup_cleanup():
    """Clean up old temp files on startup."""
    import time
    
    for directory in [TEMP_DIR, UPLOAD_DIR, OUTPUT_DIR]:
        for item in directory.iterdir():
            try:
                # Remove files older than 1 hour
                if time.time() - item.stat().st_mtime > 3600:
                    if item.is_dir():
                        shutil.rmtree(item)
                    else:
                        item.unlink()
            except Exception:
                pass
    
    print("🚀 PDF-BYTE Backend is ready!")
    print(f"   LibreOffice: {'✅' if shutil.which('libreoffice') else '❌'}")
    print(f"   Tesseract:   {'✅' if shutil.which('tesseract') else '❌'}")
    print(f"   Ghostscript: {'✅' if shutil.which('gs') else '❌'}")
    print(f"   qpdf:        {'✅' if shutil.which('qpdf') else '❌'}")


# ─── Run Server ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=7860, reload=True)
