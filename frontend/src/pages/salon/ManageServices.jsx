import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { salonService } from '../../services/salon';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import AddServiceModal from '../../components/salon/AddServiceModal';
import { toast } from 'react-hot-toast';
import { 
  PlusCircle, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Clock,
  Tag,
  ArrowLeft,
  MoreVertical,
  Scissors,
  Star,
  Flower2,
  Sparkles,
  Heart,
  User,
  AlertTriangle,
  TrendingDown
} from 'lucide-react';

const ManageServices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [showAlertServicesOnly, setShowAlertServicesOnly] = useState(false);
  const [lowBookingsThreshold] = useState(5); // Threshold for low bookings
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0
  });

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    
    if (filterParam === 'low_bookings') {
      setShowAlertServicesOnly(true);
    }
  }, [location.search]);

  // Fetch services
  const fetchServices = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await salonService.getServices({
        page,
        limit: pagination.limit,
        category: categoryFilter || undefined,
        // Always filter for active services unless specifically requesting inactive ones
        active: statusFilter ? statusFilter === 'true' : true,
        filter: showAlertServicesOnly ? 'low_bookings' : undefined
      });
      
      // DEBUG: Log the actual response structure
      console.log('API Response:', response);
      
      // FIX: Correctly access the data structure { success: true, data: [...], meta: {...} }
      const servicesData = response?.data?.data ?? [];
      const metaData = response?.data?.meta ?? {};
      
      setServices(servicesData);
      setPagination({
        page: metaData?.page ?? 1,
        limit: metaData?.limit ?? 20,
        totalPages: metaData?.totalPages ?? 1,
        totalItems: metaData?.totalItems ?? (servicesData ? servicesData.length : 0)
      });
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch services';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [categoryFilter, statusFilter, showAlertServicesOnly, pagination.page, location.search]);

  // Get count of services with low bookings
  const getLowBookingsCount = () => {
    return services.filter(service => (service?.totalBookings ?? 0) < lowBookingsThreshold).length;
  };

  // Filter services based on all criteria
  const getFilteredServices = () => {
    let filtered = services;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(service =>
        (service?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service?.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service?.category ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(service => (service?.category ?? '') === categoryFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(service => (service?.isActive ?? false) === (statusFilter === 'true'));
    }
    
    // Apply alert services filter (but only for active services)
    if (showAlertServicesOnly) {
      filtered = filtered.filter(service => 
        (service?.isActive ?? false) === true && 
        (service?.totalBookings ?? 0) < lowBookingsThreshold
      );
    }
    
    return filtered;
  };

  const handleServiceAdded = () => {
    fetchServices(pagination.page);
    setIsAddServiceModalOpen(false);
  };

  const handleServiceUpdated = () => {
    fetchServices(pagination.page);
    setServiceToEdit(null);
    setIsAddServiceModalOpen(false);
  };

  const handleEdit = (service) => {
    setServiceToEdit(service);
    setIsAddServiceModalOpen(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await salonService.deleteService(serviceId);
        fetchServices(pagination.page);
        toast.success('Service deleted successfully');
      } catch (error) {
        toast.error('Failed to delete service');
      }
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleAlertFilterToggle = () => {
    const newShowAlertServicesOnly = !showAlertServicesOnly;
    setShowAlertServicesOnly(newShowAlertServicesOnly);
    
    // Update URL to reflect the filter state
    const params = new URLSearchParams(location.search);
    if (newShowAlertServicesOnly) {
      params.set('filter', 'low_bookings');
    } else {
      params.delete('filter');
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>
    );
  };

  const getCategoryIcon = (category) => {
    // Safely handle undefined category
    const safeCategory = category ?? '';
    
    switch (safeCategory) {
      case 'Hair':
        return <Scissors className="h-4 w-4" />;
      case 'Skin':
        return <Star className="h-4 w-4" />;
      case 'Nails':
        return <Flower2 className="h-4 w-4" />;
      case 'Makeup':
        return <Sparkles className="h-4 w-4" />;
      case 'Massage':
      case 'Massage & Wellness':
        return <Heart className="h-4 w-4" />;
      case 'Grooming':
        return <User className="h-4 w-4" />;
      case 'Packages':
        return <Star className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const formatDuration = (duration) => {
    // Safely handle undefined or null duration
    const safeDuration = duration ?? 0;
    
    if (safeDuration >= 60) {
      const hours = Math.floor(safeDuration / 60);
      const minutes = safeDuration % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${safeDuration}m`;
  };

  // Get low bookings alert info for a service
  const getServiceAlertInfo = (service) => {
    // Safely access service properties
    const totalBookings = service?.totalBookings ?? 0;
    
    if (totalBookings < lowBookingsThreshold) {
      const targetBookings = lowBookingsThreshold * 4; // Monthly target is 4 times the threshold
      return {
        isLowBooking: true,
        message: `Bookings: ${totalBookings}/Month (Target: ${targetBookings})`
      };
    }
    return { isLowBooking: false };
  };

  const filteredServices = getFilteredServices();
  const lowBookingsCount = getLowBookingsCount();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/salon/dashboard')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Services</h1>
              {showAlertServicesOnly ? (
                <p className="text-gray-600">Showing {services?.length ?? 0} Services with Low Bookings</p>
              ) : (
                <p className="text-gray-600">Add, edit, and manage your salon services</p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setServiceToEdit(null);
              setIsAddServiceModalOpen(true);
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <PlusCircle size={20} />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">All Categories</option>
            <option value="Hair">Hair</option>
            <option value="Skin">Skin</option>
            <option value="Nails">Nails</option>
            <option value="Makeup">Makeup</option>
            <option value="Massage & Wellness">Massage & Wellness</option>
            <option value="Grooming">Grooming</option>
            <option value="Packages">Packages</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            onClick={handleAlertFilterToggle}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all font-medium ${
              showAlertServicesOnly
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-md transform hover:scale-105'
                : 'bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-300'
            }`}
          >
            <AlertTriangle size={16} />
            <span>
              {showAlertServicesOnly 
                ? '[Clear Alert Filter]' 
                : `Show Alert Services Only (${pagination?.totalItems ?? 0})`}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Filter size={16} />
          <span>Total: {services?.length ?? 0} services</span>
          {showAlertServicesOnly && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
              Showing only alert services
            </span>
          )}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredServices.map((service) => {
          const alertInfo = getServiceAlertInfo(service);
          
          return (
            <div key={service?._id ?? Math.random()} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{service?.name ?? 'Unnamed Service'}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{service?.description ?? ''}</p>
                  </div>
                  <div className="relative">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      {getCategoryIcon(service?.category)}
                      <span className="ml-1">{service?.category ?? 'Uncategorized'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock size={16} className="mr-1" />
                      <span>{formatDuration(service?.duration)}</span>
                    </div>
                  </div>

                  {/* Alert Badge for Low Bookings */}
                  {alertInfo.isLowBooking && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">LOW BOOKING ALERT</p>
                          <p className="text-xs text-red-700 mt-1">{alertInfo.message}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <button 
                          onClick={() => navigate('/salon/marketing?promo_service=' + (service?._id ?? ''))}
                          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Run 10% Promo
                        </button>
                        <button 
                          onClick={() => navigate('/salon/analytics?service=' + (service?._id ?? ''))}
                          className="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                        >
                          View Analytics
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-600 font-semibold">
                      <DollarSign size={16} />
                      <span>₹{service?.price ?? 0}</span>
                    </div>
                    {getStatusBadge(service?.isActive)}
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                  <button onClick={() => handleEdit(service)} className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button onClick={() => handleDelete(service?._id)} className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredServices.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <Tag size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter || statusFilter || showAlertServicesOnly
                ? "Try adjusting your search or filters" 
                : "Get started by adding your first service"}
            </p>
            {!searchQuery && !categoryFilter && !statusFilter && !showAlertServicesOnly && (
              <button
                onClick={() => setIsAddServiceModalOpen(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                Add Your First Service
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: pagination?.totalPages ?? 1 }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  page === pagination?.page
                    ? 'bg-pink-500 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handlePageChange((pagination?.page ?? 1) + 1)}
            disabled={pagination?.page === pagination?.totalPages}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {isAddServiceModalOpen && (
        <AddServiceModal
          isOpen={isAddServiceModalOpen}
          onClose={() => {
            setIsAddServiceModalOpen(false);
            setServiceToEdit(null);
          }}
          onServiceAdded={handleServiceAdded}
          onServiceUpdated={handleServiceUpdated}
          serviceToEdit={serviceToEdit}
        />
      )}
    </div>
  );
};

export default ManageServices;