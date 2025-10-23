import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CancellationPolicyManager from '../../components/salon/CancellationPolicyManager';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { salonService } from '../../services/salon';

const CancellationDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCancellations: 0,
    lateCancellations: 0,
    noShows: 0,
    totalFees: 0,
    avgFee: 0,
    totalRefunds: 0,
    refundCount: 0
  });
  const [recentCancellations, setRecentCancellations] = useState([]);
  const [refundEligibleCancellations, setRefundEligibleCancellations] = useState([]);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    fetchCancellationData();
    fetchRefundEligibleCancellations();
  }, []);

  const fetchCancellationData = async () => {
    try {
      setLoading(true);
      // Fetch actual data from the backend
      const response = await salonService.getCancellationStats();
      if (response.success) {
        setStats(response.data.stats);
        setRecentCancellations(response.data.recentCancellations || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cancellation data:', error);
      setLoading(false);
    }
  };

  const fetchRefundEligibleCancellations = async () => {
    try {
      const response = await salonService.getRefundEligibleCancellations();
      if (response.success) {
        setRefundEligibleCancellations(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching refund eligible cancellations:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getCancellationTypeColor = (type) => {
    switch (type) {
      case 'Late':
        return 'bg-yellow-100 text-yellow-800';
      case 'No-Show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRefundStatusColor = (status) => {
    switch (status) {
      case 'Processed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Eligible':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProcessRefund = (cancellation) => {
    setSelectedRefund(cancellation);
    setShowRefundModal(true);
  };

  const confirmRefund = async () => {
    if (!selectedRefund) return;
    
    setProcessingRefund(true);
    try {
      const response = await salonService.processRefund(selectedRefund._id);
      if (response.success) {
        // Update the UI to reflect the processed refund
        setRefundEligibleCancellations(prev => 
          prev.map(c => 
            c._id === selectedRefund._id 
              ? { ...c, refundStatus: 'Processed', refundProcessedAt: new Date() } 
              : c
          )
        );
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalRefunds: prev.totalRefunds + (selectedRefund.refundAmount || selectedRefund.fee),
          refundCount: prev.refundCount + 1
        }));
        
        // Close the modal and reset state
        setShowRefundModal(false);
        setSelectedRefund(null);
        
        // Show success message
        alert('Refund processed successfully!');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund. Please try again.');
    } finally {
      setProcessingRefund(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading cancellation dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                to="/salon/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Cancellation Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{user?.salonName || user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cancellations</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCancellations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Late Cancellations</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.lateCancellations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">No-Shows</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.noShows}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Fees</p>
                <p className="text-2xl font-semibold text-gray-900">₹{stats.totalFees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Fee</p>
                <p className="text-2xl font-semibold text-gray-900">₹{stats.avgFee}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Refunds Processed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.refundCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-teal-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Refunds</p>
                <p className="text-2xl font-semibold text-gray-900">₹{stats.totalRefunds}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cancellation Policy Manager */}
          <div className="lg:col-span-1">
            <CancellationPolicyManager salonId={user?.salonId} />
          </div>

          {/* Recent Cancellations and Refund Management */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Cancellations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Cancellations</h2>
              
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentCancellations.map((cancellation) => (
                      <tr key={cancellation._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cancellation.customerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(cancellation.appointmentDate)}</div>
                          <div className="text-sm text-gray-500">{cancellation.appointmentTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCancellationTypeColor(cancellation.cancellationType)}`}>
                            {cancellation.cancellationType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{cancellation.fee}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {cancellation.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {recentCancellations.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent cancellations</h3>
                  <p className="text-gray-500">There are no cancellations to display at this time.</p>
                </div>
              )}
            </div>

            {/* Refund Management Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Refund Management</h2>
                <button 
                  onClick={fetchRefundEligibleCancellations}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </button>
              </div>
              
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {refundEligibleCancellations.map((cancellation) => (
                      <tr key={cancellation._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cancellation.customerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(cancellation.appointmentDate)}</div>
                          <div className="text-sm text-gray-500">{cancellation.appointmentTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCancellationTypeColor(cancellation.cancellationType)}`}>
                            {cancellation.cancellationType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cancellation.paymentMethod || 'Online'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{cancellation.refundAmount || cancellation.fee}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRefundStatusColor(cancellation.refundStatus || 'Eligible')}`}>
                            {cancellation.refundStatus || 'Eligible'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {cancellation.refundStatus !== 'Processed' ? (
                            <button
                              onClick={() => handleProcessRefund(cancellation)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Process Refund
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-800">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Processed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {refundEligibleCancellations.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No refund eligible cancellations</h3>
                  <p className="text-gray-500">There are no cancellations eligible for refund at this time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Refund Confirmation Modal */}
      {showRefundModal && selectedRefund && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Confirm Refund
              </h3>
              <div className="mt-4 px-4 py-3 bg-gray-50 rounded-lg text-left">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Customer:</div>
                  <div className="font-medium">{selectedRefund.customerName}</div>
                  
                  <div className="text-gray-500">Appointment Date:</div>
                  <div className="font-medium">{formatDate(selectedRefund.appointmentDate)}</div>
                  
                  <div className="text-gray-500">Cancellation Type:</div>
                  <div className="font-medium">{selectedRefund.cancellationType}</div>
                  
                  <div className="text-gray-500">Payment Method:</div>
                  <div className="font-medium">{selectedRefund.paymentMethod || 'Online'}</div>
                  
                  <div className="text-gray-500">Refund Amount:</div>
                  <div className="font-medium text-green-600">₹{selectedRefund.refundAmount || selectedRefund.fee}</div>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to process this refund? This action cannot be undone.
                </p>
                <button
                  disabled={processingRefund}
                  onClick={confirmRefund}
                  className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {processingRefund ? 'Processing...' : 'Confirm Refund'}
                </button>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="mt-3 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={processingRefund}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancellationDashboard;