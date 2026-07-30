import pandas as pd
import cv2
import random
import os
import glob

def verify_export(video_path, csv_path, output_dir="verification_frames"):
    """
    Verifies exported tracking data by generating annotated frames.
    
    Args:
        video_path (str): Path to the source video file.
        csv_path (str): Path to the exported tracking CSV file.
        output_dir (str): Directory to save the verification images.
    """
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return

    if not os.path.exists(video_path):
         # Try to find mp4 files in gallery if exact path not found
        gallery_path = "demo/backend/server/assets/gallery"
        mp4_files = glob.glob(os.path.join(gallery_path, "*.mp4"))
        if mp4_files:
            print(f"Video not found at {video_path}, using found video: {mp4_files[0]}")
            video_path = mp4_files[0]
        else:
            print(f"Error: Video file not found at {video_path}")
            return

    print(f"Reading CSV from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    required_cols = ['frame_index', 'x_pixel', 'y_pixel', 'label']
    for col in required_cols:
        if col not in df.columns:
            print(f"Error: Missing column '{col}' in CSV.")
            return

    # Create output directory
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Get unique frame indices
    unique_frames = df['frame_index'].unique()
    
    # Select up to 10 random frames
    num_frames = min(10, len(unique_frames))
    selected_frames = random.sample(list(unique_frames), num_frames)
    selected_frames.sort()
    
    print(f"Processing {num_frames} frames: {selected_frames}")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return
        
    for frame_idx in selected_frames:
        # Seek to frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        
        if not ret:
            print(f"Warning: Could not read frame {frame_idx}")
            continue
            
        # Get data for this frame
        frame_data = df[df['frame_index'] == frame_idx]
        
        for _, row in frame_data.iterrows():
            x = int(row['x_pixel'])
            y = int(row['y_pixel'])
            label = str(row['label'])
            obj_id = int(row['object_id']) if 'object_id' in row else 0
            
            # defined colors for different objects
            colors = [(0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 165, 0), (0, 255, 255)]
            color = colors[obj_id % len(colors)]
            
            # Draw point at center
            cv2.circle(frame, (x, y), 5, color, -1)
            
            # Draw Label
            cv2.putText(frame, f"{label} ({obj_id})", (x + 10, y), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
            
        output_filename = os.path.join(output_dir, f"frame_{frame_idx}.jpg")
        cv2.imwrite(output_filename, frame)
        print(f"Saved {output_filename}")
        
    cap.release()
    print("Verification complete.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Verify exported tracking data.')
    parser.add_argument('--csv', default='tracking_data.csv', help='Path to exported CSV')
    parser.add_argument('--video', default='demo/data/gallery/default_waterpolo.mp4', help='Path to video file')
    args = parser.parse_args()
    
    verify_export(args.video, args.csv)
