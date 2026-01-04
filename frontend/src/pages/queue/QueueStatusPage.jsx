import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { queueService } from '../../services/queue';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Users, Clock, CheckCircle, UserCheck, AlertCircle } from 'lucide-react';

const QueueStatusPage = () => {
  const { tokenNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [queueInfo, setQueueInfo] = useState(null);
  const [currentService, setCurrentService] = useState(null);
  const [upcomingTokens, setUpcomingTokens] = useState([]);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0);

  // Fetch queue status by token number
  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      const response = await queueService.getQueueStatusForCustomer(tokenNumber);
      if (response.success) {
        const data = response.data;
        setQueueInfo(data);
        
        // Calculate estimated wait time based on position
        const waitTime = data.queuePosition * 15; // Assuming 15 mins per customer
        setEstimatedWaitTime(waitTime);
        
        // Get salon queue status for context
        const salonStatus = await queueService.getSalonQueueStatus(data.salonId._id);
        if (salonStatus.success) {
          setCurrentService(salonStatus.data.currentService);
          setUpcomingTokens(salonStatus.data.upcomingTokens);
          setTotalWaiting(salonStatus.data.totalWaiting);
        }
      } else {
        toast.error(response.message || 'Failed to fetch queue status');
      }
    } catch (error) {
      console.error('Error fetching queue status:', error);
      toast.error('Failed to fetch queue status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchQueueStatus, 30000);
    return () => clearInterval(interval);
  }, [tokenNumber]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!queueInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Token Not Found</h1>
            <p className="text-gray-600">The queue token you entered is invalid or has expired.</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-service':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting':
        return 'Waiting';
      case 'in-service':
        return 'In Service';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Main Token Status Card */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">Your Queue Status</h1>
            <p className="text-blue-100">Token: {queueInfo.tokenNumber}</p>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-4">
                <p className="text-white text-sm mb-2">Your Token Number</p>
                <p className="text-5xl font-bold text-white">{queueInfo.tokenNumber}</p>
              </div>
              
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="text-2xl font-bold text-gray-900">{queueInfo.queuePosition}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Wait Time</p>
                  <p className="text-2xl font-bold text-gray-900">{estimatedWaitTime} min</p>
                </div>
              </div>
              
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(queueInfo.status)}`}>
                {getStatusText(queueInfo.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Salon</p>
                <p className="font-medium">{queueInfo.salonId?.salonName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-medium">{queueInfo.serviceId?.name || 'General Service'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Service */}
        {currentService && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Current Service</h2>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-900">{currentService.tokenNumber}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Customer: {currentService.customerId?.name || 'N/A'}
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  In Service
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Tokens */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Tokens</h2>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {totalWaiting} waiting
            </span>
          </div>
          
          {upcomingTokens.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No customers in queue ahead of you</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTokens.map((token, index) => (
                <div key={token._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-sm font-bold">
                      {token.queuePosition}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{token.tokenNumber}</p>
                      <p className="text-sm text-gray-600">
                        Customer: {token.customerId?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">#{token.queuePosition}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Guide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-sm font-medium">Waiting</p>
              <p className="text-xs text-gray-500">In queue</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <UserCheck className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium">In Service</p>
              <p className="text-xs text-gray-500">Being served</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium">Completed</p>
              <p className="text-xs text-gray-500">Service finished</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm font-medium">Cancelled</p>
              <p className="text-xs text-gray-500">Removed from queue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueStatusPage;