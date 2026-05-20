FROM python:3.11-slim

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV GRADIO_SERVER_NAME=0.0.0.0
ENV PORT=7860

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # LibreOffice for PDF <-> Office conversion
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    # Tesseract OCR for scanned PDFs
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-hin \
    # Ghostscript for PDF compression/optimization
    ghostscript \
    # qpdf for PDF repair, encryption, decryption
    qpdf \
    # poppler-utils for PDF utilities (pdftotext, pdftoppm, etc.)
    poppler-utils \
    # Image processing
    libmagic1 \
    # Fonts for proper PDF rendering
    fonts-liberation \
    fonts-dejavu-core \
    fonts-noto \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements first (for Docker cache optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for temporary file processing
RUN mkdir -p /app/temp /app/uploads /app/outputs

# Expose the port HF Spaces expects
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Run the FastAPI server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
