import React from 'react';
import { Activity, Download, Play, RefreshCw } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer } from 'recharts';
import { speedData } from '../constants/speedData';

export default function ResultsPage({ onReset }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-full animate-in fade-in duration-500 pb-8">
      <div className="bg-arcade-dark border-4 border-pink-500 p-5 flex flex-col gap-6 relative overflow-y-auto arcade-scrollbar neon-box-pink">
        <div className="absolute top-0 left-0 right-0 h-1 bg-pink-400 opacity-50"></div>
        <h2 className="text-xl font-arcade font-bold text-pink-500 border-b-4 border-pink-900 pb-4 mb-2 flex items-center gap-3 uppercase text-shadow-pink">
          <Activity className="w-6 h-6" strokeWidth={3} /> Mission Stats
        </h2>

        <div className="bg-black border-2 border-cyan-500 p-3 relative">
          <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-500"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-cyan-500"></div>
          <div className="text-cyan-600 font-pixel text-xl uppercase mb-1">Target ID</div>
          <div className="text-2xl font-arcade text-cyan-400 flex justify-between items-center">
            PLYR_01 <span className="w-3 h-3 bg-green-500 animate-pulse shadow-[0_0_10px_#39ff14]"></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black border-2 border-yellow-500 p-3 text-center flex flex-col justify-center">
            <div className="text-yellow-600 font-pixel text-lg uppercase">Clips</div>
            <div className="text-3xl font-arcade text-yellow-400 mt-2">47</div>
          </div>
          <div className="bg-black border-2 border-green-500 p-3 text-center flex flex-col justify-center">
            <div className="text-green-600 font-pixel text-lg uppercase">Time</div>
            <div className="text-2xl font-arcade text-green-400 mt-2">3:14</div>
          </div>
        </div>

        <div className="mt-2">
          <h3 className="text-pink-500 text-lg font-pixel uppercase tracking-widest mb-2 border-b-2 border-pink-900 pb-1">Velocity (KM/H)</h3>
          <div className="h-40 bg-black border-2 border-pink-900 p-2 relative">
            <div className="absolute inset-0 grid-bg opacity-20"></div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedData}>
                <CartesianGrid stroke="#330033" strokeDasharray="3 3" />
                <Area type="step" dataKey="speed" stroke="#ff00ff" fill="rgba(255, 0, 255, 0.2)" strokeWidth={3} isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-4 pt-4 border-t-4 border-pink-900">
          <button className="w-full py-4 bg-transparent border-4 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-arcade text-sm uppercase transition-colors neon-box-cyan flex items-center justify-center gap-3">
            <Download className="w-5 h-5" strokeWidth={2} /> Save Data
          </button>
          <button onClick={onReset} className="w-full py-4 bg-transparent border-4 border-gray-500 text-gray-400 hover:border-yellow-400 hover:text-yellow-400 font-arcade text-sm uppercase transition-colors flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5" strokeWidth={2} /> Reboot
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex-1 bg-arcade-dark p-4 border-4 border-cyan-500 neon-box-cyan flex flex-col relative overflow-hidden">
          <div className="flex-1 bg-black border-2 border-cyan-900 relative group flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 scanline-bg opacity-30"></div>
            <div className="z-10 flex flex-col items-center bg-black/80 border-2 border-cyan-400 p-6 neon-box-cyan">
              <Play className="w-12 h-12 text-cyan-400 hover:text-pink-500 transition-colors cursor-pointer mb-4 ml-2" strokeWidth={1} fill="currentColor" />
              <div className="font-pixel text-cyan-400 text-2xl uppercase tracking-widest blink-slow">Play Output</div>
            </div>
            <div className="absolute top-2 left-2 text-cyan-600 font-pixel text-lg">REC // MAIN_FEED</div>
          </div>
        </div>

        <div className="bg-arcade-dark p-4 border-4 border-yellow-500 neon-box-yellow flex flex-col justify-between">
          <div className="flex justify-between items-center text-xl font-pixel text-yellow-600 mb-4 uppercase tracking-widest">
            <span>00:00</span><span className="font-arcade text-yellow-400 text-sm">Timeline</span><span>03:14</span>
          </div>
          <div className="h-8 bg-black border-2 border-yellow-900 relative flex items-center px-1 group cursor-pointer">
            <div className="absolute top-0 bottom-0 left-[10%] w-[5%] bg-pink-500/50 border-x border-pink-400"></div>
            <div className="absolute top-0 bottom-0 left-[20%] w-[12%] bg-pink-500/50 border-x border-pink-400"></div>
            <div className="absolute top-0 bottom-0 left-[45%] w-[8%] bg-pink-500/50 border-x border-pink-400"></div>
            <div className="absolute top-0 bottom-0 left-[60%] w-[15%] bg-pink-500/50 border-x border-pink-400"></div>
            <div className="absolute top-0 bottom-0 left-[85%] w-[4%] bg-pink-500/50 border-x border-pink-400"></div>
            <div className="absolute top-0 bottom-0 left-[22%] w-1.5 bg-cyan-400 shadow-[0_0_10px_#00f3ff] z-10">
              <div className="absolute -top-2 -left-1.5 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-cyan-400"></div>
              <div className="absolute -bottom-2 -left-1.5 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-cyan-400"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
