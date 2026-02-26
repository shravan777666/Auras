# Run this script to restart the ML service properly
# This will kill any existing Flask process and start fresh

import os
import sys
import subprocess
import signal

print("Restarting ML Service...")

# Kill any existing Flask process on port 5001
try:
    if sys.platform == 'win32':
        # Windows
        subprocess.run(['taskkill', '/F', '/IM', 'python.exe'], 
                      capture_output=True, check=False)
    else:
        # Unix-like systems
        subprocess.run(['pkill', '-f', 'app.py'], 
                      capture_output=True, check=False)
    print("Stopped existing Flask processes")
except Exception as e:
    print(f"No existing processes found or error: {e}")

# Start the Flask app
print("\nStarting Flask ML service...")
print("=" * 50)

# Change to the ml-service directory
ml_service_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(ml_service_dir)

# Start Flask
subprocess.Popen([sys.executable, 'app.py'])

print("ML Service starting on http://localhost:5001")
print("=" * 50)
print("\nEndpoints available:")
print("  POST /analyze-face-shape")
print("  POST /analyze-face-symmetry")
print("  GET  /static/videos/<filename>")
print("\nPress Ctrl+C to stop the service")
