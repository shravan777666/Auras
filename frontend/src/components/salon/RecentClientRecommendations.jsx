import React, { useState, useEffect } from 'react';
import { recommendationService } from '../../services/recommendations';
import { toast } from 'react-hot-toast';
import { RefreshCw, Send, User, Scissors, MessageCircle, Star, Flower2 } from 'lucide-react';

const RecentClientRecommendations = () => {
  const [clients, setClients] = useState([]);
  const [recommendations, setRecommendations] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});
  const [error, setError] = useState(null);

  // Fetch recent clients and their recommendations
  useEffect(() => {
    const fetchRecentClientsAndRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch recent clients
        const clientsResponse = await recommendationService.getRecentClients();
        const clientsData = clientsResponse.data || [];
        setClients(clientsData);
        
        // Fetch recommendations for each client with a delay to prevent rate limiting
        const recommendationsData = {};
        for (let i = 0; i < clientsData.length; i++) {
          const client = clientsData[i];
          try {
            // Use the client ID to get recommendations
            const recResponse = await recommendationService.getClientRecommendations(client.id);
            recommendationsData[client.id] = recResponse.data || { recommendations: [] };
            
            // Add a small delay between requests to prevent rate limiting
            if (i < clientsData.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (err) {
            console.error(`Failed to fetch recommendations for client ${client.id}:`, err);
            recommendationsData[client.id] = { recommendations: [] };
          }
        }
        
        setRecommendations(recommendationsData);
      } catch (err) {
        console.error('Failed to fetch recent clients:', err);
        setError('Failed to load recent client data');
        toast.error('Failed to load recent client data');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentClientsAndRecommendations();
  }, []);

  // Send recommendations to a client
  const handleSendRecommendations = async (clientId, clientName) => {
    try {
      setSending(prev => ({ ...prev, [clientId]: true }));
      
      const clientRecommendations = recommendations[clientId]?.recommendations || [];
      
      if (clientRecommendations.length === 0) {
        toast.error('No recommendations to send');
        return;
      }
      
      await recommendationService.sendRecommendations(clientId, clientRecommendations);
      toast.success(`Recommendations sent to ${clientName}!`);
      
      // Show alert as specified in requirements
      alert(`Sent recommendations to ${clientName}!`);
    } catch (err) {
      console.error('Failed to send recommendations:', err);
      toast.error('Failed to send recommendations');
    } finally {
      setSending(prev => ({ ...prev, [clientId]: false }));
    }
  };

  // Refresh recommendations for a client
  const handleRefreshRecommendations = async (clientId) => {
    try {
      const recResponse = await recommendationService.getClientRecommendations(clientId);
      setRecommendations(prev => ({
        ...prev,
        [clientId]: recResponse.data || { recommendations: [] }
      }));
      toast.success('Recommendations updated');
    } catch (err) {
      console.error(`Failed to refresh recommendations for client ${clientId}:`, err);
      toast.error('Failed to refresh recommendations');
    }
  };

  // Get icon for service
  const getServiceIcon = (service) => {
    switch (service) {
      case 'Haircut':
        return <Scissors className="h-4 w-4" />;
      case 'Spa Package':
        return <Flower2 className="h-4 w-4" />;
      case 'Massage':
        return <User className="h-4 w-4" />;
      case 'Facial':
        return <Star className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Client Recommendations</h2>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
          <div className="flex items-center justify-center py-8">
            <span className="ml-3 text-gray-600">Loading recent client recommendations...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Client Recommendations</h2>
          </div>
          <div className="text-center py-8">
            <div className="text-red-500 font-medium mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Recent Client Recommendations</h2>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
        
        {clients.length === 0 ? (
          <div className="text-center py-8 rounded-lg bg-gray-50">
            <p className="text-gray-500">No recent clients found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => {
              const clientRecs = recommendations[client.id] || { recommendations: [] };
              const clientRecommendations = clientRecs.recommendations || [];
              
              return (
                <div 
                  key={client.id} 
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                          <p className="text-sm text-gray-500">
                            {client.lastService ? `Last service: ${client.lastService}` : 'No service history'}
                            {client.lastAppointmentDate && (
                              <span className="block">Last appointment: {client.lastAppointmentDate}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 ml-16">
                        {clientRecommendations.length > 0 ? (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Recommended services:</p>
                            <div className="flex flex-wrap gap-2">
                              {clientRecommendations.map((rec, index) => (
                                <span 
                                  key={index} 
                                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
                                >
                                  <span className="mr-1.5">{getServiceIcon(rec)}</span>
                                  {rec}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-yellow-50 p-3">
                            <p className="text-sm text-yellow-700 flex items-center">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              No recommendations available
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleRefreshRecommendations(client.id)}
                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Refresh recommendations"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleSendRecommendations(client.id, client.name)}
                        disabled={sending[client.id] || clientRecommendations.length === 0}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-colors ${
                          clientRecommendations.length === 0 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        }`}
                      >
                        {sending[client.id] ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentClientRecommendations;