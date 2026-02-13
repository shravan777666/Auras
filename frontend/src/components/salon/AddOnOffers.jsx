import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Calendar, DollarSign, Percent, Tag, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import addOnOfferService from '../../services/addOnOffer';

const AddOnOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    serviceName: '',
    basePrice: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    isActive: true,
    description: '',
    termsAndConditions: ''
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await addOnOfferService.getOffers();
      if (response.success) {
        setOffers(response.data);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateDiscountedPrice = () => {
    const { basePrice, discountType, discountValue } = formData;
    if (!basePrice || !discountValue) return 0;

    const base = parseFloat(basePrice);
    const discount = parseFloat(discountValue);

    if (discountType === 'percentage') {
      return (base - (base * discount / 100)).toFixed(2);
    } else {
      return (base - discount).toFixed(2);
    }
  };

  const resetForm = () => {
    setFormData({
      serviceName: '',
      basePrice: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      isActive: true,
      description: '',
      termsAndConditions: ''
    });
    setEditingOffer(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate dates
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end <= start) {
        toast.error('End date must be after start date');
        return;
      }

      // Validate discount
      if (formData.discountType === 'percentage') {
        const discount = parseFloat(formData.discountValue);
        if (discount < 0 || discount > 100) {
          toast.error('Percentage discount must be between 0 and 100');
          return;
        }
      } else {
        const discount = parseFloat(formData.discountValue);
        const base = parseFloat(formData.basePrice);
        if (discount > base) {
          toast.error('Fixed discount cannot exceed base price');
          return;
        }
      }

      const offerData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        discountValue: parseFloat(formData.discountValue)
      };

      let response;
      if (editingOffer) {
        response = await addOnOfferService.updateOffer(editingOffer._id, offerData);
        toast.success('Offer updated successfully');
      } else {
        response = await addOnOfferService.createOffer(offerData);
        toast.success('Offer created successfully');
      }

      if (response.success) {
        fetchOffers();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error(error.response?.data?.message || 'Failed to save offer');
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      serviceName: offer.serviceName,
      basePrice: offer.basePrice.toString(),
      discountType: offer.discountType,
      discountValue: offer.discountValue.toString(),
      startDate: new Date(offer.startDate).toISOString().split('T')[0],
      endDate: new Date(offer.endDate).toISOString().split('T')[0],
      isActive: offer.isActive,
      description: offer.description || '',
      termsAndConditions: offer.termsAndConditions || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) {
      return;
    }

    try {
      await addOnOfferService.deleteOffer(offerId);
      toast.success('Offer deleted successfully');
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    }
  };

  const handleToggleStatus = async (offerId) => {
    try {
      const response = await addOnOfferService.toggleOfferStatus(offerId);
      toast.success(response.message);
      fetchOffers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle offer status');
    }
  };

  const isOfferValid = (offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);
    return offer.isActive && start <= now && end >= now;
  };

  const getOfferStatus = (offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    if (!offer.isActive) {
      return { text: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    }
    if (start > now) {
      return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    }
    if (end < now) {
      return { text: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    return { text: 'Active', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add-on Offers</h2>
          <p className="text-gray-600 mt-1">Create and manage promotional offers for your services</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Offer
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingOffer ? 'Edit Offer' : 'Create New Offer'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Premium Hair Spa"
                />
              </div>

              {/* Base Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="1000"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value *
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={formData.discountType === 'percentage' ? '20' : '200'}
                />
              </div>

              {/* Discounted Price (calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discounted Price (₹)
                </label>
                <input
                  type="text"
                  value={calculateDiscountedPrice()}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Brief description of the offer..."
                />
              </div>

              {/* Terms and Conditions */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms and Conditions
                </label>
                <textarea
                  name="termsAndConditions"
                  value={formData.termsAndConditions}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Any terms and conditions..."
                />
              </div>

              {/* Active Toggle */}
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active (offer is visible to customers)</span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {editingOffer ? 'Update Offer' : 'Create Offer'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Offers List */}
      <div className="grid grid-cols-1 gap-6">
        {offers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No offers yet</h3>
            <p className="text-gray-600">Create your first add-on offer to attract more customers</p>
          </div>
        ) : (
          offers.map((offer) => {
            const status = getOfferStatus(offer);
            return (
              <div key={offer._id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{offer.serviceName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Base Price</p>
                          <p className="font-semibold text-gray-900">₹{offer.basePrice}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Percent className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Discount</p>
                          <p className="font-semibold text-gray-900">
                            {offer.discountType === 'percentage' 
                              ? `${offer.discountValue}%` 
                              : `₹${offer.discountValue}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Tag className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Final Price</p>
                          <p className="font-semibold text-green-600">₹{offer.discountedPrice}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(offer.startDate).toLocaleDateString()}</span>
                      </div>
                      <span>→</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(offer.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {offer.description && (
                      <p className="mt-3 text-sm text-gray-600">{offer.description}</p>
                    )}

                    {offer.termsAndConditions && (
                      <div className="mt-2 flex items-start gap-2 text-sm text-gray-500">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>{offer.termsAndConditions}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleStatus(offer._id)}
                      className={`p-2 rounded-lg transition ${
                        offer.isActive
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={offer.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(offer)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                      title="Edit"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer._id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AddOnOffers;
