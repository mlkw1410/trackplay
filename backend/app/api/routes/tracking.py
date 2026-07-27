"""Tracking job routes retained at their existing URLs."""

from fastapi import APIRouter

from ...controllers import tracking_controller

router = APIRouter(tags=["tracking"])


@router.post("/api/track/{video_id}")
async def start_tracking(video_id: str):
    return tracking_controller.start_tracking(video_id)


@router.get("/api/progress/{job_id}")
async def get_progress(job_id: str):
    return tracking_controller.get_progress(job_id)
