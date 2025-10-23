import { successResponse, errorResponse } from '../utils/responses.js';
import https from 'https';
import http from 'http';
import Expense from '../models/Expense.js';
import Salon from '../models/Salon.js';

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_SERVICE_TIMEOUT = process.env.ML_SERVICE_TIMEOUT || 5000;

/**
 * Get expense forecast for next month
 */
export const getExpenseForecast = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    console.log('Fetching salon data for user:', userId);
    
    // Find the salon associated with this user
    // Try multiple fields since the schema has both user and ownerId
    const salon = await Salon.findOne({
      $or: [
        { user: userId },
        { ownerId: userId }
      ]
    });
    
    if (!salon) {
      console.log('Salon not found for user ID:', userId);
      // Log all salons for debugging
      const allSalons = await Salon.find({}, 'user ownerId email salonName');
      console.log('All salons:', allSalons);
      return errorResponse(res, 'Salon not found for this user', 404);
    }

    console.log('Salon found:', salon._id);
    
    // Fetch recent expense data for this salon
    const recentExpenses = await Expense.find({ salonId: salon._id })
      .sort({ date: -1 })
      .limit(12) // Get last 12 months of data
      .select('amount date')
      .lean();

    console.log('Recent expenses found:', recentExpenses.length);

    // If no expenses found, return a default prediction
    if (recentExpenses.length === 0) {
      console.log('No expense data found, returning default prediction');
      
      // Return a default prediction with explanation
      const defaultData = {
        prediction: 0,
        lower_95: 0,
        upper_95: 0,
        feature_importances: [],
        metrics: {
          rmse: 0,
          mae: 0,
          r2: 0
        }
      };
      
      return successResponse(res, defaultData, 'No expense data available. Add expenses to generate predictions.');
    }

    // Calculate monthly totals
    const monthlyTotals = {};
    recentExpenses.forEach(expense => {
      const monthKey = new Date(expense.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = 0;
      }
      monthlyTotals[monthKey] += expense.amount;
    });

    // Convert to sorted array
    const sortedMonthlyData = Object.entries(monthlyTotals)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log('Monthly totals:', sortedMonthlyData);

    // Prepare lag features (last 3 months)
    let lastMonthExpense = 0;
    let expenseLag2 = 0;
    let expenseLag3 = 0;

    if (sortedMonthlyData.length >= 1) {
      lastMonthExpense = sortedMonthlyData[sortedMonthlyData.length - 1].total;
    }
    if (sortedMonthlyData.length >= 2) {
      expenseLag2 = sortedMonthlyData[sortedMonthlyData.length - 2].total;
    }
    if (sortedMonthlyData.length >= 3) {
      expenseLag3 = sortedMonthlyData[sortedMonthlyData.length - 3].total;
    }

    console.log('Lag features:', { lastMonthExpense, expenseLag2, expenseLag3 });

    // Call the Python ML service with real data
    const forecastData = await callMLService('/predict/next_month', 'POST', {
      last_month_data: {
        total_monthly_expense: lastMonthExpense,
        expense_lag_2: expenseLag2,
        expense_lag_3: expenseLag3
      }
    });
    
    console.log('ML service response:', forecastData);
    
    if (!forecastData.success) {
      return errorResponse(res, 'Failed to get expense forecast', 500);
    }

    return successResponse(res, forecastData.data, 'Expense forecast retrieved successfully');

  } catch (error) {
    console.error('Error fetching expense forecast:', error);
    return errorResponse(res, 'Failed to retrieve expense forecast', 500);
  }
};

/**
 * Call the Python ML microservice
 */
const callMLService = (endpoint, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const url = `${ML_SERVICE_URL}${endpoint}`;
    
    console.log(`Calling ML service at ${url} with method ${method}`);
    
    // Choose the appropriate HTTP module based on the URL
    const httpModule = url.startsWith('https') ? https : http;
    
    const options = {
      method: method,
      timeout: parseInt(ML_SERVICE_TIMEOUT),
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = httpModule.request(url, options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        console.log(`ML service response status: ${response.statusCode}`);
        console.log(`ML service response data: ${data}`);
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse ML service response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('ML service request error:', error);
      reject(new Error(`ML service request failed: ${error.message}`));
    });
    
    req.on('timeout', () => {
      console.error('ML service request timeout');
      req.destroy();
      reject(new Error('ML service request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

export default {
  getExpenseForecast
};