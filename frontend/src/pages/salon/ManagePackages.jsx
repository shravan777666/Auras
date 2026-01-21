import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import packageService from '../../services/packageService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import AddPackageModal from '../../components/salon/AddPackageModal';
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
  Package,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const ManagePackages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState(null);
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
  }, [location.search]);

  // Fetch packages
  const fetchPackages = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await packageService.getMyPackages({
        page,
        limit: pagination.limit,
        category: categoryFilter || undefined,
        active: statusFilter ? statusFilter === 'true' : undefined
      });
      
      // DEBUG: Log the actual response structure
      console.log('API Response:', response);
      
      // FIX: Correctly access the data structure { success: true, data: [...], pagination: {...} }
      const packagesData = response?.data ?? [];
      const paginationData = response?.pagination ?? {};
      
      setPackages(packagesData);
      setPagination({
        page: paginationData?.page ?? 1,
        limit: paginationData?.limit ?? 20,
        totalPages: paginationData?.totalPages ?? 1,
        totalItems: paginationData?.total ?? (packagesData ? packagesData.length : 0)
      });
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch packages';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [categoryFilter, statusFilter, pagination.page, location.search]);

  // Filter packages based on all criteria
  const getFilteredPackages = () => {
    let filtered = packages;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(pkg =>
        (pkg?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg?.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg?.category ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg?.occasionType ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(pkg => (pkg?.category ?? '') === categoryFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(pkg => (pkg?.isActive ?? false) === (statusFilter === 'true'));
    }
    
    return filtered;
  };

  const handlePackageAdded = () => {
    fetchPackages(pagination.page);
    setIsAddPackageModalOpen(false);
  };

  const handlePackageUpdated = () => {
    fetchPackages(pagination.page);
    setPackageToEdit(null);
    setIsAddPackageModalOpen(false);
  };

  const handleEdit = (pkg) => {
    setPackageToEdit(pkg);
    setIsAddPackageModalOpen(true);
  };

  const handleDelete = async (packageId) => {
    if (window.confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      try {
        await packageService.deletePackage(packageId);
        fetchPackages(pagination.page);
        toast.success('Package deleted successfully');
      } catch (error) {
        toast.error('Failed to delete package');
      }
    }
  };

  const togglePackageStatus = async (packageId) => {
    try {
      await packageService.togglePackageStatus(packageId);
      // Refresh the package list
      fetchPackages(pagination.page);
      toast.success('Package status updated successfully');
    } catch (error) {
      toast.error('Failed to update package status');
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
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
      case 'Wedding':
      case 'Birthday':
      case 'Corporate':
      case 'Anniversary':
      case 'Festival':
      case 'Custom':
        return <Package className="h-4 w-4" />;
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

  const calculateTotalDuration = (services) => {
    if (!services || !Array.isArray(services)) return 0;
    
    return services.reduce((total, pkgService) => {
      // Assuming each service in the package has its own duration
      return total + (pkgService.duration || 0) * (pkgService.quantity || 1);
    }, 0);
  };

  const calculateTotalPrice = (services) => {
    if (!services || !Array.isArray(services)) return 0;
    
    return services.reduce((total, pkgService) => {
      // Use the package-specific price
      const servicePrice = pkgService.price || 0;
      const quantity = pkgService.quantity || 1;
      return total + (servicePrice * quantity);
    }, 0);
  };

  const calculateFinalPrice = (totalPrice, discountPercentage, discountedPrice) => {
    if (discountedPrice) {
      return parseFloat(discountedPrice);
    }
    if (discountPercentage > 0) {
      return totalPrice - (totalPrice * discountPercentage / 100);
    }
    return totalPrice;
  };

  const filteredPackages = getFilteredPackages();

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
              <h1 className="text-3xl font-bold text-gray-900">Manage Packages</h1>
              <p className="text-gray-600">Add, edit, and manage your salon packages</p>
            </div>
          </div>
          <button
            onClick={() => {
              setPackageToEdit(null);
              setIsAddPackageModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-purple-600 hover:to-indigo-700 transition-all"
          >
            <PlusCircle size={20} />
            <span>Add Package</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Categories</option>
            <option value="Wedding">Wedding</option>
            <option value="Birthday">Birthday</option>
            <option value="Corporate">Corporate</option>
            <option value="Anniversary">Anniversary</option>
            <option value="Festival">Festival</option>
            <option value="Custom">Custom</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Filter size={16} />
          <span>Total: {packages?.length ?? 0} packages</span>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredPackages.map((pkg) => {
          const totalDuration = calculateTotalDuration(pkg.services);
          const totalPrice = calculateTotalPrice(pkg.services);
          const finalPrice = calculateFinalPrice(totalPrice, pkg.discountPercentage, pkg.discountedPrice);
          
          return (
            <div key={pkg._id ?? Math.random()} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{pkg.description}</p>
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
                      {getCategoryIcon(pkg.category)}
                      <span className="ml-1">{pkg.category}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock size={16} className="mr-1" />
                      <span>{formatDuration(totalDuration)}</span>
                    </div>
                  </div>

                  {/* Included Services */}
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">INCLUDED SERVICES:</p>
                    <div className="space-y-1">
                      {pkg.services && pkg.services.length > 0 ? (
                        pkg.services.slice(0, 3).map((service, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex justify-between">
                            <span>{service.serviceName || 'Service'} x{service.quantity || 1}</span>
                            <span>₹{service.price || 0}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">No services included</p>
                      )}
                      {pkg.services && pkg.services.length > 3 && (
                        <p className="text-xs text-gray-500">+{pkg.services.length - 3} more services</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-600 font-semibold">
                      <DollarSign size={16} />
                      <span>₹{finalPrice.toFixed(2)}</span>
                    </div>
                    {getStatusBadge(pkg.isActive)}
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => handleEdit(pkg)} 
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => togglePackageStatus(pkg._id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {pkg.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                    <span>{pkg.isActive ? 'Disable' : 'Enable'}</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(pkg._id)} 
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPackages.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <Package size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter || statusFilter
                ? "Try adjusting your search or filters" 
                : "Get started by adding your first package"}
            </p>
            {!searchQuery && !categoryFilter && !statusFilter && (
              <button
                onClick={() => setIsAddPackageModalOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all"
              >
                Add Your First Package
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
                    ? 'bg-purple-500 text-white'
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

      {/* Add/Edit Package Modal */}
      {isAddPackageModalOpen && (
        <AddPackageModal
          isOpen={isAddPackageModalOpen}
          onClose={() => {
            setIsAddPackageModalOpen(false);
            setPackageToEdit(null);
          }}
          onPackageAdded={handlePackageAdded}
          onPackageUpdated={handlePackageUpdated}
          packageToEdit={packageToEdit}
        />
      )}
    </div>
  );
};

export default ManagePackages;