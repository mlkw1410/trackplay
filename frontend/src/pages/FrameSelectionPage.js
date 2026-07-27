import React from 'react';
import { CheckSquare, ChevronRight } from 'lucide-react';
import { getFrameUrl } from '../services/api';

export default function FrameSelectionPage({ frameUrls, selectedFrame, onFrameSelect, onNext }) {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pixel-box border-neon-pink bg-arcade-dark p-6 relative">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-pink-900 border-dashed pb-4 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-arcade text-pink-500 mb-2 text-shadow-pink uppercase">Select Target Frame</h2>
          <p className="text-cyan-400 text-xl font-pixel uppercase tracking-wider">Choose a frame for calibration.</p>
        </div>
        <button
          onClick={onNext}
          disabled={selectedFrame === null}
          className={`px-6 py-3 flex items-center justify-center gap-2 font-arcade text-sm transition-all uppercase ${
            selectedFrame !== null
              ? 'bg-transparent border-4 border-green-500 text-green-400 hover:bg-green-500 hover:text-black neon-box-green'
              : 'bg-transparent border-4 border-gray-600 text-gray-600 cursor-not-allowed'
          }`}
        >
          Next Stage <ChevronRight className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 overflow-y-auto pr-2 arcade-scrollbar p-2">
        {frameUrls.map((frameUrl, index) => (
          <div
            key={index}
            onClick={() => onFrameSelect(index)}
            className={`relative aspect-video bg-black cursor-pointer overflow-hidden transition-all duration-100 ${
              selectedFrame === index
                ? 'border-4 border-green-400 neon-box-green scale-105 z-10'
                : 'border-2 border-cyan-900 hover:border-cyan-400'
            }`}
          >
            <img
              src={getFrameUrl(frameUrl)}
              alt={`Frame ${index}`}
              className="w-full h-full object-cover"
              onError={(event) => {
                console.error('Failed to load frame:', frameUrl, event);
                event.target.style.display = 'none';
              }}
            />
            <div className="absolute bottom-0 left-0 bg-black/80 border-t-2 border-r-2 border-cyan-900 font-pixel text-cyan-400 px-2 py-1 text-lg">
              FRM_{String(index).padStart(2, '0')}
            </div>
            {selectedFrame === index && (
              <div className="absolute top-1 right-1">
                <CheckSquare className="w-6 h-6 text-green-400 fill-black" strokeWidth={2} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
