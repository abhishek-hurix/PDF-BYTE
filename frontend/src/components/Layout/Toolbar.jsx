/**
 * Toolbar Component
 * =================
 * Main toolbar: Undo | Redo | Select | Edit Text | Add Image | Crop |
 *               Highlight | Sign | Forms | Shapes | [Page Nav] | [Search]
 */

import { useState, useEffect } from "react";
import useEditorStore from "../../store/editorStore";
import {
  Undo2, Redo2, MousePointer2, Type, ImagePlus,
  Crop, Highlighter, PenTool, FileText, Shapes,
  ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut,
} from "lucide-react";

const TOOLS = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "text", label: "Edit Text", icon: Type, highlight: true },
  { id: "image", label: "Add Image", icon: ImagePlus },
  { id: "crop", label: "Crop", icon: Crop },
  { id: "highlight", label: "Highlight", icon: Highlighter },
  { id: "sign", label: "Sign", icon: PenTool },
  { id: "forms", label: "Forms", icon: FileText },
  { id: "shapes", label: "Shapes", icon: Shapes },
];

export default function Toolbar() {
  const {
    activeTool, setActiveTool,
    currentPage, totalPages, setCurrentPage,
    prevPage, nextPage,
    zoom, zoomIn, zoomOut,
    undo, redo, undoStack, redoStack
  } = useEditorStore();

  const [pageInputValue, setPageInputValue] = useState(currentPage.toString());

  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  const handlePageSubmit = () => {
    let newPage = parseInt(pageInputValue);
    if (isNaN(newPage) || newPage < 1) newPage = 1;
    if (newPage > totalPages && totalPages > 0) newPage = totalPages;
    setCurrentPage(newPage);
    setPageInputValue(newPage.toString());
  };

  return (
    <div className="toolbar">
      {/* Left section: Undo/Redo + Tools */}
      <div className="toolbar-left">
        {/* Undo / Redo */}
        <div className="toolbar-group">
          <button 
            className="toolbar-btn" 
            title="Undo (Ctrl+Z)" 
            onClick={undo}
            disabled={undoStack.length === 0}
          >
            <Undo2 size={18} />
            <span className="toolbar-label">Undo</span>
          </button>
          <button 
            className="toolbar-btn" 
            title="Redo (Ctrl+Y)"
            onClick={redo}
            disabled={redoStack.length === 0}
          >
            <Redo2 size={18} />
            <span className="toolbar-label">Redo</span>
          </button>
        </div>

        <div className="toolbar-separator" />

        {/* Main Tools */}
        <div className="toolbar-group">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                className={`toolbar-btn ${activeTool === tool.id ? "active" : ""} ${tool.highlight && activeTool === tool.id ? "highlight" : ""}`}
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
              >
                <Icon size={18} />
                <span className="toolbar-label">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right section: Page Navigation + Search + Zoom */}
      <div className="toolbar-right">
        {/* Zoom */}
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={zoomOut} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <span className="toolbar-zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="toolbar-btn" onClick={zoomIn} title="Zoom In">
            <ZoomIn size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        {/* Page Navigation */}
        <div className="toolbar-group page-nav">
          <button
            className="toolbar-btn"
            onClick={prevPage}
            disabled={currentPage <= 1}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="page-indicator">
            Page{" "}
            <input
              type="text"
              className="page-input"
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onBlur={handlePageSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePageSubmit();
              }}
            />{" "}
            of {totalPages}
          </span>
          <button
            className="toolbar-btn"
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        {/* Search */}
        <div className="toolbar-search">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
          />
        </div>
      </div>
    </div>
  );
}
