import React from 'react';
import { Cpu, Upload } from 'lucide-react';

export default function UploadPage({ isUploading, onFileUpload }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-12 pixel-box border-neon-cyan relative bg-arcade-dark">
      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-400"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-400"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-400"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-400"></div>

      <div className="mb-8 p-6 flex items-center justify-center neon-glow-pink">
        {isUploading ? (
          <Cpu className="w-20 h-20 text-pink-500 animate-pulse" strokeWidth={2} />
        ) : (
          <Upload className="w-20 h-20 text-cyan-400 animate-bounce" strokeWidth={2} />
        )}
      </div>

      <h2 className="text-3xl md:text-5xl font-arcade text-cyan-400 mb-6 text-center text-shadow-cyan uppercase tracking-widest leading-tight">
        Insert <br /> Video Tape
      </h2>
      <p className="text-green-400 text-center mb-12 font-pixel text-2xl md:text-3xl uppercase tracking-widest blink-slow">
        Press Start To Upload
      </p>

      <label className="cursor-pointer relative group w-full md:w-auto text-center">
        <input
          type="file"
          className="hidden"
          accept="video/mp4,video/x-m4v,video/*"
          onChange={onFileUpload}
          disabled={isUploading}
        />
        <div className="px-10 py-5 bg-transparent border-4 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black font-arcade text-xl uppercase transition-all duration-200 neon-box-pink">
          {isUploading ? 'Extracting...' : 'Select File'}
        </div>
      </label>
    </div>
  );
}
