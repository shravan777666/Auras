import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

const ImagePreview = ({ 
  isOpen, 
  onClose, 
  images = [], 
  currentIndex = 0, 
  title = "Image Preview" 
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset states when modal opens/closes or images change
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(currentIndex);
      setImageError(false);
      setImageLoading(true);
    }
  }, [isOpen, currentIndex, images]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, images.length]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const goToNext = () => {
    if (images.length > 1) {
      const nextIndex = (activeIndex + 1) % images.length;
      setActiveIndex(nextIndex);
      setImageError(false);
      setImageLoading(true);
    }
  };

  const goToPrevious = () => {
    if (images.length > 1) {
      const prevIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1;
      setActiveIndex(prevIndex);
      setImageError(false);
      setImageLoading(true);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !images.length) return null;

  const currentImage = images[activeIndex];
  const hasMultipleImages = images.length > 1;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={handleBackdropClick}
    >
      {/* Modal Content */}
      <div className="relative max-w-7xl max-h-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            {hasMultipleImages && (
              <span className="text-sm text-gray-300">
                {activeIndex + 1} of {images.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            aria-label="Close preview"
          >
            <X size={24} />
          </button>
        </div>

        {/* Image Container */}
        <div className="relative flex-1 flex items-center justify-center min-h-0">
          {/* Previous Button */}
          {hasMultipleImages && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Image */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            {imageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
            
            {imageError ? (
              <div className="flex flex-col items-center justify-center p-8 text-white">
                <ImageIcon size={64} className="mb-4 text-gray-400" />
                <p className="text-lg mb-2">Failed to load image</p>
                <p className="text-sm text-gray-400">The image could not be displayed</p>
              </div>
            ) : (
              <img
                src={currentImage}
                alt={`Preview ${activeIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ 
                  maxHeight: 'calc(100vh - 120px)',
                  maxWidth: 'calc(100vw - 80px)'
                }}
              />
            )}
          </div>

          {/* Next Button */}
          {hasMultipleImages && (
            <button
              onClick={goToNext}
              className="absolute right-4 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Thumbnail Navigation (for multiple images) */}
        {hasMultipleImages && images.length <= 10 && (
          <div className="flex justify-center p-4 space-x-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index);
                  setImageError(false);
                  setImageLoading(true);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === activeIndex 
                    ? 'border-indigo-500 ring-2 ring-indigo-300' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjI4IiBjeT0iMjgiIHI9IjMiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDM2TDI4IDI4TDM2IDM2TDQ0IDI4VjQ0SDIwVjM2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="text-center p-2 text-gray-400 text-sm">
          {hasMultipleImages && 'Use arrow keys or click thumbnails to navigate • '}
          Press ESC or click outside to close
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
