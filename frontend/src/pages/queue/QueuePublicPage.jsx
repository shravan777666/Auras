import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { queueService } from '../../services/queue';
import { salonService } from '../../services/salon';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Users, Clock, UserCheck, QrCode } from 'lucide-react';

const QueuePublicPage = () => {
  const { salonId } = useParams();
  const [loading, setLoading] = useState(true);
  const [salonInfo, setSalonInfo] = useState(null);
  const [currentService, setCurrentService] = useState(null);
  const [upcomingTokens, setUpcomingTokens] = useState([]);
  const [totalWaiting, setTotalWaiting] = useState(0);

  // Fetch salon info and queue status
  const fetchData = async () => {
    try {
      // Fetch salon info
      const salonResponse = await salonService.getSalonById(salonId);
      if (salonResponse.success) {
        setSalonInfo(salonResponse.data);
      } else {
        toast.error(salonResponse.message || 'Failed to fetch salon info');
      }

      // Fetch queue status
      const queueResponse = await queueService.getSalonQueueStatus(salonId);
      if (queueResponse.success) {
        setCurrentService(queueResponse.data.currentService);
        setUpcomingTokens(queueResponse.data.upcomingTokens);
        setTotalWaiting(queueResponse.data.totalWaiting);
      } else {
        toast.error(queueResponse.message || 'Failed to fetch queue status');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [salonId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <QrCode className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {salonInfo?.salonName} Queue
            </h1>
          </div>
          <p className="text-gray-600">Real-time queue status and information</p>
        </div>

        {/* Current Service */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Current Service</h2>
          </div>
          
          {currentService ? (
            <div className="bg-blue-50 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-900">{currentService.tokenNumber}</p>
                  <p className="text-gray-700 mt-2">
                    Customer: {currentService.customerId?.name || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Currently being served
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No one is currently being served</p>
            </div>
          )}
        </div>

        {/* Queue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {currentService ? currentService.tokenNumber : 'None'}
            </p>
            <p className="text-gray-600 mt-1">Current Service</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalWaiting}</p>
            <p className="text-gray-600 mt-1">Waiting Customers</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalWaiting > 0 ? totalWaiting * 15 : 0}
            </p>
            <p className="text-gray-600 mt-1">Estimated Wait (min)</p>
          </div>
        </div>

        {/* Upcoming Tokens */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Tokens</h2>
            </div>
            <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
              {totalWaiting} total waiting
            </span>
          </div>
          
          {upcomingTokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No customers in queue</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingTokens.map((token, index) => (
                <div key={token._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                      <span className="text-lg font-bold text-gray-700">#{token.queuePosition}</span>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{token.tokenNumber}</p>
                      <p className="text-sm text-gray-600">
                        Customer: {token.customerId?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Waiting
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Join Queue Button */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Join the Queue</h2>
          <p className="text-gray-600 mb-6">
            Scan the QR code or visit the salon's queue page to join the queue
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = `/queue/join/${salonId}`}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Join Queue Now
            </button>
            <button
              onClick={() => {
                // In a real implementation, this would generate a QR code
                navigator.clipboard.writeText(`${window.location.origin}/queue/join/${salonId}`);
                toast.success('Queue URL copied to clipboard!');
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Copy Queue Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueuePublicPage;