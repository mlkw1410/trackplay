"""
YOLO + DeepSORT Tracking Script
Tracks individual people in a video with unique IDs
"""
import cv2
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
import argparse
from pathlib import Path
import math
import sys

def euclidean_distance(point1, point2):
    """Calculate distance between two points"""
    return math.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)

def get_box_center(x1, y1, x2, y2):
    """Get center point of bounding box"""
    center_x = (x1 + x2) / 2
    center_y = (y1 + y2) / 2
    return (center_x, center_y)

def run_tracking(input_video: str, output_video: str, player_x: int = None, player_y: int = None):
    """
    Run YOLO + DeepSORT tracking on video

    Args:
        input_video: Path to input video file
        output_video: Path to save output video
        player_x: X coordinate of selected player (optional)
        player_y: Y coordinate of selected player (optional)
    """
    print(f"Starting tracking...", flush=True)
    print(f"   Input:  {input_video}", flush=True)
    print(f"   Output: {output_video}", flush=True)
    if player_x is not None and player_y is not None:
        print(f"   Target player: ({player_x}, {player_y})", flush=True)

    # Load pre-trained YOLO model
    print(f"Loading YOLOv8n model...", flush=True)
    model = YOLO('yolov8n.pt')

    # Initialize DeepSort tracker
    print(f"Initializing DeepSort tracker...", flush=True)
    tracker = DeepSort(max_age=30, n_init=3)

    # Open video
    cap = cv2.VideoCapture(input_video)

    if not cap.isOpened():
        print(f"ERROR: Could not open video: {input_video}", flush=True)
        return False

    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"Video info:", flush=True)
    print(f"   FPS: {fps}", flush=True)
    print(f"   Resolution: {width}x{height}", flush=True)
    print(f"   Total frames: {total_frames}", flush=True)

    # Create video writer to save output
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video, fourcc, fps, (width, height))

    if not out.isOpened():
        print(f"ERROR: Could not create output video writer", flush=True)
        cap.release()
        return False

    frame_count = 0
    target_track_id = None  # ID of the selected player
    detected_at_click = False

    # How often to print progress. Printing every single frame can fill up
    # the subprocess stdout pipe (default ~64KB on macOS) faster than a
    # parent process reads it, which causes the child to block on write()
    # and looks exactly like a hang (0% CPU, "sleeping" state).
    PROGRESS_EVERY = 30

    # Process each frame
    while True:
        ret, frame = cap.read()

        if not ret:
            break

        # Run YOLO detection
        results = model(frame, verbose=False)
        detections = results[0].boxes.data.cpu().numpy()

        # Convert detections to DeepSort format
        tracks = []
        for det in detections:
            x1, y1, x2, y2, conf, cls = det
            # Only track people (class 0 in COCO dataset)
            if int(cls) == 0:
                # DeepSort format: [x1, y1, x2, y2], confidence, 'person'
                tracks.append(([float(x1), float(y1), float(x2), float(y2)], float(conf), 'person'))

        # Update tracker
        tracked_objects = tracker.update_tracks(tracks, frame=frame)

        # Draw tracked objects with IDs
        for track in tracked_objects:
            if not track.is_confirmed():
                continue

            x1, y1, x2, y2 = track.to_tlbr()
            track_id = track.track_id

            # Determine if this is the selected player
            is_selected = False
            if player_x is not None and player_y is not None and target_track_id is None:
                # First frame: find which track is closest to click point
                center = get_box_center(x1, y1, x2, y2)
                distance = euclidean_distance((player_x, player_y), center)

                # If click is inside or very close to box, this is our target
                if distance < max((x2 - x1), (y2 - y1)):  # Within box dimensions
                    target_track_id = track_id
                    is_selected = True
                    detected_at_click = True
                    print(f"Selected player! Track ID: {track_id}", flush=True)
            elif target_track_id is not None and track_id == target_track_id:
                is_selected = True

            # Draw bounding box (green for selected, blue for others)
            color = (0, 255, 0) if is_selected else (255, 0, 0)  # BGR: green or blue
            thickness = 3 if is_selected else 2

            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, thickness)

            # Draw track ID
            label = f'ID: {track_id}'
            if is_selected:
                label += ' *'  # marker for selected player

            cv2.putText(frame, label, (int(x1), int(y1) - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        # Draw click point on first frame (for debugging)
        if frame_count == 0 and player_x is not None and player_y is not None:
            cv2.circle(frame, (int(player_x), int(player_y)), 10, (0, 0, 255), 2)  # Red circle

        # Write to output video
        out.write(frame)

        frame_count += 1

        # Only print progress periodically, and in a machine-parseable format
        # (main.py looks for lines starting with "PROGRESS:") so the API can
        # report real progress instead of faking it on the frontend.
        if frame_count % PROGRESS_EVERY == 0 or frame_count == total_frames:
            print(f"PROGRESS:{frame_count}/{total_frames}", flush=True)

    # Release everything
    cap.release()
    out.release()
    cv2.destroyAllWindows()

    if target_track_id is None and player_x is not None and player_y is not None:
        print(f"Warning: Target player not detected at click point", flush=True)

    print(f"Tracking complete! Output saved to {output_video}", flush=True)
    if target_track_id is not None:
        print(f"   Tracked player ID: {target_track_id}", flush=True)

    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YOLO + DeepSORT Tracking")
    parser.add_argument("--input", type=str, required=True, help="Path to input video")
    parser.add_argument("--output", type=str, required=True, help="Path to output video")
    parser.add_argument("--x", type=int, default=None, help="X coordinate of selected player")
    parser.add_argument("--y", type=int, default=None, help="Y coordinate of selected player")

    args = parser.parse_args()

    success = run_tracking(args.input, args.output, args.x, args.y)
    exit(0 if success else 1)