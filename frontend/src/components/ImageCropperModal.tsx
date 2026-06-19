import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check, RotateCw } from 'lucide-react';
import { getCroppedImg } from '../utils/cropImage';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  aspectRatio?: number; // e.g., 1 for square, 16/9 for landscape
  cropShape?: 'rect' | 'round';
  title?: string;
  onCrop: (croppedBlob: Blob) => void;
  onClose: () => void;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  aspectRatio = 1,
  cropShape = 'rect',
  title = 'Cắt và chỉnh sửa ảnh',
  onCrop,
  onClose
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedBlob) {
        onCrop(croppedBlob);
      }
    } catch (e) {
      console.error('Failed to crop image:', e);
      alert('Có lỗi xảy ra khi cắt ảnh');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative flex-1 min-h-[350px] bg-zinc-900 overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: '#18181b' },
              cropAreaStyle: { border: '2px solid rgba(147, 51, 234, 0.6)' }
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4 border-t border-white/5 bg-zinc-950">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-zinc-500" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <ZoomIn className="w-4 h-4 text-zinc-500" />
          </div>

          {/* Rotation Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Xoay ảnh: {rotation}°</span>
            </div>
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="px-3 py-1 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg transition-all"
            >
              Xoay 90°
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 font-bold rounded-xl text-xs transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleCrop}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-lg"
            >
              {loading ? (
                <div className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Xác nhận & Cắt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
