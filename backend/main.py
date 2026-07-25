from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pathlib import Path
import shutil

app = FastAPI()

# Allow React frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for uploads and outputs
UPLOAD_DIR = Path("../data/uploads")
OUTPUT_DIR = Path("../data/outputs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Store video metadata
videos = {}

@app.get("/")
def read_root():
    return {"message": "TrackPlay API is running"}

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file"""
    try:
        video_id = str(uuid.uuid4())[:8]
        file_path = UPLOAD_DIR / f"{video_id}_{file.filename}"
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Store metadata
        videos[video_id] = {
            "filename": file.filename,
            "path": str(file_path),
            "status": "uploaded"
        }
        
        return {"video_id": video_id, "message": "Upload successful"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/frames/{video_id}")
async def get_frames(video_id: str):
    """Get 10 frames from video"""
    try:
        import cv2
        
        if video_id not in videos:
            raise HTTPException(status_code=404, detail="Video not found")
        
        video_path = videos[video_id]["path"]
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Calculate frame indices to extract (evenly spaced)
        frame_indices = [int(total_frames / 10 * i) for i in range(10)]
        
        frame_dir = OUTPUT_DIR / f"{video_id}_frames"
        frame_dir.mkdir(parents=True, exist_ok=True)
        
        frame_paths = []
        for idx, frame_num in enumerate(frame_indices):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
            ret, frame = cap.read()
            
            if ret:
                frame_path = frame_dir / f"frame_{idx:02d}.jpg"
                cv2.imwrite(str(frame_path), frame)
                frame_paths.append(f"/api/frame/{video_id}/{idx}")
        
        cap.release()
        
        return {"frames": frame_paths}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/select-frame")
async def select_frame(data: dict):
    """User selects a frame"""
    try:
        video_id = data.get("video_id")
        frame_index = data.get("frame_index")
        
        if video_id not in videos:
            raise HTTPException(status_code=404, detail="Video not found")
        
        videos[video_id]["selected_frame"] = frame_index
        
        return {"message": "Frame selected", "frame_index": frame_index}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/select-player")
async def select_player(data: dict):
    """User clicks on player (x, y coordinates)"""
    try:
        video_id = data.get("video_id")
        x = data.get("x")
        y = data.get("y")
        
        if video_id not in videos:
            raise HTTPException(status_code=404, detail="Video not found")
        
        videos[video_id]["player_coords"] = {"x": x, "y": y}
        
        return {"message": "Player selected", "x": x, "y": y}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/track/{video_id}")
async def start_tracking(video_id: str):
    """Start tracking the selected player"""
    try:
        if video_id not in videos:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # TODO: Call your track.py script here
        job_id = str(uuid.uuid4())[:8]
        videos[video_id]["job_id"] = job_id
        videos[video_id]["status"] = "processing"
        
        return {"job_id": job_id, "message": "Tracking started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/progress/{job_id}")
async def get_progress(job_id: str):
    """Get tracking progress"""
    # TODO: Return actual progress from background job
    return {"progress": 50, "status": "processing"}

@app.get("/api/download/{video_id}")
async def download_video(video_id: str):
    """Download final tracked video"""
    try:
        if video_id not in videos:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # TODO: Return the output video file
        return {"message": "Video ready for download"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/frame/{video_id}/{frame_index}")
async def get_frame(video_id: str, frame_index: int):
    """Serve frame image"""
    try:
        frame_path = OUTPUT_DIR / f"{video_id}_frames" / f"frame_{frame_index:02d}.jpg"
        
        if not frame_path.exists():
            raise HTTPException(status_code=404, detail="Frame not found")
        
        return FileResponse(frame_path, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)