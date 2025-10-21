import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ fallbackPath = '/', className = '', children }) => {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to the provided path or home
      navigate(fallbackPath);
    }
  };

  return (
    <button
      onClick={handleGoBack}
      className={`flex items-center text-gray-600 hover:text-gray-900 transition-colors ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="h-5 w-5 mr-2" />
      {children || 'Back'}
    </button>
  );
};

export default BackButton;