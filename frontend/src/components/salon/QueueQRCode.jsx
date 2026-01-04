import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QueueQRCode = ({ salonId, size = 128 }) => {
  const queueUrl = salonId ? `${window.location.origin}/queue/join/${salonId}` : '';

  if (!salonId) {
    return (
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex items-center justify-center">
        <div className="text-gray-400 text-sm">QR Code unavailable</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex items-center justify-center">
      <QRCodeSVG 
        value={queueUrl} 
        size={size}
        level="H"
        includeMargin={true}
        fgColor="#000000"
        bgColor="#FFFFFF"
      />
    </div>
  );
};

export default QueueQRCode;