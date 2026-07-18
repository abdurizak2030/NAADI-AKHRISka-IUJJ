'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A lightweight, dependency-free crop/zoom tool. Given a File, it shows
 * the image in a fixed viewport with a draggable/zoomable preview and
 * hands back a cropped Blob on confirm. Used anywhere a person uploads
 * a photo — most importantly profile pictures — so they can frame the
 * shot before it's saved, instead of getting whatever crop the browser
 * happened to pick.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, RotateCw, X, ZoomIn } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageCropModalProps {
  file: File;
  /** width / height of the crop viewport, e.g. 1 for a square/circular avatar */
  aspect?: number;
  /** Render the crop viewport as a circle (for avatars) instead of a square */
  circular?: boolean;
  outputSize?: number;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}

export default function ImageCropModal({
  file,
  aspect = 1,
  circular = true,
  outputSize = 512,
  onCancel,
  onCropped,
}: ImageCropModalProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offX: 0, offY: 0 });

  const viewportSize = 280;
  const viewportW = viewportSize;
  const viewportH = viewportSize / aspect;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale =
    naturalSize.w > 0 ? Math.max(viewportW / naturalSize.w, viewportH / naturalSize.h) : 1;

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, offX: offset.x, offY: offset.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.offX + (e.clientX - dragStart.current.x),
      y: dragStart.current.offY + (e.clientY - dragStart.current.y),
    });
  };
  const onPointerUp = () => setDragging(false);

  const confirmCrop = useCallback(() => {
    if (!imgUrl || naturalSize.w === 0) return;
    setProcessing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize / aspect;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setProcessing(false);
        return;
      }
      const outScale = canvas.width / viewportW;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      const totalScale = baseScale * zoom * outScale;
      ctx.translate(offset.x * outScale, offset.y * outScale);
      ctx.drawImage(img, -(naturalSize.w * totalScale) / 2, -(naturalSize.h * totalScale) / 2, naturalSize.w * totalScale, naturalSize.h * totalScale);
      ctx.restore();
      canvas.toBlob(
        (blob) => {
          setProcessing(false);
          if (blob) onCropped(blob);
        },
        'image/jpeg',
        0.92
      );
    };
    img.src = imgUrl;
  }, [imgUrl, naturalSize, baseScale, zoom, rotation, offset, aspect, outputSize, onCropped, viewportW]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" id="image-crop-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-150">
          <h3 className="font-display font-bold text-emerald-950 text-sm">Adjust Your Photo</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div
            className="mx-auto bg-gray-900 overflow-hidden relative cursor-move touch-none select-none"
            style={{
              width: viewportW,
              height: viewportH,
              borderRadius: circular ? '9999px' : '1rem',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {imgUrl && naturalSize.w > 0 && (
              <img
                src={imgUrl}
                alt="Crop preview"
                draggable={false}
                className="absolute top-1/2 left-1/2 pointer-events-none"
                style={{
                  width: naturalSize.w * baseScale * zoom,
                  height: naturalSize.h * baseScale * zoom,
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
                }}
              />
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-emerald-800"
            />
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 shrink-0 cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 text-center">Drag to reposition, use the slider to zoom.</p>
        </div>

        <div className="flex items-center gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={confirmCrop}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold gold-gradient-bg text-emerald-950 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>{processing ? 'Processing...' : 'Apply & Upload'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
