"""Controllers for starting and monitoring tracking jobs."""

import threading
import uuid

from fastapi import HTTPException

from ..jobs.tracking_job import run_tracking_async
from ..state.job_store import jobs, videos


def start_tracking(video_id: str) -> dict:
    try:
        if video_id not in videos:
            raise HTTPException(status_code=404, detail="Video not found")

        job_id = str(uuid.uuid4())[:8]
        jobs[job_id] = {
            "video_id": video_id,
            "status": "queued",
            "progress": 0,
            "error": None,
        }
        videos[video_id]["job_id"] = job_id
        videos[video_id]["status"] = "processing"

        tracking_thread = threading.Thread(
            target=run_tracking_async,
            args=(video_id, job_id),
            daemon=True,
        )
        tracking_thread.start()
        print(f"Tracking job {job_id} started for video {video_id}")
        return {"job_id": job_id, "message": "Tracking started"}
    except HTTPException:
        raise
    except Exception as error:
        print(f"Track endpoint error: {error}")
        raise HTTPException(status_code=500, detail=str(error))


def get_progress(job_id: str) -> dict:
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "error": job.get("error"),
    }
