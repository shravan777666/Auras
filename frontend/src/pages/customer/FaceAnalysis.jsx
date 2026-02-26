import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Sparkles, CheckCircle, Activity, Play, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';

const FaceAnalysis = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup: stop camera when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Effect to set stream to video element when both are ready
  useEffect(() => {
    if (stream && videoRef.current && isCameraActive) {
      console.log('Setting stream to video element...');
      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        setCameraLoading(false);
      };
      
      videoRef.current.onplay = () => {
        console.log('Video started playing');
      };
      
      // Ensure video plays
      videoRef.current.play().then(() => {
        console.log('Video play() succeeded');
      }).catch((playErr) => {
        console.warn('Video play() error:', playErr);
      });
    }
  }, [stream, isCameraActive]);

  const requestCameraPermission = async () => {
    try {
      setError(null);
      setCameraLoading(true);
      setPermissionStatus('prompt');
      console.log('Requesting camera permission...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Camera permission granted, stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());

      // Permission granted - set stream and activate camera
      setStream(mediaStream);
      setPermissionStatus('granted');
      setIsCameraActive(true);
      setResult(null);
      setCapturedImage(null);
      
      toast.success('Camera access granted');
      console.log('Camera setup complete');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraLoading(false);
      setPermissionStatus('denied');
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access in your browser settings to use this feature.');
        toast.error('Camera access denied');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on your device.');
        toast.error('No camera found');
      } else {
        setError('Failed to access camera. Please try again.');
        toast.error('Failed to access camera');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
      setPermissionStatus('prompt');
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }

    // Check if video is actually playing and has dimensions
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Video not ready. Please wait a moment and try again.');
      console.error('Video dimensions:', video.videoWidth, video.videoHeight);
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      console.log('Starting capture and analysis...');
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);

      // Capture frame from video
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image as base64
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageDataUrl);
      console.log('Image captured, size:', imageDataUrl.length, 'bytes');

      // Convert to blob for sending
      const blob = await (await fetch(imageDataUrl)).blob();
      console.log('Blob created, size:', blob.size, 'bytes');
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      console.log('Sending request to:', `${API_URL}/analyze-face-symmetry`);

      // Send to backend
      const response = await fetch(`${API_URL}/analyze-face-symmetry`, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        setResult(data.data);
        stopCamera(); // Stop camera after successful analysis
        toast.success('Face symmetry analyzed successfully!');
      } else {
        setError(data.message || 'Failed to analyze face symmetry');
        toast.error(data.message || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error analyzing face:', err);
      setError('Failed to analyze image. Please try again.');
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setCapturedImage(null);
    setError(null);
    requestCameraPermission();
  };

  const getVideoUrl = (videoFile) => {
    return `${API_URL}/static/videos/${videoFile}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Face Symmetry Analysis</h1>
              <p className="text-gray-600 mt-1">Discover facial imbalances and get personalized exercise recommendations</p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Camera/Result View */}
          <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
            {/* Permission Request View */}
            {permissionStatus === 'prompt' && !isCameraActive && !result && (
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-4">
                  <Camera className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Camera Permission Required
                </h3>
                <p className="text-gray-300 mb-6">
                  We need access to your camera to analyze your facial symmetry and provide personalized exercise recommendations.
                </p>
                <button
                  onClick={requestCameraPermission}
                  disabled={cameraLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {cameraLoading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Camera className="inline h-5 w-5 mr-2" />
                      Allow Camera Access
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Permission Denied View */}
            {permissionStatus === 'denied' && !result && (
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-4">
                  <AlertCircle className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Camera Access Denied
                </h3>
                <p className="text-gray-300 mb-6">
                  {error || 'Please enable camera access in your browser settings and try again.'}
                </p>
                <button
                  onClick={requestCameraPermission}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                >
                  <Camera className="inline h-5 w-5 mr-2" />
                  Try Again
                </button>
              </div>
            )}

            {/* Live Camera Preview */}
            {isCameraActive && !result && (
              <div className="relative w-full h-full">
                {cameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-white">Loading camera...</p>
                    </div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ display: 'block' }}
                />
                <div className="absolute inset-0 border-4 border-blue-500 opacity-30 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-white rounded-full opacity-40"></div>
                </div>
                {!cameraLoading && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs px-3 py-2 rounded">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      Live Preview • Position your face in the circle
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Result View with Captured Image */}
            {result && capturedImage && (
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Analysis Complete</span>
                </div>
              </div>
            )}

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls and Results */}
          <div className="p-6">
            {/* Error Display */}
            {error && !result && permissionStatus !== 'denied' && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Camera Controls */}
            {isCameraActive && !result && permissionStatus === 'granted' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing Face...
                    </>
                  ) : (
                    <>
                      <Sparkles className="inline h-5 w-5 mr-2" />
                      Capture & Analyze
                    </>
                  )}
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Results Display */}
            {result && (
              <div className="space-y-6">
                {/* Detected Issue */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Activity className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>
                  </div>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
                      {result.primary_issue}
                    </p>
                    <p className="text-gray-700">
                      {result.description}
                    </p>
                  </div>
                </div>

                {/* Workout Video */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Play className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Recommended Workout Video</h3>
                  </div>
                  <div className="bg-gray-900 rounded-xl overflow-hidden">
                    <video
                      controls
                      className="w-full"
                      src={getVideoUrl(result.video_file)}
                      poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect fill='%23111827' width='800' height='450'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23ffffff' font-size='20' font-family='Arial'%3EWorkout Video%3C/text%3E%3C/svg%3E"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Watch this video and follow along with the exercises for best results.
                  </p>
                </div>

                {/* Exercise List */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">Recommended Exercises</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.exercises?.map((exercise, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{exercise}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-yellow-50 rounded-xl p-4 border-l-4 border-yellow-500">
                  <h4 className="font-semibold text-yellow-900 mb-2">Exercise Tips</h4>
                  <ul className="text-yellow-800 text-sm space-y-1">
                    <li>• Perform these exercises daily for best results</li>
                    <li>• Start slowly and gradually increase intensity</li>
                    <li>• Be consistent - results typically show after 2-4 weeks</li>
                    <li>• Maintain good posture during exercises</li>
                    <li>• Stay hydrated and relaxed</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={resetAnalysis}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
                  >
                    <Camera className="inline h-5 w-5 mr-2" />
                    Analyze Again
                  </button>
                  <button
                    onClick={() => navigate('/customer/dashboard')}
                    className="flex-1 px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How It Works Section */}
        {!result && permissionStatus === 'prompt' && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-3">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Grant Permission</h4>
                <p className="text-sm text-gray-600">
                  Allow camera access to capture your face
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full mb-3">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Capture & Analyze</h4>
                <p className="text-sm text-gray-600">
                  AI analyzes your facial symmetry using advanced detection
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mb-3">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Get Exercises</h4>
                <p className="text-sm text-gray-600">
                  Receive personalized workout videos and exercise recommendations
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceAnalysis;
