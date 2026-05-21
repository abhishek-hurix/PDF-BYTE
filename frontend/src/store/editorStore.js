/**
 * PDF-BYTE — Editor Store (Zustand)
 * ===================================
 * Central state management for the PDF editor.
 * Undo/redo works on PDF bytes snapshots.
 */

import { create } from "zustand";

const useEditorStore = create((set, get) => ({
  // ─── PDF Document State ──────────────────────────────────────────
  pdfFile: null,
  pdfDocument: null,
  pdfBytes: null,
  fileName: "",
  totalPages: 0,
  currentPage: 1,
  zoom: 1.0,
  isLoading: false,

  // ─── Active Tool ─────────────────────────────────────────────────
  activeTool: "select",

  // ─── Sidebar State ───────────────────────────────────────────────
  leftSidebarTab: "pages",
  leftSidebarOpen: true,
  // ─── Undo/Redo (PDF bytes snapshots) ─────────────────────────────
  undoStack: [],
  redoStack: [],
  needsReload: false,

  // ─── Actions ─────────────────────────────────────────────────────

  setPdfFile: (file) => set({ pdfFile: file, fileName: file.name }),

  setPdfDocument: (doc) => set({ pdfDocument: doc, totalPages: doc.numPages }),

  setPdfBytes: (bytes) => set({ pdfBytes: bytes }),

  setCurrentPage: (page) => {
    const { totalPages } = get();
    if (page >= 1 && page <= totalPages) {
      set({ currentPage: page });
    }
  },

  nextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages) set({ currentPage: currentPage + 1 });
  },

  prevPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) set({ currentPage: currentPage - 1 });
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(5, zoom)) }),
  zoomIn: () => set((s) => ({ zoom: Math.min(5, s.zoom + 0.25) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(0.25, s.zoom - 0.25) })),

  setActiveTool: (tool) => set({ activeTool: tool }),

  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),

  setLoading: (loading) => set({ isLoading: loading }),

  /** Save current PDF bytes to undo stack before making an edit */
  pushUndo: (bytes) => set((s) => ({
    undoStack: [...s.undoStack.slice(-19), bytes],
    redoStack: [],
  })),

  /** Undo: restore previous PDF bytes */
  undo: () => set((s) => {
    if (s.undoStack.length === 0) return s;
    const prev = s.undoStack[s.undoStack.length - 1];
    return {
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, s.pdfBytes],
      pdfBytes: prev,
      needsReload: true,
    };
  }),

  /** Redo: restore next PDF bytes */
  redo: () => set((s) => {
    if (s.redoStack.length === 0) return s;
    const next = s.redoStack[s.redoStack.length - 1];
    return {
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, s.pdfBytes],
      pdfBytes: next,
      needsReload: true,
    };
  }),

  /** Clear the needsReload flag after PDF document has been reloaded */
  clearReload: () => set({ needsReload: false }),

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
      comments: [],
      undoStack: [],
      redoStack: [],
      needsReload: false,
    }),
}));

export default useEditorStore;
