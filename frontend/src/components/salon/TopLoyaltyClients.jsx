import React, { useState, useEffect } from 'react';
import { Star, Crown, TrendingUp } from 'lucide-react';
import { loyaltyService } from '../../services/loyalty';

const TopLoyaltyClients = ({ limit = 5 }) => {
  const [topClients, setTopClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopClients = async () => {
      try {
        setLoading(true);
        const response = await loyaltyService.getTopLoyaltyCustomers(limit);
        setTopClients(response.data);
      } catch (err) {
        console.error('Error fetching top loyalty clients:', err);
        setError('Failed to load top loyalty clients');
      } finally {
        setLoading(false);
      }
    };

    fetchTopClients();
  }, [limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="flex items-center py-3 border-b border-gray-100">
              <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!topClients || topClients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-500">
          <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No loyalty clients found</p>
        </div>
      </div>
    );
  }

  // Determine tier icon
  const getTierIcon = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return <Crown className="h-4 w-4 text-purple-600" />;
      case 'gold': return <Star className="h-4 w-4 text-yellow-600" />;
      case 'silver': return <Star className="h-4 w-4 text-gray-400" />;
      default: return <Star className="h-4 w-4 text-blue-600" />;
    }
  };

  // Determine tier color
  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return 'text-purple-600 bg-purple-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Loyalty Clients</h3>
        <TrendingUp className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {topClients.map((client, index) => (
          <div key={client._id} className="flex items-center py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mr-3">
              {index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {client.name || 'Anonymous Customer'}
                </div>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getTierColor(client.loyaltyTier)}`}>
                  {getTierIcon(client.loyaltyTier)}
                  <span className="ml-1">{client.loyaltyTier}</span>
                </span>
              </div>
              
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <span>{client.email || 'No email'}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {client.loyaltyPoints || 0} pts
              </div>
              <div className="text-xs text-gray-500">
                ₹{client.loyaltyPoints || 0}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Recognition for our most loyal customers
        </div>
      </div>
    </div>
  );
};

export default TopLoyaltyClients;