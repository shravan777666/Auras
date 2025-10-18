import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { revenueService } from '../../services/revenue';

const NextWeekFinancialForecast = () => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const response = await revenueService.getFinancialForecast();
        setForecastData(response.data);
      } catch (err) {
        console.error('Error fetching financial forecast:', err);
        setError('Failed to load financial forecast');
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Loading forecast...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center h-24 text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!forecastData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center h-24 text-gray-500">
          <span>No forecast data available</span>
        </div>
      </div>
    );
  }

  const {
    predictedRevenue,
    confidence,
    percentageChange,
    trend
  } = forecastData;

  const isPositive = trend === 'positive';
  const formattedPercentage = Math.abs(percentageChange).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Next Week Financial Forecast</h3>
        <div className="flex items-center">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            {Math.round(confidence * 100)}% Confidence
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Predicted Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            {revenueService.formatCurrency(predictedRevenue)}
          </p>
        </div>
        
        <div className="flex flex-col items-end">
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="h-5 w-5 mr-1" />
            ) : (
              <TrendingDown className="h-5 w-5 mr-1" />
            )}
            <span className="font-medium">
              {isPositive ? '+' : ''}{formattedPercentage}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            vs current month
          </p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current Month</span>
          <span className="font-medium">₹1,499</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, Math.abs(percentageChange) / 2)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default NextWeekFinancialForecast;