import { successResponse, errorResponse } from '../utils/responses.js';
import https from 'https';
import http from 'http';

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_SERVICE_TIMEOUT = process.env.ML_SERVICE_TIMEOUT || 5000;

/**
 * Get financial forecast for next week
 */
export const getFinancialForecast = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    // Call the Python ML service
    const forecastData = await callMLService('/predict');
    
    if (!forecastData.success) {
      return errorResponse(res, 'Failed to get financial forecast', 500);
    }

    return successResponse(res, {
      predictedRevenue: forecastData.data.predicted_revenue,
      confidence: forecastData.data.confidence,
      percentageChange: forecastData.data.percentage_change,
      trend: forecastData.data.trend
    }, 'Financial forecast retrieved successfully');

  } catch (error) {
    console.error('Error fetching financial forecast:', error);
    return errorResponse(res, 'Failed to retrieve financial forecast', 500);
  }
};

/**
 * Call the Python ML microservice
 */
const callMLService = (endpoint) => {
  return new Promise((resolve, reject) => {
    const url = `${ML_SERVICE_URL}${endpoint}`;
    
    // Choose the appropriate HTTP module based on the URL
    const httpModule = url.startsWith('https') ? https : http;
    
    const options = {
      timeout: parseInt(ML_SERVICE_TIMEOUT),
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = httpModule.get(url, options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse ML service response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`ML service request failed: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ML service request timeout'));
    });
    
    req.end();
  });
};

/**
 * Train the model with new data (admin only)
 */
export const trainModel = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { records } = req.body;
    
    if (!userId) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    // In a real implementation, you would check if the user is an admin
    // For now, we'll allow any authenticated user to train the model
    
    // Prepare training data from appointments
    const trainingData = {
      records: records || []
    };

    // Call the Python ML service to train the model
    const result = await callMLService('/train', 'POST', trainingData);
    
    if (!result.success) {
      return errorResponse(res, 'Failed to train model', 500);
    }

    return successResponse(res, {}, 'Model trained successfully');

  } catch (error) {
    console.error('Error training model:', error);
    return errorResponse(res, 'Failed to train model', 500);
  }
};

// Helper function to make POST requests to ML service
const callMLServicePost = (endpoint, data) => {
  return new Promise((resolve, reject) => {
    const url = `${ML_SERVICE_URL}${endpoint}`;
    const postData = JSON.stringify(data);
    
    // Choose the appropriate HTTP module based on the URL
    const httpModule = url.startsWith('https') ? https : http;
    
    const options = {
      method: 'POST',
      timeout: parseInt(ML_SERVICE_TIMEOUT),
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = httpModule.request(url, options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse ML service response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`ML service request failed: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ML service request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
};

export default {
  getFinancialForecast,
  trainModel
};