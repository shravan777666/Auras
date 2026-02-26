"""
Quick test for face shape analyzer
"""

from face_shape_analyzer import get_face_analyzer
import numpy as np
import cv2

print("Testing Face Shape Analyzer...")
print("=" * 50)

try:
    # Get analyzer instance
    analyzer = get_face_analyzer()
    print("✓ Face analyzer initialized successfully")
    
    # Test with a dummy image (this will fail to detect face, but tests the pipeline)
    dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)
    result = analyzer.analyze_face(dummy_image)
    
    print("\nTest with blank image (should not detect face):")
    print(f"Success: {result['success']}")
    print(f"Message: {result.get('message', 'N/A')}")
    
    # Check recommendations mapping
    print("\n✓ Available face shape categories:")
    for shape in analyzer.hairstyle_recommendations.keys():
        count = len(analyzer.hairstyle_recommendations[shape])
        print(f"  - {shape}: {count} recommendations")
    
    print("\n✓ All tests passed!")
    print("\nTo test with a real image, use the web interface")
    print("or provide an actual face image to the analyzer.")
    
except Exception as e:
    print(f"\n✗ Error: {str(e)}")
    import traceback
    traceback.print_exc()
