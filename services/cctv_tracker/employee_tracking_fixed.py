import cv2
import numpy as np
import time
import os
from datetime import datetime
import urllib.request
import threading
import queue
import tempfile
from werkzeug.utils import secure_filename

class EmployeeTracker:
    def __init__(self):
        # Initialize state variables
        self.is_running = False
        self.tracking_thread = None
        self.frame_queue = queue.Queue(maxsize=10)  # Queue for frames between threads
        self.current_frame = None
        self.lock = threading.Lock()
        
        # Multi-workstation tracking status
        self.workstations = [] # list of {"id": str, "name": str, "coords": tuple or None}
        self.workstation_states = {} # {id: {"present": bool, "absence_start_time": float or None, "absence_logged": bool, "last_present_time": float, "name": str}}
        self.frames_processed = 0
        
        # Configuration
        self.camera_source = 0
        self.absence_threshold = 5
        self.confidence_threshold = 0.5
        self.monitor_area = None
        self.save_interval = 20
        self.output_dir = "output_frames"
        self.source_type = "webcam"  # Default source type
        self.uploaded_video_path = None
        
        # Model setup
        self.model_dir = "yolo_model"
        self.net = None
        self.output_layers = None
        
        # Create output directory if it doesn't exist
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            
        # Create logs directory if it doesn't exist
        if not os.path.exists("logs"):
            os.makedirs("logs")
        
        # Create uploads directory if it doesn't exist
        if not os.path.exists("uploads"):
            os.makedirs("uploads")
            
        # Initialize log file
        self.log_file_path = os.path.join("logs", "employee_log.txt")
        if not os.path.exists(self.log_file_path):
            with open(self.log_file_path, "w") as f:
                f.write("# Employee Tracking System Log\n\n")
    
    def setup_model(self):
        """Download and setup the YOLO model"""
        if not self._download_yolo_files():
            return False
        
        # Load YOLOv4-tiny model
        weights_path = os.path.join(self.model_dir, "yolov4-tiny.weights")
        config_path = os.path.join(self.model_dir, "yolov4-tiny.cfg")
        
        try:
            self.net = cv2.dnn.readNetFromDarknet(config_path, weights_path)
            
            # Use CPU
            self.net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
            self.net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
            
            # Get output layer names
            layer_names = self.net.getLayerNames()
            try:
                # Different versions of OpenCV have different indexing for getUnconnectedOutLayers
                self.output_layers = [layer_names[i - 1] for i in self.net.getUnconnectedOutLayers()]
            except:
                # Alternative approach for newer OpenCV versions
                self.output_layers = [layer_names[i[0] - 1] for i in self.net.getUnconnectedOutLayers()]
            
            return True
        except Exception as e:
            self.log_event(f"Error loading model: {e}")
            return False
    
    def _download_yolo_files(self):
        """Download YOLOv4-tiny model files"""
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir)
        
        files = {
            "yolov4-tiny.weights": "https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights",
            "yolov4-tiny.cfg": "https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4-tiny.cfg",
            "coco.names": "https://raw.githubusercontent.com/AlexeyAB/darknet/master/data/coco.names"
        }
        
        for filename, url in files.items():
            filepath = os.path.join(self.model_dir, filename)
            if not os.path.exists(filepath):
                try:
                    urllib.request.urlretrieve(url, filepath)
                    self.log_event(f"Downloaded {filename} successfully")
                except Exception as e:
                    self.log_event(f"Error downloading {filename}: {e}")
                    return False
        
        return True
    
    def log_event(self, message):
        """Log an event with timestamp"""
        with open(self.log_file_path, "a") as log_file:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_file.write(f"{timestamp} - {message}\n")
    
    def get_logs(self, max_lines=100):
        """Get recent log entries"""
        if not os.path.exists(self.log_file_path):
            return []
        
        try:
            with open(self.log_file_path, "r") as f:
                lines = f.readlines()
                return lines[-max_lines:] if lines else []
        except:
            return ["Error reading log file"]
    
    def get_status(self):
        """Get current tracking status"""
        with self.lock:
            workstation_data = []
            for ws_id, state in self.workstation_states.items():
                duration = 0
                if not state["present"] and state["absence_start_time"] is not None:
                    duration = time.time() - state["absence_start_time"]
                workstation_data.append({
                    "id": ws_id,
                    "name": state["name"],
                    "present": state["present"],
                    "absence_duration": duration
                })
            
            return {
                "status": "active" if self.is_running else "inactive",
                "frames_processed": self.frames_processed,
                "workstations": workstation_data
            }
    
    def upload_video(self, video_file, config):
        """Handle uploaded video file"""
        if self.is_running:
            return {"status": "error", "message": "Tracking is already running"}
        
        try:
            # Save the uploaded file
            filename = secure_filename(video_file.filename)
            file_path = os.path.join("uploads", f"{int(time.time())}_{filename}")
            video_file.save(file_path)
            
            self.log_event(f"Video uploaded: {filename}")
            self.uploaded_video_path = file_path
            self.source_type = "upload"
            
            # Start tracking with the uploaded video
            return self.start_tracking(config)
            
        except Exception as e:
            self.log_event(f"Error processing uploaded video: {str(e)}")
            return {"status": "error", "message": f"Upload error: {str(e)}"}
    
    def start_tracking(self, config):
        """Start the tracking process with the given configuration"""
        if self.is_running:
            return {"status": "error", "message": "Tracking is already running"}
        
        # Update configuration
        self.source_type = config.get("source_type", "webcam")
        
        if self.source_type == "upload" and self.uploaded_video_path is None:
            return {"status": "error", "message": "No uploaded video available"}
        elif self.source_type == "webcam":
            self.camera_source = config.get("camera_source", 0)
            if isinstance(self.camera_source, str) and self.camera_source.isdigit():
                self.camera_source = int(self.camera_source)
        elif self.source_type == "custom":
            self.camera_source = config.get("camera_source", "")
            
        self.absence_threshold = float(config.get("absence_threshold", 5))
        self.confidence_threshold = float(config.get("confidence", 0.5))
        
        # Make sure the model is set up
        if self.net is None:
            if not self.setup_model():
                return {"status": "error", "message": "Failed to set up detection model"}
        
        # Open camera to get frame dimensions
        cap = self._open_camera()
        if cap is None:
            return {"status": "error", "message": "Failed to open video source"}
            
        ret, frame = cap.read()
        if not ret:
            cap.release()
            return {"status": "error", "message": "Failed to read initial frame"}
            
        # Resize frame for consistent processing
        frame = cv2.resize(frame, (600, int(frame.shape[0] * 600 / frame.shape[1])))
        height, width = frame.shape[:2]
        
        # Initialize dynamic workstations list and states
        self.workstations = []
        self.workstation_states = {}
        
        workstations_input = config.get("workstations", [])
        if workstations_input:
            self.log_event(f"Loading {len(workstations_input)} workstations from configuration...")
            for ws in workstations_input:
                ws_id = ws.get("id") or ws.get("employee_id")
                ws_name = ws.get("name") or ws.get("employee_name") or ws_id
                coords = ws.get("coords") # Expected as [x_min, y_min, x_max, y_max] normalized floats
                if coords and len(coords) == 4:
                    self.workstations.append({
                        "id": ws_id,
                        "name": ws_name,
                        "coords": tuple(map(float, coords))
                    })
                    self.workstation_states[ws_id] = {
                        "present": False,
                        "absence_start_time": None,
                        "absence_logged": False,
                        "last_present_time": time.time(),
                        "name": ws_name
                    }
        
        # Fallback to single/auto monitor area if no workstations provided
        if not self.workstations:
            self.log_event("No multi-workstation mapping provided. Using auto/manual monitor area.")
            area_method = config.get("area_method", "auto")
            if area_method == "manual":
                try:
                    coords = config.get("manual_coords", "0.1,0.1,0.9,0.9")
                    x1, y1, x2, y2 = map(float, coords.split(','))
                    self.monitor_area = (
                        int(x1 * width),
                        int(y1 * height),
                        int(x2 * width),
                        int(y2 * height)
                    )
                except:
                    self.monitor_area = (int(width * 0.1), int(height * 0.1), int(width * 0.9), int(height * 0.9))
            else:
                self.monitor_area = self._detect_desk_area(cap)
            
            # Map default monitor area as single workstation
            ws_id = "default_workstation"
            ws_name = "Generic Workstation"
            self.workstations.append({
                "id": ws_id,
                "name": ws_name,
                "coords": None # Signals fallback to self.monitor_area
            })
            self.workstation_states[ws_id] = {
                "present": False,
                "absence_start_time": None,
                "absence_logged": False,
                "last_present_time": time.time(),
                "name": ws_name
            }
        
        # Release initial camera
        cap.release()
        self.frames_processed = 0
        
        # Log system start
        self.log_event(f"Tracking started using {self.source_type} source")
        
        # Start tracking thread
        self.is_running = True
        self.tracking_thread = threading.Thread(target=self._tracking_loop)
        self.tracking_thread.daemon = True
        self.tracking_thread.start()
        
        return {"status": "success", "message": "Tracking started"}
    
    def stop_tracking(self):
        """Stop the tracking process"""
        if not self.is_running:
            return {"status": "error", "message": "Tracking is not running"}
        
        # Stop the tracking loop
        self.is_running = False
        
        # Wait for thread to finish (with timeout)
        if self.tracking_thread:
            self.tracking_thread.join(timeout=5.0)
        
        # Log system stop
        self.log_event("Tracking system stopped")
        
        # Clean up uploaded video if needed
        if self.source_type == "upload" and self.uploaded_video_path:
            try:
                self.uploaded_video_path = None
            except:
                pass
        
        return {"status": "success", "message": "Tracking stopped"}
    
    def get_current_frame(self):
        """Get the latest processed frame for the video feed"""
        with self.lock:
            if self.current_frame is not None:
                # Encode the image as JPEG
                ret, jpeg = cv2.imencode('.jpg', self.current_frame)
                if ret:
                    return jpeg.tobytes()
        
        # Return a blank frame if no frame is available
        blank = np.zeros((300, 400, 3), dtype=np.uint8)
        blank[:] = [50, 50, 50]  # Dark gray background
        cv2.putText(blank, "Loading...", (120, 150), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        ret, jpeg = cv2.imencode('.jpg', blank)
        return jpeg.tobytes()
    
    def _open_camera(self):
        """Helper to open the camera source"""
        try:
            if self.source_type == "upload" and self.uploaded_video_path:
                # Use uploaded video file
                cap = cv2.VideoCapture(self.uploaded_video_path)
                if not cap.isOpened():
                    self.log_event(f"Error: Could not open uploaded video {self.uploaded_video_path}")
                    return None
                return cap
            elif self.source_type == "webcam":
                # Use webcam
                if isinstance(self.camera_source, int) or str(self.camera_source).isdigit():
                    cap = cv2.VideoCapture(int(self.camera_source))
                else:
                    cap = cv2.VideoCapture(self.camera_source)
            elif self.source_type == "custom":
                # Use custom URL
                cap = cv2.VideoCapture(self.camera_source)
            else:
                self.log_event(f"Unsupported source type: {self.source_type}")
                return None
                
            if not cap.isOpened():
                self.log_event(f"Error: Could not open video source {self.camera_source}")
                return None
                
            return cap
        except Exception as e:
            self.log_event(f"Error opening camera: {str(e)}")
            return None
    
    def _detect_desk_area(self, cap):
        """Detect the desk area using object detection"""
        self.log_event("Detecting desk area...")
        
        # Take multiple frames to improve detection reliability
        desk_candidates = []
        frame_count = 0
        max_frames = 5
        
        while frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame = cv2.resize(frame, (600, int(frame.shape[0] * 600 / frame.shape[1])))
            height, width = frame.shape[:2]
            
            blob = cv2.dnn.blobFromImage(frame, 1/255.0, (416, 416), swapRB=True, crop=False)
            self.net.setInput(blob)
            
            try:
                detections = self.net.forward(self.output_layers)
            except Exception as e:
                self.log_event(f"Error during detection: {e}")
                break
            
            desks = []
            for detection in detections:
                for obj_detection in detection:
                    scores = obj_detection[5:]
                    class_id = np.argmax(scores)
                    confidence = scores[class_id]
                    
                    desk_related_classes = [56, 60, 63, 64, 65]
                    
                    if confidence > self.confidence_threshold and class_id in desk_related_classes:
                        center_x = int(obj_detection[0] * width)
                        center_y = int(obj_detection[1] * height)
                        w = int(obj_detection[2] * width)
                        h = int(obj_detection[3] * height)
                        
                        x = int(center_x - w / 2)
                        y = int(center_y - h / 2)
                        
                        desks.append([x, y, w, h, confidence, class_id])
            
            if desks:
                desk_candidates.extend(desks)
            
            frame_count += 1
            if self.source_type == "upload":
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        
        if len(desk_candidates) < 2:
            self.log_event("Not enough desk objects detected. Using default desk area.")
            height, width = frame.shape[:2]
            desk_area = [int(width * 0.2), int(height * 0.4), int(width * 0.8), int(height * 0.9)]
            return tuple(desk_area)
        
        x_coords = [d[0] for d in desk_candidates]
        y_coords = [d[1] for d in desk_candidates]
        max_x = max([d[0] + d[2] for d in desk_candidates])
        max_y = max([d[1] + d[3] for d in desk_candidates])
        
        min_x = max(0, int(min(x_coords) - 0.1 * width))
        min_y = max(0, int(min(y_coords) - 0.1 * height))
        max_x = min(width, int(max_x + 0.1 * width))
        max_y = min(height, int(max_y + 0.1 * height))
        
        return (min_x, min_y, max_x, max_y)
    
    def _tracking_loop(self):
        """Main tracking loop that runs in a separate thread"""
        cap = self._open_camera()
        if cap is None:
            self.log_event("Failed to open camera in tracking loop")
            self.is_running = False
            return
        
        try:
            last_save_time = time.time()
            video_ended = False
            
            while self.is_running:
                ret, frame = cap.read()
                
                if not ret:
                    if self.source_type == "upload":
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        ret, frame = cap.read()
                        if ret:
                            if not video_ended:
                                self.log_event("End of video reached, looping back to start")
                                video_ended = True
                        else:
                            self.log_event("Failed to loop video, ending tracking")
                            break
                    else:
                        self.log_event("Failed to read frame, camera disconnected?")
                        break
                
                frame = cv2.resize(frame, (600, int(frame.shape[0] * 600 / frame.shape[1])))
                
                # Process frame for all workstation presence
                processed_frame, workstation_occupancy = self._process_frame(frame)
                
                current_time = time.time()
                
                # Update status and transition logs for each workstation independently
                with self.lock:
                    for ws in self.workstations:
                        ws_id = ws["id"]
                        detected = workstation_occupancy.get(ws_id, False)
                        state = self.workstation_states[ws_id]
                        
                        if detected:
                            if not state["present"]:
                                # Employee returned
                                state["present"] = True
                                if state["absence_start_time"] is not None:
                                    absence_duration = current_time - state["absence_start_time"]
                                    self.log_event(f"Employee {state['name']} ({ws_id}) returned after {absence_duration:.1f} seconds")
                                    state["absence_start_time"] = None
                                    state["absence_logged"] = False
                                
                                # Log PRESENT state to Next.js CRM API
                                self._log_status_to_crm(ws_id, "PRESENT")
                            
                            state["last_present_time"] = current_time
                        else:
                            if state["present"]:
                                # Employee just left
                                state["present"] = False
                                state["absence_start_time"] = current_time
                            elif state["absence_start_time"] is not None:
                                # Check if absence threshold is reached
                                absence_duration = current_time - state["absence_start_time"]
                                if absence_duration >= self.absence_threshold and not state["absence_logged"]:
                                    self.log_event(f"Employee {state['name']} ({ws_id}) absence detected")
                                    state["absence_logged"] = True
                                    
                                    # Log ABSENT state to Next.js CRM API
                                    self._log_status_to_crm(ws_id, "ABSENT")
                
                # Save the processed frame for the web UI
                with self.lock:
                    self.current_frame = processed_frame
                    self.frames_processed += 1
                
                # Save frame periodically
                if current_time - last_save_time > 10:
                    frame_filename = os.path.join(self.output_dir, f"frame_{self.frames_processed:06d}.jpg")
                    cv2.imwrite(frame_filename, processed_frame)
                    last_save_time = current_time
                
                if self.source_type == "upload":
                    time.sleep(0.033)  # ~30 fps
                else:
                    time.sleep(0.01)  # Brief pause to reduce CPU usage
                
        except Exception as e:
            self.log_event(f"Error in tracking loop: {str(e)}")
        finally:
            cap.release()
            self.is_running = False
            self.log_event("Tracking loop ended")
    
    def _process_frame(self, frame):
        """Process a frame to detect people and check occupancy for each workstation"""
        height, width = frame.shape[:2]
        workstation_occupancy = {ws["id"]: False for ws in self.workstations}
        
        blob = cv2.dnn.blobFromImage(frame, 1/255.0, (416, 416), swapRB=True, crop=False)
        self.net.setInput(blob)
        
        try:
            detections = self.net.forward(self.output_layers)
        except Exception as e:
            self.log_event(f"Error during detection: {e}")
            return frame, workstation_occupancy
        
        boxes = []
        confidences = []
        
        # Process detections to find people
        for detection in detections:
            for obj_detection in detection:
                scores = obj_detection[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]
                
                if confidence > self.confidence_threshold and class_id == 0:  # Person class
                    center_x = int(obj_detection[0] * width)
                    center_y = int(obj_detection[1] * height)
                    w = int(obj_detection[2] * width)
                    h = int(obj_detection[3] * height)
                    
                    x = int(center_x - w / 2)
                    y = int(center_y - h / 2)
                    
                    boxes.append([x, y, w, h])
                    confidences.append(float(confidence))
        
        # Apply Non-Maximum Suppression
        indices = []
        if len(boxes) > 0:
            indices = cv2.dnn.NMSBoxes(boxes, confidences, self.confidence_threshold, 0.4)
        
        # Track which person boxes belong to which workstations
        person_boxes = []
        if len(indices) > 0:
            for i in indices.flatten():
                x, y, w, h = boxes[i]
                person_boxes.append((x, y, w, h, confidences[i]))
        
        # Evaluate each workstation
        for ws in self.workstations:
            ws_id = ws["id"]
            ws_name = ws["name"]
            coords = ws["coords"]
            
            # Determine desk area bounding box
            if coords is not None:
                # Normalized workstation bounds
                x1_ws = int(coords[0] * width)
                y1_ws = int(coords[1] * height)
                x2_ws = int(coords[2] * width)
                y2_ws = int(coords[3] * height)
            else:
                # Use default monitor area
                x1_ws, y1_ws, x2_ws, y2_ws = self.monitor_area
            
            ws_box = (x1_ws, y1_ws, x2_ws, y2_ws)
            is_occupied = False
            occupied_confidence = 0.0
            
            # Check overlap with any detected person
            for px, py, pw, ph, pconf in person_boxes:
                # Person bounding box coordinates
                px1, py1, px2, py2 = px, py, px + pw, py + ph
                
                # Compute intersection
                ix1 = max(x1_ws, px1)
                iy1 = max(y1_ws, py1)
                ix2 = min(x2_ws, px2)
                iy2 = min(y2_ws, py2)
                
                iw = ix2 - ix1
                ih = iy2 - iy1
                
                if iw > 0 and ih > 0:
                    intersection_area = iw * ih
                    person_area = pw * ph
                    overlap_ratio = intersection_area / person_area
                    
                    if overlap_ratio > 0.3: # >30% overlap
                        is_occupied = True
                        occupied_confidence = max(occupied_confidence, pconf)
            
            workstation_occupancy[ws_id] = is_occupied
            
            # Draw workstation boundary (Green if empty, Red if occupied)
            color = (0, 0, 255) if is_occupied else (0, 255, 0)
            cv2.rectangle(frame, (x1_ws, y1_ws), (x2_ws, y2_ws), color, 2)
            
            # Draw workstation label
            label = f"{ws_name}: {'PRESENT' if is_occupied else 'ABSENT'}"
            cv2.putText(frame, label, (x1_ws + 5, y1_ws + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
        
        # Display global stats
        present_count = sum(1 for val in workstation_occupancy.values() if val)
        cv2.putText(frame, f"Tracking: {len(self.workstations)} workstations", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"Present: {present_count} | Absent: {len(self.workstations) - present_count}", (10, 55), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Add timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, f"Time: {timestamp}", (10, 80), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
        
        return frame, workstation_occupancy
        
    def _log_status_to_crm(self, employee_id, status):
        """Log status change to Next.js CRM webhook in a non-blocking way"""
        if employee_id == "default_workstation":
            return
            
        def post_request():
            timestamp = datetime.now().isoformat()
            data = {
                "employee_id": employee_id,
                "status": status,
                "timestamp": timestamp,
                "camera_source": str(self.camera_source)
            }
            try:
                import json
                req_data = json.dumps(data).encode('utf-8')
                crm_url = os.environ.get("CRM_API_URL", "http://127.0.0.1:3005")
                req = urllib.request.Request(
                    f"{crm_url}/api/cctv/log",
                    data=req_data,
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    self.log_event(f"Successfully synced transition to CRM: {employee_id} is now {status}")
            except Exception as e:
                self.log_event(f"Failed to sync transition to CRM for {employee_id}: {str(e)}")
                
        # Run request in a separate thread so it doesn't block the video processing loop
        t = threading.Thread(target=post_request)
        t.daemon = True
        t.start()
