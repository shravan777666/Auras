import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2, AlertCircle, Info } from 'lucide-react';
import { salonService } from '../../services/salon';

const NextMonthExpenseForecast = () => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching expense forecast...');
        const response = await salonService.getExpenseForecast();
        console.log('Expense forecast response:', response);

        const { success, data, message } = response || {};

        if (!success || !data) {
          setForecastData(null);
          setError(message || 'No forecast data available');
          return;
        }
        setError(null);

        const metrics = data.metrics || {};
        const featureImportances = Array.isArray(data.feature_importances) ? data.feature_importances : [];

        const validatedData = {
          ...data,
          prediction: !isNaN(data.prediction) && isFinite(data.prediction) ? data.prediction : 0,
          lower_95: !isNaN(data.lower_95) && isFinite(data.lower_95) ? data.lower_95 : 0,
          upper_95: !isNaN(data.upper_95) && isFinite(data.upper_95) ? data.upper_95 : 0,
          metrics: {
            ...metrics,
            rmse: metrics.rmse && !isNaN(metrics.rmse) && isFinite(metrics.rmse) ? metrics.rmse : 0
          },
          feature_importances: featureImportances.map(feature => ({
            ...feature,
            importance: !isNaN(feature.importance) && isFinite(feature.importance) ? feature.importance : 0
          }))
        };
        setForecastData(validatedData);
      } catch (err) {
        console.error('Error fetching expense forecast:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load expense forecast');
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  // Always render the component container
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Next Month Expense Forecast</h3>
        <div className="flex items-center">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            AI-Powered Prediction
          </span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading forecast...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-24">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            <p>This feature requires expense data to generate predictions.</p>
            <p className="mt-1">Add some expenses to see the forecast.</p>
          </div>
        </div>
      ) : !forecastData ? (
        <div className="flex items-center justify-center h-24 text-gray-500">
          <Info className="h-5 w-5 mr-2" />
          <span>No forecast data available. Add some expenses to generate predictions.</span>
        </div>
      ) : (
        <ForecastContent 
          forecastData={forecastData} 
        />
      )}
    </div>
  );
};

// Separate component for the forecast content to keep the main component clean
const ForecastContent = ({ forecastData }) => {
  const {
    prediction,
    lower_95,
    upper_95,
    feature_importances,
    metrics
  } = forecastData;

  // Find the most important feature
  const mostImportantFeature = feature_importances && feature_importances.length > 0 
    ? feature_importances[0] 
    : null;

  // Add validation for numeric values
  const validPrediction = !isNaN(prediction) && isFinite(prediction) ? prediction : 0;
  const validLower95 = !isNaN(lower_95) && isFinite(lower_95) ? lower_95 : 0;
  const validUpper95 = !isNaN(upper_95) && isFinite(upper_95) ? upper_95 : 0;

  // Calculate the change from current month (if we have data)
  const currentMonthExpense = validLower95 > 0 ? (validLower95 + validUpper95) / 2 : validPrediction;
  const percentageChange = currentMonthExpense > 0 ? ((validPrediction - currentMonthExpense) / currentMonthExpense) * 100 : 0;
  const isIncrease = percentageChange > 0;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600">Predicted Expense</p>
          <p className="text-3xl font-bold text-gray-900">
            ₹{validPrediction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <div className="flex items-center mt-1">
            {isIncrease ? (
              <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
            )}
            <span className={`text-sm ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
              {Math.abs(percentageChange).toFixed(1)}% {isIncrease ? 'increase' : 'decrease'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-right">
            <p className="text-xs text-gray-500">Confidence Interval</p>
            <p className="text-sm font-medium text-gray-900">
              ₹{validLower95.toLocaleString('en-IN', { maximumFractionDigits: 0 })} - ₹{validUpper95.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          {mostImportantFeature && (
            <div className="text-right mt-2">
              <p className="text-xs text-gray-500">Most Important Factor</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {mostImportantFeature.feature.replace(/_/g, ' ')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {feature_importances && feature_importances.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Feature Importance</h4>
          <div className="space-y-2">
            {feature_importances.slice(0, 3).map((feature, index) => {
              // Validate feature importance value
              const validImportance = !isNaN(feature.importance) && isFinite(feature.importance) ? feature.importance : 0;
              const percentage = validImportance * 100;
              
              return (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-xs text-gray-600 capitalize">
                    {feature.feature.replace(/_/g, ' ')}
                  </div>
                  <div className="flex-1 ml-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-indigo-600"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-10 text-xs text-gray-500 text-right">
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Model Performance (RMSE)</span>
          <span className="font-medium">
            {metrics.rmse && !isNaN(metrics.rmse) && isFinite(metrics.rmse) ? metrics.rmse.toFixed(2) : 'N/A'}
          </span>
        </div>
      </div>
    </>
  );
};

export default NextMonthExpenseForecast;