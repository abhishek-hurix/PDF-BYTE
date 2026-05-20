/**
 * PDF-BYTE — Main Application
 * =============================
 * Assembles the full PDF editor layout:
 * MenuBar → Toolbar → [LeftSidebar | PDFViewer | RightSidebar]
 */

import { useEffect, useCallback } from "react";
import useEditorStore from "./store/editorStore";
import { loadPdf } from "./utils/pdfUtils";
import { checkHealth } from "./config/api";

import MenuBar from "./components/Layout/MenuBar";
import Toolbar from "./components/Layout/Toolbar";
import LeftSidebar from "./components/Sidebar/LeftSidebar";
import RightSidebar from "./components/Sidebar/RightSidebar";
import PDFViewer from "./components/Canvas/PDFViewer";

import "./index.css";

export default function App() {
  const {
    setPdfFile, setPdfDocument, setPdfBytes,
    setLoading, setBackendStatus,
    leftSidebarOpen, rightSidebarOpen,
  } = useEditorStore();

  /** Handle PDF file open */
  const handleOpenPdf = useCallback(async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) return;

    setLoading(true);
    try {
      // Store original file
      setPdfFile(file);

      // Read file bytes
      const arrayBuffer = await file.arrayBuffer();
      setPdfBytes(arrayBuffer);

      // Load with PDF.js
      const pdfDoc = await loadPdf(arrayBuffer.slice(0));
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

  /** Check backend health on mount */
  useEffect(() => {
    checkHealth().then((res) => {
      setBackendStatus(res.status === "healthy" ? "healthy" : "offline");
    });
  }, [setBackendStatus]);

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

        <main className={`main-canvas ${!leftSidebarOpen ? "no-left" : ""} ${!rightSidebarOpen ? "no-right" : ""}`}>
          <PDFViewer />
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}
