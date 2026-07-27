import React from 'react';
import { Cpu, Crosshair, Maximize2 } from 'lucide-react';
import { getFrameUrl } from '../services/api';

export default function PlayerSelectionPage({
  canvasRef,
  clickCoords,
  frameUrls,
  selectedFrame,
  onPlayerClick,
  onStartProcessing
}) {
  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end bg-arcade-dark p-4 pixel-box border-neon-cyan gap-4">
        <div>
          <h2 className="text-2xl font-arcade text-cyan-400 mb-2 flex items-center gap-3 uppercase text-shadow-cyan">
            <Crosshair className="w-6 h-6 text-pink-500" strokeWidth={2} /> Lock Target
          </h2>
          <p className="text-green-400 text-xl font-pixel uppercase tracking-widest">Identify player to initiate tracking.</p>
        </div>
        <button
          onClick={onStartProcessing}
          disabled={!clickCoords}
          className={`px-6 py-3 flex items-center justify-center gap-2 font-arcade text-sm transition-all uppercase ${
            clickCoords
              ? 'bg-transparent border-4 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black neon-box-yellow blink-fast-hover'
              : 'bg-transparent border-4 border-gray-600 text-gray-600 cursor-not-allowed'
          }`}
        >
          Execute <Cpu className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      <div className="relative flex-1 bg-black p-2 md:p-4 pixel-box border-2 border-pink-500 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30"></div>
        <div
          className="relative w-full aspect-video bg-gray-900 cursor-crosshair group max-h-full border-2 border-cyan-800 overflow-hidden"
          onClick={onPlayerClick}
          ref={canvasRef}
        >
          {selectedFrame !== null && frameUrls[selectedFrame] && (
            <img
              src={getFrameUrl(frameUrls[selectedFrame])}
              alt="Selected frame"
              className="w-full h-full object-cover"
            />
          )}

          {!selectedFrame && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 scanline-bg">
              <Maximize2 className="w-16 h-16 text-cyan-600 mb-4" strokeWidth={1} />
              <span className="font-pixel text-2xl text-cyan-600 uppercase tracking-widest">Video Output Feed</span>
            </div>
          )}

          {clickCoords && (
            <div
              className="absolute pointer-events-none transition-all duration-75 z-10"
              style={{
                left: `${clickCoords.x}px`,
                top: `${clickCoords.y}px`,
                transform: 'translate(-40px, -80px)',
                width: '80px',
                height: '160px'
              }}
            >
              <div className="w-full h-full relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-yellow-400 shadow-[0_0_8px_#ffe600]"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-yellow-400 shadow-[0_0_8px_#ffe600]"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-yellow-400 shadow-[0_0_8px_#ffe600]"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-yellow-400 shadow-[0_0_8px_#ffe600]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-6 h-0.5 bg-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70"></div>
                  <div className="h-6 w-0.5 bg-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70"></div>
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black border border-yellow-400 px-2 py-0.5 shadow-[0_0_5px_#ffe600]">
                  <span className="text-yellow-400 font-pixel text-lg uppercase tracking-widest">TRK_01</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
