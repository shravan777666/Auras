import React from 'react';
import { useNavigate } from 'react-router-dom';
import RecentClientRecommendations from '../../components/salon/RecentClientRecommendations';
import BackButton from '../../components/common/BackButton';

const ClientRecommendationsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton fallbackPath="/salon/dashboard" />
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Recent Client Recommendations</h1>
            </div>
            <RecentClientRecommendations />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientRecommendationsPage;