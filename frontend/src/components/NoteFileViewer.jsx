import React, { useState } from 'react';
import { X, ExternalLink, FileText, ZoomIn } from 'lucide-react';

/**
 * Full-screen viewer for the original file behind a Note.
 * - Images: open full screen, object-contain, native pinch-zoom (the app's
 *   viewport allows scaling) plus a double-tap/click to toggle a 2x zoom.
 * - PDFs: embedded via <iframe> when possible, with an always-visible
 *   "Open in system viewer" fallback link (handles Android WebViews that
 *   can't render embedded PDFs).
 *
 * Always reuses `note.fileUrl` (the existing Cloudinary URL) - never
 * re-uploads or re-fetches the file from anywhere else.
 */
export default function NoteFileViewer({ note, onClose }) {
  const [zoomed, setZoomed] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);

  if (!note) return null;

  const isImage = note.fileType === 'image';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 animate-fade-in">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 p-3 sm:p-4">
        <p className="min-w-0 truncate text-sm font-medium text-white/90">{note.originalFileName}</p>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={note.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Open in system viewer</span>
          </a>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-auto" style={{ touchAction: 'pinch-zoom pan-x pan-y' }}>
        {isImage ? (
          <div
            className="flex min-h-full min-w-full items-center justify-center p-2 sm:p-6"
            onClick={() => setZoomed((z) => !z)}
          >
            <img
              src={note.fileUrl}
              alt={note.originalFileName}
              className={`max-h-full max-w-full select-none rounded-md object-contain transition-transform duration-300 ${
                zoomed ? 'scale-[2] cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              draggable={false}
            />
          </div>
        ) : !iframeFailed ? (
          <iframe
            src={note.fileUrl}
            title={note.originalFileName}
            className="h-full w-full border-0 bg-white"
            onError={() => setIframeFailed(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center text-white/80">
            <FileText size={48} />
            <p className="max-w-xs text-sm">
              This PDF can't be previewed inline. Use the system viewer to open the original file.
            </p>
            <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <ExternalLink size={16} /> Open PDF
            </a>
          </div>
        )}

        {isImage && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] text-white/80">
            <ZoomIn size={12} />
            Pinch, or tap to zoom
          </div>
        )}
      </div>
    </div>
  );
}
