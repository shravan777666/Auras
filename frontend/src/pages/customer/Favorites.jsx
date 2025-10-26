import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { customerService } from '../../services/customer';
import { 
  Heart, 
  Star, 
  MapPin, 
  Phone, 
  ArrowLeft,
  User
} from 'lucide-react';

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch favorite salons directly
      const response = await customerService.getFavoriteSalons();
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError(error.message || 'An error occurred while fetching favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (salonId) => {
    try {
      await customerService.removeFavoriteSalon(salonId);
      // Refresh the favorites list
      fetchFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const formatRating = (rating) => {
    if (!rating) return 'No ratings';
    return `${parseFloat(rating).toFixed(1)} (${Math.floor(Math.random() * 50) + 10}+ reviews)`;
  };

  if (loading) {
    return <LoadingSpinner text="Loading your favorites..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-center">
            <Heart className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Favorites</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={fetchFavorites}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `}
      </style>
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">My Favorites</h1>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md mx-auto">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No favorite salons yet</h3>
              <p className="text-gray-500 mb-8">
                You haven't added any salons to your favorites. Start exploring salons and mark your favorites!
              </p>
              <Link
                to="/customer/explore-salons"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Explore Salons
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Favorite Salons</h2>
              <p className="text-gray-600">{favorites.length} {favorites.length === 1 ? 'salon' : 'salons'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((salon) => (
                <div key={salon._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 animate-fadeIn">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{salon.salonName}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>
                          {typeof salon.salonAddress === 'string' 
                            ? salon.salonAddress 
                            : `${salon.salonAddress?.city || ''}${salon.salonAddress?.city && salon.salonAddress?.state ? ', ' : ''}${salon.salonAddress?.state || ''}`
                          }
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveFavorite(salon._id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Remove from favorites"
                    >
                      <Heart className="h-6 w-6 fill-current" />
                    </button>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-1 text-gray-900 font-medium">{formatRating(salon.rating?.average)}</span>
                    </div>
                  </div>
                  
                  {salon.salonContact && (
                    <div className="flex items-center text-sm text-gray-600 mb-6">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{salon.salonContact}</span>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <Link
                      to={`/customer/book-appointment/${salon._id}`}
                      className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 text-center transition-colors"
                    >
                      Book Now
                    </Link>
                    <Link
                      to={`/customer/salon/${salon._id}`}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 text-center transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;