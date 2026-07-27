"""Background subprocess runner for the existing YOLO + DeepSORT script."""

import subprocess
import threading

from ..core.paths import BACKEND_DIR, OUTPUT_DIR, TRACK_SCRIPT
from ..state.job_store import jobs, videos


def _stream_reader(pipe, job_id: str, total_frames_holder: dict) -> None:
    """Drain tracker output and translate progress lines into job progress."""
    try:
        for raw_line in iter(pipe.readline, ""):
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
                    pct = int(5 + (current / total) * 90) if total > 0 else 5
                    jobs[job_id]["progress"] = min(95, pct)
                except (ValueError, ZeroDivisionError):
                    pass
    finally:
        pipe.close()


def run_tracking_async(video_id: str, job_id: str) -> None:
    """Run the unchanged tracker subprocess and update the in-memory job."""
    try:
        print(f"\n{'=' * 80}")
        print(f"TRACKING JOB STARTED: {job_id}")
        print(f"{'=' * 80}")

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

        command = [
            "python3",
            str(TRACK_SCRIPT),
            "--input",
            str(video_path),
            "--output",
            str(output_video),
        ]
        if x is not None and y is not None:
            command.extend(["--x", str(int(x)), "--y", str(int(y))])

        print(f"Running command: {' '.join(command)}")
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=str(BACKEND_DIR),
        )

        total_frames_holder = {"total": None}
        reader_thread = threading.Thread(
            target=_stream_reader,
            args=(process.stdout, job_id, total_frames_holder),
            daemon=True,
        )
        reader_thread.start()

        returncode = process.wait()
        reader_thread.join(timeout=5)
        print(f"Return code: {returncode}")

        if returncode == 0 and output_video.exists():
            print("Tracking completed successfully")
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["progress"] = 100
            jobs[job_id]["output_video"] = str(output_video)
            videos[video_id]["output_video"] = str(output_video)
            print(f"Job {job_id} COMPLETED")
        else:
            print("Tracking failed")
            jobs[job_id]["status"] = "error"
            jobs[job_id]["error"] = f"Return code: {returncode}"
            print(f"Job {job_id} FAILED")

        print(f"{'=' * 80}\n")

    except Exception as error:
        print(f"EXCEPTION: {error}")
        import traceback

        traceback.print_exc()
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(error)
