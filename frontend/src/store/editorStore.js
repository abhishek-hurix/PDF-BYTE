/**
 * PDF-BYTE — Editor Store (Zustand)
 * ===================================
 * Central state management for the PDF editor.
 */

import { create } from "zustand";

const useEditorStore = create((set, get) => ({
  // ─── PDF Document State ──────────────────────────────────────────
  pdfFile: null,           // Original File object
  pdfDocument: null,       // PDF.js document proxy
  pdfBytes: null,          // ArrayBuffer of current PDF
  fileName: "",            // Current file name
  totalPages: 0,           // Total page count
  currentPage: 1,          // Currently viewed page (1-indexed)
  zoom: 1.0,               // Zoom level (1.0 = 100%)
  isLoading: false,        // PDF loading state

  // ─── Active Tool ─────────────────────────────────────────────────
  activeTool: "select",    // Current active tool: select, text, image, crop, highlight, sign, forms, shapes, draw
  
  // ─── Sidebar State ───────────────────────────────────────────────
  leftSidebarTab: "pages",      // pages | layers | bookmarks
  leftSidebarOpen: true,        // Is left sidebar visible
  rightSidebarOpen: true,       // Is right sidebar visible
  rightSidebarTab: "comments",  // comments | properties

  // ─── Annotations & Objects per page ──────────────────────────────
  annotations: {},  // { pageNum: [annotation objects] }
  
  // ─── Comments ────────────────────────────────────────────────────
  comments: [],     // Array of comment objects

  // ─── Undo/Redo History ───────────────────────────────────────────
  history: [],
  historyIndex: -1,

  // ─── Backend Status ──────────────────────────────────────────────
  backendStatus: "unknown",  // unknown | healthy | offline

  // ─── Actions ─────────────────────────────────────────────────────

  /** Load a PDF file */
  setPdfFile: (file) => set({ pdfFile: file, fileName: file.name }),

  /** Set the PDF.js document proxy */
  setPdfDocument: (doc) => set({ pdfDocument: doc, totalPages: doc.numPages }),

  /** Set PDF bytes (for pdf-lib operations) */
  setPdfBytes: (bytes) => set({ pdfBytes: bytes }),

  /** Navigate to a specific page */
  setCurrentPage: (page) => {
    const { totalPages } = get();
    if (page >= 1 && page <= totalPages) {
      set({ currentPage: page });
    }
  },

  /** Go to next page */
  nextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 });
    }
  },

  /** Go to previous page */
  prevPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 });
    }
  },

  /** Set zoom level */
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(5, zoom)) }),
  zoomIn: () => set((s) => ({ zoom: Math.min(5, s.zoom + 0.25) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(0.25, s.zoom - 0.25) })),

  /** Set active editing tool */
  setActiveTool: (tool) => set({ activeTool: tool }),

  /** Toggle sidebars */
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),

  /** Set loading state */
  setLoading: (loading) => set({ isLoading: loading }),

  /** Set backend status */
  setBackendStatus: (status) => set({ backendStatus: status }),

  /** Set active editing tool */
  setActiveTool: (tool) => set({ activeTool: tool }),

  /** Toggle sidebars */
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),

  /** Set loading state */
  setLoading: (loading) => set({ isLoading: loading }),

  /** Set backend status */
  setBackendStatus: (status) => set({ backendStatus: status }),

  /** Save Fabric.js canvas JSON for a specific page */
  savePageAnnotations: (pageNum, json) => set((s) => ({
    annotations: {
      ...s.annotations,
      [pageNum]: json,
    },
  })),

  /** Add a comment */
  addComment: (comment) => {
    set((s) => ({
      comments: [
        ...s.comments,
        {
          id: Date.now(),
          author: "You",
          text: comment.text,
          page: comment.page || s.currentPage,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  },

  /** Reset editor state */
  resetEditor: () =>
    set({
      pdfFile: null,
      pdfDocument: null,
      pdfBytes: null,
      fileName: "",
      totalPages: 0,
      currentPage: 1,
      zoom: 1.0,
      activeTool: "select",
      annotations: {},
      comments: [],
      history: [],
      historyIndex: -1,
    }),
}));

export default useEditorStore;
