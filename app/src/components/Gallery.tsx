import React from 'react';
import Image from 'next/image';

interface GalleryProps {
  images: string[];
}

const Gallery: React.FC<GalleryProps> = ({ images }) => {
  const [current, setCurrent] = React.useState(0);

  // Preload all images on mount
  React.useEffect(() => {
    images.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [images]);

  if (!images.length) return <div className="bg-gray-200 h-64 flex items-center justify-center rounded-xl shadow-inner">No images</div>;
  return (
  <div className="relative w-full h-full aspect-video mx-auto rounded-none overflow-hidden shadow-none border-none bg-black dark:bg-gray-950">
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={images[current]}
          alt="Home"
          className="rounded-3xl object-contain shadow-lg max-h-full max-w-full"
          style={{ objectFit: 'contain', background: '#000', width: '100%', height: '100%' }}
        />
      </div>
  {/* Thumbnails grid overlayed on main image */}
  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-5xl flex flex-row flex-wrap gap-2 justify-center z-40 bg-black/60 rounded-xl p-2">
        {images.map((img, i) => (
          <button
            key={i}
            className={`border-2 ${i === current ? 'border-blue-400' : 'border-transparent'} rounded-lg overflow-hidden focus:outline-none`}
            onClick={() => setCurrent(i)}
            aria-label={`View image ${i + 1}`}
            style={{ width: 80, height: 60 }}
          >
            <img src={img} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
  );
};

export default Gallery;
