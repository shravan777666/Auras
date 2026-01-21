import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Plus, Trash2, Package, Calendar, Tag, Percent, Clock, IndianRupee } from 'lucide-react';
import { salonService } from '../../services/salon';
import packageService from '../../services/packageService';

const AddPackageModal = ({ isOpen, onClose, onPackageAdded, onPackageUpdated, packageToEdit, salonId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Custom',
    occasionType: '',
    services: [],
    discountPercentage: 0,
    discountedPrice: '',
    isFeatured: false,
    targetAudience: 'All',
    seasonal: false,
    season: 'All Year',
    tags: []
  });
  
  const [loading, setLoading] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const isEditMode = Boolean(packageToEdit);

  // Occasion types for dropdown
  const occasionTypes = [
    'Wedding',
    'Birthday',
    'Corporate Event',
    'Anniversary',
    'Festival',
    'Graduation',
    'Baby Shower',
    'Other'
  ];

  // Categories for dropdown
  const categories = [
    'Wedding',
    'Birthday',
    'Corporate',
    'Anniversary',
    'Festival',
    'Custom'
  ];

  // Target audiences
  const targetAudiences = [
    'Bride',
    'Groom',
    'Women',
    'Men',
    'Couples',
    'Groups',
    'All'
  ];

  // Seasons
  const seasons = [
    'Spring',
    'Summer',
    'Autumn',
    'Winter',
    'All Year'
  ];

  // Fetch available services for the salon
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await salonService.getServices({ limit: 100 });
        const servicesData = response?.data?.data ?? [];
        setAvailableServices(servicesData);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Failed to load services');
      }
    };

    if (isOpen && salonId) {
      fetchServices();
    }
  }, [isOpen, salonId]);

  // Initialize form data when editing
  useEffect(() => {
    if (packageToEdit) {
      setFormData({
        name: packageToEdit.name || '',
        description: packageToEdit.description || '',
        category: packageToEdit.category || 'Custom',
        occasionType: packageToEdit.occasionType || '',
        services: packageToEdit.services || [],
        discountPercentage: packageToEdit.discountPercentage || 0,
        discountedPrice: packageToEdit.discountedPrice || '',
        isFeatured: packageToEdit.isFeatured || false,
        targetAudience: packageToEdit.targetAudience || 'All',
        seasonal: packageToEdit.seasonal || false,
        season: packageToEdit.season || 'All Year',
        tags: packageToEdit.tags || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'Custom',
        occasionType: '',
        services: [],
        discountPercentage: 0,
        discountedPrice: '',
        isFeatured: false,
        targetAudience: 'All',
        seasonal: false,
        season: 'All Year',
        tags: []
      });
    }
  }, [packageToEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...formData.services];
    const service = updatedServices[index];
    
    if (field === 'quantity') {
      service.quantity = parseInt(value) || 1;
    } else if (field === 'price') {
      service.price = value === '' ? 0 : parseFloat(value);
    } else {
      service[field] = value;
    }
    
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, {
        serviceId: '',
        serviceName: '',
        quantity: 1,
        price: 0,
        isSelected: true
      }]
    }));
  };

  const removeService = (index) => {
    const updatedServices = formData.services.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  const handleServiceSelect = (index, serviceId) => {
    const service = availableServices.find(s => s._id === serviceId);
    if (service) {
      handleServiceChange(index, 'serviceId', serviceId);
      handleServiceChange(index, 'serviceName', service.name);
      // Auto-fill price from service, but don't override if already set
      if (!formData.services[index].price || formData.services[index].price === 0) {
        handleServiceChange(index, 'price', service.price || 0);
      }
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const calculateTotals = () => {
    let totalDuration = 0;
    let totalPrice = 0;

    formData.services.forEach(pkgService => {
      const service = availableServices.find(s => s._id === pkgService.serviceId);
      if (service) {
        const quantity = pkgService.quantity || 1;
        totalDuration += (service.duration || 0) * quantity;
        
        // Use the package-specific price
        const servicePrice = pkgService.price || 0;
        totalPrice += servicePrice * quantity;
      }
    });

    return { totalDuration, totalPrice };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.occasionType || formData.services.length === 0) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate that all services have been selected
      const invalidServices = formData.services.filter(s => !s.serviceId);
      if (invalidServices.length > 0) {
        toast.error('Please select a service for all package items');
        setLoading(false);
        return;
      }

      const { totalPrice } = calculateTotals();
      
      // Prepare package data with service information
      const packageData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        occasionType: formData.occasionType,
        services: formData.services,
        totalPrice: totalPrice,
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : undefined,
        isFeatured: formData.isFeatured,
        targetAudience: formData.targetAudience,
        seasonal: formData.seasonal,
        season: formData.season,
        tags: formData.tags,
        isActive: true
      };

      if (isEditMode && packageToEdit) {
        // Update existing package
        await packageService.updatePackage(packageToEdit._id, packageData);
        toast.success('Package updated successfully!');
        onPackageUpdated();
      } else {
        // Create new package
        await packageService.createPackage(salonId, packageData);
        toast.success('Package created successfully!');
        onPackageAdded();
      }

      onClose();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error(error.response?.data?.message || 'Failed to save package');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const { totalDuration, totalPrice } = calculateTotals();
  const finalPrice = formData.discountPercentage > 0 
    ? totalPrice - (totalPrice * formData.discountPercentage / 100)
    : (formData.discountedPrice ? parseFloat(formData.discountedPrice) : totalPrice);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Package' : 'Create New Package'}
              </h2>
              <p className="text-gray-600">
                {isEditMode ? 'Update your occasion-based package' : 'Create a new occasion-based package'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-[calc(90vh-180px)]">
          {/* Left Column - Main Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Bridal Glam Package"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Occasion Type *
                    </label>
                    <select
                      name="occasionType"
                      value={formData.occasionType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select occasion type</option>
                      {occasionTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience
                    </label>
                    <select
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {targetAudiences.map(audience => (
                        <option key={audience} value={audience}>{audience}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe what this package includes and who it's perfect for..."
                    required
                  />
                </div>
              </div>

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Included Services *</h3>
                  <button
                    type="button"
                    onClick={addService}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </button>
                </div>
                
                {formData.services.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No services added yet</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Add Service" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.services.map((pkgService, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Service</label>
                            <select
                              value={pkgService.serviceId}
                              onChange={(e) => handleServiceSelect(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                              required
                            >
                              <option value="">Select service</option>
                              {availableServices.map(service => (
                                <option key={service._id} value={service._id}>
                                  {service.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={pkgService.quantity}
                              onChange={(e) => handleServiceChange(index, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={pkgService.price || ''}
                              onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                              required
                            />
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Pricing and Options */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 p-6 bg-gray-50 overflow-y-auto">
            <div className="space-y-6 min-h-full pb-6">
              {/* Pricing Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <IndianRupee className="h-5 w-5 mr-2 text-purple-600" />
                  Pricing Summary
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Services:</span>
                    <span className="font-medium">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {totalDuration >= 60 
                        ? `${Math.floor(totalDuration/60)}h ${totalDuration%60}m`
                        : `${totalDuration}m`
                      }
                    </span>
                  </div>
                  
                  {formData.discountPercentage > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Discount ({formData.discountPercentage}%):</span>
                      <span>-₹{(totalPrice * formData.discountPercentage / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Final Price:</span>
                      <span className="font-bold text-lg text-purple-600">₹{finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Options */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Percent className="h-5 w-5 mr-2 text-purple-600" />
                  Discount Options
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      name="discountPercentage"
                      value={formData.discountPercentage}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or Fixed Discounted Price
                    </label>
                    <input
                      type="number"
                      name="discountedPrice"
                      value={formData.discountedPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter fixed price"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-purple-600" />
                  Additional Options
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Package</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="seasonal"
                      checked={formData.seasonal}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Seasonal Package</span>
                  </label>
                  
                  {formData.seasonal && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Season
                      </label>
                      <select
                        name="season"
                        value={formData.season}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      >
                        {seasons.map(season => (
                          <option key={season} value={season}>{season}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Package' : 'Create Package'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPackageModal;