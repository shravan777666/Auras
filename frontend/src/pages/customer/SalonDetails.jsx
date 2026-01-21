import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { customerService } from '../../services/customer';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  User, 
  ArrowLeft,
  Calendar,
  Scissors,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import GiftCardSection from '../../components/customer/GiftCardSection';

const SalonDetails = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchSalonDetails();
  }, [salonId]);

  const fetchSalonDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch salon details
      const salonRes = await customerService.getSalonDetails(salonId);
      
      // Fetch user's favorite status
      const profileRes = await customerService.getProfile();
      
      if (salonRes?.success) {
        setSalon(salonRes.data);
        
        // Check if this salon is the user's favorite
        if (profileRes?.data?.favoriteSalon === salonId) {
          setIsFavorite(true);
        }
      }
      
      // Fetch reviews (would need a reviews service)
      // For now, we'll just use the salon's rating data
    } catch (error) {
      console.error('Error fetching salon details:', error);
      toast.error('Failed to load salon details');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      // If it's already favorite, remove it (set to null), otherwise set it to this salon
      const newFavoriteId = isFavorite ? null : salonId;
      await customerService.updateFavoriteSalon(newFavoriteId);
      setIsFavorite(!isFavorite);
      
      if (isFavorite) {
        toast.success('Removed from favorites');
      } else {
        toast.success('Added to favorites!');
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const groupServicesByCategory = (services) => {
    if (!services || !Array.isArray(services)) return {};
    
    return services.reduce((groups, service) => {
      const category = service.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
      return groups;
    }, {});
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    
    if (typeof address === 'string') {
      return address;
    }
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean);
    
    return parts.join(', ') || 'Address not available';
  };

  const renderRating = (rating) => {
    if (!rating || !rating.average) return 'No ratings';
    
    const avg = rating.average;
    const count = rating.count || 0;
    
    return (
      <div className="flex items-center">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 ${star <= Math.round(avg) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span className="ml-2 text-gray-600">
          {avg.toFixed(1)} ({count} reviews)
        </span>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading salon details..." />;
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <Scissors className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Salon not found</h3>
          <p className="text-gray-500 mb-4">The requested salon could not be found.</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const servicesByCategory = groupServicesByCategory(salon.services);
  const salonAddress = formatAddress(salon.salonAddress);

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-xl font-semibold text-gray-900">{salon.salonName}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleFavorite}
                className={`p-2 rounded-full ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Salon Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-primary-500 to-secondary-600">
        {salon.documents?.salonImages?.[0] ? (
          <img 
            src={salon.documents.salonImages[0].startsWith('http') ? salon.documents.salonImages[0] : `${import.meta.env.VITE_API_URL || ''}${salon.documents.salonImages[0]}`} 
            alt={salon.salonName}
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scissors className="h-16 w-16 text-white opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white">{salon.salonName}</h1>
            <div className="flex items-center mt-2 text-white/90">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{salonAddress}</span>
            </div>
            <div className="mt-2">
              {renderRating(salon.rating)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'services', label: 'Services' },
                  { key: 'staff', label: 'Staff' },
                  { key: 'reviews', label: 'Reviews' },
                  { key: 'info', label: 'Information' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-4 px-1 text-sm font-medium border-b-2 ${
                      activeTab === tab.key
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {activeTab === 'services' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Our Services</h2>
                  {Object.keys(servicesByCategory).length > 0 ? (
                    <div className="space-y-8">
                      {Object.entries(servicesByCategory).map(([category, services]) => (
                        <div key={category}>
                          <h3 className="text-lg font-medium text-gray-900 mb-4 border-l-4 border-primary-500 pl-2">
                            {category}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map((service) => (
                              <div key={service._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                      ₹{service.discountedPrice || service.price}
                                    </p>
                                    {service.discountedPrice && service.price && (
                                      <p className="text-xs text-gray-500 line-through">
                                        ₹{service.price}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {service.duration} min
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No services available</h3>
                      <p className="text-gray-500">This salon hasn't added any services yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'staff' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Our Team</h2>
                  {salon.staff && salon.staff.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {salon.staff.map((staff) => (
                        <div key={staff._id} className="flex items-center border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          {staff.profilePicture ? (
                            <img 
                              src={staff.profilePicture.startsWith('http') ? staff.profilePicture : `${import.meta.env.VITE_API_URL || ''}${staff.profilePicture}`} 
                              alt={staff.name || 'Staff'}
                              className="h-16 w-16 rounded-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="ml-4 flex-1">
                            <h3 className="font-medium text-gray-900">{staff.name || 'Unknown Staff'}</h3>
                            <p className="text-sm text-gray-500">{staff.position || 'Staff Member'}</p>
                            {staff.skills && Array.isArray(staff.skills) && staff.skills.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {staff.skills.slice(0, 3).map((skill, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {skill}
                                  </span>
                                ))}
                                {staff.skills.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    +{staff.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members</h3>
                      <p className="text-gray-500">This salon hasn't added any staff members yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Reviews</h2>
                  <div className="mb-6">
                    {renderRating(salon.rating)}
                  </div>
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-500 mb-4">Be the first to review this salon after your appointment.</p>
                    <Link
                      to={`/customer/book-appointment/${salonId}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Book Appointment
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'info' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Salon Information</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-gray-600">{salon.contactNumber || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <span className="text-gray-600">{salonAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Business Hours</h3>
                      {salon.businessHours ? (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Opening Time</span>
                            <span className="font-medium">{formatTime(salon.businessHours.openTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Closing Time</span>
                            <span className="font-medium">{formatTime(salon.businessHours.closeTime)}</span>
                          </div>
                          {salon.businessHours.workingDays && (
                            <div className="mt-3">
                              <span className="text-gray-600">Working Days: </span>
                              <span className="font-medium">{salon.businessHours.workingDays.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">Hours not specified</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">About</h3>
                      <p className="text-gray-600">
                        {salon.description || 'No description available for this salon.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Book Appointment Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Book?</h3>
              <p className="text-gray-600 text-sm mb-6">
                Book your appointment with {salon.salonName} today and experience our premium services.
              </p>
              <Link
                to={`/customer/book-appointment/${salonId}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Link>
            </div>
                        
            {/* Gift Cards Section */}
            <GiftCardSection salonId={salonId} />

            {/* Gallery */}
            {salon.documents?.salonImages && salon.documents.salonImages.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gallery</h3>
                <div className="grid grid-cols-2 gap-2">
                  {salon.documents.salonImages.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image.startsWith('http') ? image : `${import.meta.env.VITE_API_URL || ''}${image}`}
                      alt={`Salon ${index + 1}`}
                      className="h-24 w-full object-cover rounded-md"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonDetails;