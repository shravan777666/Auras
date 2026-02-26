import requests
import json

# Test the face symmetry analysis endpoint
API_URL = "http://localhost:5001"

print("Testing Face Symmetry Analysis Endpoint")
print("=" * 50)

# Test 1: Check if endpoint exists
try:
    # Create a simple test request with a dummy image
    import io
    from PIL import Image
    import numpy as np
    
    # Create a test image (black square)
    test_image = Image.new('RGB', (100, 100), color='black')
    img_byte_arr = io.BytesIO()
    test_image.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    # Send request
    files = {'image': ('test.jpg', img_byte_arr, 'image/jpeg')}
    response = requests.post(f"{API_URL}/analyze-face-symmetry", files=files)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200 or response.status_code == 400:
        print("\n✓ Endpoint exists and is responding!")
    else:
        print("\n✗ Endpoint returned unexpected status code")
        
except requests.exceptions.ConnectionError:
    print("\n✗ Cannot connect to ML service. Make sure Flask is running on port 5001")
except Exception as e:
    print(f"\n✗ Error: {e}")

print("=" * 50)
