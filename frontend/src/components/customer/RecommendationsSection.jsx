import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  Phone, 
  Star, 
  Calendar,
  RefreshCw,
  ExternalLink,
  Heart,
  Scissors,
  User
} from 'lucide-react';

const RecommendationsSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Early return if user is not available
  if (!user) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations for You</h2>
        <div className="text-center py-8">
          <p className="text-gray-600">Please log in to view your recommendations.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (user?.id) {
      fetchRecommendations();
    }
  }, [user?.id]);

  const fetchRecommendations = async (showRefreshing = false) => {
    try {
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('Fetching recommendations for user ID:', user.id);
      const response = await customerService.getRecommendations(user.id);
      console.log('API Response:', response);
      
      if (response?.success) {
        const recommendationsData = Array.isArray(response.data) ? response.data : [];
        setRecommendations(recommendationsData);
        console.log('Processed recommendations data:', recommendationsData);
      } else {
        throw new Error(response?.message || 'Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load recommendations';
      setError(errorMessage);
      setRecommendations([]); // Set empty array on error
      if (showRefreshing) {
        toast.error('Failed to refresh recommendations');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRecommendations(true);
  };

  const handleBookNow = (recommendation) => {
    try {
      console.log('Book Now clicked for recommendation:', recommendation);
      
      // Extract salon ID from the recommendation
      const salonId = recommendation.salonId;
      
      console.log('Extracted salon ID:', salonId);
      console.log('Salon name:', recommendation.salonName);
      
      if (!salonId) {
        console.error('Salon ID not found in recommendation data:', recommendation);
        toast.error('Unable to book appointment. Salon information not available.');
        return;
      }

      // Navigate to booking page with salon ID
      console.log(`Navigating to: /customer/book-appointment/${salonId}`);
      navigate(`/customer/book-appointment/${salonId}`);
      
      // Show success message
      toast.success(`Redirecting to book appointment with ${recommendation.salonName}...`);
    } catch (error) {
      console.error('Error navigating to booking page:', error);
      toast.error('Failed to open booking page. Please try again.');
    }
  };

  const getServiceIcon = (serviceName) => {
    const service = serviceName.toLowerCase();
    
    if (service.includes('hair') || service.includes('cut') || service.includes('style') || service.includes('keratin')) {
      return <Scissors className="h-4 w-4" />;
    } else if (service.includes('facial') || service.includes('skin') || service.includes('wax') || service.includes('peel')) {
      return <Star className="h-4 w-4" />;
    } else if (service.includes('nail') || service.includes('manicure') || service.includes('pedicure')) {
      return <Sparkles className="h-4 w-4" />;
    } else if (service.includes('makeup') || service.includes('bridal')) {
      return <Heart className="h-4 w-4" />;
    } else if (service.includes('massage') || service.includes('spa') || service.includes('aromatherapy')) {
      return <Heart className="h-4 w-4" />;
    } else {
      return <User className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const isExpiringSoon = (expiresAt) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recommendations for You</h2>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
        </div>
        <div className="flex items-center justify-center py-8">
          <span className="text-gray-600">Loading your recommendations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recommendations for You</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 font-medium mb-4">{error}</div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recommendations for You</h2>
          <p className="text-sm text-gray-600 mt-1">Personalized service suggestions from your favorite salons</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Refresh recommendations"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!Array.isArray(recommendations) || recommendations.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Book your first appointment with a salon to start receiving personalized service recommendations!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(recommendations || []).map((recommendation) => {
            // Add safety checks for recommendation object
            if (!recommendation || !recommendation.id) {
              return null;
            }
            
            return (
            <div 
              key={recommendation.id} 
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
            >
              {/* Salon Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <Sparkles className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{recommendation.salonName}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      {recommendation.salonAddress && (
                        <div className="flex items-center mr-4">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="truncate max-w-xs">
                            {typeof recommendation.salonAddress === 'string' 
                              ? recommendation.salonAddress 
                              : 'Address available'}
                          </span>
                        </div>
                      )}
                      {recommendation.salonContact && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          <span>{recommendation.salonContact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Status and Date */}
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Sent {formatDate(recommendation.sentAt)}</span>
                  </div>
                  {isExpiringSoon(recommendation.expiresAt) && (
                    <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Expires soon</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Context */}
              {recommendation.basedOnService && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Based on your previous service:</span> {recommendation.basedOnService}
                  </p>
                </div>
              )}

              {/* Recommendations */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Recommended services for you:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(recommendation.recommendations || []).map((service, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                    >
                      <div className="text-primary-600 mr-3">
                        {getServiceIcon(service?.serviceName || '')}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{service?.serviceName || 'Service'}</h4>
                        {service?.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{service.description}</p>
                        )}
                        {service?.estimatedPrice && service.estimatedPrice > 0 && (
                          <p className="text-xs text-green-600 mt-1 font-medium">₹{service.estimatedPrice}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {recommendation.notes && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">{recommendation.notes}</p>
                </div>
              )}
              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {recommendation.status === 'viewed' ? (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Viewed {recommendation.viewedAt ? formatDate(recommendation.viewedAt) : 'recently'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span>New recommendation</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => handleBookNow(recommendation)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center transition-colors duration-200 hover:bg-primary-50 px-3 py-2 rounded-lg"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Book Now
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendationsSection;
