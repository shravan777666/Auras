/**
 * Test script for the Financial Forecast system
 * This script tests the integration between the Node.js backend and Python ML service
 */

import https from 'https';
import http from 'http';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Test the health endpoint of the ML service
 */
async function testHealthEndpoint() {
  console.log('Testing ML service health endpoint...');
  
  try {
    const result = await callMLService('/health');
    console.log('Health check result:', result);
    
    if (result.status === 'healthy') {
      console.log('✅ ML service is healthy');
      return true;
    } else {
      console.log('❌ ML service is not healthy');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing health endpoint:', error.message);
    return false;
  }
}

/**
 * Test the prediction endpoint
 */
async function testPredictionEndpoint() {
  console.log('Testing prediction endpoint...');
  
  try {
    const result = await callMLService('/predict');
    console.log('Prediction result:', result);
    
    if (result.success) {
      console.log(`✅ Prediction successful: ₹${result.data.predicted_revenue}`);
      console.log(`   Confidence: ${(result.data.confidence * 100).toFixed(1)}%`);
      console.log(`   Change: ${result.data.percentage_change >= 0 ? '+' : ''}${result.data.percentage_change.toFixed(1)}%`);
      return true;
    } else {
      console.log('❌ Prediction failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing prediction endpoint:', error.message);
    return false;
  }
}

/**
 * Call the Python ML microservice
 */
function callMLService(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${ML_SERVICE_URL}${endpoint}`;
    
    // Choose the appropriate HTTP module based on the URL
    const httpModule = url.startsWith('https') ? https : http;
    
    const options = {
      timeout: 5000,
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
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Running Financial Forecast System Tests\n');
  
  const healthTestPassed = await testHealthEndpoint();
  console.log();
  
  const predictionTestPassed = await testPredictionEndpoint();
  console.log();
  
  if (healthTestPassed && predictionTestPassed) {
    console.log('🎉 All tests passed! The Financial Forecast system is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the system setup.');
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testHealthEndpoint, testPredictionEndpoint };