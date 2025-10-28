import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, X, User } from 'lucide-react';
import imageService from '../../services/imageService';

const ImageUpload = ({ 
  onImageUpload, 
  onImageDelete, 
  currentImageUrl, 
  uploadType = 'customer', // 'customer', 'staff', or 'salon'
  className = '',
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      return false;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
      return false;
    }

    return true;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!validateFile(file)) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      let response;
      switch (uploadType) {
        case 'customer':
          response = await imageService.uploadCustomerProfileImage(file);
          break;
        case 'staff':
          response = await imageService.uploadStaffProfileImage(file);
          break;
        case 'salon':
          response = await imageService.uploadSalonImage(file);
          break;
        default:
          throw new Error('Invalid upload type');
      }

      if (response.success) {
        toast.success('Image uploaded successfully!');
        setPreviewUrl(response.data.url);
        if (onImageUpload) {
          onImageUpload(response.data);
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
      // Revert to previous image
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!previewUrl) return;

    try {
      let response;
      switch (uploadType) {
        case 'customer':
          response = await imageService.deleteCustomerProfileImage();
          break;
        case 'staff':
          response = await imageService.deleteStaffProfileImage();
          break;
        case 'salon':
          response = await imageService.deleteSalonImage();
          break;
        default:
          throw new Error('Invalid upload type');
      }

      if (response.success) {
        toast.success('Image deleted successfully!');
        setPreviewUrl(null);
        if (onImageDelete) {
          onImageDelete();
        }
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(error.message || 'Failed to delete image');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col items-center">
        {/* Image preview or placeholder */}
        <div className="relative">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Upload button overlay */}
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </button>

          {/* Delete button */}
          {previewUrl && (
            <button
              type="button"
              onClick={handleDeleteImage}
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        {/* Upload instructions */}
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600">
            {isUploading ? 'Uploading...' : 'Click to upload image'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max size: {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;