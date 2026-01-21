import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Tag, CreditCard, Search, Edit, Trash2, Eye, Clock, DollarSign, Info, Copy, Users, FileText, Hash } from 'lucide-react';
import giftCardService from '../../services/giftCardService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const GiftCards = () => {
  const navigate = useNavigate();
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingGiftCard, setEditingGiftCard] = useState(null);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  // Form state for creating/updating gift cards
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    expiryDate: '',
    usageType: 'BOTH',
    description: '',
    termsAndConditions: '',
    code: '' // Optional - will auto-generate if empty
  });

  // State for validation errors
  const [errors, setErrors] = useState({});

  // Bulk creation form state
  const [bulkFormData, setBulkFormData] = useState({
    count: 1,
    amount: '',
    expiryDate: '',
    usageType: 'BOTH',
    namePrefix: 'Gift Card'
  });

  // Fetch gift cards
  const fetchGiftCards = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: filterStatus,
        search: searchTerm
      };

      const response = await giftCardService.getGiftCards(params);
      if (response.success) {
        setGiftCards(response.data.giftCards);
        setTotalPages(response.data.pagination.totalPages);
        setCurrentPage(response.data.pagination.currentPage);
        setTotalItems(response.data.pagination.totalItems);
      } else {
        toast.error(response.message || 'Failed to fetch gift cards');
      }
    } catch (error) {
      console.error('Error fetching gift cards:', error);
      toast.error('Failed to fetch gift cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCards(currentPage);
  }, [filterStatus, searchTerm, currentPage]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle bulk form input changes
  const handleBulkInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setBulkFormData(prev => ({
      ...prev,
      [name]: name === 'count' ? parseInt(value) || 1 : value
    }));
  };

  // Client-side validation function
  const validateForm = () => {
    const newErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must not exceed 100 characters';
    }
    
    // Validate amount
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    // Validate expiry date
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const selectedDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.expiryDate = 'Expiry date must be today or in the future';
      }
    }
    
    // Validate usage type
    if (!formData.usageType) {
      newErrors.usageType = 'Usage type is required';
    }
    
    // Validate code format if provided
    if (formData.code && formData.code.trim() !== '') {
      if (formData.code.length < 6 || formData.code.length > 20) {
        newErrors.code = 'Code must be between 6 and 20 characters';
      } else if (!/^[A-Z0-9-]+$/.test(formData.code.toUpperCase())) {
        newErrors.code = 'Code can only contain uppercase letters, numbers, and hyphens';
      }
    }
    
    // Validate description length
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }
    
    // Validate terms and conditions length
    if (formData.termsAndConditions && formData.termsAndConditions.length > 2000) {
      newErrors.termsAndConditions = 'Terms and conditions must not exceed 2000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission for creating gift card
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Perform client-side validation
    if (!validateForm()) {
      return;
    }
    
    try {
      // Prepare payload with proper data formatting
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        expiryDate: new Date(formData.expiryDate).toISOString(), // Convert to ISO format
        code: formData.code.trim() || undefined // Use undefined to let backend auto-generate if empty
      };
      
      // Remove empty code field (let backend generate it)
      if (!payload.code || payload.code.trim() === '') {
        delete payload.code;
      }
      
      // Auto-uppercase the code if provided
      if (payload.code) {
        payload.code = payload.code.toUpperCase();
      }

      if (editingGiftCard) {
        // Update existing gift card
        const response = await giftCardService.updateGiftCard(editingGiftCard._id, payload);
        if (response.success) {
          toast.success('Gift card updated successfully');
          closeModal();
          fetchGiftCards(currentPage);
        } else {
          toast.error(response.message || 'Failed to update gift card');
        }
      } else {
        // Create new gift card
        const response = await giftCardService.createGiftCard(payload);
        if (response.success) {
          toast.success('Gift card created successfully');
          closeModal();
          fetchGiftCards(currentPage);
        } else {
          toast.error(response.message || 'Failed to create gift card');
        }
      }
    } catch (error) {
      console.error('Error saving gift card:', error);
      
      // Handle validation errors from backend
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          // Map backend field names to form field names
          const fieldName = err.param;
          backendErrors[fieldName] = err.msg;
        });
        setErrors(backendErrors);
        toast.error('Please fix the validation errors above');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save gift card');
      }
    }
  };

  // Client-side validation function for bulk creation
  const validateBulkForm = () => {
    const newErrors = {};
    
    // Validate count
    const count = parseInt(bulkFormData.count);
    if (!bulkFormData.count || isNaN(count) || count < 1 || count > 50) {
      newErrors.count = 'Count must be between 1 and 50';
    }
    
    // Validate amount
    const amount = parseFloat(bulkFormData.amount);
    if (!bulkFormData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    // Validate expiry date
    if (!bulkFormData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const selectedDate = new Date(bulkFormData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.expiryDate = 'Expiry date must be today or in the future';
      }
    }
    
    // Validate usage type
    if (!bulkFormData.usageType) {
      newErrors.usageType = 'Usage type is required';
    }
    
    // Validate name prefix length
    if (bulkFormData.namePrefix && bulkFormData.namePrefix.length > 50) {
      newErrors.namePrefix = 'Name prefix must not exceed 50 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle bulk creation
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    
    // Perform client-side validation
    if (!validateBulkForm()) {
      return;
    }
    
    try {
      setIsBulkCreating(true);
      const payload = {
        ...bulkFormData,
        amount: parseFloat(bulkFormData.amount),
        expiryDate: new Date(bulkFormData.expiryDate).toISOString(), // Convert to ISO format
        count: parseInt(bulkFormData.count) // Ensure count is an integer
      };

      const response = await giftCardService.bulkCreateGiftCards(payload);
      if (response.success) {
        toast.success(`Successfully created ${response.data.totalCreated} gift cards`);
        if (response.data.failed && response.data.failed.length > 0) {
          toast.warning(`Failed to create ${response.data.totalFailed} gift cards`);
        }
        setShowBulkModal(false);
        setBulkFormData({
          count: 1,
          amount: '',
          expiryDate: '',
          usageType: 'BOTH',
          namePrefix: 'Gift Card'
        });
        fetchGiftCards(currentPage);
      } else {
        toast.error(response.message || 'Failed to create gift cards');
      }
    } catch (error) {
      console.error('Error in bulk creation:', error);
      
      // Handle validation errors from backend
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          // Map backend field names to form field names
          const fieldName = err.param;
          backendErrors[fieldName] = err.msg;
        });
        setErrors(backendErrors);
        toast.error('Please fix the validation errors above');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create gift cards in bulk');
      }
    } finally {
      setIsBulkCreating(false);
    }
  };

  // Handle edit gift card
  const handleEdit = (giftCard) => {
    setEditingGiftCard(giftCard);
    setFormData({
      name: giftCard.name,
      amount: giftCard.amount.toString(),
      expiryDate: new Date(giftCard.expiryDate).toISOString().split('T')[0],
      usageType: giftCard.usageType,
      description: giftCard.description || '',
      termsAndConditions: giftCard.termsAndConditions || '',
      code: giftCard.code || '',
      balance: giftCard.balance?.toString() || giftCard.amount.toString()
    });
    setShowEditModal(true);
  };

  // Handle delete gift card
  const handleDelete = async (giftCardId) => {
    if (window.confirm('Are you sure you want to deactivate this gift card?')) {
      try {
        const response = await giftCardService.deleteGiftCard(giftCardId);
        if (response.success) {
          toast.success('Gift card deactivated successfully');
          fetchGiftCards(currentPage);
        } else {
          toast.error(response.message || 'Failed to deactivate gift card');
        }
      } catch (error) {
        console.error('Error deactivating gift card:', error);
        toast.error('Failed to deactivate gift card');
      }
    }
  };

  // Copy gift card code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopySuccess(code);
      setTimeout(() => setCopySuccess(''), 2000);
      toast.success('Code copied to clipboard!');
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format amount for display
  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Calculate remaining days until expiry
  const getRemainingDays = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Get status badge class
  const getStatusBadgeClass = (status, expiryDate) => {
    const isExpired = new Date(expiryDate) < new Date();
    
    if (isExpired && status === 'ACTIVE') {
      return 'bg-red-100 text-red-800';
    }
    
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'REDEEMED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get usage type display text
  const getUsageTypeDisplay = (usageType) => {
    const displayMap = {
      'ONE_TIME': 'One Time Use',
      'MULTIPLE_USE': 'Multiple Use',
      'SERVICE_ONLY': 'Services Only',
      'PRODUCT_ONLY': 'Products Only',
      'BOTH': 'Services & Products',
      'SPECIFIC_SERVICES': 'Specific Services',
      'SPECIFIC_PRODUCTS': 'Specific Products'
    };
    return displayMap[usageType] || usageType;
  };

  // Get status display text
  const getStatusDisplay = (status, expiryDate) => {
    const isExpired = new Date(expiryDate) < new Date();
    
    if (isExpired && status === 'ACTIVE') {
      return 'EXPIRED';
    }
    
    return status;
  };

  // Reset form and close modal
  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowBulkModal(false);
    setEditingGiftCard(null);
    setFormData({
      name: '',
      amount: '',
      expiryDate: '',
      usageType: 'BOTH',
      description: '',
      termsAndConditions: '',
      code: ''
    });
    setBulkFormData({
      count: 1,
      amount: '',
      expiryDate: '',
      usageType: 'BOTH',
      namePrefix: 'Gift Card'
    });
    setErrors({}); // Clear all errors
  };

  if (loading && giftCards.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gift Cards</h1>
          <p className="text-gray-600 mt-1">Create and manage digital gift cards for your salon</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Users className="h-5 w-5" />
            Bulk Create
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Gift Card
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Gift Cards</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(giftCards.reduce((sum, card) => 
                  card.status === 'ACTIVE' && getRemainingDays(card.expiryDate) > 0 ? sum + card.balance : sum, 0
                ))}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Cards</p>
              <p className="text-2xl font-bold text-gray-900">
                {giftCards.filter(card => 
                  card.status === 'ACTIVE' && getRemainingDays(card.expiryDate) > 0
                ).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expired/Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {giftCards.filter(card => 
                  card.status !== 'ACTIVE' || getRemainingDays(card.expiryDate) <= 0
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="ALL">All</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
              <option value="REDEEMED">Redeemed</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {giftCards.length} of {totalItems} total
            </div>
          </div>
        </div>
      </div>

      {/* Gift Cards List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : giftCards.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No gift cards found</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first gift card.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Bulk Create
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Gift Card
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {giftCards.map((giftCard) => {
            const remainingDays = getRemainingDays(giftCard.expiryDate);
            const displayStatus = getStatusDisplay(giftCard.status, giftCard.expiryDate);
            
            return (
              <div key={giftCard._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">{giftCard.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(giftCard.status, giftCard.expiryDate)}`}>
                            {displayStatus}
                          </span>
                          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs">
                            <Hash className="h-3 w-3" />
                            <span className="font-mono">{giftCard.code}</span>
                            <button
                              onClick={() => copyToClipboard(giftCard.code)}
                              className="ml-1 hover:text-indigo-900"
                              title="Copy code"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          {remainingDays > 0 && displayStatus === 'ACTIVE' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              Expires in {remainingDays} days
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <div>
                              <span>Value: {formatAmount(giftCard.amount)}</span>
                              <span className="ml-2 text-xs text-gray-500">
                                (Balance: {formatAmount(giftCard.balance)})
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Expires: {formatDate(giftCard.expiryDate)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            <span>{getUsageTypeDisplay(giftCard.usageType)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Created: {formatDate(giftCard.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Redemptions: {giftCard.redemptionCount || 0}</span>
                          </div>
                        </div>
                        
                        {giftCard.description && (
                          <p className="text-gray-700 text-sm mb-2">{giftCard.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created by: {giftCard.createdBy?.name || 'Unknown'}</span>
                          <span>ID: {giftCard._id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(giftCard)}
                      className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit gift card"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(giftCard._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deactivate gift card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => copyToClipboard(giftCard.code)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {giftCard.termsAndConditions && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-xs text-gray-600 italic">{giftCard.termsAndConditions}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Gift Card Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Gift Card</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gift Card Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="e.g., Premium Spa Day"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="e.g., 5000"
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                    )}
                  </div>
                                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Type *
                    </label>
                    <select
                      name="usageType"
                      value={formData.usageType}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.usageType ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="ONE_TIME">One Time Use</option>
                      <option value="MULTIPLE_USE">Multiple Use</option>
                      <option value="SERVICE_ONLY">Services Only</option>
                      <option value="PRODUCT_ONLY">Products Only</option>
                      <option value="BOTH">Both Services & Products</option>
                      <option value="SPECIFIC_SERVICES">Specific Services</option>
                      <option value="SPECIFIC_PRODUCTS">Specific Products</option>
                    </select>
                    {errors.usageType && (
                      <p className="text-red-500 text-xs mt-1">{errors.usageType}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gift Card Code (Optional)
                    <span className="text-xs text-gray-500 ml-1">Leave empty for auto-generation</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g., AURA-1A2B3C (auto-generated if empty)"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.code && (
                    <p className="text-red-500 text-xs mt-1">{errors.code}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Code must be uppercase letters, numbers, and hyphens only
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Describe what this gift card offers..."
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleInputChange}
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.termsAndConditions ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Add terms and conditions for this gift card..."
                  />
                  {errors.termsAndConditions && (
                    <p className="text-red-500 text-xs mt-1">{errors.termsAndConditions}</p>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Create Gift Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gift Card Modal */}
      {showEditModal && editingGiftCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Gift Card</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gift Card Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Type *
                    </label>
                    <select
                      name="usageType"
                      value={formData.usageType}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.usageType ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="ONE_TIME">One Time Use</option>
                      <option value="MULTIPLE_USE">Multiple Use</option>
                      <option value="SERVICE_ONLY">Services Only</option>
                      <option value="PRODUCT_ONLY">Products Only</option>
                      <option value="BOTH">Both Services & Products</option>
                      <option value="SPECIFIC_SERVICES">Specific Services</option>
                      <option value="SPECIFIC_PRODUCTS">Specific Products</option>
                    </select>
                    {errors.usageType && (
                      <p className="text-red-500 text-xs mt-1">{errors.usageType}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gift Card Code
                    </label>
                    <input
                      type="text"
                      value={editingGiftCard.code}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Code cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Balance (₹)
                    </label>
                    <input
                      type="number"
                      name="balance"
                      value={formData.balance}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      max={formData.amount}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status || editingGiftCard.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="REDEEMED">Redeemed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleInputChange}
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.termsAndConditions ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.termsAndConditions && (
                    <p className="text-red-500 text-xs mt-1">{errors.termsAndConditions}</p>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Update Gift Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Bulk Create Gift Cards</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Gift Cards *
                    <span className="text-xs text-gray-500 ml-1">(Max: 50)</span>
                  </label>
                  <input
                    type="number"
                    name="count"
                    value={bulkFormData.count}
                    onChange={handleBulkInputChange}
                    required
                    min="1"
                    max="50"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.count ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.count && (
                    <p className="text-red-500 text-xs mt-1">{errors.count}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount per Card (₹) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={bulkFormData.amount}
                    onChange={handleBulkInputChange}
                    required
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., 1000"
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name Prefix
                  </label>
                  <input
                    type="text"
                    name="namePrefix"
                    value={bulkFormData.namePrefix}
                    onChange={handleBulkInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.namePrefix ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., Gift Card"
                  />
                  {errors.namePrefix && (
                    <p className="text-red-500 text-xs mt-1">{errors.namePrefix}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Cards will be named: "Prefix 1", "Prefix 2", etc.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={bulkFormData.expiryDate}
                      onChange={handleBulkInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Type *
                    </label>
                    <select
                      name="usageType"
                      value={bulkFormData.usageType}
                      onChange={handleBulkInputChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.usageType ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="ONE_TIME">One Time Use</option>
                      <option value="MULTIPLE_USE">Multiple Use</option>
                      <option value="SERVICE_ONLY">Services Only</option>
                      <option value="PRODUCT_ONLY">Products Only</option>
                      <option value="BOTH">Both Services & Products</option>
                    </select>
                    {errors.usageType && (
                      <p className="text-red-500 text-xs mt-1">{errors.usageType}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <h4 className="font-medium text-blue-800 mb-2">Summary</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Creating {bulkFormData.count} gift cards</li>
                    <li>• Amount: ₹{bulkFormData.amount || '0'} each</li>
                    <li>• Total Value: ₹{(bulkFormData.count * (parseFloat(bulkFormData.amount) || 0)).toFixed(2)}</li>
                    <li>• Unique codes will be auto-generated</li>
                  </ul>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBulkCreating}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBulkCreating ? 'Creating...' : 'Bulk Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftCards;