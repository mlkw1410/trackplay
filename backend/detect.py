import cv2
from ultralytics import YOLO

# Load pre-trained YOLO model
model = YOLO('yolov8n.pt')  # nano model, fast and lightweight

# Path to your video
video_path = '/Users/malavikapanicker/Developer/trackplay/data/jude_sample.mp4'  # Update this with your actual filename

# Open video
cap = cv2.VideoCapture(video_path)

# Get video properties
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# Create video writer to save output
output_path = '/Users/malavikapanicker/Developer/trackplay/data/output_detected.mp4'
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
    
    # Draw bounding boxes
    annotated_frame = results[0].plot()
    
    # Write to output video
    out.write(annotated_frame)
    
    frame_count += 1
    print(f"Processed frame {frame_count}")

# Release everything
cap.release()
out.release()
cv2.destroyAllWindows()

print(f"Done! Output saved to {output_path}")