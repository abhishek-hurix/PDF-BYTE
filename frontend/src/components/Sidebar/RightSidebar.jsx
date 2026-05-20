/**
 * Right Sidebar Component
 * ========================
 * Comments & Collaboration panel matching the screenshot design.
 * Shows: Live activity, user avatars, comment threads, recent edits.
 */

import { useState } from "react";
import useEditorStore from "../../store/editorStore";
import { MessageSquare, X, Send, Settings } from "lucide-react";

export default function RightSidebar() {
  const {
    rightSidebarOpen, toggleRightSidebar,
    comments, addComment, currentPage,
  } = useEditorStore();

  const [newComment, setNewComment] = useState("");

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addComment({ text: newComment.trim(), page: currentPage });
    setNewComment("");
  };

  if (!rightSidebarOpen) return null;

  return (
    <aside className="right-sidebar">
      {/* Header */}
      <div className="right-sidebar-header">
        <h3>Comments & Collaboration</h3>
        <button className="close-btn" onClick={toggleRightSidebar} title="Close">
          <X size={16} />
        </button>
      </div>

      {/* Live Activity */}
      <div className="live-activity">
        <div className="live-activity-header">
          <span className="live-dot" />
          <span>Live activity</span>
        </div>
        <div className="user-avatars">
          {/* Placeholder avatars */}
          <div className="avatar" style={{ background: "#2563EB" }}>Y</div>
        </div>
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <MessageSquare size={32} strokeWidth={1} />
            <p>No comments yet</p>
            <span>Add a comment to start collaborating</span>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-avatar" style={{ background: "#2563EB" }}>
                  {comment.author[0]}
                </div>
                <div className="comment-meta">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-time">
                    {new Date(comment.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <p className="comment-text">{comment.text}</p>
              {comment.page && (
                <span className="comment-page">Page {comment.page}</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Comment Input */}
      <div className="comment-input-area">
        <input
          type="text"
          className="comment-input"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
        />
        <button
          className="comment-send-btn"
          onClick={handleSubmitComment}
          disabled={!newComment.trim()}
          title="Send"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Recent Edits */}
      <div className="recent-edits">
        <span className="recent-edits-label">Recent Edits: You</span>
      </div>

      {/* Property Panel Toggle */}
      <div className="property-panel-toggle">
        <button className="property-btn" title="Property Panel">
          <Settings size={16} />
        </button>
      </div>
    </aside>
  );
}
