import React from 'react';
import Image from 'next/image';

interface GalleryProps {
  images: string[];
  timeLeft?: number;
}

const Gallery: React.FC<GalleryProps> = ({ images, timeLeft }) => {
  const [current, setCurrent] = React.useState(0);
  const THUMBNAIL_ROWS = 3;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!images.length) return;
      if (e.key === 'ArrowLeft') {
        setCurrent((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setCurrent((prev) => (prev + 1) % images.length);
      } else if (e.key === 'ArrowUp') {
        setCurrent((prev) => (prev - THUMBNAIL_ROWS + images.length) % images.length);
      } else if (e.key === 'ArrowDown') {
        setCurrent((prev) => (prev + THUMBNAIL_ROWS) % images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images]);

  // Preload all images on mount
  React.useEffect(() => {
    images.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [images]);

  if (!images.length) return <div className="bg-gray-200 h-64 flex items-center justify-center rounded-xl shadow-inner">No images</div>;
  return (
    <>
      {/* Time left outside the gallery */}
      {typeof timeLeft === 'number' && (
        <div className="w-full flex flex-col items-center mt-2 mb-2 gap-2">
          <div className="inline-block bg-yellow-100 text-yellow-900 rounded-xl px-4 py-2 shadow font-bold text-lg">
            Time Left: <span className="ml-2">{timeLeft}s</span>
          </div>
          {/* Centered Multiplayer button */}
          <button
            className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow font-bold text-lg hover:bg-blue-700 transition-all duration-150"
            type="button"
          >
            Multiplayer
          </button>
        </div>
      )}
      <div className="relative w-full h-full aspect-video mx-auto rounded-none overflow-hidden shadow-none border-none bg-black dark:bg-gray-950">
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={images[current]}
          alt="Home"
          className="rounded-3xl object-contain shadow-lg max-h-full max-w-full"
          style={{ objectFit: 'contain', background: '#000', width: '100%', height: '100%' }}
          width={800}
          height={600}
          sizes="(max-width: 800px) 100vw, 800px"
          priority
        />
      </div>
      {/* Thumbnails grid overlayed on main image, max 3 rows, scrollable */}
      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[60vw] max-w-4xl grid grid-rows-3 grid-flow-col gap-2 z-40 bg-black/60 rounded-xl p-2 overflow-y-auto"
        style={{ maxHeight: '220px', minHeight: '80px' }}
      >
        {images.map((img, i) => (
          <button
            key={i}
            className={`border-2 ${i === current ? 'border-blue-400' : 'border-transparent'} rounded-lg overflow-hidden focus:outline-none`}
            onClick={() => setCurrent(i)}
            aria-label={`View image ${i + 1}`}
            style={{ width: 80, height: 60 }}
          >
            <Image
              src={img}
              alt="thumb"
              width={80}
              height={60}
              className="object-cover"
              style={{ width: '100%', height: '100%' }}
            />
          </button>
        ))}
      </div>
  {/* Vintage Navigation buttons */}
      <button
        className="absolute left-8 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-br from-[#f5e9d4] via-[#d2b48c] to-[#bfa76a] text-[#6b4f1d] rounded-full p-7 shadow-lg border-4 border-[#e6c97a] hover:scale-105 hover:bg-[#f5e9d4] transition-all duration-200 font-serif"
        style={{ fontFamily: 'Georgia, Times, serif', boxShadow: '0 4px 24px 0 #bfa76a88' }}
        onClick={() => setCurrent((current - 1 + images.length) % images.length)}
        aria-label="Previous image"
      >
        <span className="text-6xl font-bold" style={{ textShadow: '2px 2px 0 #e6c97a, 0 0 8px #bfa76a' }}>❮</span>
      </button>
      <button
        className="absolute right-8 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-br from-[#f5e9d4] via-[#d2b48c] to-[#bfa76a] text-[#6b4f1d] rounded-full p-7 shadow-lg border-4 border-[#e6c97a] hover:scale-105 hover:bg-[#f5e9d4] transition-all duration-200 font-serif"
        style={{ fontFamily: 'Georgia, Times, serif', boxShadow: '0 4px 24px 0 #bfa76a88' }}
        onClick={() => setCurrent((current + 1) % images.length)}
        aria-label="Next image"
      >
        <span className="text-6xl font-bold" style={{ textShadow: '2px 2px 0 #e6c97a, 0 0 8px #bfa76a' }}>❯</span>
      </button>
    </div>
    </>
  );
};

export default Gallery;
