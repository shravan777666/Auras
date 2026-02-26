"""
Test the face shape analysis endpoint with a sample image
"""

import requests
import cv2
import numpy as np

def test_endpoint():
    # Create a simple test image with a face-like pattern
    # For real testing, use an actual face image
    test_image = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Draw a simple oval face for testing
    cv2.ellipse(test_image, (320, 240), (100, 130), 0, 0, 360, (255, 255, 255), -1)
    cv2.circle(test_image, (290, 210), 10, (0, 0, 0), -1)  # Left eye
    cv2.circle(test_image, (350, 210), 10, (0, 0, 0), -1)  # Right eye
    
    # Save to file
    cv2.imwrite('test_face.jpg', test_image)
    
    # Send to endpoint
    url = 'http://localhost:5001/analyze-face-shape'
    
    print("Testing face shape analysis endpoint...")
    print(f"URL: {url}")
    
    try:
        with open('test_face.jpg', 'rb') as f:
            files = {'image': ('test_face.jpg', f, 'image/jpeg')}
            response = requests.post(url, files=files)
            
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("\n✓ Endpoint is working!")
        else:
            print("\n✗ Endpoint returned an error")
            
    except requests.exceptions.ConnectionError:
        print("\n✗ Could not connect to ML service. Is it running?")
        print("Start it with: cd ml-service && venv\\Scripts\\Activate.ps1 && python app.py")
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")

if __name__ == '__main__':
    test_endpoint()
