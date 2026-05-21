/**
 * MenuBar Component
 * =================
 * Top menu bar: File | Edit | View | Insert | Format | Pages | Comment | Share
 */

import { useState } from "react";
import useEditorStore from "../../store/editorStore";
import { MessageSquare } from "lucide-react";

const MENUS = [
  {
    label: "File",
    items: [
      { label: "Open PDF...", action: "open", shortcut: "Ctrl+O" },
      { label: "Save", action: "save", shortcut: "Ctrl+S" },
      { label: "Save As...", action: "saveAs", shortcut: "Ctrl+Shift+S" },
      { divider: true },
      { label: "Merge PDFs...", action: "merge" },
      { label: "Import Office File...", action: "importOffice" },
      { label: "Import Images...", action: "importImages" },
      { divider: true },
      { label: "Export as Word", action: "exportWord" },
      { label: "Export as Excel", action: "exportExcel" },
      { label: "Export as PowerPoint", action: "exportPptx" },
      { label: "Export as Images", action: "exportImages" },
      { divider: true },
      { label: "Compress PDF", action: "compress" },
      { label: "Repair PDF", action: "repair" },
      { divider: true },
      { label: "Protect with Password...", action: "encrypt" },
      { label: "Remove Password...", action: "decrypt" },
      { divider: true },
      { label: "Properties...", action: "properties" },
    ],
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", action: "undo", shortcut: "Ctrl+Z" },
      { label: "Redo", action: "redo", shortcut: "Ctrl+Y" },
      { divider: true },
      { label: "Find & Replace...", action: "findReplace", shortcut: "Ctrl+H" },
      { divider: true },
      { label: "OCR (Scan → Text)", action: "ocr" },
      { label: "Deskew Pages", action: "deskew" },
    ],
  },
  {
    label: "View",
    items: [
      { label: "Zoom In", action: "zoomIn", shortcut: "Ctrl+=" },
      { label: "Zoom Out", action: "zoomOut", shortcut: "Ctrl+-" },
      { label: "Fit to Width", action: "fitWidth" },
      { label: "Fit to Page", action: "fitPage" },
      { divider: true },
      { label: "Toggle Left Sidebar", action: "toggleLeft" },
      { label: "Toggle Right Sidebar", action: "toggleRight" },
    ],
  },
  {
    label: "Insert",
    items: [
      { label: "Text Box", action: "insertText" },
      { label: "Image...", action: "insertImage" },
      { label: "Link...", action: "insertLink" },
      { label: "Shape", action: "insertShape" },
      { divider: true },
      { label: "Watermark...", action: "watermark" },
      { label: "Header & Footer...", action: "headerFooter" },
      { label: "Page Numbers...", action: "pageNumbers" },
      { label: "Bates Numbering...", action: "batesNumber" },
      { divider: true },
      { label: "Whiteout", action: "whiteout" },
    ],
  },
  {
    label: "Format",
    items: [
      { label: "Flatten Forms", action: "flatten" },
      { label: "Convert to Grayscale", action: "grayscale" },
    ],
  },
  {
    label: "Pages",
    items: [
      { label: "Add Blank Page", action: "addBlank" },
      { label: "Delete Page", action: "deletePage" },
      { label: "Rotate Page", action: "rotatePage" },
      { divider: true },
      { label: "Extract Pages...", action: "extractPages" },
      { label: "Split PDF...", action: "splitPdf" },
      { divider: true },
      { label: "Crop Pages...", action: "cropPages" },
      { label: "Resize Pages...", action: "resizePages" },
      { label: "N-up Printing...", action: "nup" },
    ],
  },

  {
    label: "Share",
    items: [
      { label: "Share Link...", action: "shareLink" },
      { label: "Export & Send...", action: "exportSend" },
    ],
  },
];

export default function MenuBar() {
  const [activeMenu, setActiveMenu] = useState(null);
  const fileName = useEditorStore((s) => s.fileName);

  const handleMenuClick = (menuLabel) => {
    setActiveMenu(activeMenu === menuLabel ? null : menuLabel);
  };

  const handleAction = (action) => {
    setActiveMenu(null);
    // TODO: Dispatch actions via store or event system
    console.log("Menu action:", action);
  };

  return (
    <div className="menu-bar">
      <div className="menu-bar-title">
        <span className="menu-bar-logo">PDF-BYTE</span>
        {fileName && (
          <>
            <span className="menu-bar-separator">|</span>
            <span className="menu-bar-filename">{fileName}</span>
          </>
        )}
      </div>

      <nav className="menu-bar-nav">
        {MENUS.map((menu) => (
          <div
            key={menu.label}
            className={`menu-item ${activeMenu === menu.label ? "active" : ""}`}
            onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
          >
            <button
              className="menu-item-button"
              onClick={() => handleMenuClick(menu.label)}
            >
              {menu.label}
            </button>

            {activeMenu === menu.label && (
              <div className="menu-dropdown">
                {menu.items.map((item, i) =>
                  item.divider ? (
                    <div key={i} className="menu-divider" />
                  ) : (
                    <button
                      key={item.action}
                      className="menu-dropdown-item"
                      onClick={() => handleAction(item.action)}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="menu-shortcut">{item.shortcut}</span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </nav>



      {/* Close menu when clicking outside */}
      {activeMenu && (
        <div className="menu-overlay" onClick={() => setActiveMenu(null)} />
      )}
    </div>
  );
}
