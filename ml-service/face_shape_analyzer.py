"""
Face Shape Analyzer using OpenCV
Analyzes face to determine face shape and recommend hairstyles
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging
import os

logger = logging.getLogger(__name__)

class FaceShapeAnalyzer:
    """
    Analyzes face shape using OpenCV face and eye detection
    """
    
    def __init__(self):
        """Initialize OpenCV face detectors"""
        # Load Haar Cascade classifiers
        cascade_path = cv2.data.haarcascades
        self.face_cascade = cv2.CascadeClassifier(
            os.path.join(cascade_path, 'haarcascade_frontalface_default.xml')
        )
        self.eye_cascade = cv2.CascadeClassifier(
            os.path.join(cascade_path, 'haarcascade_eye.xml')
        )
        
        logger.info("Face Shape Analyzer initialized with OpenCV")
        
        # Hairstyle recommendations mapping
        self.hairstyle_recommendations = {
            'Round': [
                'Long Layered Cuts - adds length to elongate the face',
                'Side-Swept Bangs - creates angles and asymmetry',
                'High Ponytail or Top Knot - adds height',
                'Angular Bob - adds definition',
                'Textured Pixie Cut - creates visual length'
            ],
            'Oval': [
                'Almost Any Style Works! - most versatile face shape',
                'Blunt Bob - emphasizes balanced proportions',
                'Soft Waves - adds volume and movement',
                'Curtain Bangs - frames the face beautifully',
                'Long Straight Hair - showcases symmetry'
            ],
            'Long': [
                'Chin-Length Bob - adds width and balance',
                'Side Bangs or Fringe - shortens face visually',
                'Waves or Curls - adds volume at sides',
                'Layered Shoulder-Length Cut - creates width',
                'Avoid Very Long Straight Hair - can elongate further'
            ],
            'Square': [
                'Soft Layers - softens angular features',
                'Side-Swept Bangs - creates diagonal lines',
                'Long Wavy Styles - adds softness',
                'Rounded Bob - balances square jawline',
                'Textured Lob (Long Bob) - very flattering'
            ],
            'Heart': [
                'Chin-Length Bob - balances wider forehead',
                'Side-Swept Bangs - softens forehead',
                'Long Layers Starting at Chin - adds width below',
                'Textured Pixie - can work well',
                'Avoid Heavy Top Volume - keeps balance'
            ],
            'Diamond': [
                'Chin-Length Cuts - emphasizes cheekbones',
                'Side-Swept Bangs - balances narrow forehead',
                'Textured Waves - adds width at temples',
                'Deep Side Part - creates asymmetry',
                'Soft Layers Around Face - highlights cheekbones'
            ]
        }
        
        self.styling_tips = {
            'Round': 'Create height and volume at the crown. Avoid blunt cuts at chin level.',
            'Oval': 'Your face shape is very versatile! Most styles will look great on you.',
            'Long': 'Add width at the sides and avoid excessive height. Horizontal lines work well.',
            'Square': 'Soften angles with layers and waves. Side parts work better than center.',
            'Heart': 'Balance your wider forehead with volume at the chin level.',
            'Diamond': 'Emphasize your beautiful cheekbones and balance the narrow forehead and chin.'
        }
    
    def calculate_distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """
        Calculate Euclidean distance between two points
        
        Args:
            point1: First point (x, y)
            point2: Second point (x, y)
            
        Returns:
            Euclidean distance
        """
        return np.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
    
    def extract_face_landmarks(self, image: np.ndarray) -> Optional[Dict]:
        """
        Extract key facial landmarks from image using OpenCV face detection
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            Dictionary with landmark coordinates or None if face not detected
        """
        # Convert to grayscale for detection
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
        
        # Get the largest face (closest to camera)
        face = max(faces, key=lambda rect: rect[2] * rect[3])
        x, y, w, h = face
        
        # Extract face region
        face_roi = gray[y:y+h, x:x+w]
        
        # Detect eyes within face region
        eyes = self.eye_cascade.detectMultiScale(face_roi)
        
        # Calculate landmarks based on face bounding box and eyes
        # These are approximate landmarks for face shape analysis
        
        forehead_top = (x + w//2, y)
        chin_bottom = (x + w//2, y + h)
        left_cheek = (x, y + h//2)
        right_cheek = (x + w, y + h//2)
        
        # If eyes detected, use them for more accurate measurements
        if len(eyes) >= 2:
            # Sort eyes by x-coordinate
            eyes_sorted = sorted(eyes, key=lambda e: e[0])
            left_eye = eyes_sorted[0]
            right_eye = eyes_sorted[1] if len(eyes_sorted) > 1 else eyes_sorted[0]
            
            # Adjust forehead and cheek positions based on eyes
            eye_level_y = y + left_eye[1] + left_eye[3]//2
            forehead_top = (x + w//2, max(y, eye_level_y - h//3))
            
            left_forehead = (x + w//4, forehead_top[1])
            right_forehead = (x + 3*w//4, forehead_top[1])
        else:
            # Approximate forehead points
            forehead_y = y + h//5
            left_forehead = (x + w//4, forehead_y)
            right_forehead = (x + 3*w//4, forehead_y)
        
        landmarks = {
            'forehead_top': forehead_top,
            'chin_bottom': chin_bottom,
            'left_cheek': left_cheek,
            'right_cheek': right_cheek,
            'left_forehead': left_forehead,
            'right_forehead': right_forehead,
            'face_box': (x, y, w, h)  # Store original face box for reference
        }
        
        return landmarks
    
    def calculate_face_measurements(self, landmarks: Dict) -> Dict:
        """
        Calculate face length, width, and ratio
        
        Args:
            landmarks: Dictionary of facial landmarks
            
        Returns:
            Dictionary with measurements
        """
        # Face length: forehead top to chin bottom
        face_length = self.calculate_distance(
            landmarks['forehead_top'],
            landmarks['chin_bottom']
        )
        
        # Face width: left cheek to right cheek
        face_width = self.calculate_distance(
            landmarks['left_cheek'],
            landmarks['right_cheek']
        )
        
        # Alternative width measurement (forehead width)
        forehead_width = self.calculate_distance(
            landmarks['left_forehead'],
            landmarks['right_forehead']
        )
        
        # Use average of face width and forehead width
        avg_width = (face_width + forehead_width) / 2
        
        # Calculate ratio
        ratio = face_length / avg_width if avg_width > 0 else 0
        
        return {
            'face_length': face_length,
            'face_width': avg_width,
            'ratio': ratio
        }
    
    def classify_face_shape(self, measurements: Dict) -> str:
        """
        Classify face shape based on measurements using rule-based logic
        
        Args:
            measurements: Dictionary with face measurements
            
        Returns:
            Face shape classification
        """
        ratio = measurements['ratio']
        
        # Classification rules based on face length to width ratio
        if ratio < 1.1:
            # Face is almost as wide as it is long
            return 'Round'
        elif 1.1 <= ratio < 1.3:
            # Slightly longer than wide - most balanced
            return 'Oval'
        elif ratio >= 1.3:
            # Significantly longer than wide
            return 'Long'
        
        return 'Oval'  # Default to oval
    
    def get_hairstyle_recommendations(self, face_shape: str) -> List[str]:
        """
        Get hairstyle recommendations for given face shape
        
        Args:
            face_shape: Classified face shape
            
        Returns:
            List of recommended hairstyles
        """
        return self.hairstyle_recommendations.get(face_shape, self.hairstyle_recommendations['Oval'])
    
    def get_styling_tips(self, face_shape: str) -> str:
        """
        Get styling tips for given face shape
        
        Args:
            face_shape: Classified face shape
            
        Returns:
            Styling tips string
        """
        return self.styling_tips.get(face_shape, self.styling_tips['Oval'])
    
    def analyze_face(self, image: np.ndarray) -> Dict:
        """
        Complete face shape analysis pipeline
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            Dictionary with analysis results
        """
        try:
            # Extract landmarks
            landmarks = self.extract_face_landmarks(image)
            
            if landmarks is None:
                return {
                    'success': False,
                    'message': 'No face detected in the image. Please ensure your face is clearly visible and well-lit.'
                }
            
            # Calculate measurements
            measurements = self.calculate_face_measurements(landmarks)
            
            # Classify face shape
            face_shape = self.classify_face_shape(measurements)
            
            # Get recommendations
            hairstyles = self.get_hairstyle_recommendations(face_shape)
            tips = self.get_styling_tips(face_shape)
            
            return {
                'success': True,
                'data': {
                    'face_shape': face_shape,
                    'face_measurements': measurements,
                    'recommended_hairstyles': hairstyles,
                    'tips': tips
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing face: {str(e)}", exc_info=True)
            return {
                'success': False,
                'message': f'Error analyzing face: {str(e)}'
            }
    
    def __del__(self):
        """Cleanup resources"""
        # OpenCV classifiers don't need explicit cleanup
        pass


# Singleton instance
_face_analyzer = None

def get_face_analyzer() -> FaceShapeAnalyzer:
    """
    Get singleton instance of FaceShapeAnalyzer
    
    Returns:
        FaceShapeAnalyzer instance
    """
    global _face_analyzer
    if _face_analyzer is None:
        _face_analyzer = FaceShapeAnalyzer()
    return _face_analyzer
