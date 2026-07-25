import React, { useState, useRef, useEffect } from 'react';
import { Upload, Search, Play, Download, RefreshCw, BarChart2, Video, CheckSquare, Crosshair, ChevronRight, Maximize2, Activity, Cpu, MousePointer2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Define the different stages of the application flow
const STAGES = {
  UPLOAD: 'UPLOAD',
  FRAME_SELECT: 'FRAME_SELECT',
  PLAYER_SELECT: 'PLAYER_SELECT',
  PROCESSING: 'PROCESSING',
  RESULTS: 'RESULTS'
};

// Mock data for speed graph (retro styled)
const speedData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  speed: Math.max(10, Math.min(35, 20 + Math.sin(i / 2) * 10 + (Math.random() * 5 - 2.5)))
}));

export default function TrackPlayApp() {
  const [currentStage, setCurrentStage] = useState(STAGES.UPLOAD);
  
  // State for different stages
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [clickCoords, setClickCoords] = useState(null);
  const [progress, setProgress] = useState(0);
  
  // Ref for the player selection canvas
  const canvasRef = useRef(null);

  // Simulate backend processing
  const startProcessing = () => {
    setCurrentStage(STAGES.PROCESSING);
    setProgress(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 5;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setCurrentStage(STAGES.RESULTS), 800);
      } else {
        setProgress(currentProgress);
      }
    }, 150);
  };

  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsUploading(true);
      
      try {
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        
        const response = await fetch('http://localhost:8000/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        const videoId = data.video_id;
        
        // Store video ID for later use
        localStorage.setItem('current_video_id', videoId);
        
        setIsUploading(false);
        setCurrentStage(STAGES.FRAME_SELECT);
      } catch (error) {
        console.error('Upload failed:', error);
        setIsUploading(false);
        alert('Upload failed. Make sure backend is running on localhost:8000');
      }
    }
  };

  const handleFrameSelect = (index) => {
    setSelectedFrame(index);
  };

  const handlePlayerClick = (e) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to percentages for responsive drawing
    setClickCoords({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    });
  };

  const resetFlow = () => {
    setFile(null);
    setSelectedFrame(null);
    setClickCoords(null);
    setProgress(0);
    setCurrentStage(STAGES.UPLOAD);
  };

  // SCREEN 1: UPLOAD
  const renderUploadScreen = () => (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-12 pixel-box border-neon-cyan relative bg-arcade-dark">
      {/* Corner Accents */}
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
        Insert <br/> Video Tape
      </h2>
      <p className="text-green-400 text-center mb-12 font-pixel text-2xl md:text-3xl uppercase tracking-widest blink-slow">
        Press Start To Upload
      </p>
      
      <label className="cursor-pointer relative group w-full md:w-auto text-center">
        <input 
          type="file" 
          className="hidden" 
          accept="video/mp4,video/x-m4v,video/*"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <div className="px-10 py-5 bg-transparent border-4 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black font-arcade text-xl uppercase transition-all duration-200 neon-box-pink">
          {isUploading ? 'Extracting...' : 'Select File'}
        </div>
      </label>
    </div>
  );

  // SCREEN 2: FRAME SELECTION
  const renderFrameSelection = () => {
    const frames = Array.from({ length: 10 }, (_, i) => i);
    
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-300 pixel-box border-neon-pink bg-arcade-dark p-6 relative">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-pink-900 border-dashed pb-4 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-arcade text-pink-500 mb-2 text-shadow-pink uppercase">Select Target Frame</h2>
            <p className="text-cyan-400 text-xl font-pixel uppercase tracking-wider">Choose a frame for calibration.</p>
          </div>
          <button 
            onClick={() => setCurrentStage(STAGES.PLAYER_SELECT)}
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
          {frames.map((index) => (
            <div 
              key={index}
              onClick={() => handleFrameSelect(index)}
              className={`relative aspect-video bg-black cursor-pointer overflow-hidden transition-all duration-100 ${
                selectedFrame === index 
                  ? 'border-4 border-green-400 neon-box-green scale-105 z-10' 
                  : 'border-2 border-cyan-900 hover:border-cyan-400'
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-30 scanline-bg">
                 <Video className="w-8 h-8 text-cyan-500" strokeWidth={1.5} />
              </div>
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
  };

  // SCREEN 3: PLAYER SELECTION
  const renderPlayerSelection = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end bg-arcade-dark p-4 pixel-box border-neon-cyan gap-4">
        <div>
          <h2 className="text-2xl font-arcade text-cyan-400 mb-2 flex items-center gap-3 uppercase text-shadow-cyan">
            <Crosshair className="w-6 h-6 text-pink-500" strokeWidth={2} /> Lock Target
          </h2>
          <p className="text-green-400 text-xl font-pixel uppercase tracking-widest">Identify player to initiate tracking.</p>
        </div>
        <button 
          onClick={startProcessing}
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
        {/* Retro Grid Background */}
        <div className="absolute inset-0 grid-bg opacity-30"></div>
        
        {/* The Main Frame */}
        <div 
          className="relative w-full aspect-video bg-gray-900 cursor-crosshair group max-h-full border-2 border-cyan-800 overflow-hidden"
          onClick={handlePlayerClick}
          ref={canvasRef}
        >
           <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 scanline-bg">
               <Maximize2 className="w-16 h-16 text-cyan-600 mb-4" strokeWidth={1} />
               <span className="font-pixel text-2xl text-cyan-600 uppercase tracking-widest">Video Output Feed</span>
           </div>

          {/* Retro Bounding Box */}
          {clickCoords && (
             <div 
              className="absolute pointer-events-none transition-all duration-75 z-10"
              style={{
                left: `calc(${clickCoords.x}% - 40px)`,
                top: `calc(${clickCoords.y}% - 80px)`,
                width: '80px',
                height: '160px',
              }}
            >
              <div className="w-full h-full relative">
                {/* HUD Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-yellow-400 shadow-[0_0_8px_#ffe600]"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-yellow-400 shadow-[0_0_8px_#ffe600]"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-yellow-400 shadow-[0_0_8px_#ffe600]"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-yellow-400 shadow-[0_0_8px_#ffe600]"></div>
                
                {/* Center Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <div className="w-6 h-0.5 bg-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70"></div>
                   <div className="h-6 w-0.5 bg-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70"></div>
                </div>
                
                {/* Data Overlay Note */}
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

  // SCREEN 4: PROCESSING
  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-12 animate-in zoom-in duration-300">
      <div className="w-full bg-arcade-dark p-8 pixel-box border-neon-yellow relative overflow-hidden">
        <div className="absolute inset-0 scanline-bg opacity-50"></div>
        
        <h2 className="text-3xl font-arcade text-yellow-400 mb-8 uppercase text-shadow-yellow blink-fast relative z-10">
          Processing Data...
        </h2>
        
        {/* Retro Progress Bar */}
        <div className="w-full h-12 bg-black border-4 border-gray-700 relative z-10 p-1 flex">
          <div 
            className="h-full bg-yellow-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="mt-6 flex justify-between text-pixel text-xl uppercase text-cyan-400 tracking-widest relative z-10">
          <span>Sys.Load</span>
          <span>{Math.floor(progress)}% Complete</span>
        </div>
        
        {/* Fake terminal output */}
        <div className="mt-8 text-left font-pixel text-green-500 text-lg opacity-80 h-24 overflow-hidden relative z-10 uppercase">
          <div>&gt; INIT NEURAL_NET_V2.4... OK</div>
          <div>&gt; EXTRACTING FRAMES [{Math.floor((progress/100) * 2520)}/2520]</div>
          <div>&gt; CALCULATING VECTORS...</div>
          {progress > 50 && <div>&gt; OPTIMIZING PATH DATA...</div>}
          {progress > 80 && <div className="text-yellow-400">&gt; ALMOST DONE...</div>}
        </div>
      </div>
    </div>
  );

  // SCREEN 5: RESULTS 
  const renderResults = () => (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-full animate-in fade-in duration-500 pb-8">
      
      {/* COMMAND CENTER (Sidebar - Stats Terminal) */}
      <div className="bg-arcade-dark border-4 border-pink-500 p-5 flex flex-col gap-6 relative overflow-y-auto arcade-scrollbar neon-box-pink">
        <div className="absolute top-0 left-0 right-0 h-1 bg-pink-400 opacity-50"></div>
        
        <h2 className="text-xl font-arcade font-bold text-pink-500 border-b-4 border-pink-900 pb-4 mb-2 flex items-center gap-3 uppercase text-shadow-pink">
          <Activity className="w-6 h-6" strokeWidth={3} /> Mission Stats
        </h2>

        {/* Track Info */}
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

        {/* Analytics - Speed Graph (Retro styled) */}
        <div className="mt-2">
           <h3 className="text-pink-500 text-lg font-pixel uppercase tracking-widest mb-2 border-b-2 border-pink-900 pb-1">Velocity (KM/H)</h3>
           <div className="h-40 bg-black border-2 border-pink-900 p-2 relative">
             <div className="absolute inset-0 grid-bg opacity-20"></div>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={speedData}>
                  <CartesianGrid stroke="#330033" strokeDasharray="3 3" />
                  <Area 
                    type="step" 
                    dataKey="speed" 
                    stroke="#ff00ff" 
                    fill="rgba(255, 0, 255, 0.2)" 
                    strokeWidth={3} 
                    isAnimationActive={true}
                  />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-4 pt-4 border-t-4 border-pink-900">
          <button className="w-full py-4 bg-transparent border-4 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-arcade text-sm uppercase transition-colors neon-box-cyan flex items-center justify-center gap-3">
            <Download className="w-5 h-5" strokeWidth={2} /> Save Data
          </button>
          <button 
            onClick={resetFlow}
            className="w-full py-4 bg-transparent border-4 border-gray-500 text-gray-400 hover:border-yellow-400 hover:text-yellow-400 font-arcade text-sm uppercase transition-colors flex items-center justify-center gap-3"
          >
            <RefreshCw className="w-5 h-5" strokeWidth={2} /> Reboot
          </button>
        </div>
      </div>

      {/* THE STAGE (Main Video Player Area) */}
      <div className="flex flex-col gap-6">
        <div className="flex-1 bg-arcade-dark p-4 border-4 border-cyan-500 neon-box-cyan flex flex-col relative overflow-hidden">
           {/* Mock Video Element */}
           <div className="flex-1 bg-black border-2 border-cyan-900 relative group flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 scanline-bg opacity-30"></div>
              <div className="z-10 flex flex-col items-center bg-black/80 border-2 border-cyan-400 p-6 neon-box-cyan">
                <Play className="w-12 h-12 text-cyan-400 hover:text-pink-500 transition-colors cursor-pointer mb-4 ml-2" strokeWidth={1} fill="currentColor" />
                <div className="font-pixel text-cyan-400 text-2xl uppercase tracking-widest blink-slow">Play Output</div>
              </div>
              <div className="absolute top-2 left-2 text-cyan-600 font-pixel text-lg">REC // MAIN_FEED</div>
           </div>
        </div>

        {/* THE SCRUB BAR (Timeline) */}
        <div className="bg-arcade-dark p-4 border-4 border-yellow-500 neon-box-yellow flex flex-col justify-between">
           <div className="flex justify-between items-center text-xl font-pixel text-yellow-600 mb-4 uppercase tracking-widest">
             <span>00:00</span>
             <span className="font-arcade text-yellow-400 text-sm">Timeline</span>
             <span>03:14</span>
           </div>
           
           {/* Retro Timeline track */}
           <div className="h-8 bg-black border-2 border-yellow-900 relative flex items-center px-1 group cursor-pointer">
              {/* Representing the clips found with marker highlights */}
              <div className="absolute top-0 bottom-0 left-[10%] w-[5%] bg-pink-500/50 border-x border-pink-400"></div>
              <div className="absolute top-0 bottom-0 left-[20%] w-[12%] bg-pink-500/50 border-x border-pink-400"></div>
              <div className="absolute top-0 bottom-0 left-[45%] w-[8%] bg-pink-500/50 border-x border-pink-400"></div>
              <div className="absolute top-0 bottom-0 left-[60%] w-[15%] bg-pink-500/50 border-x border-pink-400"></div>
              <div className="absolute top-0 bottom-0 left-[85%] w-[4%] bg-pink-500/50 border-x border-pink-400"></div>
              
              {/* Playhead */}
              <div className="absolute top-0 bottom-0 left-[22%] w-1.5 bg-cyan-400 shadow-[0_0_10px_#00f3ff] z-10">
                 <div className="absolute -top-2 -left-1.5 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-cyan-400"></div>
                 <div className="absolute -bottom-2 -left-1.5 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-cyan-400"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-gray-200 selection:bg-pink-500 selection:text-white overflow-x-hidden relative font-pixel">
      
      {/* CRT Scanline Overlay applied globally */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-40"></div>
      
      {/* Subtle vignette/flicker effect */}
      <div className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]"></div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        
        .font-arcade { font-family: 'Press Start 2P', cursive; line-height: 1.5; }
        .font-pixel { font-family: 'VT323', monospace; }

        .bg-arcade-dark { background-color: #0b0710; }

        /* Neon Glow Effects */
        .text-shadow-cyan { text-shadow: 2px 2px 0px #005555, 0 0 10px #00f3ff; }
        .text-shadow-pink { text-shadow: 2px 2px 0px #550055, 0 0 10px #ff00ff; }
        .text-shadow-yellow { text-shadow: 2px 2px 0px #554400, 0 0 10px #ffe600; }

        .neon-box-cyan { box-shadow: 0 0 10px #00f3ff20, inset 0 0 10px #00f3ff20; }
        .neon-box-pink { box-shadow: 0 0 10px #ff00ff20, inset 0 0 10px #ff00ff20; }
        .neon-box-yellow { box-shadow: 0 0 10px #ffe60020, inset 0 0 10px #ffe60020; }
        .neon-box-green { box-shadow: 0 0 10px #39ff1420, inset 0 0 10px #39ff1420; }

        .border-neon-cyan { border: 4px solid #00f3ff; }
        .border-neon-pink { border: 4px solid #ff00ff; }
        .border-neon-yellow { border: 4px solid #ffe600; }

        .pixel-box {
          position: relative;
          clip-path: polygon(
            0 8px, 8px 8px, 8px 0,
            calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px,
            100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%,
            8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px)
          );
        }

        /* Patterns */
        .scanline-bg {
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
          background-size: 100% 4px;
        }

        .grid-bg {
          background-image: 
            linear-gradient(to right, #330033 1px, transparent 1px),
            linear-gradient(to bottom, #330033 1px, transparent 1px);
          background-size: 20px 20px;
        }

        /* Animations */
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .blink-slow { animation: blink 2s step-end infinite; }
        .blink-fast { animation: blink 0.5s step-end infinite; }
        .blink-fast-hover:hover { animation: blink 0.2s step-end infinite; }

        /* Custom Scrollbar for arcade look */
        .arcade-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .arcade-scrollbar::-webkit-scrollbar-track {
          background: #000;
          border-left: 2px solid #333;
        }
        .arcade-scrollbar::-webkit-scrollbar-thumb {
          background: #ff00ff;
          border: 2px solid #000;
        }
      `}</style>

      {/* Header */}
      <header className="h-24 bg-black border-b-4 border-cyan-500 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 neon-box-cyan">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black border-4 border-pink-500 flex items-center justify-center neon-box-pink">
            <Cpu className="w-8 h-8 text-pink-500" strokeWidth={2} />
          </div>
          <h1 className="text-2xl md:text-3xl font-arcade text-white tracking-widest mt-2 uppercase text-shadow-cyan">
            Track<span className="text-cyan-400">Play</span>
          </h1>
        </div>
        
        {/* Step Indicator (Arcade stages) */}
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

      {/* Main Content Area */}
      <main className="h-[calc(100vh-6rem)] p-4 md:p-6 lg:p-8 relative z-10">
        <div className="h-full w-full max-w-7xl mx-auto">
          {currentStage === STAGES.UPLOAD && renderUploadScreen()}
          {currentStage === STAGES.FRAME_SELECT && renderFrameSelection()}
          {currentStage === STAGES.PLAYER_SELECT && renderPlayerSelection()}
          {currentStage === STAGES.PROCESSING && renderProcessing()}
          {currentStage === STAGES.RESULTS && renderResults()}
        </div>
      </main>

    </div>
  );
}