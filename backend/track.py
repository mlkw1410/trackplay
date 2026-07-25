import cv2
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

# Load pre-trained YOLO model
model = YOLO('yolov8n.pt')

# Initialize DeepSort tracker
tracker = DeepSort(max_age=30, n_init=3)

# Path to your video
video_path = 'data/jude_sample.mp4'

# Open video
cap = cv2.VideoCapture(video_path)

# Get video properties
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# Create video writer to save output
output_path = 'data/output_tracked.mp4'
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

frame_count = 0

# Process each frame
while True:
    ret, frame = cap.read()
    
    if not ret:
        break
    
    # Run YOLO detection
    results = model(frame)
    detections = results[0].boxes.data.cpu().numpy()
    
    # Convert detections to DeepSort format
    tracks = []
    for det in detections:
        x1, y1, x2, y2, conf, cls = det
        # DeepSort format: [x1, y1, x2, y2, confidence]
        tracks.append(([x1, y1, x2, y2], conf, 'person'))
    
    # Update tracker
    tracked_objects = tracker.update_tracks(tracks, frame=frame)
    
    # Draw tracked objects with IDs
    for track in tracked_objects:
        if not track.is_confirmed():
            continue
        
        x1, y1, x2, y2 = track.to_tlbr()
        track_id = track.track_id
        
        # Draw bounding box
        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
        
        # Draw track ID
        cv2.putText(frame, f'ID: {track_id}', (int(x1), int(y1) - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # Write to output video
    out.write(frame)
    
    frame_count += 1
    print(f"Processed frame {frame_count}")

# Release everything
cap.release()
out.release()
cv2.destroyAllWindows()

print(f"Done! Output saved to {output_path}")