/**
 * PDFViewer Component
 * ====================
 * Main canvas area that renders the PDF using PDF.js and overlays
 * a Fabric.js canvas for drawing, text, and annotations.
 */

import { useRef, useEffect, useCallback, useState } from "react";
import useEditorStore from "../../store/editorStore";
import { renderPage } from "../../utils/pdfUtils";
import * as fabric from "fabric";

export default function PDFViewer() {
  const containerRef = useRef(null);
  const pdfCanvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fabricInstanceRef = useRef(null);

  const {
    pdfDocument, currentPage, zoom, isLoading,
    activeTool, getPageAnnotations, savePageAnnotations,
  } = useEditorStore();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 1. Render PDF and setup dimensions
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDocument || !pdfCanvasRef.current) return;

    try {
      const viewport = await renderPage(pdfDocument, currentPage, pdfCanvasRef.current, zoom * 1.5);
      
      setDimensions({ width: viewport.width, height: viewport.height });
    } catch (error) {
      console.error("Error rendering PDF page:", error);
    }
  }, [pdfDocument, currentPage, zoom]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // 2. Initialize Fabric.js Canvas once dimensions are set
  useEffect(() => {
    if (!fabricCanvasRef.current || dimensions.width === 0) return;

    // Destroy existing instance if it exists
    if (fabricInstanceRef.current) {
      fabricInstanceRef.current.dispose();
    }

    // Initialize new Fabric canvas
    const canvas = new fabric.Canvas(fabricCanvasRef.current, {
      width: dimensions.width,
      height: dimensions.height,
      selection: true,
    });
    fabricInstanceRef.current = canvas;

    // Load saved annotations for this page if they exist
    const savedAnnotations = getPageAnnotations(currentPage);
    if (savedAnnotations) {
      canvas.loadFromJSON(savedAnnotations, () => {
        canvas.renderAll();
      });
    }

    // Event listener to save state on changes
    const saveState = () => {
      savePageAnnotations(currentPage, canvas.toJSON());
    };

    canvas.on('object:added', saveState);
    canvas.on('object:modified', saveState);
    canvas.on('object:removed', saveState);
    canvas.on('path:created', saveState);

    return () => {
      canvas.dispose();
      fabricInstanceRef.current = null;
    };
  }, [dimensions, currentPage, getPageAnnotations, savePageAnnotations]);

  // 3. Update Fabric interactions based on activeTool
  useEffect(() => {
    const canvas = fabricInstanceRef.current;
    if (!canvas) return;

    // Reset modes
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.forEachObject((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });

    if (activeTool === "sign" || activeTool === "highlight") {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      if (activeTool === "highlight") {
        brush.color = "rgba(255, 235, 59, 0.5)"; // Translucent yellow
        brush.width = 16 * zoom;
      } else {
        brush.color = "black";
        brush.width = 2 * zoom;
      }
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "select") {
      // Default selection mode
    } else if (activeTool === "text") {
      // We will handle text addition via click events later
      canvas.selection = false;
    }

    // Custom click handler for adding text/shapes
    const handleMouseUp = (opt) => {
      if (activeTool === "text" && !opt.target) {
        const text = new fabric.IText("Type here", {
          left: opt.pointer.x,
          top: opt.pointer.y,
          fontFamily: "Inter",
          fontSize: 20 * zoom,
          fill: "black",
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        savePageAnnotations(currentPage, canvas.toJSON());
      }
    };

    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [activeTool, currentPage, zoom, savePageAnnotations]);


  return (
    <div className="pdf-viewer" ref={containerRef}>
      {isLoading && (
        <div className="pdf-loading">
          <div className="loading-spinner" />
          <p>Loading PDF...</p>
        </div>
      )}

      {!pdfDocument && !isLoading && (
        <div className="pdf-empty-state">
          <div className="empty-icon">📄</div>
          <h2>Open a PDF to get started</h2>
          <p>Drag & drop a PDF file here, or use File → Open</p>
          <label className="open-file-btn">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  window.dispatchEvent(
                    new CustomEvent("pdf-file-selected", { detail: file })
                  );
                }
              }}
              hidden
            />
            Open PDF File
          </label>
        </div>
      )}

      {pdfDocument && (
        <div 
          className="pdf-canvas-wrapper" 
          style={{ width: dimensions.width, height: dimensions.height, position: "relative" }}
        >
          {/* Base PDF Canvas */}
          <canvas 
            ref={pdfCanvasRef} 
            className="pdf-canvas" 
            style={{ position: "absolute", left: 0, top: 0, zIndex: 1 }} 
          />
          
          {/* Fabric.js Annotation Layer */}
          <div style={{ position: "absolute", left: 0, top: 0, zIndex: 2 }}>
            <canvas ref={fabricCanvasRef} />
          </div>
        </div>
      )}
    </div>
  );
}
