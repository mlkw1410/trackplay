import React from 'react';
import { Cpu } from 'lucide-react';
import { STAGES } from '../../constants/stages';

export default function AppHeader({ currentStage }) {
  return (
    <header className="h-24 bg-black border-b-4 border-cyan-500 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 neon-box-cyan">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-black border-4 border-pink-500 flex items-center justify-center neon-box-pink">
          <Cpu className="w-8 h-8 text-pink-500" strokeWidth={2} />
        </div>
        <h1 className="text-2xl md:text-3xl font-arcade text-white tracking-widest mt-2 uppercase text-shadow-cyan">
          Track<span className="text-cyan-400">Play</span>
        </h1>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-xl font-pixel bg-arcade-dark px-4 py-2 border-2 border-gray-800">
        {Object.values(STAGES).map((stage, idx) => {
          const isActive = stage === currentStage;
          const isPast = Object.values(STAGES).indexOf(currentStage) > idx;

          return (
            <React.Fragment key={stage}>
              <span className={`uppercase tracking-widest ${isActive ? 'text-cyan-400 font-bold text-shadow-cyan' : isPast ? 'text-green-500' : 'text-gray-600'}`}>
                {isPast ? '[X]' : `[0${idx + 1}]`} {stage.split('_')[0]}
              </span>
              {idx < Object.values(STAGES).length - 1 && (
                <span className="text-gray-700 mx-1">&gt;</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </header>
  );
}
