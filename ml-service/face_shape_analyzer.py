"""
Face Shape Analyzer using OpenCV
Analyzes face to determine face shape and recommend hairstyles
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging
import os
import importlib

logger = logging.getLogger(__name__)

BASE_IMAGE_URL = '/static/hairstyles/'

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

        self.model_path = os.path.join(os.path.dirname(__file__), 'model', 'face_shape_model.h5')
        self.face_shape_labels = ['Round', 'Oval', 'Square', 'Heart', 'Oblong']
        self.face_shape_model = None
        
        logger.info("Face Shape Analyzer initialized with OpenCV")
        
        # Hairstyle recommendations mapping
        self.hairstyle_recommendations = {
            'Round': {
                'primary': [
                    {
                        'name': 'Textured Crop',
                        'image_url': f'{BASE_IMAGE_URL}round/textured_crop.jpg',
                        'description': 'Short, textured top with faded sides'
                    },
                    {
                        'name': 'Low Fade with Natural Top',
                        'image_url': f'{BASE_IMAGE_URL}round/low_fade_natural_top.jpg',
                        'description': 'Clean fade on sides with longer natural top'
                    },
                    {
                        'name': 'Modern Buzz Cut',
                        'image_url': f'{BASE_IMAGE_URL}round/modern_buzz_cut.jpg',
                        'description': 'Uniform short length all around'
                    }
                ],
                'secondary': [
                    {
                        'name': 'Afro',
                        'image_url': f'{BASE_IMAGE_URL}round/afro.jpg',
                        'description': 'Full, rounded natural style'
                    },
                    {
                        'name': 'Waves',
                        'image_url': f'{BASE_IMAGE_URL}round/waves.jpg',
                        'description': 'Patterned wave texture'
                    },
                    {
                        'name': 'S-Curls',
                        'image_url': f'{BASE_IMAGE_URL}round/s_curls.jpg',
                        'description': 'Soft, defined S-shaped curls'
                    },
                    {
                        'name': 'Bowl Cut',
                        'image_url': f'{BASE_IMAGE_URL}round/bowl_cut.jpg',
                        'description': 'Classic rounded cut'
                    },
                    {
                        'name': 'Tight Curls',
                        'image_url': f'{BASE_IMAGE_URL}round/tight_curls.jpg',
                        'description': 'Defined, close-cropped curls'
                    }
                ]
            },
            'Oval': {
                'primary': [
                    {
                        'name': 'Messy Medium-Length Hair',
                        'image_url': f'{BASE_IMAGE_URL}oval/messy_medium.jpg',
                        'description': 'Textured, casual medium length'
                    },
                    {
                        'name': 'Wavy Medium-Length Cut',
                        'image_url': f'{BASE_IMAGE_URL}oval/wavy_medium.jpg',
                        'description': 'Natural waves at medium length'
                    },
                    {
                        'name': 'Side Part Haircut',
                        'image_url': f'{BASE_IMAGE_URL}oval/side_part.jpg',
                        'description': 'Classic side-parted style'
                    }
                ],
                'secondary': [
                    {
                        'name': 'Quiff',
                        'image_url': f'{BASE_IMAGE_URL}oval/quiff.jpg',
                        'description': 'Voluminous front with tapered back'
                    },
                    {
                        'name': 'Spiky Hair',
                        'image_url': f'{BASE_IMAGE_URL}oval/spiky.jpg',
                        'description': 'Textured, spiked up style'
                    },
                    {
                        'name': 'Faux Hawk',
                        'image_url': f'{BASE_IMAGE_URL}oval/faux_hawk.jpg',
                        'description': 'Modern mohawk variation'
                    },
                    {
                        'name': 'Long Hair',
                        'image_url': f'{BASE_IMAGE_URL}oval/long_hair.jpg',
                        'description': 'Extended length all around'
                    },
                    {
                        'name': 'Tousled',
                        'image_url': f'{BASE_IMAGE_URL}oval/tousled.jpg',
                        'description': 'Carefree, textured look'
                    }
                ]
            },
            'Square': {
                'primary': [
                    {
                        'name': 'Mid Fade with Textured Top',
                        'image_url': f'{BASE_IMAGE_URL}square/mid_fade_textured.jpg',
                        'description': 'Medium fade with textured upper'
                    },
                    {
                        'name': 'Short Quiff',
                        'image_url': f'{BASE_IMAGE_URL}square/short_quiff.jpg',
                        'description': 'Short, lifted front style'
                    },
                    {
                        'name': 'Slick Back with Taper',
                        'image_url': f'{BASE_IMAGE_URL}square/slick_back_taper.jpg',
                        'description': 'Sleek back with tapered sides'
                    }
                ],
                'secondary': [
                    {
                        'name': 'Low Fade',
                        'image_url': f'{BASE_IMAGE_URL}square/low_fade.jpg',
                        'description': 'Subtle fade starting low'
                    },
                    {
                        'name': 'Mid Fade',
                        'image_url': f'{BASE_IMAGE_URL}square/mid_fade.jpg',
                        'description': 'Classic medium fade'
                    },
                    {
                        'name': 'Burst Fade',
                        'image_url': f'{BASE_IMAGE_URL}square/burst_fade.jpg',
                        'description': 'Rounded fade around ears'
                    },
                    {
                        'name': 'Crew Cut',
                        'image_url': f'{BASE_IMAGE_URL}square/crew_cut.jpg',
                        'description': 'Short, uniform military style'
                    },
                    {
                        'name': 'Pompadour',
                        'image_url': f'{BASE_IMAGE_URL}square/pompadour.jpg',
                        'description': 'Voluminous front swept back'
                    },
                    {
                        'name': 'Undercut',
                        'image_url': f'{BASE_IMAGE_URL}square/undercut.jpg',
                        'description': 'Shaved sides with longer top'
                    }
                ]
            },
            'Heart': {
                'primary': [
                    {
                        'name': 'Curly Top with Fade',
                        'image_url': f'{BASE_IMAGE_URL}heart/curly_top_fade.jpg',
                        'description': 'Curly upper with faded sides'
                    },
                    {
                        'name': 'French Crop',
                        'image_url': f'{BASE_IMAGE_URL}heart/french_crop.jpg',
                        'description': 'Short top with textured fringe'
                    },
                    {
                        'name': 'Caesar Cut',
                        'image_url': f'{BASE_IMAGE_URL}heart/caesar_cut.jpg',
                        'description': 'Short, forward-brushed fringe'
                    }
                ],
                'secondary': [
                    {
                        'name': 'Cornrows',
                        'image_url': f'{BASE_IMAGE_URL}heart/cornrows.jpg',
                        'description': 'Braided rows close to scalp'
                    },
                    {
                        'name': 'Braids',
                        'image_url': f'{BASE_IMAGE_URL}heart/braids.jpg',
                        'description': 'Various braided styles'
                    },
                    {
                        'name': 'Dreadlocks',
                        'image_url': f'{BASE_IMAGE_URL}heart/dreadlocks.jpg',
                        'description': 'Rope-like matted strands'
                    },
                    {
                        'name': 'Twists',
                        'image_url': f'{BASE_IMAGE_URL}heart/twists.jpg',
                        'description': 'Twisted strand style'
                    },
                    {
                        'name': 'Curly Fringe',
                        'image_url': f'{BASE_IMAGE_URL}heart/curly_fringe.jpg',
                        'description': 'Curly front fringe'
                    }
                ]
            },
            'Oblong': {
                'primary': [
                    {
                        'name': 'Classic Taper',
                        'image_url': f'{BASE_IMAGE_URL}oblong/classic_taper.jpg',
                        'description': 'Gradual fade from top to bottom'
                    },
                    {
                        'name': 'Drop Fade Haircut',
                        'image_url': f'{BASE_IMAGE_URL}oblong/drop_fade.jpg',
                        'description': 'Fade that drops behind ear'
                    },
                    {
                        'name': 'Clean Shave with Beard Focus',
                        'image_url': f'{BASE_IMAGE_URL}oblong/clean_shave_beard.jpg',
                        'description': 'Smooth shave with styled beard'
                    }
                ],
                'secondary': [
                    {
                        'name': 'Skin Fade',
                        'image_url': f'{BASE_IMAGE_URL}oblong/skin_fade.jpg',
                        'description': 'Fade down to skin'
                    },
                    {
                        'name': 'Razor Fade',
                        'image_url': f'{BASE_IMAGE_URL}oblong/razor_fade.jpg',
                        'description': 'Sharp, clean fade'
                    },
                    {
                        'name': 'Flat Top',
                        'image_url': f'{BASE_IMAGE_URL}oblong/flat_top.jpg',
                        'description': 'Flat, squared top'
                    },
                    {
                        'name': 'Crop Top',
                        'image_url': f'{BASE_IMAGE_URL}oblong/crop_top.jpg',
                        'description': 'Short, cropped upper'
                    },
                    {
                        'name': 'Taper',
                        'image_url': f'{BASE_IMAGE_URL}oblong/Taper.jpg',
                        'description': 'Gradual length reduction'
                    }
                ]
            }
        }
        
        self.styling_tips = {
            'Round': 'Create height and volume at the crown. Avoid blunt cuts at chin level.',
            'Oval': 'Your face shape is very versatile! Most styles will look great on you.',
            'Oblong': 'Add width at the sides and avoid excessive height. Horizontal lines work well.',
            'Square': 'Soften angles with layers and waves. Side parts work better than center.',
            'Heart': 'Balance your wider forehead with volume at the chin level.'
        }

        self._load_face_shape_model()

    def _load_face_shape_model(self) -> None:
        """Load trained .h5 face shape model if available."""
        if not os.path.exists(self.model_path):
            logger.warning('Face shape model not found at %s. Using rule-based fallback.', self.model_path)
            return

        try:
            keras_models = importlib.import_module('tensorflow.keras.models')
            load_model = getattr(keras_models, 'load_model')
            self.face_shape_model = load_model(self.model_path)
            logger.info('Loaded face shape model from %s', self.model_path)
        except Exception as e:
            logger.warning('Unable to load face shape model (%s). Using rule-based fallback.', str(e))
            self.face_shape_model = None

    def predict_face_shape_with_model(self, image: np.ndarray, landmarks: Dict) -> Optional[str]:
        """
        Predict face shape using the trained .h5 model.

        Returns None when model is unavailable or prediction fails.
        """
        if self.face_shape_model is None:
            return None

        try:
            x, y, w, h = landmarks['face_box']
            img_h, img_w = image.shape[:2]

            x = max(0, x)
            y = max(0, y)
            w = min(w, img_w - x)
            h = min(h, img_h - y)

            if w <= 0 or h <= 0:
                return None

            face_crop = image[y:y + h, x:x + w]
            if face_crop.size == 0:
                return None

            # Match common classifier preprocessing: RGB, resized, normalized [0, 1].
            face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
            face_resized = cv2.resize(face_rgb, (224, 224), interpolation=cv2.INTER_AREA)
            model_input = face_resized.astype(np.float32) / 255.0
            model_input = np.expand_dims(model_input, axis=0)

            prediction = self.face_shape_model.predict(model_input, verbose=0)
            prediction = np.asarray(prediction)

            if prediction.ndim == 2 and prediction.shape[1] >= len(self.face_shape_labels):
                class_idx = int(np.argmax(prediction[0][:len(self.face_shape_labels)]))
                return self.face_shape_labels[class_idx]

            return None
        except Exception as e:
            logger.warning('Model prediction failed (%s). Falling back to rule-based classification.', str(e))
            return None
    
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
            return 'Oblong'
        
        return 'Oval'  # Default to oval
    
    def get_hairstyle_recommendations(self, face_shape: str) -> Dict[str, List[Dict[str, str]]]:
        """
        Get hairstyle recommendations for given face shape
        
        Args:
            face_shape: Classified face shape
            
        Returns:
            Dictionary with primary and secondary hairstyle recommendations
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
            
            # Prefer trained model prediction, fallback to rule-based classification.
            model_face_shape = self.predict_face_shape_with_model(image, landmarks)
            if model_face_shape is not None:
                face_shape = model_face_shape
                prediction_source = 'model'
            else:
                face_shape = self.classify_face_shape(measurements)
                prediction_source = 'rule_based'
            
            # Get recommendations
            hairstyle_recommendations = self.get_hairstyle_recommendations(face_shape)
            tips = self.get_styling_tips(face_shape)

            # Backward-compatible flat list for older clients (string-only names).
            flat_recommendations = [
                item.get('name', 'Recommended Style')
                for item in (hairstyle_recommendations['primary'] + hairstyle_recommendations['secondary'])
            ]
            
            return {
                'success': True,
                'data': {
                    'face_shape': face_shape,
                    'prediction_source': prediction_source,
                    'face_measurements': measurements,
                    'recommended_hairstyles': flat_recommendations,
                    'hairstyle_recommendations': hairstyle_recommendations,
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
