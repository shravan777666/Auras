import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, RefreshCw, Sparkles, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';

const HairstyleRecommendation = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
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

  const startCamera = async () => {
    try {
      setError(null);
      setCameraLoading(true);
      setIsCameraActive(true); // Set this first to render the video element
      console.log('Requesting camera access...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Camera access granted, stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());

      // Set stream - the useEffect will handle assigning it to the video element
      setStream(mediaStream);
      setResult(null);
      setCapturedImage(null);
      
      console.log('Camera setup complete');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraLoading(false);
      setIsCameraActive(false); // Reset if camera fails
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access to use this feature.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on your device.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
      toast.error('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
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

      console.log('Sending request to:', `${API_URL}/analyze-face-shape`);

      // Send to backend
      const response = await fetch(`${API_URL}/analyze-face-shape`, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        setResult(data.data);
        stopCamera(); // Freeze camera after successful analysis
        toast.success('Face shape analyzed successfully!');
      } else {
        setError(data.message || 'Failed to analyze face shape');
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
    startCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
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
            <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hairstyle Recommendation</h1>
              <p className="text-gray-600 mt-1">Discover the perfect hairstyle for your face shape</p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Camera/Result View */}
          <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
            {!isCameraActive && !result && (
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-500 rounded-full mb-4">
                  <Camera className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Start Your Face Analysis
                </h3>
                <p className="text-gray-300 mb-6">
                  We'll analyze your face shape and recommend the best hairstyles for you
                </p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg"
                >
                  <Camera className="inline h-5 w-5 mr-2" />
                  Start Camera
                </button>
              </div>
            )}

            {isCameraActive && (
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
                <div className="absolute inset-0 border-4 border-pink-500 opacity-50 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-white rounded-full opacity-30"></div>
                </div>
                {/* Debug info overlay */}
                {!cameraLoading && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs px-3 py-2 rounded">
                    Camera Active • Ready to capture
                  </div>
                )}
              </div>
            )}

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
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Camera Controls */}
            {isCameraActive && !result && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing...
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
                {/* Face Shape Result */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <User className="h-6 w-6 text-purple-600" />
                    <h3 className="text-xl font-bold text-gray-900">Your Face Shape</h3>
                  </div>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                      {result.face_shape}
                    </p>
                    {result.face_measurements && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Face Length: {result.face_measurements.face_length?.toFixed(1)} units</p>
                        <p>Face Width: {result.face_measurements.face_width?.toFixed(1)} units</p>
                        <p>Ratio: {result.face_measurements.ratio?.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hairstyle Recommendations */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Sparkles className="h-6 w-6 text-pink-600" />
                    <h3 className="text-xl font-bold text-gray-900">Recommended Hairstyles</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.recommended_hairstyles?.map((hairstyle, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border-2 border-pink-200 hover:border-pink-400 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{hairstyle}</h4>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Tips */}
                {result.tips && (
                  <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-900 mb-2">Styling Tips</h4>
                    <p className="text-blue-800 text-sm">{result.tips}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={resetAnalysis}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-md"
                  >
                    <RefreshCw className="inline h-5 w-5 mr-2" />
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/customer/explore-salons')}
                    className="flex-1 px-6 py-3 bg-white text-purple-600 font-medium rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    Book a Salon
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How It Works Section */}
        {!result && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 text-pink-600 rounded-full mb-3">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Start Camera</h4>
                <p className="text-sm text-gray-600">
                  Allow camera access to capture your face
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mb-3">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Capture & Analyze</h4>
                <p className="text-sm text-gray-600">
                  AI analyzes your face shape using advanced detection
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-3">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Get Recommendations</h4>
                <p className="text-sm text-gray-600">
                  Receive personalized hairstyle suggestions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HairstyleRecommendation;
