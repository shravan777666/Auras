import React, { useState, useEffect } from 'react';
import { QrCode, Users, Clock, UserCheck, SkipForward, CheckCircle, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { queueService } from '../../services/queue';
import { toast } from 'react-hot-toast';
import QueueQRCode from './QueueQRCode';

const QueueManagement = ({ salonId }) => {
  const [queueData, setQueueData] = useState({
    currentService: null,
    upcomingTokens: [],
    totalWaiting: 0,
    completedTokens: []
  });
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Function to generate QR code URL
  const generateQrCodeUrl = () => {
    // In a real implementation, you would generate the actual QR code URL
    // For now, we'll create a placeholder URL
    if (!salonId) {
      setQrCodeUrl('');
      return;
    }
    const queueUrl = `${window.location.origin}/queue/${salonId}`;
    setQrCodeUrl(queueUrl);
  };

  // Fetch queue status
  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      const response = await queueService.getQueueStatus();
      if (response.success) {
        setQueueData(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch queue status');
        // Set default data to prevent errors
        setQueueData({
          currentService: null,
          upcomingTokens: [],
          totalWaiting: 0,
          completedTokens: []
        });
      }
    } catch (error) {
      console.error('Error fetching queue status:', error);
      toast.error('Failed to fetch queue status');
      // Set default data to prevent errors
      setQueueData({
        currentService: null,
        upcomingTokens: [],
        totalWaiting: 0,
        completedTokens: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle queue actions (next, skip, complete)
  const handleQueueAction = async (tokenNumber, action, staffId = null) => {
    try {
      const response = await queueService.updateQueueStatus(tokenNumber, action, staffId);
      if (response.success) {
        toast.success(`Queue entry ${action}ed successfully`);
        // Refresh the queue status
        fetchQueueStatus();
      } else {
        toast.error(response.message || `Failed to ${action} queue entry`);
      }
    } catch (error) {
      console.error(`Error ${action}ing queue entry:`, error);
      toast.error(`Failed to ${action} queue entry`);
    }
  };

  useEffect(() => {
    if (!salonId) {
      console.warn('QueueManagement: salonId is required but not provided');
      return;
    }
    
    generateQrCodeUrl();
    fetchQueueStatus();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchQueueStatus, 30000);
    
    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [salonId]);

  if (!salonId) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <div className="text-center py-8 text-gray-500">
          <p>Salon information not available. Please ensure you're on a valid salon dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading queue data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* QR Code Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-indigo-100">
            <QrCode className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Queue QR Code</h2>
            <p className="text-sm text-gray-500">Share this QR code for customers to join the queue</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center">
            <QueueQRCode salonId={salonId} size={160} />
            <p className="mt-3 text-sm text-gray-600">Scan to join queue</p>
          </div>
          
          <div className="flex-1">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Queue URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrCodeUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm text-gray-500 truncate"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(qrCodeUrl)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition text-sm flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
              <button
                onClick={() => window.open(qrCodeUrl, '_blank')}
                className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm flex items-center justify-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Open Queue Page
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Customers can scan this QR code or visit the URL to join the queue and check their status.
            </p>
          </div>
        </div>
      </div>

      {/* Queue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Service</p>
              <p className="text-2xl font-bold text-gray-900">
                {queueData.currentService ? queueData.currentService.tokenNumber : 'None'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          {queueData.currentService && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                Customer: {queueData.currentService.customerId?.name || queueData.currentService.customerId || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                Service: {queueData.currentService.serviceId?.name || queueData.currentService.serviceId || 'N/A'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Waiting</p>
              <p className="text-2xl font-bold text-gray-900">{queueData.totalWaiting}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Tokens</p>
              <p className="text-2xl font-bold text-gray-900">{queueData.upcomingTokens.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Current Service */}
      {queueData.currentService && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Service</h3>
            <button
              onClick={() => handleQueueAction(queueData.currentService.tokenNumber, 'complete')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Service
            </button>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-900">{queueData.currentService.tokenNumber}</p>
                <p className="text-sm text-blue-700 mt-1">
                  Customer: {queueData.currentService.customerId?.name || queueData.currentService.customerId || 'N/A'}
                </p>
                <p className="text-sm text-blue-700">
                  Service: {queueData.currentService.serviceId?.name || queueData.currentService.serviceId || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  In Service
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Tokens */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Tokens</h3>
          <button
            onClick={fetchQueueStatus}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {queueData.upcomingTokens.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>No customers in queue</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queueData.upcomingTokens.map((token, index) => (
              <div key={token._id || token.tokenNumber} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                    <span className="text-lg font-bold text-gray-700">{token.queuePosition}</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{token.tokenNumber}</p>
                    <p className="text-sm text-gray-600">
                      Customer: {token.customerId?.name || token.customerId || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Service: {token.serviceId?.name || token.serviceId || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQueueAction(token.tokenNumber, 'next')}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-1"
                  >
                    <UserCheck className="h-4 w-4" />
                    Next
                  </button>
                  <button
                    onClick={() => handleQueueAction(token.tokenNumber, 'skip')}
                    className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm flex items-center gap-1"
                  >
                    <SkipForward className="h-4 w-4" />
                    Skip
                  </button>
                  <button
                    onClick={() => handleQueueAction(token.tokenNumber, 'complete')}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Completed */}
      {queueData.completedTokens.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recently Completed</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {queueData.completedTokens.map((token) => (
              <div key={token._id || token.tokenNumber} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-900">{token.tokenNumber}</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Customer: {token.customerId?.name || token.customerId || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  Service: {token.serviceId?.name || token.serviceId || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManagement;