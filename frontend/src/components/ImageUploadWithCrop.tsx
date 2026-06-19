import React, { useState, useRef } from 'react';
import ImageCropperModal from './ImageCropperModal';

interface ImageUploadWithCropProps {
  label?: string;
  aspectRatio?: number;
  cropShape?: 'rect' | 'round';
  onFileCropped: (file: File) => void;
  className?: string;
  placeholder?: string;
}

export default function ImageUploadWithCrop({
  label,
  aspectRatio = 1,
  cropShape = 'rect',
  onFileCropped,
  className = '',
  placeholder = 'Chọn ảnh...'
}: ImageUploadWithCropProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropped = (blob: Blob) => {
    setCropperOpen(false);
    const croppedFile = new File([blob], selectedFileName || 'cropped-image.jpg', { type: 'image/jpeg' });
    onFileCropped(croppedFile);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-xs font-semibold text-zinc-400">{label}</label>}
      <div 
        onClick={() => fileRef.current?.click()}
        className="w-full bg-zinc-950 border border-zinc-800 hover:border-purple-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-400 cursor-pointer flex items-center justify-between transition-all group"
      >
        <span className="truncate group-hover:text-zinc-200">
          {selectedFileName ? `Đã chọn: ${selectedFileName}` : placeholder}
        </span>
        <span className="text-xs bg-zinc-900 border border-white/5 py-1 px-3 rounded-lg text-white group-hover:bg-zinc-800 transition-all">
          Duyệt...
        </span>
      </div>
      <input 
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperSrc}
        aspectRatio={aspectRatio}
        cropShape={cropShape}
        title="Cắt và chỉnh sửa hình ảnh"
        onCrop={handleCropped}
        onClose={() => {
          setCropperOpen(false);
          if (fileRef.current) fileRef.current.value = '';
        }}
      />
    </div>
  );
}
