/**
 * Left Sidebar Component
 * =======================
 * Tabs: Pages (thumbnails) | Layers | Bookmarks
 */

import { useState, useEffect } from "react";
import useEditorStore from "../../store/editorStore";
import { generateThumbnail } from "../../utils/pdfUtils";
import { FileText, Layers, Bookmark, Settings } from "lucide-react";

const TABS = [
  { id: "pages", label: "Pages", icon: FileText },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
];

export default function LeftSidebar() {
  const {
    leftSidebarOpen, leftSidebarTab, setLeftSidebarTab,
    pdfDocument, totalPages, currentPage, setCurrentPage,
  } = useEditorStore();

  const [thumbnails, setThumbnails] = useState({});

  // Generate thumbnails when PDF loads
  useEffect(() => {
    if (!pdfDocument) return;

    const generateAll = async () => {
      const thumbs = {};
      for (let i = 1; i <= totalPages; i++) {
        try {
          thumbs[i] = await generateThumbnail(pdfDocument, i, 140);
        } catch (e) {
          console.error(`Thumbnail error page ${i}:`, e);
        }
      }
      setThumbnails(thumbs);
    };

    generateAll();
  }, [pdfDocument, totalPages]);

  if (!leftSidebarOpen) return null;

  return (
    <aside className="left-sidebar">
      {/* Tabs */}
      <div className="sidebar-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`sidebar-tab ${leftSidebarTab === tab.id ? "active" : ""}`}
              onClick={() => setLeftSidebarTab(tab.id)}
              title={tab.label}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="sidebar-content">
        {/* Pages Tab */}
        {leftSidebarTab === "pages" && (
          <div className="pages-list">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                className={`page-thumbnail ${currentPage === pageNum ? "active" : ""}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {thumbnails[pageNum] ? (
                  <img
                    src={thumbnails[pageNum]}
                    alt={`Page ${pageNum}`}
                    className="thumbnail-img"
                  />
                ) : (
                  <div className="thumbnail-placeholder">
                    <FileText size={24} />
                  </div>
                )}
                <span className="page-number">{pageNum}</span>
              </div>
            ))}
          </div>
        )}

        {/* Layers Tab */}
        {leftSidebarTab === "layers" && (
          <div className="layers-panel">
            <p className="sidebar-empty">No layers detected</p>
          </div>
        )}

        {/* Bookmarks Tab */}
        {leftSidebarTab === "bookmarks" && (
          <div className="bookmarks-panel">
            <p className="sidebar-empty">No bookmarks found</p>
          </div>
        )}
      </div>

      {/* Settings icon at bottom */}
      <div className="sidebar-footer">
        <button className="sidebar-settings-btn" title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
}
