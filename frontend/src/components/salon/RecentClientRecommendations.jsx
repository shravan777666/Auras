import React, { useState, useEffect } from 'react';
import { recommendationService } from '../../services/recommendations';
import { toast } from 'react-hot-toast';
import { RefreshCw, Send, User, Scissors, MessageCircle, Star, Flower2, Heart, Sparkles } from 'lucide-react';

const RecentClientRecommendations = () => {
  const [clients, setClients] = useState([]);
  const [recommendations, setRecommendations] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});
  const [error, setError] = useState(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState({});

  // Fetch recent clients and their recommendations from API
  useEffect(() => {
    const fetchRecentClientsAndRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch real clients from API
        const clientsResponse = await recommendationService.getRecentClients();
        
        if (!clientsResponse.success) {
          throw new Error(clientsResponse.message || 'Failed to fetch clients');
        }
        
        const clientsData = clientsResponse.data || [];
        setClients(clientsData);
        
        // Fetch recommendations for each client
        const recommendationsData = {};
        const initialSelections = {};
        
        for (const client of clientsData) {
          try {
            const recResponse = await recommendationService.getClientRecommendations(client.id);
            if (recResponse.success && recResponse.data) {
              const clientRecs = recResponse.data.recommendations || [];
              recommendationsData[client.id] = { recommendations: clientRecs };
              
              // Initialize all recommendations as selected
              initialSelections[client.id] = clientRecs.reduce((acc, rec) => {
                acc[rec] = true;
                return acc;
              }, {});
            } else {
              // If no recommendations, set empty array
              recommendationsData[client.id] = { recommendations: [] };
              initialSelections[client.id] = {};
            }
          } catch (recError) {
            console.error(`Failed to fetch recommendations for client ${client.id}:`, recError);
            recommendationsData[client.id] = { recommendations: [] };
            initialSelections[client.id] = {};
          }
        }
        
        setRecommendations(recommendationsData);
        setSelectedRecommendations(initialSelections);
      } catch (err) {
        console.error('Failed to fetch recent clients:', err);
        setError(err.message || 'Failed to load recent client data');
        toast.error(err.message || 'Failed to load recent client data');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentClientsAndRecommendations();
  }, []);

  // Toggle recommendation selection
  const handleToggleRecommendation = (clientId, recommendation) => {
    setSelectedRecommendations(prev => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [recommendation]: !prev[clientId]?.[recommendation]
      }
    }));
  };

  // Get selected recommendations for a client
  const getSelectedRecommendations = (clientId) => {
    const clientSelections = selectedRecommendations[clientId] || {};
    const clientRecs = recommendations[clientId]?.recommendations || [];
    return clientRecs.filter(rec => clientSelections[rec]);
  };

  // Check if any recommendations are selected for a client
  const hasSelectedRecommendations = (clientId) => {
    return getSelectedRecommendations(clientId).length > 0;
  };

  // Check if any client has selected recommendations
  const hasAnySelectedRecommendations = () => {
    return clients.some(client => hasSelectedRecommendations(client.id));
  };

  // Send recommendations to a client
  const handleSendRecommendations = async (clientId, clientName) => {
    try {
      setSending(prev => ({ ...prev, [clientId]: true }));
      
      const selectedRecs = getSelectedRecommendations(clientId);
      
      if (selectedRecs.length === 0) {
        toast.error('No recommendations selected');
        return;
      }
      
      await recommendationService.sendRecommendations(clientId, selectedRecs);
      toast.success(`Recommendations sent to ${clientName}!`);
      
      alert(`Sent recommendations to ${clientName}!`);
    } catch (err) {
      console.error('Failed to send recommendations:', err);
      toast.error('Failed to send recommendations');
    } finally {
      setSending(prev => ({ ...prev, [clientId]: false }));
    }
  };

  // Send all selected recommendations
  const handleSendAll = async () => {
    try {
      for (const client of clients) {
        const selectedRecs = getSelectedRecommendations(client.id);
        if (selectedRecs.length > 0) {
          await recommendationService.sendRecommendations(client.id, selectedRecs);
        }
      }
      toast.success('All recommendations sent successfully!');
      alert('All recommendations sent successfully!');
    } catch (err) {
      console.error('Failed to send recommendations:', err);
      toast.error('Failed to send some recommendations');
    }
  };

  // Refresh recommendations for a client
  const handleRefreshRecommendations = async (clientId) => {
    try {
      const recResponse = await recommendationService.getClientRecommendations(clientId);
      
      if (recResponse.success && recResponse.data) {
        const newRecs = recResponse.data.recommendations || [];
        
        setRecommendations(prev => ({
          ...prev,
          [clientId]: { recommendations: newRecs }
        }));
        
        // Update selections for new recommendations
        setSelectedRecommendations(prev => ({
          ...prev,
          [clientId]: newRecs.reduce((acc, rec) => {
            acc[rec] = true;
            return acc;
          }, {})
        }));
        
        toast.success('Recommendations updated');
      } else {
        toast.error('Failed to refresh recommendations');
      }
    } catch (err) {
      console.error(`Failed to refresh recommendations for client ${clientId}:`, err);
      toast.error('Failed to refresh recommendations');
    }
  };

  // Get icon for service
  const getServiceIcon = (service) => {
    const serviceLower = service.toLowerCase();
    
    if (serviceLower.includes('hair') || serviceLower.includes('cut') || serviceLower.includes('style') || serviceLower.includes('keratin')) {
      return <Scissors className="h-4 w-4" />;
    } else if (serviceLower.includes('facial') || serviceLower.includes('skin') || serviceLower.includes('wax') || serviceLower.includes('peel')) {
      return <Star className="h-4 w-4" />;
    } else if (serviceLower.includes('nail') || serviceLower.includes('manicure') || serviceLower.includes('pedicure')) {
      return <Flower2 className="h-4 w-4" />;
    } else if (serviceLower.includes('makeup') || serviceLower.includes('bridal')) {
      return <Sparkles className="h-4 w-4" />;
    } else if (serviceLower.includes('massage') || serviceLower.includes('spa') || serviceLower.includes('aromatherapy')) {
      return <Heart className="h-4 w-4" />;
    } else if (serviceLower.includes('package') || serviceLower.includes('combo')) {
      return <Star className="h-4 w-4" />;
    } else {
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
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSendAll}
              disabled={!hasAnySelectedRecommendations()}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-colors ${
                !hasAnySelectedRecommendations()
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }`}
            >
              <Send className="h-4 w-4 mr-2" />
              Send All Selected
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh All
            </button>
          </div>
        </div>
        
        {clients.length === 0 ? (
          <div className="text-center py-8 rounded-lg bg-gray-50">
            <p className="text-gray-500">No recent clients found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {clients.map((client) => {
              const clientRecs = recommendations[client.id] || { recommendations: [] };
              const clientRecommendations = clientRecs.recommendations || [];
              const hasSelections = hasSelectedRecommendations(client.id);
              
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
                              <span className="block">Last appointment: {new Date(client.lastAppointmentDate).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 ml-16">
                        {clientRecommendations.length > 0 ? (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Recommended services:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {clientRecommendations.map((rec, index) => (
                                <label 
                                  key={index} 
                                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                                    selectedRecommendations[client.id]?.[rec]
                                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={!!selectedRecommendations[client.id]?.[rec]}
                                    onChange={() => handleToggleRecommendation(client.id, rec)}
                                    className="hidden"
                                  />
                                  <span className="mr-2">{getServiceIcon(rec)}</span>
                                  {rec}
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {getSelectedRecommendations(client.id).length} of {clientRecommendations.length} selected
                            </p>
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
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleRefreshRecommendations(client.id)}
                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Refresh recommendations"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleSendRecommendations(client.id, client.name)}
                        disabled={sending[client.id] || !hasSelections}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-colors ${
                          !hasSelections
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