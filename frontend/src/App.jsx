/**
 * PDF-BYTE — Main Application
 * =============================
 * Assembles the full PDF editor layout:
 * MenuBar → Toolbar → [LeftSidebar | PDFViewer | RightSidebar]
 */

import { useEffect, useCallback } from "react";
import useEditorStore from "./store/editorStore";
import { loadPdf } from "./utils/pdfUtils";

import MenuBar from "./components/Layout/MenuBar";
import Toolbar from "./components/Layout/Toolbar";
import LeftSidebar from "./components/Sidebar/LeftSidebar";
import PDFViewer from "./components/Canvas/PDFViewer";

import "./index.css";

export default function App() {
  const {
    setPdfFile, setPdfDocument, setPdfBytes,
    setLoading, leftSidebarOpen,
  } = useEditorStore();

  /** Handle PDF file open */
  const handleOpenPdf = useCallback(async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) return;

    setLoading(true);
    try {
      // Store original file
      setPdfFile(file);

      // Read file bytes — store as Uint8Array so it's never detached
      const arrayBuffer = await file.arrayBuffer();
      const bytesForStore = new Uint8Array(arrayBuffer);
      setPdfBytes(bytesForStore);

      // Load with PDF.js (give it its own copy)
      const pdfDoc = await loadPdf(new Uint8Array(arrayBuffer));
      setPdfDocument(pdfDoc);
    } catch (error) {
      console.error("Failed to load PDF:", error);
      alert("Failed to load PDF file. It may be corrupted or password-protected.");
    } finally {
      setLoading(false);
    }
  }, [setPdfFile, setPdfDocument, setPdfBytes, setLoading]);

  /** Listen for file selection events */
  useEffect(() => {
    const handler = (e) => handleOpenPdf(e.detail);
    window.addEventListener("pdf-file-selected", handler);
    return () => window.removeEventListener("pdf-file-selected", handler);
  }, [handleOpenPdf]);

  /** Drag & drop support */
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleOpenPdf(file);
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, [handleOpenPdf]);

  /** Keyboard shortcuts */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "o":
            e.preventDefault();
            document.querySelector('input[type="file"]')?.click();
            break;
          case "z":
            e.preventDefault();
            // TODO: undo
            break;
          case "y":
            e.preventDefault();
            // TODO: redo
            break;
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="app">
      {/* Top Section */}
      <MenuBar />
      <Toolbar />

      {/* Main Workspace */}
      <div className="workspace">
        <LeftSidebar />

        <main className={`main-canvas ${!leftSidebarOpen ? "no-left" : ""}`}>
          <PDFViewer />
        </main>
      </div>
    </div>
  );
}
