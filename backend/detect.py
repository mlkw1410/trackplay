"""
YOLO Detection Script
Detects all people in a video and draws bounding boxes
"""
import cv2
from ultralytics import YOLO
import argparse
from pathlib import Path

def run_detection(input_video: str, output_video: str):
    """
    Run YOLO detection on video
    
    Args:
        input_video: Path to input video file
        output_video: Path to save output video
    """
    print(f"🎬 Starting detection...")
    print(f"   Input:  {input_video}")
    print(f"   Output: {output_video}")
    
    # Load pre-trained YOLO model
    print(f"📦 Loading YOLOv8n model...")
    model = YOLO('yolov8n.pt')  # nano model, fast and lightweight
    
    # Open video
    cap = cv2.VideoCapture(input_video)
    
    if not cap.isOpened():
        print(f"❌ ERROR: Could not open video: {input_video}")
        return False
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"📊 Video info:")
    print(f"   FPS: {fps}")
    print(f"   Resolution: {width}x{height}")
    print(f"   Total frames: {total_frames}")
    
    # Create video writer to save output
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video, fourcc, fps, (width, height))
    
    if not out.isOpened():
        print(f"❌ ERROR: Could not create output video writer")
        cap.release()
        return False
    
    frame_count = 0
    
    # Process each frame
    while True:
        ret, frame = cap.read()
        
        if not ret:
            break
        
        # Run YOLO detection
        results = model(frame, verbose=False)  # verbose=False to reduce spam
        
        # Draw bounding boxes
        annotated_frame = results[0].plot()
        
        # Write to output video
        out.write(annotated_frame)
        
        frame_count += 1
        progress = (frame_count / total_frames) * 100
        print(f"   ✓ Frame {frame_count}/{total_frames} ({progress:.1f}%)")
    
    # Release everything
    cap.release()
    out.release()
    cv2.destroyAllWindows()
    
    print(f"✅ Detection complete! Output saved to {output_video}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YOLO Detection - Draw bounding boxes on all people")
    parser.add_argument("--input", type=str, required=True, help="Path to input video")
    parser.add_argument("--output", type=str, required=True, help="Path to output video")
    
    args = parser.parse_args()
    
    success = run_detection(args.input, args.output)
    exit(0 if success else 1)