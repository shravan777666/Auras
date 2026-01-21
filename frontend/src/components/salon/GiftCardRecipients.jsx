import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { RefreshCw, Search, Filter, Calendar, CreditCard, User, Mail, Eye, Download, AlertCircle } from 'lucide-react';
import giftCardService from '../../services/giftCardService';
import LoadingSpinner from '../common/LoadingSpinner';

const GiftCardRecipients = ({ salonId }) => {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [stats, setStats] = useState({
    totalGiftCards: 0,
    activeGiftCards: 0,
    redeemedGiftCards: 0,
    expiredGiftCards: 0,
    totalAmount: 0,
    remainingBalance: 0
  });
  const [expandedCard, setExpandedCard] = useState(null);

  // Fetch gift card recipients
  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const response = await giftCardService.getRecipients();
      if (response.success) {
        setRecipients(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch gift card recipients');
      }
    } catch (error) {
      console.error('Error fetching gift card recipients:', error);
      toast.error('Failed to fetch gift card recipients');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await giftCardService.getRecipientsStats();
      if (response.success) {
        setStats(response.data);
      } else {
        console.error('Failed to fetch stats:', response.message);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchRecipients();
    fetchStats();
  }, []);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply filters to recipients
  const filteredRecipients = recipients.filter(recipient => {
    // Status filter
    if (filter.status && recipient.status !== filter.status) {
      return false;
    }

    // Search filter (search in sender name, receiver email, or gift card name)
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch = 
        (recipient.sender?.name?.toLowerCase().includes(searchLower)) ||
        (recipient.receiver?.email?.toLowerCase().includes(searchLower)) ||
        (recipient.name.toLowerCase().includes(searchLower)) ||
        recipient.code.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) {
        return false;
      }
    }

    // Date range filter
    if (filter.startDate || filter.endDate) {
      const cardDate = new Date(recipient.createdAt);
      if (filter.startDate && cardDate < new Date(filter.startDate)) {
        return false;
      }
      if (filter.endDate && cardDate > new Date(filter.endDate)) {
        return false;
      }
    }

    return true;
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status, isRedeemed) => {
    if (isRedeemed) return 'bg-green-100 text-green-800';
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'REDEEMED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && recipients.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Gift Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGiftCards}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeGiftCards}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Redeemed Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.redeemedGiftCards}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Gift Card Recipients</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={fetchRecipients}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
              <option value="REDEEMED">Redeemed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or code..."
                value={filter.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 mb-4">
          Showing {filteredRecipients.length} of {recipients.length} gift card recipients
        </div>

        {/* Recipients Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gift Card</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecipients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <CreditCard className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium mb-1">No gift card recipients found</p>
                      <p className="text-sm">Try adjusting your filters or create new gift cards</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecipients.map((recipient) => (
                  <React.Fragment key={recipient.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                            <CreditCard className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{recipient.name}</div>
                            <div className="text-xs text-gray-500">{recipient.code}</div>
                            {recipient.occasionType && (
                              <div className="text-xs text-blue-600 mt-1">
                                {recipient.occasionType}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-1.5 bg-green-100 rounded-full mr-2">
                            <User className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {recipient.sender?.name || 'Anonymous'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {recipient.sender?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-1.5 bg-blue-100 rounded-full mr-2">
                            <Mail className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {recipient.receiver?.name || 'Guest'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {recipient.receiver?.email || recipient.receiver?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(recipient.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Balance: {formatCurrency(recipient.balance)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(recipient.status, recipient.isRedeemed)}`}>
                          {recipient.isRedeemed ? 'Redeemed' : recipient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(recipient.createdAt)}
                        </div>
                        {recipient.expiryDate && (
                          <div className="text-xs text-gray-500">
                            Exp: {new Date(recipient.expiryDate).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedCard(expandedCard === recipient.id ? null : recipient.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="h-4 w-4" />
                          {expandedCard === recipient.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {expandedCard === recipient.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="7" className="px-6 py-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Gift Card Details</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p><strong>Code:</strong> {recipient.code}</p>
                                  <p><strong>Name:</strong> {recipient.name}</p>
                                  <p><strong>Amount:</strong> {formatCurrency(recipient.amount)}</p>
                                  <p><strong>Balance:</strong> {formatCurrency(recipient.balance)}</p>
                                  <p><strong>Status:</strong> {recipient.status}</p>
                                  <p><strong>Redeemed:</strong> {recipient.isRedeemed ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Info</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p><strong>Created:</strong> {formatDate(recipient.createdAt)}</p>
                                  {recipient.expiryDate && (
                                    <p><strong>Expiry:</strong> {new Date(recipient.expiryDate).toLocaleDateString('en-IN')}</p>
                                  )}
                                  {recipient.occasionType && (
                                    <p><strong>Occasion:</strong> {recipient.occasionType}</p>
                                  )}
                                  {recipient.personalMessage && (
                                    <p><strong>Message:</strong> {recipient.personalMessage}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GiftCardRecipients;