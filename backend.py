from flask import Flask, jsonify, Response
from scipy.spatial import distance as dist
from imutils import face_utils
import numpy as np
import dlib
import cv2
import os
import wget
import time
from flask_cors import CORS

app = Flask(_name_)
CORS(app)

# Initialize global variables
TOTAL_BLINKS = 0
EYE_AR_THRESH = 0.3
EYE_AR_CONSEC_FRAMES = 2
COUNTER = 0

# Define path for dlib model
MODEL_PATH = 'model/shape_predictor_68_face_landmarks.dat'

# Download the model if not present
if not os.path.exists(MODEL_PATH):
    wget.download('http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2', out='model/')
    # Unzip the file
    import bz2
    with bz2.BZ2File('model/shape_predictor_68_face_landmarks.dat.bz2') as fr, open(MODEL_PATH, 'wb') as fw:
        fw.write(fr.read())
    os.remove('model/shape_predictor_68_face_landmarks.dat.bz2')

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
    detector = dlib.get_frontal_face_detector()
    predictor = dlib.shape_predictor(MODEL_PATH)

    (lStart, lEnd) = face_utils.FACIAL_LANDMARKS_IDXS["left_eye"]
    (rStart, rEnd) = face_utils.FACIAL_LANDMARKS_IDXS["right_eye"]

    def generate_frames():
        global TOTAL_BLINKS, COUNTER  # Declare global variables inside the function
        cap = cv2.VideoCapture(0)
        start_time = time.time()

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            rects = detector(gray, 0)

            for rect in rects:
                shape = predictor(gray, rect)
                shape = face_utils.shape_to_np(shape)

                leftEye = shape[lStart:lEnd]
                rightEye = shape[rStart:rEnd]
                leftEAR = eye_aspect_ratio(leftEye)
                rightEAR = eye_aspect_ratio(rightEye)

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

if _name_ == '_main_':
    app.run(debug=True)