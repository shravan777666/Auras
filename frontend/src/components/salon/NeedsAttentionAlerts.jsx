import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsService } from '../../services/alerts';
import { 
  AlertTriangle, 
  Calendar, 
  MessageCircle, 
  Users, 
  Package,
  Bell,
  X
} from 'lucide-react';

const NeedsAttentionAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertsService.getNeedsAttentionAlerts();
      setAlerts(response.data.alerts || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (link) => {
    if (link) {
      navigate(link);
    }
  };

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'calendar':
        return <Calendar className="h-5 w-5" />;
      case 'feedback':
        return <MessageCircle className="h-5 w-5" />;
      case 'staff':
        return <Users className="h-5 w-5" />;
      case 'inventory':
        return <Package className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'important':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Needs Attention</h2>
          <div className="animate-pulse h-6 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Needs Attention</h2>
        </div>
        <div className="text-center py-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Needs Attention ({alerts.length})
        </h2>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className={`border-l-4 rounded-lg p-4 flex items-start justify-between transition-all hover:shadow-md ${getAlertColor(alert.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${
                alert.type === 'urgent' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                {getIcon(alert.icon)}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{alert.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleActionClick(alert.action.link)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${
                  alert.type === 'urgent' 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                {alert.action.text}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NeedsAttentionAlerts;