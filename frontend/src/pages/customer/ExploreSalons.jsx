import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { customerService } from '../../services/customer';
import { 
  MapPin, 
  Star, 
  Search,
  Heart,
  ArrowLeft,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExploreSalons = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || searchParams.get('q') || '';
  const [loading, setLoading] = useState(true);
  const [salons, setSalons] = useState([]);
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const serviceFilter = searchParams.get('service') || '';
  const [favoriteSalons, setFavoriteSalons] = useState(new Set());

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    // Update local state when URL search parameter changes
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [urlSearchTerm]);

  useEffect(() => {
    filterSalons();
  }, [searchTerm, salons]);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const res = await customerService.browseSalons({ page: 1, limit: 100 });
      if (res?.success) {
        setSalons(res.data || []);
        setFilteredSalons(res.data || []);
        
        // Get user's current favorite salons
        const profileRes = await customerService.getFavoriteSalons();
        if (profileRes?.data) {
          setFavoriteSalons(new Set(profileRes.data.map(salon => salon._id)));
        }
      }
    } catch (error) {
      console.error('Error fetching salons:', error);
      toast.error('Failed to load salons');
    } finally {
      setLoading(false);
    }
  };

  const filterSalons = () => {
    let filtered = salons;
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(salon => 
        salon.salonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof salon.salonAddress === 'string' && salon.salonAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (salon.salonAddress?.city && salon.salonAddress.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply service filter
    if (serviceFilter) {
      filtered = filtered.filter(salon => 
        salon.services && salon.services.some(service => 
          service.name && service.name.toLowerCase().includes(serviceFilter.toLowerCase())
        )
      );
    }
    
    setFilteredSalons(filtered);
  };

  const toggleFavorite = async (salonId) => {
    try {
      const isCurrentlyFavorite = favoriteSalons.has(salonId);
      
      // Add or remove from favorites
      if (isCurrentlyFavorite) {
        await customerService.removeFavoriteSalon(salonId);
        toast.success('Removed from favorites');
      } else {
        await customerService.addFavoriteSalon(salonId);
        toast.success('Added to favorites!');
      }
      
      // Update local state
      setFavoriteSalons(prev => {
        const newFavorites = new Set(prev);
        if (isCurrentlyFavorite) {
          newFavorites.delete(salonId);
        } else {
          newFavorites.add(salonId);
        }
        return newFavorites;
      });
      
      // Navigate to favorites page only after adding a new favorite
      if (!isCurrentlyFavorite) {
        // Use setTimeout to ensure navigation happens after render cycle
        setTimeout(() => {
          navigate('/customer/favorites');
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const getTopServices = (services, limit = 3) => {
    if (!services || !Array.isArray(services)) return [];
    return services.slice(0, limit);
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
              className={`h-4 w-4 ${star <= Math.round(avg) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span className="ml-1 text-sm text-gray-600">
          {avg.toFixed(1)} ({count})
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-xl font-semibold text-gray-900">Explore Salons</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Link 
                  to="/customer/dashboard"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
                >
                  Back to Favorites
                </Link>
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-xl font-semibold text-gray-900">Explore Salons</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/customer/dashboard"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
              >
                Back to Favorites
              </Link>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search salon by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchTerm('')}
              >
                <span className="text-gray-400 hover:text-gray-600">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Salons Grid */}
        {filteredSalons.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No salons found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `No salons match your search for "${searchTerm}". Try a different search term.` 
                : "There are currently no salons available."}
            </p>
            {searchTerm && (
              <button
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSalons.map((salon) => {
              const topServices = getTopServices(salon.services);
              const isFavorite = favoriteSalons.has(salon._id);
              
              return (
                <div key={salon._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{salon.salonName}</h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {typeof salon.salonAddress === 'string' 
                              ? salon.salonAddress 
                              : [salon.salonAddress?.city, salon.salonAddress?.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(salon._id)}
                        className={`p-2 rounded-full ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      {renderRating(salon.rating)}
                    </div>
                    
                    {topServices.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Popular Services</h4>
                        <div className="flex flex-wrap gap-2">
                          {topServices.map((service, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {service.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <Link
                        to={`/customer/salon/${salon._id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        View Salon
                      </Link>
                      <Link
                        to={`/customer/book-appointment/${salon._id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreSalons;