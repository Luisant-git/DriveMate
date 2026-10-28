import React, { useState } from 'react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string | null;
  entityName?: string;
  onDownload?: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
  entityName,
  onDownload
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!isOpen || !url) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const isPdf = url.toLowerCase().includes('.pdf');

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">{title}</h3>
              {entityName && (
                <p className="text-xs text-gray-500 font-medium">Owner: {entityName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View external tab */}
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-black hover:bg-gray-200/60 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
              title="Open full image in new tab"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="hidden sm:inline">New Tab</span>
            </a>

            {/* Download button */}
            {onDownload && (
              <button
                onClick={onDownload}
                className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Download this file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-200/70 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition active:scale-95 ml-2"
              title="Close viewer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Toolbar for image controls (zoom, rotate) */}
        {!isPdf && (
          <div className="px-6 py-2 bg-white border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span className="font-medium text-gray-500">Zoom: {Math.round(zoom * 100)}%</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleZoomOut} 
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                title="Zoom Out"
                disabled={zoom <= 0.5}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button 
                onClick={handleZoomIn} 
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                title="Zoom In"
                disabled={zoom >= 3}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button 
                onClick={handleRotate} 
                className="p-1.5 hover:bg-gray-100 rounded-lg transition ml-1"
                title="Rotate 90deg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button 
                onClick={handleReset} 
                className="px-2 py-1 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition ml-1"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 bg-gray-900/5 p-4 sm:p-6 overflow-auto flex items-center justify-center min-h-[350px]">
          {isPdf ? (
            <iframe 
              src={url} 
              title={title}
              className="w-full h-[600px] rounded-xl border border-gray-200 bg-white"
            />
          ) : (
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              {loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {error ? (
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-red-100">
                  <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-800">Failed to display document</p>
                  <p className="text-xs text-gray-500 mt-1">The image file could not be loaded directly.</p>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-block mt-3 px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition"
                  >
                    Open in New Tab
                  </a>
                </div>
              ) : (
                <img
                  src={url}
                  alt={title}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease'
                  }}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-md border border-gray-200/80 bg-white"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
