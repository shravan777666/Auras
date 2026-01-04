import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { queueService } from '../../services/queue';
import { salonService } from '../../services/salon';
import { serviceService } from '../../services/service';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Users, Clock, QrCode, CheckCircle } from 'lucide-react';

const QueueJoinPage = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salonInfo, setSalonInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [tokenNumber, setTokenNumber] = useState(null);

  // Fetch salon info
  const fetchSalonInfo = async () => {
    try {
      const response = await salonService.getSalonById(salonId);
      if (response.success) {
        setSalonInfo(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch salon info');
      }
    } catch (error) {
      console.error('Error fetching salon info:', error);
      toast.error('Failed to fetch salon info');
    }
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await serviceService.getServiceCatalog({ salonId });
      if (response.success) {
        setServices(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to fetch services');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSalonInfo(),
        fetchServices()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [salonId]);

  const handleJoinQueue = async (e) => {
    e.preventDefault();
    setJoiningQueue(true);

    try {
      // In a real implementation, you would create a user account first if needed
      // For now, we'll simulate joining the queue
      const response = await queueService.joinQueue('customer_id_placeholder', selectedService);
      if (response.success) {
        setTokenNumber(response.data.tokenNumber);
        toast.success('Successfully joined the queue!');
      } else {
        toast.error(response.message || 'Failed to join queue');
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      toast.error('Failed to join queue');
    } finally {
      setJoiningQueue(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (tokenNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Successfully Joined Queue!</h1>
            <p className="text-gray-600 mb-8">Your token number is ready</p>
            
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 mb-8">
              <p className="text-white text-sm mb-2">Your Token Number</p>
              <p className="text-5xl font-bold text-white">{tokenNumber}</p>
              <p className="text-white text-sm mt-4">Please wait for your turn</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Salon</p>
                <p className="font-medium">{salonInfo?.salonName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-medium">
                  {services.find(s => s._id === selectedService)?.name || 'General Service'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => navigate(`/queue/status/${tokenNumber}`)}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              View Queue Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <QrCode className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Join Queue</h1>
            </div>
            <p className="text-blue-100">Get in line at {salonInfo?.salonName}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Salon Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{salonInfo?.salonName}</p>
                <p className="text-sm text-gray-600">{salonInfo?.address?.fullAddress}</p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Phone:</span> {salonInfo?.contact?.phone}
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinQueue}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Selection</h2>
                <div className="grid grid-cols-1 gap-3">
                  {services.map((service) => (
                    <label key={service._id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="service"
                        value={service._id}
                        checked={selectedService === service._id}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{service.price}</p>
                        <p className="text-sm text-gray-600">{service.duration} mins</p>
                      </div>
                    </label>
                  ))}
                  {services.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p>No services available at this salon</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={joiningQueue}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joiningQueue ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Joining Queue...
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5" />
                    Join Queue
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueJoinPage;