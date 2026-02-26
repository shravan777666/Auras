"""
Face Symmetry Analyzer using OpenCV and MediaPipe
Analyzes facial symmetry and recommends appropriate exercises
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class FaceSymmetryAnalyzer:
    """
    Analyzes facial symmetry and detects imbalances
    """
    
    def __init__(self):
        """Initialize OpenCV face and eye detectors"""
        # Load Haar Cascade classifiers
        cascade_path = cv2.data.haarcascades
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
        
        logger.info("Face Symmetry Analyzer initialized with OpenCV")
        
        # Exercise recommendations mapping
        self.exercise_recommendations = {
            'Jaw Asymmetry': {
                'issue': 'Jaw Asymmetry',
                'description': 'Your jaw shows slight asymmetry. These exercises can help strengthen and balance jaw muscles.',
                'video': 'jaw_tightening.mp4',
                'exercises': [
                    'Jaw Clenching - Clench and release jaw muscles',
                    'Jaw Slides - Move jaw side to side slowly',
                    'Chin Tucks - Pull chin back to align jaw',
                    'Resistance Training - Push tongue against roof of mouth'
                ]
            },
            'Cheek Imbalance': {
                'issue': 'Cheek Imbalance',
                'description': 'Slight cheek asymmetry detected. These exercises can help tone and lift cheek muscles.',
                'video': 'cheek_lift.mp4',
                'exercises': [
                    'Cheek Lifts - Smile while lifting cheeks',
                    'Cheek Puffing - Puff air and move between cheeks',
                    'Fish Face - Suck in cheeks and hold',
                    'Smile Training - Practice symmetric smiling'
                ]
            },
            'Eye Droop Exercises': {
                'issue': 'Eye Area Asymmetry',
                'description': 'Eye area shows slight asymmetry. These exercises can help lift and strengthen the eye area.',
                'video': 'eyebrow_lift.mp4',
                'exercises': [
                    'Eyebrow Lifts - Raise and lower eyebrows',
                    'Eye Squints - Gentle squinting exercises',
                    'Forehead Smoothing - Massage forehead muscles',
                    'Eyelid Resistance - Gentle resistance training'
                ]
            },
            'Forehead & Symmetry Correction': {
                'issue': 'Forehead Asymmetry',
                'description': 'Forehead shows minor asymmetry. These exercises can help relax and balance forehead muscles.',
                'video': 'forehead_stretch.mp4',
                'exercises': [
                    'Forehead Smoothing - Gentle massage movements',
                    'Eyebrow Stretches - Stretch and relax',
                    'Temple Massage - Circular massage motions',
                    'Forehead Relaxation - Release tension exercises'
                ]
            },
            'Full Face Toning Routine (General Recommendation)': {
                'issue': 'General Face Toning',
                'description': 'Your face shows good symmetry! Maintain it with this comprehensive face toning routine.',
                'video': 'full_face_yoga.mp4',
                'exercises': [
                    'Full Face Yoga - Complete facial workout',
                    'Face Massage - Improve circulation',
                    'Facial Stretching - Maintain flexibility',
                    'Muscle Activation - Engage all facial muscles'
                ]
            }
        }
    
    def detect_face_landmarks(self, image: np.ndarray) -> Optional[Dict]:
        """
        Detect facial features and key landmarks
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            Dictionary with landmark coordinates or None if face not detected
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(100, 100)
        )
        
        if len(faces) == 0:
            logger.warning("No face detected in image")
            return None
        
        # Get the largest face
        face = max(faces, key=lambda rect: rect[2] * rect[3])
        x, y, w, h = face
        
        # Extract face region for eye detection
        face_roi_gray = gray[y:y+h, x:x+w]
        face_roi_color = image[y:y+h, x:x+w]
        
        # Detect eyes within face region
        eyes = self.eye_cascade.detectMultiScale(face_roi_gray)
        
        landmarks = {
            'face_box': (x, y, w, h),
            'face_center': (x + w//2, y + h//2),
            'eyes': []
        }
        
        # Process detected eyes
        if len(eyes) >= 2:
            # Sort eyes by x-coordinate (left to right)
            eyes_sorted = sorted(eyes, key=lambda e: e[0])
            for i, (ex, ey, ew, eh) in enumerate(eyes_sorted[:2]):
                # Adjust coordinates to image space
                eye_center = (x + ex + ew//2, y + ey + eh//2)
                landmarks['eyes'].append({
                    'box': (x + ex, y + ey, ew, eh),
                    'center': eye_center,
                    'side': 'left' if i == 0 else 'right'
                })
        
        # Calculate additional landmarks
        if len(landmarks['eyes']) == 2:
            left_eye = landmarks['eyes'][0]['center']
            right_eye = landmarks['eyes'][1]['center']
            
            # Eye level
            eye_y = (left_eye[1] + right_eye[1]) // 2
            
            # Forehead points (above eyes)
            forehead_y = y + (eye_y - y) // 2
            landmarks['forehead'] = {
                'left': (x + w//4, forehead_y),
                'center': (x + w//2, forehead_y),
                'right': (x + 3*w//4, forehead_y)
            }
            
            # Cheek points (below eyes)
            cheek_y = eye_y + (y + h - eye_y) // 3
            landmarks['cheeks'] = {
                'left': (x + w//4, cheek_y),
                'right': (x + 3*w//4, cheek_y)
            }
            
            # Jaw points
            jaw_y = y + int(h * 0.85)
            landmarks['jaw'] = {
                'left': (x + w//4, jaw_y),
                'center': (x + w//2, jaw_y),
                'right': (x + 3*w//4, jaw_y)
            }
        
        return landmarks
    
    def calculate_asymmetry_score(self, landmarks: Dict) -> Dict:
        """
        Calculate asymmetry scores for different facial regions
        
        Args:
            landmarks: Dictionary of facial landmarks
            
        Returns:
            Dictionary with asymmetry scores and detected issues
        """
        if len(landmarks.get('eyes', [])) < 2:
            # If eyes not properly detected, return general recommendation
            return {
                'primary_issue': 'Full Face Toning Routine (General Recommendation)',
                'asymmetry_scores': {},
                'confidence': 'low'
            }
        
        asymmetry_scores = {}
        
        # Eye asymmetry
        left_eye = landmarks['eyes'][0]['center']
        right_eye = landmarks['eyes'][1]['center']
        eye_height_diff = abs(left_eye[1] - right_eye[1])
        eye_asymmetry = eye_height_diff / landmarks['face_box'][3] * 100  # Normalize by face height
        asymmetry_scores['eye'] = eye_asymmetry
        
        # Cheek asymmetry (if cheek landmarks exist)
        if 'cheeks' in landmarks:
            left_cheek = landmarks['cheeks']['left']
            right_cheek = landmarks['cheeks']['right']
            face_center_x = landmarks['face_center'][0]
            
            left_distance = abs(left_cheek[0] - face_center_x)
            right_distance = abs(right_cheek[0] - face_center_x)
            cheek_asymmetry = abs(left_distance - right_distance) / landmarks['face_box'][2] * 100
            asymmetry_scores['cheek'] = cheek_asymmetry
        
        # Jaw asymmetry (if jaw landmarks exist)
        if 'jaw' in landmarks:
            left_jaw = landmarks['jaw']['left']
            right_jaw = landmarks['jaw']['right']
            jaw_center = landmarks['jaw']['center']
            face_center_x = landmarks['face_center'][0]
            
            jaw_center_offset = abs(jaw_center[0] - face_center_x)
            jaw_asymmetry = jaw_center_offset / landmarks['face_box'][2] * 100
            asymmetry_scores['jaw'] = jaw_asymmetry
        
        # Forehead asymmetry (if forehead landmarks exist)
        if 'forehead' in landmarks:
            left_forehead = landmarks['forehead']['left']
            right_forehead = landmarks['forehead']['right']
            face_center_x = landmarks['face_center'][0]
            
            left_distance = abs(left_forehead[0] - face_center_x)
            right_distance = abs(right_forehead[0] - face_center_x)
            forehead_asymmetry = abs(left_distance - right_distance) / landmarks['face_box'][2] * 100
            asymmetry_scores['forehead'] = forehead_asymmetry
        
        # Determine primary issue based on highest asymmetry score
        if not asymmetry_scores:
            primary_issue = 'Full Face Toning Routine (General Recommendation)'
        else:
            max_asymmetry_region = max(asymmetry_scores.items(), key=lambda x: x[1])
            region, score = max_asymmetry_region
            
            # Map region to exercise category with threshold
            if score > 5:  # Threshold for significant asymmetry
                if region == 'jaw':
                    primary_issue = 'Jaw Asymmetry'
                elif region == 'cheek':
                    primary_issue = 'Cheek Imbalance'
                elif region == 'eye':
                    primary_issue = 'Eye Droop Exercises'
                elif region == 'forehead':
                    primary_issue = 'Forehead & Symmetry Correction'
                else:
                    primary_issue = 'Full Face Toning Routine (General Recommendation)'
            else:
                # Low asymmetry - general recommendation
                primary_issue = 'Full Face Toning Routine (General Recommendation)'
        
        return {
            'primary_issue': primary_issue,
            'asymmetry_scores': asymmetry_scores,
            'confidence': 'high' if asymmetry_scores else 'low'
        }
    
    def analyze_face_symmetry(self, image: np.ndarray) -> Dict:
        """
        Main analysis function - analyzes facial symmetry and returns recommendations
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            Dictionary with analysis results and exercise recommendations
        """
        try:
            # Detect facial landmarks
            landmarks = self.detect_face_landmarks(image)
            
            if landmarks is None:
                return {
                    'success': False,
                    'message': 'No face detected in the image. Please ensure your face is clearly visible and well-lit.'
                }
            
            # Calculate asymmetry
            asymmetry_analysis = self.calculate_asymmetry_score(landmarks)
            
            # Get exercise recommendations
            primary_issue = asymmetry_analysis['primary_issue']
            recommendations = self.exercise_recommendations.get(
                primary_issue,
                self.exercise_recommendations['Full Face Toning Routine (General Recommendation)']
            )
            
            return {
                'success': True,
                'data': {
                    'primary_issue': primary_issue,
                    'description': recommendations['description'],
                    'video_file': recommendations['video'],
                    'exercises': recommendations['exercises'],
                    'asymmetry_scores': asymmetry_analysis['asymmetry_scores'],
                    'confidence': asymmetry_analysis['confidence']
                }
            }
            
        except Exception as e:
            logger.error(f"Error in face symmetry analysis: {str(e)}", exc_info=True)
            return {
                'success': False,
                'message': f'Error analyzing face symmetry: {str(e)}'
            }


# Global instance
_analyzer_instance = None

def get_symmetry_analyzer():
    """
    Get or create global FaceSymmetryAnalyzer instance
    
    Returns:
        FaceSymmetryAnalyzer instance
    """
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = FaceSymmetryAnalyzer()
    return _analyzer_instance
