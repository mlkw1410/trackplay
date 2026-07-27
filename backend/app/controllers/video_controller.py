"""Controllers for the existing video upload and selection workflow."""

import uuid

from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse

from ..services.video_service import (
    extract_frames,
    get_frame_path,
    get_output_path,
    save_upload,
)
from ..state.job_store import videos


async def upload_video(file: UploadFile) -> dict:
    try:
        video_id = str(uuid.uuid4())[:8]
        await save_upload(video_id, file)
        return {"video_id": video_id, "message": "Upload successful"}
    except Exception as error:
        print(f"Upload error: {error}")
        raise HTTPException(status_code=400, detail=str(error))


def get_frames(video_id: str) -> dict:
    try:
        return {"frames": extract_frames(video_id)}
    except HTTPException:
        raise
    except Exception as error:
        print(f"Frame extraction error: {error}")
        raise HTTPException(status_code=500, detail=str(error))


def select_frame(data: dict) -> dict:
    try:
        video_id = data.get("video_id")
        frame_index = data.get("frame_index")
        if video_id not in videos:
            raise HTTPException(status_code=404, detail="Video not found")

        videos[video_id]["selected_frame"] = frame_index
        print(f"Frame {frame_index} selected for video {video_id}")
        return {"message": "Frame selected", "frame_index": frame_index}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


def select_player(data: dict) -> dict:
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
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


def download_video(video_id: str) -> FileResponse:
    try:
        output_video = get_output_path(video_id)
        if not output_video.exists():
            raise HTTPException(status_code=404, detail="Output video not ready")

        print(f"Downloading: {output_video}")
        return FileResponse(
            output_video,
            media_type="video/mp4",
            filename=f"trackplay_{video_id}.mp4",
        )
    except HTTPException:
        raise
    except Exception as error:
        print(f"Download error: {error}")
        raise HTTPException(status_code=500, detail=str(error))


def serve_frame(video_id: str, frame_index: int) -> FileResponse:
    try:
        frame_path = get_frame_path(video_id, frame_index)
        if not frame_path.exists():
            raise HTTPException(status_code=404, detail=f"Frame not found at {frame_path}")

        return FileResponse(frame_path, media_type="image/jpeg")
    except HTTPException:
        raise
    except Exception as error:
        print(f"Frame serving error: {error}")
        raise HTTPException(status_code=500, detail=str(error))
