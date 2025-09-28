import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

const AddServiceModal = ({ isOpen, onClose, onServiceAdded, onServiceUpdated, serviceToEdit }) => {
  const [formData, setFormData] = useState({
    category: '',
    serviceName: '',
    serviceType: '',
    description: '',
    duration: '',
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [availableServiceNames, setAvailableServiceNames] = useState([]);
  const [availableServiceTypes, setAvailableServiceTypes] = useState([]);

  const isEditMode = Boolean(serviceToEdit);

  // Predefined service structure
  const serviceStructure = {
    'Hair': {
      'Haircut': ['Men', 'Women', 'Kids'],
      'Hair Styling': ['Blow Dry', 'Straightening', 'Curling'],
      'Hair Coloring': ['Full Color', 'Highlights', 'Root Touch-Up'],
      'Hair Treatments': ['Keratin', 'Deep Conditioning', 'Scalp Treatment'],
      'Hair Extensions': ['Clip-in', 'Tape-in', 'Keratin']
    },
    'Skin': {
      'Facials': ['Basic', 'Anti-Aging', 'Brightening'],
      'Skin Treatments': ['Acne Treatment', 'Chemical Peel', 'Microdermabrasion'],
      'Waxing': ['Full Body', 'Eyebrow', 'Legs', 'Arms'],
      'Body Scrubs & Wraps': ['Sea Salt Scrub', 'Mud Wrap', 'Chocolate Wrap']
    },
    'Nails': {
      'Manicure': ['Basic', 'Gel', 'Spa'],
      'Pedicure': ['Basic', 'Spa', 'Gel'],
      'Nail Art': ['Design', 'Extensions'],
      'Nail Treatment': ['Strengthening', 'Repair']
    },
    'Makeup': {
      'Bridal Makeup': ['Classic', 'Glam'],
      'Party Makeup': ['Evening', 'Themed'],
      'Professional Consultation': ['Skin Tone Matching', 'Makeup Tutorial'],
      'Airbrush Makeup': ['Full Face', 'Partial']
    },
    'Massage & Wellness': {
      'Swedish Massage': ['30 min', '60 min', '90 min'],
      'Deep Tissue Massage': ['30 min', '60 min', '90 min'],
      'Aromatherapy Massage': ['Lavender', 'Eucalyptus', 'Peppermint'],
      'Hot Stone Massage': ['Full Body', 'Partial'],
      'Reflexology': ['Foot', 'Hand']
    },
    'Grooming': {
      'Beard Trim': ['Basic', 'Detailed'],
      'Shaving': ['Hot Shave', 'Straight Razor'],
      'Eyebrow Threading': ['Basic', 'Shaping'],
      'Eyelash Extensions': ['Classic', 'Volume']
    },
    'Packages': {
      'Bridal Packages': ['Hair + Makeup + Nails'],
      'Spa Packages': ['Massage + Facial + Scrub'],
      'Hair & Skin Combo': ['Haircut + Facial'],
      'Seasonal Offers': ['Winter Skin Care', 'Summer Hair Care']
    }
  };

  const categories = Object.keys(serviceStructure);

  // Update available service names when category changes
  useEffect(() => {
    if (formData.category && serviceStructure[formData.category]) {
      const serviceNames = Object.keys(serviceStructure[formData.category]);
      setAvailableServiceNames(serviceNames);
      // Reset service name and type when category changes
      if (!isEditMode) {
        setFormData(prev => ({ ...prev, serviceName: '', serviceType: '' }));
      }
    } else {
      setAvailableServiceNames([]);
      if (!isEditMode) {
        setFormData(prev => ({ ...prev, serviceName: '', serviceType: '' }));
      }
    }
    setAvailableServiceTypes([]);
  }, [formData.category, isEditMode]);

  // Update available service types when service name changes
  useEffect(() => {
    if (formData.category && formData.serviceName && serviceStructure[formData.category] && serviceStructure[formData.category][formData.serviceName]) {
      const serviceTypes = serviceStructure[formData.category][formData.serviceName];
      setAvailableServiceTypes(serviceTypes);
      // Reset service type when service name changes
      if (!isEditMode) {
        setFormData(prev => ({ ...prev, serviceType: '' }));
      }
    } else {
      setAvailableServiceTypes([]);
      if (!isEditMode) {
        setFormData(prev => ({ ...prev, serviceType: '' }));
      }
    }
  }, [formData.category, formData.serviceName, isEditMode]);


  // Initialize form data when editing or creating new service
  useEffect(() => {
    if (serviceToEdit) {
      // Parse existing service name to extract service name and type
      const serviceName = serviceToEdit.name || '';
      let extractedServiceName = '';
      let extractedServiceType = '';
      
      // Try to match the service name with our predefined structure
      if (serviceToEdit.category && serviceStructure[serviceToEdit.category]) {
        const categoryServices = serviceStructure[serviceToEdit.category];
        for (const [name, types] of Object.entries(categoryServices)) {
          if (serviceName.includes(name)) {
            extractedServiceName = name;
            // Try to extract the type from the service name
            const remainingName = serviceName.replace(name, '').trim();
            if (remainingName.startsWith('-')) {
              extractedServiceType = remainingName.substring(1).trim();
            }
            break;
          }
        }
      }
      
      setFormData({
        category: serviceToEdit.category || '',
        serviceName: extractedServiceName,
        serviceType: extractedServiceType,
        description: serviceToEdit.description || '',
        duration: serviceToEdit.duration || '',
        price: serviceToEdit.price || '',
      });
    } else {
      setFormData({
        category: '',
        serviceName: '',
        serviceType: '',
        description: '',
        duration: '',
        price: '',
      });
    }
  }, [serviceToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.category || !formData.serviceName || !formData.duration || !formData.price) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create the service name by combining service name and type
      let fullServiceName = formData.serviceName;
      if (formData.serviceType) {
        fullServiceName += ` - ${formData.serviceType}`;
      }

      const serviceData = {
        category: formData.category,
        name: fullServiceName,
        serviceName: formData.serviceName,
        serviceType: formData.serviceType,
        description: formData.description,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        isActive: true
      };

      // For demo purposes, we'll just call the callback functions
      // In a real implementation, you would call your API here
      toast.success(`Service ${isEditMode ? 'updated' : 'added'} successfully!`);
      
      if (isEditMode) {
        onServiceUpdated();
      } else {
        onServiceAdded();
      }
      
      onClose();
      
    } catch (error) {
      toast.error('An error occurred while saving the service');
      console.error('Error saving service:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Dropdown */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Service Name Dropdown */}
          <div>
            <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-2">
              Service Name <span className="text-red-500">*</span>
            </label>
            <select
              name="serviceName"
              id="serviceName"
              value={formData.serviceName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={!formData.category}
              required
            >
              <option value="">Select a service name</option>
              {availableServiceNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {!formData.category && (
              <p className="mt-1 text-xs text-gray-500">Please select a category first</p>
            )}
          </div>

          {/* Service Type Dropdown */}
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              name="serviceType"
              id="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={!formData.serviceName}
            >
              <option value="">Select a service type (optional)</option>
              {availableServiceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {!formData.serviceName && (
              <p className="mt-1 text-xs text-gray-500">Please select a service name first</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Brief description of the service..."
            ></textarea>
          </div>

          {/* Duration and Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="duration"
                id="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="e.g., 60"
                min="1"
                required
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="e.g., 1500"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isEditMode ? 'Updating...' : 'Adding...'}</span>
                </div>
              ) : (
                isEditMode ? 'Update Service' : 'Add Service'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceModal;
