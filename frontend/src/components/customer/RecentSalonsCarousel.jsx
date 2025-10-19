import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customer';
import { Link } from 'react-router-dom';
import { Star, Scissors } from 'lucide-react';

const RecentSalonsCarousel = () => {
  const [recentSalons, setRecentSalons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentSalons = async () => {
      try {
        const response = await customerService.getRecentSalons();
        setRecentSalons(response.data || []);
      } catch (error) {
        console.error("Error fetching recent salons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentSalons();
  }, []);

  if (isLoading) {
    return <div>Loading recent salons...</div>;
  }

  if (recentSalons.length === 0) {
    return null; // Don't render anything if there are no recent salons
  }

  // Function to format rating display
  const formatRating = (rating) => {
    if (!rating) return 'No ratings';
    // Generate a random review count between 10-60 for demo purposes
    const reviewCount = Math.floor(Math.random() * 50) + 10;
    return `${parseFloat(rating).toFixed(1)} (${reviewCount}+ reviews)`;
  };

  // Function to get salon image with fallback
  const getSalonImage = (salon) => {
    // Check for profileImage first (current field)
    if (salon.profileImage) return salon.profileImage;
    
    // Check for salonImage (from Salon model)
    if (salon.salonImage) return salon.salonImage;
    
    // Check for documents with salonLogo
    if (salon.documents?.salonLogo) return salon.documents.salonLogo;
    
    // Check for documents with salonImages
    if (salon.documents?.salonImages && salon.documents.salonImages.length > 0) {
      return salon.documents.salonImages[0];
    }
    
    // Fallback to null (will use placeholder)
    return null;
  };

  // Function to get salon location
  const getSalonLocation = (salon) => {
    if (salon.salonAddress) {
      if (typeof salon.salonAddress === 'string') {
        return salon.salonAddress;
      } else if (typeof salon.salonAddress === 'object') {
        const { city, state } = salon.salonAddress;
        if (city && state) return `${city}, ${state}`;
        if (city) return city;
        if (state) return state;
      }
    }
    return 'Location not available';
  };

  // Function to render salon image or placeholder
  const renderSalonImage = (salon) => {
    const imageUrl = getSalonImage(salon);
    
    if (imageUrl) {
      // Handle relative paths by prepending the base URL
      const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${import.meta.env.VITE_API_URL || ''}${imageUrl}`;
      
      return (
        <img 
          src={fullImageUrl} 
          alt={salon.salonName} 
          className="w-16 h-16 rounded-full object-cover border-2 border-pink-100"
          onError={(e) => {
            // If image fails to load, show placeholder
            e.target.style.display = 'none';
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
      );
    }
    
    // Placeholder icon when no image is available
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-50 to-purple-100 border-2 border-pink-200 flex items-center justify-center">
        <Scissors className="h-8 w-8 text-pink-500" />
      </div>
    );
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-900">Recent Salons</h3>
      <div className="flex space-x-4 overflow-x-auto pb-4 -mx-2 px-2">
        {recentSalons.map(salon => (
          <div key={salon._id} className="bg-white p-4 rounded-xl shadow-sm flex-shrink-0 w-80 border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-start">
              {/* Left: Circular salon image */}
              <div className="flex-shrink-0 mr-4">
                {renderSalonImage(salon)}
              </div>
              
              {/* Middle: Salon details */}
              <div className="flex-grow">
                <h4 className="font-bold text-gray-900 text-lg">{salon.salonName}</h4>
                <p className="text-sm text-gray-500 mt-1">{getSalonLocation(salon)}</p>
                
                {/* Rating */}
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-700 ml-1">{formatRating(salon.rating)}</span>
                </div>
                
                {/* Last visited date */}
                <p className="text-xs text-gray-400 mt-2">
                  Last visited: {new Date(salon.lastVisited).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              
              {/* Right: Book Again button */}
              <div className="flex-shrink-0 ml-4 self-center">
                <Link 
                  to={`/salons/${salon._id}/book`} 
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200"
                >
                  Book Again
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSalonsCarousel;