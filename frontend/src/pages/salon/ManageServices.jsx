import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salonService } from '../../services/salon';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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
  MoreVertical
} from 'lucide-react';

const ManageServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0
  });

  const fetchServices = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pagination.limit,
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { active: statusFilter })
      };

      const response = await salonService.getServices(params);
      
      if (response.success) {
        setServices(response.data || []);
        setPagination(response.pagination || {
          page: 1,
          limit: 20,
          totalPages: 1,
          totalItems: 0
        });
      } else {
        const errorMsg = response.message || 'Failed to fetch services';
        setError(errorMsg);
        toast.error(errorMsg);
      }
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
  }, [categoryFilter, statusFilter]);

  const handleServiceAdded = () => {
    fetchServices(pagination.page);
    setIsAddServiceModalOpen(false);
  };

  const handlePageChange = (page) => {
    fetchServices(page);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>
    );
  };

  const formatDuration = (duration) => {
    if (duration >= 60) {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${duration}m`;
  };

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
              <p className="text-gray-600">Add, edit, and manage your salon services</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddServiceModalOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <PlusCircle size={20} />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <option value="Massage">Massage</option>
            <option value="Other">Other</option>
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

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter size={16} />
            <span>Total: {pagination.totalItems} services</span>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredServices.map((service) => (
          <div key={service._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
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
                    <Tag size={16} className="mr-1" />
                    <span>{service.category}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock size={16} className="mr-1" />
                    <span>{formatDuration(service.duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-600 font-semibold">
                    <DollarSign size={16} />
                    <span>₹{service.price}</span>
                  </div>
                  {getStatusBadge(service.isActive)}
                </div>

                {service.availableStaff && service.availableStaff.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Staff: {service.availableStaff.map(staff => staff.name).join(', ')}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                  <Eye size={16} />
                  <span>View</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredServices.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <Tag size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter || statusFilter 
                ? "Try adjusting your search or filters" 
                : "Get started by adding your first service"}
            </p>
            {!searchQuery && !categoryFilter && !statusFilter && (
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
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  page === pagination.page
                    ? 'bg-pink-500 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Service Modal */}
      <AddServiceModal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        onServiceAdded={handleServiceAdded}
      />
    </div>
  );
};

export default ManageServices;
