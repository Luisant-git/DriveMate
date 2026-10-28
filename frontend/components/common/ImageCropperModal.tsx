import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  documentTitle: string;
  defaultAspectRatio?: '1:1' | '4:3' | '3:2' | 'free';
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => Promise<void> | void;
  onUploadOriginal?: () => Promise<void> | void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  documentTitle,
  defaultAspectRatio = '4:3',
  onClose,
  onCropComplete,
  onUploadOriginal
}) => {
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '3:2' | 'free'>(defaultAspectRatio);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when a new image is opened
  useEffect(() => {
    if (isOpen) {
      setAspectRatio(defaultAspectRatio);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setIsProcessing(false);
    }
  }, [isOpen, imageSrc, defaultAspectRatio]);

  // Handle Drag / Pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Perform crop using Canvas
  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !containerRef.current) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const cropBox = containerRef.current.getBoundingClientRect();
      
      // Calculate crop frame dimensions
      let cropWidth = Math.min(cropBox.width - 40, 420);
      let cropHeight = cropWidth;

      if (aspectRatio === '4:3') {
        cropHeight = cropWidth * (3 / 4);
      } else if (aspectRatio === '3:2') {
        cropHeight = cropWidth * (2 / 3);
      } else if (aspectRatio === 'free') {
        cropHeight = Math.min(cropBox.height - 40, 320);
      }

      // Desired output resolution (clean HD)
      const outputWidth = Math.max(800, cropWidth * 2);
      const outputHeight = (cropHeight / cropWidth) * outputWidth;

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill with clean white background in case of transparent borders
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      // Translate to canvas center
      ctx.translate(outputWidth / 2, outputHeight / 2);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Calculate scale relative to preview container
      const scaleFactor = outputWidth / cropWidth;
      const displayedWidth = img.naturalWidth * (img.width / img.naturalWidth) * zoom * scaleFactor;
      const displayedHeight = img.naturalHeight * (img.height / img.naturalHeight) * zoom * scaleFactor;

      // Draw transformed image
      ctx.drawImage(
        img,
        -displayedWidth / 2 + pan.x * scaleFactor,
        -displayedHeight / 2 + pan.y * scaleFactor,
        displayedWidth,
        displayedHeight
      );

      // Convert to blob
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          const previewUrl = URL.createObjectURL(blob);
          await onCropComplete(blob, previewUrl);
          setIsProcessing(false);
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Cropping failed:', err);
      setIsProcessing(false);
      alert('Failed to crop image. Please try again.');
    }
  }, [aspectRatio, zoom, rotation, pan, onCropComplete]);

  if (!isOpen || !imageSrc) return null;

  // Visual aspect ratio dimensions
  const getCropBoxStyles = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'w-64 h-64 sm:w-80 sm:h-80';
      case '4:3':
        return 'w-72 h-54 sm:w-96 sm:h-72';
      case '3:2':
        return 'w-72 h-48 sm:w-96 sm:h-64';
      case 'free':
      default:
        return 'w-72 h-64 sm:w-[420px] sm:h-72';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                Crop & Adjust: {documentTitle}
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                Drag to position, use controls to zoom or rotate
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-200/80 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition active:scale-95"
            title="Cancel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="px-5 py-2.5 bg-gray-100/60 border-b border-gray-200/60 flex items-center justify-between flex-wrap gap-2 text-xs font-semibold">
          <span className="text-gray-500 text-[11px] uppercase tracking-wide">Aspect Ratio:</span>
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setAspectRatio('1:1')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                aspectRatio === '1:1' ? 'bg-black text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              1:1 (Photo)
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('4:3')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                aspectRatio === '4:3' ? 'bg-black text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              4:3 (Card / DL)
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('3:2')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                aspectRatio === '3:2' ? 'bg-black text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              3:2 (ID)
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('free')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                aspectRatio === 'free' ? 'bg-black text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Free
            </button>
          </div>
        </div>

        {/* Cropping Canvas / Viewport Area */}
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-80 sm:h-96 bg-neutral-900 flex items-center justify-center overflow-hidden cursor-move select-none"
        >
          {/* Target Image being manipulated */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source for cropping"
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              maxWidth: 'none',
              maxHeight: 'none'
            }}
            className="pointer-events-none select-none max-w-none max-h-none"
          />

          {/* Semi-transparent dark overlay with crop window */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* The Cutout Box */}
            <div 
              className={`relative border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] rounded-lg pointer-events-none transition-all duration-200 ${getCropBoxStyles()}`}
            >
              {/* Corner Guides */}
              <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></span>
              <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></span>
              <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></span>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></span>

              {/* Grid 3x3 Overlay Guidelines */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-white"></div>
                <div className="border-r border-white"></div>
                <div></div>
              </div>

              {/* Watermark/Hint */}
              <span className="absolute bottom-1 right-2 text-[10px] text-white/70 font-semibold drop-shadow-sm select-none">
                Crop Area
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Adjustment Controls */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between gap-4">
            {/* Zoom Slider */}
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex-shrink-0">
                Zoom:
              </span>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
                className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm flex items-center justify-center transition"
                title="Zoom Out"
              >
                -
              </button>
              <input 
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-black h-1.5 bg-gray-200 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm flex items-center justify-center transition"
                title="Zoom In"
              >
                +
              </button>
              <span className="text-xs font-mono text-gray-600 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotate Button */}
            <button
              type="button"
              onClick={handleRotate}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 active:scale-95 flex-shrink-0"
              title="Rotate 90 degrees"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Rotate 90°</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition active:scale-95"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {onUploadOriginal && (
                <button
                  type="button"
                  onClick={onUploadOriginal}
                  disabled={isProcessing}
                  className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold rounded-xl transition active:scale-95"
                >
                  Skip & Upload Original
                </button>
              )}

              <button
                type="button"
                onClick={handleCrop}
                disabled={isProcessing}
                className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Crop & Upload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
