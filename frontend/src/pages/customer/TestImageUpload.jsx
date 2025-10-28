import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ImageUpload from '../../components/common/ImageUpload';
import BackButton from '../../components/common/BackButton';
import { toast } from 'react-hot-toast';

const TestImageUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  const handleImageUpload = (imageData) => {
    console.log('Image uploaded:', imageData);
    setCurrentImageUrl(imageData.profilePic || imageData.profilePicture || imageData.url);
    toast.success('Image uploaded successfully!');
  };

  const handleImageDelete = () => {
    setCurrentImageUrl(null);
    toast.success('Image deleted successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <BackButton fallbackPath="/customer/dashboard" />
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Image Upload</h1>
          <p className="text-gray-600 mb-8">Test Cloudinary image upload functionality</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Image</h2>
              <ImageUpload
                onImageUpload={handleImageUpload}
                onImageDelete={handleImageDelete}
                currentImageUrl={currentImageUrl}
                uploadType="customer"
                maxSize={5 * 1024 * 1024} // 5MB
                allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
              />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Preview</h2>
              {currentImageUrl ? (
                <div className="space-y-4">
                  <img 
                    src={currentImageUrl} 
                    alt="Uploaded preview" 
                    className="w-full max-w-md rounded-lg shadow-md"
                  />
                  <p className="text-sm text-gray-600 break-all">
                    Image URL: {currentImageUrl}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <p className="text-gray-500">No image uploaded yet</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestImageUpload;