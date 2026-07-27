import React, { useRef, useState } from 'react';
import AppHeader from './components/layout/AppHeader';
import { STAGES } from './constants/stages';
import FrameSelectionPage from './pages/FrameSelectionPage';
import PlayerSelectionPage from './pages/PlayerSelectionPage';
import ProcessingPage from './pages/ProcessingPage';
import ResultsPage from './pages/ResultsPage';
import UploadPage from './pages/UploadPage';
import {
  fetchFrames,
  fetchTrackingProgress,
  selectFrame,
  selectPlayer,
  startTracking,
  uploadVideo
} from './services/api';

export default function TrackPlayApp() {
  const [currentStage, setCurrentStage] = useState(STAGES.UPLOAD);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [clickCoords, setClickCoords] = useState(null);
  const [progress, setProgress] = useState(0);
  const [videoId, setVideoId] = useState(null);
  const [frameUrls, setFrameUrls] = useState([]);
  const canvasRef = useRef(null);

  const startProcessing = async () => {
    setCurrentStage(STAGES.PROCESSING);
    setProgress(0);

    try {
      const data = await startTracking(videoId);
      const jobId = data.job_id;
      console.log('Tracking started, job ID:', jobId);

      const pollInterval = setInterval(async () => {
        try {
          const progressData = await fetchTrackingProgress(jobId);
          console.log('Job status:', progressData.status, 'Progress:', progressData.progress);
          setProgress(progressData.progress);

          if (progressData.status === 'completed') {
            clearInterval(pollInterval);
            setProgress(100);
            setTimeout(() => setCurrentStage(STAGES.RESULTS), 800);
          } else if (progressData.status === 'error') {
            clearInterval(pollInterval);
            console.error('Tracking failed:', progressData.error);
            alert('Tracking failed: ' + progressData.error);
            setCurrentStage(STAGES.PLAYER_SELECT);
          }
        } catch (error) {
          console.error('Progress check failed:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Tracking start failed:', error);
      alert('Failed to start tracking. Make sure backend is running.');
      setCurrentStage(STAGES.PLAYER_SELECT);
    }
  };

  const handleFileUpload = async (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setIsUploading(true);

      try {
        const data = await uploadVideo(event.target.files[0]);
        const vid = data.video_id;
        setVideoId(vid);
        localStorage.setItem('current_video_id', vid);

        console.log('Fetching frames...');
        const framesData = await fetchFrames(vid);
        setFrameUrls(framesData.frames);
        console.log('✓ Frames fetched:', framesData.frames);

        setIsUploading(false);
        setCurrentStage(STAGES.FRAME_SELECT);
      } catch (error) {
        console.error('Upload failed:', error);
        setIsUploading(false);
        alert('Upload failed. Make sure backend is running on localhost:8000');
      }
    }
  };

  const handleFrameSelect = async (index) => {
    setSelectedFrame(index);
    try {
      const data = await selectFrame(videoId, index);
      console.log('✓ Frame selected on backend:', data);
    } catch (error) {
      console.error('Frame selection failed:', error);
    }
  };

  const handlePlayerClick = async (event) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const coords = {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top)
    };
    setClickCoords(coords);

    try {
      const data = await selectPlayer(videoId, coords.x, coords.y, selectedFrame);
      console.log('✓ Player selected on backend:', data);
    } catch (error) {
      console.error('Player selection failed:', error);
    }
  };

  const resetFlow = () => {
    setFile(null);
    setSelectedFrame(null);
    setClickCoords(null);
    setProgress(0);
    setVideoId(null);
    setFrameUrls([]);
    localStorage.removeItem('current_video_id');
    setCurrentStage(STAGES.UPLOAD);
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 selection:bg-pink-500 selection:text-white overflow-x-hidden relative font-pixel">
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-40"></div>
      <div className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]"></div>
      <AppHeader currentStage={currentStage} />

      <main className="h-[calc(100vh-6rem)] p-4 md:p-6 lg:p-8 relative z-10">
        <div className="h-full w-full max-w-7xl mx-auto">
          {currentStage === STAGES.UPLOAD && <UploadPage isUploading={isUploading} onFileUpload={handleFileUpload} />}
          {currentStage === STAGES.FRAME_SELECT && <FrameSelectionPage frameUrls={frameUrls} selectedFrame={selectedFrame} onFrameSelect={handleFrameSelect} onNext={() => setCurrentStage(STAGES.PLAYER_SELECT)} />}
          {currentStage === STAGES.PLAYER_SELECT && <PlayerSelectionPage canvasRef={canvasRef} clickCoords={clickCoords} frameUrls={frameUrls} selectedFrame={selectedFrame} onPlayerClick={handlePlayerClick} onStartProcessing={startProcessing} />}
          {currentStage === STAGES.PROCESSING && <ProcessingPage progress={progress} />}
          {currentStage === STAGES.RESULTS && <ResultsPage onReset={resetFlow} />}
        </div>
      </main>
    </div>
  );
}
