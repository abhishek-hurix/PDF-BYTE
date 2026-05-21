/**
 * PDFViewer Component — Multi-page, Real-time Editing
 * =====================================================
 * - Shows ALL pages scrollable vertically
 * - Text editing: hover → blue border, click → edit inline
 * - Changes applied IMMEDIATELY to PDF bytes (real-time)
 * - Undo/Redo via PDF bytes history
 */

import { useRef, useEffect, useCallback, useState, memo } from "react";
import useEditorStore from "../../store/editorStore";
import { renderPage, extractTextItems, replaceTextInPdf, loadPdf } from "../../utils/pdfUtils";

// ── Single Page Component ───────────────────────────────────────────
const PDFPageView = memo(function PDFPageView({ pdfDocument, pageNum, scale, onTextEdit }) {
  const activeTool = useEditorStore((state) => state.activeTool);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [textItems, setTextItems] = useState([]);

  const renderTaskRef = useRef(null);

  // Render the page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;
    let cancelled = false;

    const render = async () => {
      // Wait for any previous render task to fully abort/finish
      if (renderTaskRef.current) {
        try {
          await renderTaskRef.current.promise;
        } catch (e) {
          // ignore previous cancellations
        }
      }
      if (cancelled) return;

      let result;
      try {
        result = await renderPage(pdfDocument, pageNum, canvasRef.current, scale);
        renderTaskRef.current = result.renderTask;
        const viewport = result.viewport;
        
        await result.renderTask.promise;

        if (cancelled) return;
        const items = await extractTextItems(pdfDocument, pageNum, scale);
        if (cancelled) return;
        setTextItems(items);
      } catch (e) {
        if (e.name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNum}:`, e);
        }
      } finally {
        if (renderTaskRef.current === result?.renderTask) {
          renderTaskRef.current = null;
        }
      }
    };

    render();
    return () => { 
      cancelled = true; 
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDocument, pageNum, scale]);

  // Click to edit
  const handleClick = useCallback((e) => {
    const span = e.target.closest(".pdf-text-span");
    if (!span || span.contentEditable === "true") return;

    span.contentEditable = "true";
    span.style.color = "#000";
    span.style.background = "rgba(255, 255, 255, 0.97)";
    span.style.border = "2px dashed #2196F3";
    span.style.outline = "none";
    span.style.zIndex = "10";
    span.focus();

    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, []);

  // Save on blur
  const handleBlur = useCallback((e) => {
    const span = e.target;
    if (!span.classList?.contains("pdf-text-span") || span.contentEditable !== "true") return;

    span.contentEditable = "false";
    span.style.zIndex = "";
    span.style.border = "";
    span.style.background = "";
    span.style.color = "transparent";
    span.style.cursor = "";

    const idx = parseInt(span.dataset.index);
    const item = textItems[idx];
    if (!item) return;

    const newText = span.textContent || "";
    if (newText !== item.text && newText.trim()) {
      onTextEdit(pageNum, item, newText);
    }
  }, [textItems, pageNum, onTextEdit]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      const span = document.activeElement;
      if (span?.classList?.contains("pdf-text-span")) {
        const idx = parseInt(span.dataset.index);
        const item = textItems[idx];
        if (item) span.textContent = item.text;
        span.blur();
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.activeElement?.blur();
    }
  }, [textItems]);

  return (
    <div className="pdf-page-container">
      <div className="pdf-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="pdf-canvas"
        />

        {/* Text overlay for editing */}
        <div
          ref={overlayRef}
          className={`pdf-text-overlay ${activeTool === "text" ? "text-mode" : ""}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            zIndex: 2,
            pointerEvents: activeTool === "text" ? "auto" : "none",
          }}
          onClick={handleClick}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        >
          {textItems.map((item, idx) =>
            item.text && item.text.trim() ? (
              <span
                key={idx}
                className="pdf-text-span"
                data-index={idx}
                style={{
                  position: "absolute",
                  left: item.x + "px",
                  top: item.y + "px",
                  width: item.width + "px",
                  height: item.height + "px",
                  display: "inline-block",
                  fontSize: item.fontSize + "px",
                  fontFamily: "sans-serif",
                  lineHeight: "1",
                  color: "transparent",
                  whiteSpace: "pre",
                  cursor: "default",
                  padding: "0",
                  boxSizing: "border-box",
                }}
              >
                {item.text}
              </span>
            ) : null
          )}
        </div>
      </div>

      <div className="page-number-label">{pageNum}</div>
    </div>
  );
});

// ── Main PDFViewer ──────────────────────────────────────────────────
export default function PDFViewer() {
  const containerRef = useRef(null);
  const {
    pdfDocument, totalPages, zoom, isLoading,
    activeTool, needsReload,
  } = useEditorStore();

  const scale = zoom * 1.5;

  // Handle undo/redo reload
  useEffect(() => {
    if (!needsReload) return;
    const bytes = useEditorStore.getState().pdfBytes;
    if (!bytes) return;

    loadPdf(bytes).then((doc) => {
      useEditorStore.getState().setPdfDocument(doc);
      useEditorStore.getState().clearReload();
    }).catch((e) => {
      console.error("Failed to reload PDF after undo/redo:", e);
      useEditorStore.getState().clearReload();
    });
  }, [needsReload]);

  // Real-time text edit handler
  const handleTextEdit = useCallback(async (pageNum, item, newText) => {
    const store = useEditorStore.getState();
    if (!store.pdfBytes) return;

    // Save current state for undo
    store.pushUndo(store.pdfBytes);
    store.setLoading(true);

    try {
      const newBytes = await replaceTextInPdf(store.pdfBytes, pageNum, item, newText);
      const newDoc = await loadPdf(newBytes);

      // Apply immediately
      useEditorStore.setState({
        pdfBytes: newBytes,
        pdfDocument: newDoc,
        isLoading: false,
      });
    } catch (e) {
      console.error("Failed to apply text edit:", e);
      useEditorStore.setState({ isLoading: false });
    }
  }, []);

  // Build page list
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="pdf-viewer" ref={containerRef}>
      {isLoading && (
        <div className="pdf-loading-overlay">
          <div className="loading-spinner" />
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
        <div className="pdf-pages-scroll">
          {pages.map((pageNum) => (
            <PDFPageView
              key={pageNum}
              pdfDocument={pdfDocument}
              pageNum={pageNum}
              scale={scale}
              onTextEdit={handleTextEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
