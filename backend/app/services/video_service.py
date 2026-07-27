"""Video upload, frame extraction, and local output path operations."""

from pathlib import Path

import cv2
from fastapi import HTTPException, UploadFile

from ..core.paths import OUTPUT_DIR, UPLOAD_DIR
from ..state.job_store import videos


async def save_upload(video_id: str, file: UploadFile) -> None:
    """Save an uploaded video and register its original metadata."""
    file_path = UPLOAD_DIR / f"{video_id}_{file.filename}"

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    videos[video_id] = {
        "filename": file.filename,
        "path": str(file_path),
        "status": "uploaded",
    }
    print(f"Video uploaded: {file_path}")


def extract_frames(video_id: str) -> list[str]:
    """Extract ten evenly spaced preview frames from an uploaded video."""
    if video_id not in videos:
        raise HTTPException(status_code=404, detail="Video not found")

    video_path = videos[video_id]["path"]
    print(f"Extracting frames from: {video_path}")

    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Total frames in video: {total_frames}")

    frame_indices = [int(total_frames / 10 * index) for index in range(10)]
    frame_dir = OUTPUT_DIR / f"{video_id}_frames"
    frame_dir.mkdir(parents=True, exist_ok=True)
    print(f"Saving frames to: {frame_dir}")

    frame_paths = []
    for index, frame_number in enumerate(frame_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        ret, frame = cap.read()

        if ret:
            frame_path = frame_dir / f"frame_{index:02d}.jpg"
            cv2.imwrite(str(frame_path), frame)
            frame_paths.append(f"/api/frame/{video_id}/{index}")
            print(f"  Extracted frame {index}: {frame_path}")

    cap.release()
    print("All 10 frames extracted successfully")
    return frame_paths


def get_frame_path(video_id: str, frame_index: int) -> Path:
    """Return the expected preview-frame path."""
    return OUTPUT_DIR / f"{video_id}_frames" / f"frame_{frame_index:02d}.jpg"


def get_output_path(video_id: str) -> Path:
    """Return the completed output path registered for a video."""
    if video_id not in videos:
        raise HTTPException(status_code=404, detail="Video not found")

    return Path(videos[video_id].get("output_video", ""))
