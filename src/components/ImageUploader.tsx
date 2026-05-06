'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 1000;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim; }
        else { width = Math.round((width / height) * maxDim); height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas error')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => { if (blob) resolve(blob); else reject(new Error('compress failed')); },
        'image/jpeg',
        0.6
      );
    };
    img.onerror = () => reject(new Error('load image failed'));
    img.src = URL.createObjectURL(file);
  });
}

async function uploadOne(file: File, index: number): Promise<string> {
  const compressed = await compressImage(file);
  const fd = new FormData();
  fd.append('file', compressed, `img_${Date.now()}_${index}.jpg`);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '上传失败');
  }
  const data = await res.json();
  return data.url;
}

export default function ImageUploader({ images, onChange, max = 6 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [error, setError] = useState('');

  const handlePick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = max - images.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setUploadText(`0/${toUpload.length}`);
    setError('');

    // Upload all in parallel
    const results = await Promise.allSettled(
      toUpload.map((file, i) => uploadOne(file, i))
    );

    const uploaded: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        uploaded.push(r.value);
      } else {
        setError(prev => prev ? prev + ` 第${i + 1}张失败` : `第${i + 1}张上传失败`);
      }
      setUploadText(`${i + 1}/${toUpload.length}`);
    });

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
    }
    setUploading(false);
    setUploadText('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleChange} className="hidden" />
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={`${url.slice(-20)}_${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-[var(--border)]">
            <Image src={url} alt="" fill className="object-cover" sizes="80px" unoptimized />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-0 right-0 w-6 h-6 bg-black/50 text-white text-xs flex items-center justify-center rounded-bl-lg z-10"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-[10px] font-medium leading-tight text-center">{uploadText}</span>
            ) : (
              <>
                <span className="text-2xl leading-none">+</span>
                <span className="text-[10px] font-medium">{images.length}/{max}</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
