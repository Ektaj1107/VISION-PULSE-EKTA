from flask import Flask, jsonify, Response
from scipy.spatial import distance as dist
import numpy as np
import mediapipe as mp
import cv2
import os
import time
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Initialize global variables
TOTAL_BLINKS = 0
EYE_AR_THRESH = 0.3
EYE_AR_CONSEC_FRAMES = 2
COUNTER = 0

# Initialize Mediapipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, min_detection_confidence=0.5)

# Eye Aspect Ratio calculation
def eye_aspect_ratio(eye):
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    C = dist.euclidean(eye[0], eye[3])
    ear = (A + B) / (2.0 * C)
    return ear

# Flask route to stream video and perform blink detection
@app.route('/detect_blinks')
def detect_blinks():
    global TOTAL_BLINKS, COUNTER

    def generate_frames():
        global TOTAL_BLINKS, COUNTER
        cap = cv2.VideoCapture(0)
        start_time = time.time()

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)

            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    left_eye = [(face_landmarks.landmark[i].x, face_landmarks.landmark[i].y) for i in [362, 385, 387, 263, 373, 380]]
                    right_eye = [(face_landmarks.landmark[i].x, face_landmarks.landmark[i].y) for i in [33, 160, 158, 133, 153, 144]]

                    # Convert normalized coordinates to actual pixel coordinates
                    h, w, _ = frame.shape
                    left_eye = [(int(x * w), int(y * h)) for x, y in left_eye]
                    right_eye = [(int(x * w), int(y * h)) for x, y in right_eye]

                    leftEAR = eye_aspect_ratio(left_eye)
                    rightEAR = eye_aspect_ratio(right_eye)

                    ear = (leftEAR + rightEAR) / 2.0

                    if ear < EYE_AR_THRESH:
                        COUNTER += 1
                    else:
                        if COUNTER >= EYE_AR_CONSEC_FRAMES:
                            TOTAL_BLINKS += 1
                        COUNTER = 0

            elapsed_time = time.time() - start_time

            # Stop after 1 minute
            if elapsed_time > 60:
                cap.release()
                cv2.destroyAllWindows()
                break

            # Encode the frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

        # Reset the COUNTER after processing
        COUNTER = 0

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# Route to get the total blink count
@app.route('/get_blink_count')
def get_blink_count():
    global TOTAL_BLINKS
    try:
        return jsonify({'blinks_per_minute': TOTAL_BLINKS})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
