import React from 'react';
import Image from 'next/image';
import { HomeItem } from '../types';

interface GalleryOverlayProps {
  current: HomeItem | null;
  galleryIndex: number;
  setGalleryIndex: (index: number) => void;
}

const GalleryOverlay: React.FC<GalleryOverlayProps> = ({ current, galleryIndex, setGalleryIndex }) => {
  if (!current) return null;
  const images = current.images || [];
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col items-center gap-4 animate-fade-in">
      <div
        className="grid grid-rows-3 grid-flow-col gap-2 mb-2 overflow-y-auto max-h-24 w-full max-w-xs scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
        style={{ minHeight: '72px' }}
      >
        {images.map((img, i) => (
          <button
            key={img}
            className={`w-6 h-6 rounded-full border-2 ${galleryIndex === i ? 'border-blue-500 bg-blue-200 dark:bg-blue-800' : 'border-gray-300 bg-gray-100 dark:bg-gray-800'}`}
            onClick={() => setGalleryIndex(i)}
            aria-label={`Go to image ${i + 1}`}
          >
            <span className="sr-only">{`Image ${i + 1}`}</span>
          </button>
        ))}
      </div>
      <div className="relative max-w-xs max-h-80 w-full h-80">
        <Image
          src={images[galleryIndex]}
          alt={`Gallery image ${galleryIndex + 1}`}
          fill
          sizes="(max-width: 400px) 100vw, 400px"
          className="rounded-xl border border-gray-300 dark:border-gray-700 shadow-md vintage-frame object-contain"
        />
      </div>
    </div>
  );
};

export default GalleryOverlay;
