'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface Props {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageViewer({ images, initialIndex, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex);
  const startX = useRef(0);
  const deltaX = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const goNext = useCallback(() => {
    if (current < images.length - 1) setCurrent(c => c + 1);
  }, [current, images.length]);

  const goPrev = useCallback(() => {
    if (current > 0) setCurrent(c => c - 1);
  }, [current]);

  const handleStart = (clientX: number) => {
    startX.current = clientX;
    deltaX.current = 0;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    deltaX.current = clientX - startX.current;
    if (imgRef.current) {
      imgRef.current.style.transform = `translateX(${deltaX.current}px)`;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (imgRef.current) {
      imgRef.current.style.transition = 'transform 0.2s ease';
      if (Math.abs(deltaX.current) > 80) {
        if (deltaX.current > 0 && current > 0) setCurrent(c => c - 1);
        else if (deltaX.current < 0 && current < images.length - 1) setCurrent(c => c + 1);
      }
      imgRef.current.style.transform = '';
      setTimeout(() => {
        if (imgRef.current) imgRef.current.style.transition = '';
      }, 200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Close */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
        <span className="text-white/80 text-sm font-semibold">
          {current + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/20 text-white text-lg flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      {/* Image area */}
      <div
        ref={imgRef}
        className="w-full h-full flex items-center justify-center select-none"
        onTouchStart={e => handleStart(e.touches[0].clientX)}
        onTouchMove={e => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={e => handleStart(e.clientX)}
        onMouseMove={e => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        style={{ willChange: isDragging ? 'transform' : 'auto' }}
      >
        <Image
          src={images[current]}
          alt=""
          fill
          className="object-contain pointer-events-none"
          unoptimized
          priority
          sizes="100vw"
          draggable={false}
        />
      </div>

      {/* Nav arrows (desktop) */}
      {current > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white text-xl hidden sm:flex items-center justify-center"
        >
          ‹
        </button>
      )}
      {current < images.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white text-xl hidden sm:flex items-center justify-center"
        >
          ›
        </button>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-8 flex gap-1.5">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === current ? 'bg-white w-3' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
