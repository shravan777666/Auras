import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, CameraOff } from 'lucide-react';

const QRScanner = ({ onScan, onClose, onError }) => {
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner;
    
    const initializeScanner = () => {
      // Use the element ID to initialize the scanner
      const elementId = 'qr-reader';
      const container = document.getElementById(elementId);
      
      if (container && !scannerInstanceRef.current) {
        // Create a new instance of the QR code scanner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: false
        };
        
        // Initialize scanner with the element ID
        html5QrcodeScanner = new Html5QrcodeScanner(
          elementId,
          config,
          false // Use the production mode
        );
        
        html5QrcodeScanner.render(
          (decodedText, decodedResult) => {
            // Handle successful scan
            onScan(decodedText);
            // Close scanner after successful scan
            onClose();
          },
          (errorMessage) => {
            // Handle error (but don't close the scanner for errors)
            console.error('QR Scan Error:', errorMessage);
            if (onError) {
              onError(errorMessage);
            }
          }
        );
        
        scannerInstanceRef.current = html5QrcodeScanner;
      }
    };
    
    // Initialize scanner after component is mounted
    const timer = setTimeout(initializeScanner, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.clear().catch(error => {
            // Ignore error if scanner is already cleared
            console.warn('Scanner clear error:', error);
          });
        } catch (error) {
          console.warn('Error clearing scanner:', error);
        }
        scannerInstanceRef.current = null;
      }
    };
  }, [onScan, onClose, onError]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Scan Salon QR Code</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-4">Point your camera at the salon's QR code to check in</p>
        </div>
        
        <div id="qr-reader" className="flex justify-center w-full h-80 bg-gray-100 rounded-lg" style={{ minHeight: '320px' }}>
          {/* Scanner will be rendered here by html5-qrcode */}
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-gray-400 flex flex-col items-center">
              <Camera className="h-12 w-12 mb-2" />
              <p>Initializing camera...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;