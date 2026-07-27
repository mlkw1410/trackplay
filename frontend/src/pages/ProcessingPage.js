import React from 'react';

export default function ProcessingPage({ progress }) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-12 animate-in zoom-in duration-300">
      <div className="w-full bg-arcade-dark p-8 pixel-box border-neon-yellow relative overflow-hidden">
        <div className="absolute inset-0 scanline-bg opacity-50"></div>
        <h2 className="text-3xl font-arcade text-yellow-400 mb-8 uppercase text-shadow-yellow blink-fast relative z-10">
          Processing Data...
        </h2>
        <div className="w-full h-12 bg-black border-4 border-gray-700 relative z-10 p-1 flex">
          <div className="h-full bg-yellow-400 transition-all duration-75 ease-linear" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="mt-6 flex justify-between text-pixel text-xl uppercase text-cyan-400 tracking-widest relative z-10">
          <span>Sys.Load</span>
          <span>{Math.floor(progress)}% Complete</span>
        </div>
        <div className="mt-8 text-left font-pixel text-green-500 text-lg opacity-80 h-24 overflow-hidden relative z-10 uppercase">
          <div>&gt; INIT NEURAL_NET_V2.4... OK</div>
          <div>&gt; EXTRACTING FRAMES [{Math.floor((progress / 100) * 2520)}/2520]</div>
          <div>&gt; CALCULATING VECTORS...</div>
          {progress > 50 && <div>&gt; OPTIMIZING PATH DATA...</div>}
          {progress > 80 && <div className="text-yellow-400">&gt; ALMOST DONE...</div>}
        </div>
      </div>
    </div>
  );
}
