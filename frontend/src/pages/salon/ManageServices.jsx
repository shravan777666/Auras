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
  MoreVertical,
  Scissors,
  Star,
  Flower2,
  Sparkles,
  Heart,
  User
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
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0
  });

  // Default services data
  const defaultServices = [
    // Hair Services
    { _id: '1', name: 'Haircut - Men', category: 'Hair', price: 500, duration: 30, description: 'Professional haircut for men', isActive: true },
    { _id: '2', name: 'Haircut - Women', category: 'Hair', price: 800, duration: 45, description: 'Professional haircut for women', isActive: true },
    { _id: '3', name: 'Haircut - Kids', category: 'Hair', price: 400, duration: 25, description: 'Haircut for children', isActive: true },
    { _id: '4', name: 'Blow Dry Styling', category: 'Hair', price: 600, duration: 30, description: 'Professional blow dry styling', isActive: true },
    { _id: '5', name: 'Hair Straightening', category: 'Hair', price: 1500, duration: 90, description: 'Hair straightening treatment', isActive: true },
    { _id: '6', name: 'Hair Curling', category: 'Hair', price: 700, duration: 45, description: 'Professional hair curling', isActive: true },
    { _id: '7', name: 'Full Hair Color', category: 'Hair', price: 2000, duration: 120, description: 'Full hair coloring service', isActive: true },
    { _id: '8', name: 'Highlights', category: 'Hair', price: 2500, duration: 150, description: 'Hair highlighting service', isActive: true },
    { _id: '9', name: 'Root Touch-Up', category: 'Hair', price: 1200, duration: 60, description: 'Root touch-up coloring', isActive: true },
    { _id: '10', name: 'Keratin Treatment', category: 'Hair', price: 3500, duration: 180, description: 'Keratin smoothing treatment', isActive: true },
    { _id: '11', name: 'Deep Conditioning', category: 'Hair', price: 800, duration: 45, description: 'Deep conditioning treatment', isActive: true },
    { _id: '12', name: 'Scalp Treatment', category: 'Hair', price: 1000, duration: 60, description: 'Therapeutic scalp treatment', isActive: true },

    // Skin Services
    { _id: '13', name: 'Basic Facial', category: 'Skin', price: 1200, duration: 60, description: 'Basic cleansing and moisturizing facial', isActive: true },
    { _id: '14', name: 'Anti-Aging Facial', category: 'Skin', price: 2000, duration: 75, description: 'Anti-aging and rejuvenating facial', isActive: true },
    { _id: '15', name: 'Brightening Facial', category: 'Skin', price: 1800, duration: 70, description: 'Skin brightening and glow facial', isActive: true },
    { _id: '16', name: 'Acne Treatment', category: 'Skin', price: 1500, duration: 65, description: 'Specialized acne treatment', isActive: true },
    { _id: '17', name: 'Chemical Peel', category: 'Skin', price: 2500, duration: 90, description: 'Chemical peel treatment', isActive: true },
    { _id: '18', name: 'Microdermabrasion', category: 'Skin', price: 2200, duration: 80, description: 'Microdermabrasion exfoliation', isActive: true },
    { _id: '19', name: 'Full Body Waxing', category: 'Skin', price: 1800, duration: 90, description: 'Complete body waxing service', isActive: true },
    { _id: '20', name: 'Eyebrow Waxing', category: 'Skin', price: 300, duration: 15, description: 'Eyebrow shaping and waxing', isActive: true },

    // Nails Services
    { _id: '21', name: 'Basic Manicure', category: 'Nails', price: 400, duration: 30, description: 'Basic manicure service', isActive: true },
    { _id: '22', name: 'Gel Manicure', category: 'Nails', price: 800, duration: 45, description: 'Gel polish manicure', isActive: true },
    { _id: '23', name: 'Spa Manicure', category: 'Nails', price: 600, duration: 40, description: 'Spa manicure with massage', isActive: true },
    { _id: '24', name: 'Basic Pedicure', category: 'Nails', price: 500, duration: 35, description: 'Basic pedicure service', isActive: true },
    { _id: '25', name: 'Spa Pedicure', category: 'Nails', price: 900, duration: 50, description: 'Spa pedicure with massage', isActive: true },
    { _id: '26', name: 'Gel Pedicure', category: 'Nails', price: 1000, duration: 55, description: 'Gel polish pedicure', isActive: true },
    { _id: '27', name: 'Nail Art Design', category: 'Nails', price: 200, duration: 20, description: 'Custom nail art design', isActive: true },

    // Makeup Services
    { _id: '28', name: 'Bridal Makeup - Classic', category: 'Makeup', price: 3500, duration: 90, description: 'Classic bridal makeup', isActive: true },
    { _id: '29', name: 'Bridal Makeup - Glam', category: 'Makeup', price: 4500, duration: 120, description: 'Glamorous bridal makeup', isActive: true },
    { _id: '30', name: 'Party Makeup - Evening', category: 'Makeup', price: 1500, duration: 60, description: 'Evening party makeup', isActive: true },
    { _id: '31', name: 'Party Makeup - Themed', category: 'Makeup', price: 2000, duration: 75, description: 'Themed party makeup', isActive: true },
    { _id: '32', name: 'Airbrush Makeup - Full Face', category: 'Makeup', price: 2500, duration: 80, description: 'Airbrush makeup application', isActive: true },

    // Massage Services
    { _id: '33', name: 'Swedish Massage - 60 min', category: 'Massage', price: 1500, duration: 60, description: 'Swedish relaxation massage', isActive: true },
    { _id: '34', name: 'Swedish Massage - 90 min', category: 'Massage', price: 2000, duration: 90, description: 'Extended Swedish massage', isActive: true },
    { _id: '35', name: 'Deep Tissue Massage - 60 min', category: 'Massage', price: 1800, duration: 60, description: 'Deep tissue therapeutic massage', isActive: true },
    { _id: '36', name: 'Deep Tissue Massage - 90 min', category: 'Massage', price: 2500, duration: 90, description: 'Extended deep tissue massage', isActive: true },
    { _id: '37', name: 'Aromatherapy Massage - Lavender', category: 'Massage', price: 2000, duration: 60, description: 'Aromatherapy relaxation massage', isActive: true },
    { _id: '38', name: 'Hot Stone Massage', category: 'Massage', price: 2200, duration: 75, description: 'Hot stone therapeutic massage', isActive: true },
    { _id: '39', name: 'Reflexology - Foot', category: 'Massage', price: 1200, duration: 45, description: 'Foot reflexology massage', isActive: true },

    // Grooming Services
    { _id: '40', name: 'Beard Trim - Basic', category: 'Grooming', price: 200, duration: 15, description: 'Basic beard trimming', isActive: true },
    { _id: '41', name: 'Beard Trim - Detailed', category: 'Grooming', price: 400, duration: 30, description: 'Detailed beard styling', isActive: true },
    { _id: '42', name: 'Hot Shave', category: 'Grooming', price: 500, duration: 30, description: 'Traditional hot shave', isActive: true },
    { _id: '43', name: 'Eyebrow Threading', category: 'Grooming', price: 150, duration: 10, description: 'Eyebrow threading service', isActive: true },
    { _id: '44', name: 'Eyelash Extensions - Classic', category: 'Grooming', price: 2000, duration: 120, description: 'Classic eyelash extensions', isActive: true },

    // Packages
    { _id: '45', name: 'Bridal Package', category: 'Packages', price: 8000, duration: 240, description: 'Complete bridal package - Hair + Makeup + Nails', isActive: true },
    { _id: '46', name: 'Spa Package', category: 'Packages', price: 5000, duration: 180, description: 'Relaxing spa package - Massage + Facial + Scrub', isActive: true },
    { _id: '47', name: 'Hair & Skin Combo', category: 'Packages', price: 3000, duration: 120, description: 'Haircut + Facial combination', isActive: true },
    { _id: '48', name: 'Winter Skin Care Package', category: 'Packages', price: 3500, duration: 150, description: 'Winter skin care treatment package', isActive: true },
    { _id: '49', name: 'Summer Hair Care Package', category: 'Packages', price: 2800, duration: 135, description: 'Summer hair care treatment package', isActive: true }
  ];

  const fetchServices = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // For demonstration, use default services
      // In real implementation, you would call your API
      setServices(defaultServices);
      setPagination({
        page: 1,
        limit: 20,
        totalPages: 1,
        totalItems: defaultServices.length
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
  }, [categoryFilter, statusFilter]);

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
        // In real implementation, call your API
        // await salonService.deleteService(serviceId);
        setServices(prev => prev.filter(service => service._id !== serviceId));
        toast.success('Service deleted successfully');
      } catch (error) {
        toast.error('Failed to delete service');
      }
    }
  };

  const handlePageChange = (page) => {
    fetchServices(page);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(service => 
    !categoryFilter || service.category === categoryFilter
  ).filter(service =>
    !statusFilter || service.isActive === (statusFilter === 'true')
  );

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>
    );
  };

  const getCategoryIcon = (category) => {
    switch (category) {
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
                    {getCategoryIcon(service.category)}
                    <span className="ml-1">{service.category}</span>
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
                <button onClick={() => handleDelete(service._id)} className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
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