import React from 'react';

interface CluesProps {
  yearBuilt: number;
  price: number;
}

const Clues: React.FC<CluesProps> = ({ yearBuilt, price }) => (
  <div className="flex flex-row gap-8 items-center justify-center w-full my-2">
    {/* Year Built Card */}
    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#f5e9d4] via-[#d2b48c] to-[#bfa76a] border-4 border-[#e6c97a] rounded-2xl px-8 py-6 shadow-xl font-serif max-w-xs">
      <span className="text-5xl font-bold text-[#6b4f1d] drop-shadow-lg mb-2" style={{ textShadow: '2px 2px 0 #e6c97a, 0 0 8px #bfa76a' }}>🏛️</span>
      <span className="text-lg font-semibold text-[#6b4f1d] mb-1 tracking-wide">Year Built</span>
      <span className="text-3xl font-bold text-[#6b4f1d]" style={{ textShadow: '1px 1px 0 #e6c97a' }}>{yearBuilt}</span>
    </div>
    {/* Price Card */}
    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#e6f5d4] via-[#b7d48c] to-[#a7bf6a] border-4 border-[#c9e67a] rounded-2xl px-8 py-6 shadow-xl font-serif max-w-xs">
      <span className="text-5xl font-bold text-[#3d6b1d] drop-shadow-lg mb-2" style={{ textShadow: '2px 2px 0 #c9e67a, 0 0 8px #a7bf6a' }}>💰</span>
      <span className="text-lg font-semibold text-[#3d6b1d] mb-1 tracking-wide">Sold Price</span>
      <span className="text-3xl font-bold text-[#3d6b1d]" style={{ textShadow: '1px 1px 0 #c9e67a' }}>${price.toLocaleString()}</span>
    </div>
  </div>
);

export default Clues;
