const API_BASE_URL = 'http://localhost:8000';

export const uploadVideo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });
  return response.json();
};

export const fetchFrames = async (videoId) => {
  const response = await fetch(`${API_BASE_URL}/api/frames/${videoId}`);
  return response.json();
};

export const selectFrame = async (videoId, frameIndex) => {
  const response = await fetch(`${API_BASE_URL}/api/select-frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_id: videoId, frame_index: frameIndex })
  });
  return response.json();
};

export const selectPlayer = async (videoId, x, y, frameIndex) => {
  const response = await fetch(`${API_BASE_URL}/api/select-player`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_id: videoId,
      x,
      y,
      frame_index: frameIndex
    })
  });
  return response.json();
};

export const startTracking = async (videoId) => {
  const response = await fetch(`${API_BASE_URL}/api/track/${videoId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
};

export const fetchTrackingProgress = async (jobId) => {
  const response = await fetch(`${API_BASE_URL}/api/progress/${jobId}`);
  return response.json();
};

export const getFrameUrl = (frameUrl) => `${API_BASE_URL}${frameUrl}`;
