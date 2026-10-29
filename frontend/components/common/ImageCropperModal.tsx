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
  onUploadOriginal,
}) => {
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '3:2' | 'free'>(defaultAspectRatio);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  // Natural rendered size of the image at zoom=1 (computed once image loads)
  const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when a new image opens
  useEffect(() => {
    if (isOpen) {
      setAspectRatio(defaultAspectRatio);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setIsProcessing(false);
      setBaseSize(null);
    }
  }, [isOpen, imageSrc, defaultAspectRatio]);

  // Compute base rendered size once image loads, then auto-zoom to fill crop box
  const handleImageLoad = () => {
    // Use a small delay so the layout has settled before measuring
    requestAnimationFrame(() => {
      if (!imageRef.current || !containerRef.current) return;
      const img = imageRef.current;
      const cW = containerRef.current.clientWidth;
      const cH = containerRef.current.clientHeight;

      // img.width / img.height = actual rendered pixels before CSS transform
      const bW = img.width;
      const bH = img.height;
      setBaseSize({ w: bW, h: bH });

      // Crop box dimensions
      let cropW = Math.min(cW - 40, 420);
      let cropH = cropW;
      if (defaultAspectRatio === '4:3') cropH = cropW * (3 / 4);
      else if (defaultAspectRatio === '3:2') cropH = cropW * (2 / 3);
      else if (defaultAspectRatio === 'free') cropH = Math.min(cH - 40, 320);

      // Auto-zoom so the image fills the crop box completely
      const fillZoom = Math.max(cropW / bW, cropH / bH);
      setZoom(parseFloat(Math.max(fillZoom, 1).toFixed(3)));
    });
  };

  // ── Drag / Pan ────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const t = e.touches[0];
    setPan({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };
  const handleTouchEnd = () => setIsDragging(false);

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // ── Crop ─────────────────────────────────────────────────────────────
  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !containerRef.current || !baseSize) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const container = containerRef.current;
      const cW = container.clientWidth;
      const cH = container.clientHeight;

      // ── Screen-space crop box ─────────────────────────────────────────
      let cropW = Math.min(cW - 40, 420);
      let cropH = cropW;
      if (aspectRatio === '4:3') cropH = cropW * (3 / 4);
      else if (aspectRatio === '3:2') cropH = cropW * (2 / 3);
      else if (aspectRatio === 'free') cropH = Math.min(cH - 40, 320);

      // ── Image rendered size at current zoom ───────────────────────────
      // img.width/img.height = rendered layout size before CSS transform
      const scaledW = img.width * zoom;
      const scaledH = img.height * zoom;

      // Image top-left in container coords (image is centred then panned)
      const imgLeft = (cW - scaledW) / 2 + pan.x;
      const imgTop = (cH - scaledH) / 2 + pan.y;

      // Crop box top-left in container coords (always centred)
      const boxLeft = (cW - cropW) / 2;
      const boxTop = (cH - cropH) / 2;

      // ── Map to source image pixels ────────────────────────────────────
      const pxPerSrc = scaledW / img.naturalWidth;
      const srcX = (boxLeft - imgLeft) / pxPerSrc;
      const srcY = (boxTop - imgTop) / pxPerSrc;
      const srcW = cropW / pxPerSrc;
      const srcH = cropH / pxPerSrc;

      // ── Output canvas ─────────────────────────────────────────────────
      const outW = Math.max(1200, Math.round(cropW * 2));
      const outH = Math.round((cropH / cropW) * outW);

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);

      if (rotation === 0) {
        // Direct source-rect draw — most accurate, no rotation
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
      } else {
        // Rotate around the crop-box centre
        const outPxPerSrc = outW / srcW;
        const cropCX = srcX + srcW / 2;
        const cropCY = srcY + srcH / 2;
        ctx.save();
        ctx.translate(outW / 2, outH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(
          img,
          -cropCX * outPxPerSrc,
          -cropCY * outPxPerSrc,
          img.naturalWidth * outPxPerSrc,
          img.naturalHeight * outPxPerSrc,
        );
        ctx.restore();
      }

      canvas.toBlob(
        async (blob) => {
          if (!blob) { setIsProcessing(false); return; }
          const previewUrl = URL.createObjectURL(blob);
          await onCropComplete(blob, previewUrl);
          setIsProcessing(false);
        },
        'image/jpeg',
        0.92,
      );
    } catch (err) {
      console.error('Cropping failed:', err);
      setIsProcessing(false);
      alert('Failed to crop image. Please try again.');
    }
  }, [aspectRatio, zoom, rotation, pan, baseSize, onCropComplete]);

  // minZoom: image must always cover the crop box — no black bars
  const getMinZoom = () => {
    if (!imageRef.current || !containerRef.current) return 0.3;
    const bW = imageRef.current.width;
    const bH = imageRef.current.height;
    if (!bW || !bH) return 0.3;
    const cW = containerRef.current.clientWidth;
    const cH = containerRef.current.clientHeight;
    let cropW = Math.min(cW - 40, 420);
    let cropH = cropW;
    if (aspectRatio === '4:3') cropH = cropW * (3 / 4);
    else if (aspectRatio === '3:2') cropH = cropW * (2 / 3);
    else if (aspectRatio === 'free') cropH = Math.min(cH - 40, 320);
    return Math.max(cropW / bW, cropH / bH);
  };
  const minZoom = getMinZoom();

  const getCropBoxStyles = () => {
    switch (aspectRatio) {
      case '1:1': return 'w-64 h-64 sm:w-72 sm:h-72';
      case '4:3': return 'w-72 h-54 sm:w-96 sm:h-72';
      case '3:2': return 'w-72 h-48 sm:w-96 sm:h-64';
      case 'free':
      default: return 'w-72 h-64 sm:w-[420px] sm:h-72';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">Crop & Adjust: {documentTitle}</h3>
              <p className="text-[11px] text-gray-400 font-medium">Drag to position · zoom · rotate</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-200/80 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="px-5 py-2.5 bg-gray-100/60 border-b border-gray-200/60 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Aspect Ratio:</span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
            {(['1:1', '4:3', '3:2', 'free'] as const).map((r) => (
              <button key={r} type="button" onClick={() => setAspectRatio(r)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${aspectRatio === r ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {r === '1:1' ? '1:1 (Photo)' : r === '4:3' ? '4:3 (Card/DL)' : r === '3:2' ? '3:2 (ID)' : 'Free'}
              </button>
            ))}
          </div>
        </div>

        {/* Crop Viewport */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-80 sm:h-96 bg-neutral-900 flex items-center justify-center overflow-hidden cursor-move select-none"
        >
          {/* The image — natural size capped to container, transform handles zoom/pan/rotate */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="crop source"
            draggable={false}
            onLoad={handleImageLoad}
            style={{
              // Let the image sit at its natural object-contain size
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
              // All manipulation via transform — origin stays at element centre
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.08s ease-out',
            }}
            className="pointer-events-none select-none"
          />

          {/* Dark overlay + crop box */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`relative border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.62)] rounded-sm pointer-events-none transition-all duration-200 ${getCropBoxStyles()}`}>
              {/* Corner handles */}
              <span className="absolute -top-[3px] -left-[3px] w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
              <span className="absolute -top-[3px] -right-[3px] w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
              <span className="absolute -bottom-[3px] -left-[3px] w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
              <span className="absolute -bottom-[3px] -right-[3px] w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br" />
              {/* Rule-of-thirds grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25 pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex-shrink-0">Zoom:</span>
            <button type="button" onClick={() => setZoom(p => Math.max(minZoom, +(p - 0.1).toFixed(2)))}
              className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-black flex items-center justify-center transition">−</button>
            <input type="range" min={minZoom} max="4" step="0.05" value={zoom}
              onChange={(e) => setZoom(Math.max(minZoom, parseFloat(e.target.value)))}
              className="flex-1 accent-black h-1.5 rounded-lg cursor-pointer" />
            <button type="button" onClick={() => setZoom(p => Math.min(4, +(p + 0.1).toFixed(2)))}
              className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-black flex items-center justify-center transition">+</button>
            <span className="text-xs font-mono text-gray-600 w-10 text-right">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={handleRotate}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 active:scale-95 flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              90°
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={isProcessing}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition active:scale-95">
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {onUploadOriginal && (
                <button type="button" onClick={onUploadOriginal} disabled={isProcessing}
                  className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold rounded-xl transition active:scale-95">
                  Skip & Upload Original
                </button>
              )}
              <button type="button" onClick={handleCrop} disabled={isProcessing || !baseSize}
                className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50">
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Crop & Upload
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
