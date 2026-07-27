from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pathlib import Path
import shutil
import subprocess
import threading
import json

app = FastAPI()

# Allow React frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for uploads and outputs (using absolute paths)
BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
DATA_DIR = ROOT_DIR / "data"

UPLOAD_DIR = DATA_DIR / "uploads"
OUTPUT_DIR = DATA_DIR / "outputs"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Debug: Print paths on startup
print(f"\n{'='*60}")
print(f"BACKEND_DIR:  {BACKEND_DIR}")
print(f"ROOT_DIR:     {ROOT_DIR}")
print(f"DATA_DIR:     {DATA_DIR}")
print(f"UPLOAD_DIR:   {UPLOAD_DIR}")
print(f"OUTPUT_DIR:   {OUTPUT_DIR}")
print(f"{'='*60}\n")

# Store video metadata and job progress
videos = {}
jobs = {}  # Track progress of background jobs

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

        print(f"Video uploaded: {file_path}")
        return {"video_id": video_id, "message": "Upload successful"}
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/frames/{video_id}")
async def get_frames(video_id: str):
    """Get 10 frames from video"""
    try:
        import cv2

        if video_id not in videos:
            raise HTTPException(status_code=404, detail="Video not found")

        video_path = videos[video_id]["path"]
        print(f"Extracting frames from: {video_path}")

        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"Total frames in video: {total_frames}")

        # Calculate frame indices to extract (evenly spaced)
        frame_indices = [int(total_frames / 10 * i) for i in range(10)]

        frame_dir = OUTPUT_DIR / f"{video_id}_frames"
        frame_dir.mkdir(parents=True, exist_ok=True)
        print(f"Saving frames to: {frame_dir}")

        frame_paths = []
        for idx, frame_num in enumerate(frame_indices):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
            ret, frame = cap.read()

            if ret:
                frame_path = frame_dir / f"frame_{idx:02d}.jpg"
                cv2.imwrite(str(frame_path), frame)
                frame_paths.append(f"/api/frame/{video_id}/{idx}")
                print(f"  Extracted frame {idx}: {frame_path}")

        cap.release()

        print(f"All 10 frames extracted successfully")
        return {"frames": frame_paths}
    except Exception as e:
        print(f"Frame extraction error: {e}")
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
        print(f"Frame {frame_index} selected for video {video_id}")

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
        videos[video_id]["selected_frame_index"] = data.get("frame_index")
        print(f"Player selected at ({x}, {y}) for video {video_id}")

        return {"message": "Player selected", "x": x, "y": y}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def _stream_reader(pipe, job_id, total_frames_holder):
    """
    Continuously read lines from the subprocess stdout pipe as they arrive.

    This is the critical fix: without something actively draining stdout while
    the subprocess runs, the OS pipe buffer (~64KB on macOS) fills up once
    track.py prints enough lines, and the child process blocks forever on its
    next print() call waiting for a reader. That looked exactly like a "hang"
    (0% CPU, sleeping state) even though nothing had crashed.

    This function runs in its own thread, reads line by line, parses the
    "PROGRESS:current/total" lines emitted by track.py, and updates jobs[job_id]
    with real progress instead of a time-based guess.
    """
    try:
        for raw_line in iter(pipe.readline, ''):
            line = raw_line.strip()
            if not line:
                continue

            print(f"[track.py] {line}")

            if line.startswith("PROGRESS:"):
                try:
                    fraction = line.replace("PROGRESS:", "")
                    current_str, total_str = fraction.split("/")
                    current, total = int(current_str), int(total_str)
                    total_frames_holder["total"] = total
                    # Map 0-100% of track.py's own progress onto 5-95% of the
                    # job's reported progress, leaving room for setup/teardown.
                    pct = int(5 + (current / total) * 90) if total > 0 else 5
                    jobs[job_id]["progress"] = min(95, pct)
                except (ValueError, ZeroDivisionError):
                    pass
    finally:
        pipe.close()


def run_tracking_async(video_id: str, job_id: str):
    """Run tracking in background"""
    try:
        print(f"\n{'='*80}")
        print(f"TRACKING JOB STARTED: {job_id}")
        print(f"{'='*80}")

        if video_id not in videos:
            print(f"Video {video_id} not found")
            jobs[job_id]["status"] = "error"
            jobs[job_id]["error"] = "Video not found"
            return

        video_path = videos[video_id]["path"]
        output_video = OUTPUT_DIR / f"{video_id}_tracked.mp4"

        coords = videos[video_id].get("player_coords", {})
        x = coords.get("x")
        y = coords.get("y")

        print(f"Video path: {video_path}")
        print(f"Output path: {output_video}")
        print(f"Player coords: ({x}, {y})")

        jobs[job_id]["status"] = "processing"
        jobs[job_id]["progress"] = 5

        cmd = [
            "python3",
            str(BACKEND_DIR / "track.py"),
            "--input", str(video_path),
            "--output", str(output_video),
        ]

        if x is not None and y is not None:
            cmd.extend(["--x", str(int(x)), "--y", str(int(y))])

        print(f"Running command: {' '.join(cmd)}")

        # Merge stderr into stdout so a single reader thread catches both.
        # bufsize=1 + text=True gives us line-buffered text output.
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=str(BACKEND_DIR)
        )

        total_frames_holder = {"total": None}

        # Start a dedicated thread that continuously drains stdout while the
        # subprocess runs. This is what prevents the pipe from filling up.
        reader_thread = threading.Thread(
            target=_stream_reader,
            args=(process.stdout, job_id, total_frames_holder),
            daemon=True
        )
        reader_thread.start()

        # Block until the subprocess actually exits. This is safe now because
        # the reader thread is draining stdout concurrently, so track.py will
        # never block on a full pipe.
        returncode = process.wait()

        # Make sure the reader thread has finished flushing any last lines.
        reader_thread.join(timeout=5)

        print(f"Return code: {returncode}")

        if returncode == 0 and output_video.exists():
            print(f"Tracking completed successfully")
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["progress"] = 100
            jobs[job_id]["output_video"] = str(output_video)
            videos[video_id]["output_video"] = str(output_video)
            print(f"Job {job_id} COMPLETED")
        else:
            print(f"Tracking failed")
            jobs[job_id]["status"] = "error"
            jobs[job_id]["error"] = f"Return code: {returncode}"
            print(f"Job {job_id} FAILED")

        print(f"{'='*80}\n")

    except Exception as e:
        print(f"EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)

@app.post("/api/track/{video_id}")
async def start_tracking(video_id: str):
    """Start tracking the selected player"""
    try:
        if video_id not in videos:
            raise HTTPException(status_code=404, detail="Video not found")

        job_id = str(uuid.uuid4())[:8]

        # Initialize job tracking
        jobs[job_id] = {
            "video_id": video_id,
            "status": "queued",
            "progress": 0,
            "error": None
        }

        videos[video_id]["job_id"] = job_id
        videos[video_id]["status"] = "processing"

        # Start tracking in background thread (non-blocking)
        tracking_thread = threading.Thread(
            target=run_tracking_async,
            args=(video_id, job_id),
            daemon=True
        )
        tracking_thread.start()

        print(f"Tracking job {job_id} started for video {video_id}")
        return {"job_id": job_id, "message": "Tracking started"}
    except Exception as e:
        print(f"Track endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/progress/{job_id}")
async def get_progress(job_id: str):
    """Get tracking progress"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "error": job.get("error")
    }

@app.get("/api/download/{video_id}")
async def download_video(video_id: str):
    """Download final tracked video"""
    try:
        if video_id not in videos:
            raise HTTPException(status_code=404, detail="Video not found")

        output_video = Path(videos[video_id].get("output_video", ""))

        if not output_video.exists():
            raise HTTPException(status_code=404, detail="Output video not ready")

        print(f"Downloading: {output_video}")
        return FileResponse(
            output_video,
            media_type="video/mp4",
            filename=f"trackplay_{video_id}.mp4"
        )
    except Exception as e:
        print(f"Download error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/frame/{video_id}/{frame_index}")
async def get_frame(video_id: str, frame_index: int):
    """Serve frame image"""
    try:
        frame_path = OUTPUT_DIR / f"{video_id}_frames" / f"frame_{frame_index:02d}.jpg"

        if not frame_path.exists():
            raise HTTPException(status_code=404, detail=f"Frame not found at {frame_path}")

        return FileResponse(frame_path, media_type="image/jpeg")
    except Exception as e:
        print(f"Frame serving error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)