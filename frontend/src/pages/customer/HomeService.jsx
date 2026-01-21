import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer';
import { freelancerService } from '../../services/freelancerService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Home, MapPin, Calendar, Clock, Star, User, Scissors } from 'lucide-react';

const HomeService = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [freelancers, setFreelancers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFreelancers, setFilteredFreelancers] = useState([]);
  const [serviceRadius, setServiceRadius] = useState('10'); // Default 10km radius
  const [homeAddress, setHomeAddress] = useState(''); // NEW: Added home address state

  useEffect(() => {
    fetchFreelancers();
  }, []);

  useEffect(() => {
    // Filter freelancers based on search query
    if (searchQuery.trim() === '') {
      setFilteredFreelancers(freelancers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = freelancers.filter(freelancer => 
        (freelancer.name && freelancer.name.toLowerCase().includes(query)) ||
        (freelancer.specialty && freelancer.specialty.toLowerCase().includes(query)) ||
        (freelancer.address && typeof freelancer.address === 'string' && freelancer.address.toLowerCase().includes(query)) ||
        (freelancer.address && freelancer.address.city && freelancer.address.city.toLowerCase().includes(query))
      );
      setFilteredFreelancers(filtered);
    }
  }, [searchQuery, freelancers]);

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      const res = await freelancerService.getApprovedFreelancers({ page: 1, limit: 50 });
      if (res?.success) {
        // Filter freelancers with status = 'APPROVED' only
        const approvedFreelancers = res.data.filter(freelancer => 
          freelancer.status && freelancer.status.toUpperCase() === 'APPROVED'
        );
        setFreelancers(approvedFreelancers);
        setFilteredFreelancers(approvedFreelancers);
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      toast.error('Failed to load freelancers offering home services');
    } finally {
      setLoading(false);
    }
  };

  // =========== UPDATED: handleBookHomeService function ===========
  const handleBookHomeService = (freelancer) => {
    // Check if address is provided (optional check - you can make it required)
    if (!homeAddress.trim()) {
      toast.error('Please enter your home address for home service booking');
      return;
    }
    
    // Navigate to book appointment page with home service data
    navigate(`/customer/book-appointment/${freelancer._id}?homeService=true`, {
      state: { 
        homeAddress,
        freelancerName: freelancer.name,
        isFreelancer: true  // Important flag to identify this is a freelancer booking
      }
    });
  };

  if (loading) {
    return <LoadingSpinner text="Finding approved freelancers that offer home services..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Home className="h-8 w-8 mr-3 text-purple-600" />
            Home Service
          </h1>
          <p className="text-gray-600 mt-2">Find beauty professionals who come to your home</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Freelancers</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by freelancer name or specialty..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <MapPin className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Radius</label>
              <select
                value={serviceRadius}
                onChange={(e) => setServiceRadius(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="15">Within 15 km</option>
                <option value="20">Within 20 km</option>
                <option value="30">Within 30 km</option>
              </select>
            </div>
            
            {/* =========== ADDED: Home Address Field =========== */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Home Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="Enter your complete home address for service (required)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows="2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Please provide complete address with landmark for accurate service delivery
              </p>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchFreelancers}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Search Home Services
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredFreelancers.length}</span> approved freelancers offering home services
          </p>
          {!homeAddress.trim() && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                ⚠️ <strong>Note:</strong> Please enter your home address above to book a home service.
              </p>
            </div>
          )}
        </div>

        {/* Freelancers List */}
        {filteredFreelancers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Home Service Providers Found</h3>
            <p className="text-gray-500 mb-6">There are currently no approved freelancers in our network offering home services in your area.</p>
            <Link
              to="/customer/explore-salons"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
            >
              Browse All Professionals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFreelancers.map((freelancer) => (
              <div key={freelancer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {freelancer.profilePic || freelancer.profilePicture ? (
                        <img
                          src={freelancer.profilePic || freelancer.profilePicture}
                          alt={freelancer.name}
                          className="w-16 h-16 rounded-xl object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                          <Scissors className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{freelancer.name}</h3>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(freelancer.averageRating || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-sm text-gray-600">
                              ({freelancer.averageRating?.toFixed(1) || '0'})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {typeof freelancer.address === 'string' 
                        ? freelancer.address 
                        : [freelancer.address?.city, freelancer.address?.state].filter(Boolean).join(', ')}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Home className="h-4 w-4 mr-2 text-purple-600" />
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        Home Service Available
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties:</h4>
                    <div className="flex flex-wrap gap-1">
                      {freelancer.specialties?.slice(0, 3).map((specialty, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {specialty}
                        </span>
                      ))}
                      {freelancer.specialties && freelancer.specialties.length > 3 && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          +{freelancer.specialties.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* =========== UPDATED: Book Home Service Button =========== */}
                  <button
                    onClick={() => handleBookHomeService(freelancer)}
                    disabled={!homeAddress.trim()}
                    className={`w-full text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                      !homeAddress.trim() 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    {!homeAddress.trim() ? 'Enter Address First' : 'Book Home Service'}
                  </button>
                  {!homeAddress.trim() && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                      Please enter your home address above to book
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Home Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Convenience</h3>
              <p className="text-gray-600 text-sm">Enjoy professional beauty services in the comfort of your own home.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quality</h3>
              <p className="text-gray-600 text-sm">Professional-grade treatments delivered by certified beauticians.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Flexibility</h3>
              <p className="text-gray-600 text-sm">Choose convenient time slots that fit your busy schedule.</p>
            </div>
          </div>
          
          {/* =========== ADDED: Home Service Instructions =========== */}
          <div className="mt-8 pt-6 border-t border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">How Home Service Works:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-white rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-purple-600">1</span>
                </div>
                <h4 className="font-medium text-gray-900">Enter Your Address</h4>
                <p className="text-gray-600 text-xs">Provide your complete home address above</p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-purple-600">2</span>
                </div>
                <h4 className="font-medium text-gray-900">Select a Professional</h4>
                <p className="text-gray-600 text-xs">Choose from our verified beauticians</p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-purple-600">3</span>
                </div>
                <h4 className="font-medium text-gray-900">Book & Enjoy</h4>
                <p className="text-gray-600 text-xs">Schedule appointment and enjoy at home</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeService;