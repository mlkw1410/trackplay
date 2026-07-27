"""Routes retained at their existing URLs for frontend compatibility."""

from fastapi import APIRouter, File, UploadFile

from ...controllers import video_controller

router = APIRouter(tags=["videos"])


@router.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    return await video_controller.upload_video(file)


@router.get("/api/frames/{video_id}")
async def get_frames(video_id: str):
    return video_controller.get_frames(video_id)


@router.post("/api/select-frame")
async def select_frame(data: dict):
    return video_controller.select_frame(data)


@router.post("/api/select-player")
async def select_player(data: dict):
    return video_controller.select_player(data)


@router.get("/api/download/{video_id}")
async def download_video(video_id: str):
    return video_controller.download_video(video_id)


@router.get("/api/frame/{video_id}/{frame_index}")
async def get_frame(video_id: str, frame_index: int):
    return video_controller.serve_frame(video_id, frame_index)
