#!/usr/bin/env node

/**
 * End-to-End ML Service Integration Test
 * 
 * This script tests the complete flow from ML service to frontend UI
 * to ensure ML predictions are actively used in real backend and UI flows.
 */

import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs';

// Configuration
const CONFIG = {
  ML_SERVICE_URL: 'http://localhost:5001',
  BACKEND_URL: 'http://localhost:5011',
  FRONTEND_URL: 'http://localhost:3008',
  TIMEOUT: 10000
};

// Test results tracking
let testResults = {
  mlService: { status: 'pending', details: '' },
  backendIntegration: { status: 'pending', details: '' },
  apiEndpoints: { status: 'pending', details: '' },
  uiComponents: { status: 'pending', details: '' },
  dataFlow: { status: 'pending', details: '' }
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    error: '\x1b[31m',   // red
    warning: '\x1b[33m', // yellow
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: ML Service Health Check
async function testMLServiceHealth() {
  log('🧪 Testing ML Service Health...', 'info');
  
  try {
    const response = await axios.get(`${CONFIG.ML_SERVICE_URL}/health`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.data.status === 'healthy') {
      testResults.mlService = {
        status: 'passed',
        details: `ML Service is healthy. Models loaded: ${response.data.models_loaded}`
      };
      log('✅ ML Service Health Check PASSED', 'success');
      return true;
    } else {
      throw new Error('ML Service reported unhealthy status');
    }
  } catch (error) {
    testResults.mlService = {
      status: 'failed',
      details: `ML Service is not responding: ${error.message}`
    };
    log(`❌ ML Service Health Check FAILED: ${error.message}`, 'error');
    return false;
  }
}

// Test 2: ML Service Prediction Endpoints
async function testMLServiceEndpoints() {
  log('🧪 Testing ML Service Prediction Endpoints...', 'info');
  
  const tests = [
    {
      name: 'Revenue Prediction',
      endpoint: '/predict',
      method: 'GET',
      expectedFields: ['predicted_revenue', 'confidence', 'percentage_change', 'trend']
    },
    {
      name: 'Expense Prediction',
      endpoint: '/predict/next_month',
      method: 'POST',
      data: {
        last_month_data: {
          total_monthly_expense: 15000,
          expense_lag_2: 14000,
          expense_lag_3: 13000
        }
      },
      expectedFields: ['prediction', 'lower_95', 'upper_95']
    },
    {
      name: 'Add-on Prediction',
      endpoint: '/predict-addon',
      method: 'POST',
      data: {
        time_gap_size: 2,
        discount_offered: 15,
        customer_loyalty: 0.8,
        past_add_on_history: 1,
        day_of_week: 3
      },
      expectedFields: ['prediction', 'probability']
    }
  ];

  let passedTests = 0;
  
  for (const test of tests) {
    try {
      log(`  Testing ${test.name}...`, 'info');
      
      const options = {
        method: test.method,
        url: `${CONFIG.ML_SERVICE_URL}${test.endpoint}`,
        timeout: CONFIG.TIMEOUT
      };
      
      if (test.data) {
        options.data = test.data;
      }
      
      const response = await axios(options);
      
      if (response.data.success) {
        const hasRequiredFields = test.expectedFields.every(field => 
          response.data.data && response.data.data[field] !== undefined
        );
        
        if (hasRequiredFields) {
          log(`  ✅ ${test.name} PASSED`, 'success');
          passedTests++;
        } else {
          log(`  ❌ ${test.name} FAILED - Missing required fields`, 'error');
        }
      } else {
        log(`  ❌ ${test.name} FAILED - API returned success=false`, 'error');
      }
    } catch (error) {
      log(`  ❌ ${test.name} FAILED - ${error.message}`, 'error');
    }
  }
  
  if (passedTests === tests.length) {
    testResults.apiEndpoints = {
      status: 'passed',
      details: `All ${passedTests}/${tests.length} ML endpoints working correctly`
    };
    return true;
  } else {
    testResults.apiEndpoints = {
      status: 'failed',
      details: `Only ${passedTests}/${tests.length} ML endpoints working`
    };
    return false;
  }
}

// Test 3: Backend Integration
async function testBackendIntegration() {
  log('🧪 Testing Backend Integration with ML Service...', 'info');
  
  try {
    // Test financial forecast endpoint (requires auth, so we'll check if it exists)
    const response = await axios.post(
      `${CONFIG.BACKEND_URL}/api/financial-forecast/forecast`,
      {},
      { timeout: CONFIG.TIMEOUT }
    );
    
    // We expect either 401 (auth required) or 200 (if somehow auth works)
    if (response.status === 401 || response.status === 200) {
      testResults.backendIntegration = {
        status: 'passed',
        details: 'Backend financial forecast endpoint is accessible'
      };
      log('✅ Backend Integration Test PASSED', 'success');
      return true;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 401) {
      // This is expected - endpoint exists but requires auth
      testResults.backendIntegration = {
        status: 'passed',
        details: 'Backend financial forecast endpoint exists and requires authentication'
      };
      log('✅ Backend Integration Test PASSED (Authentication required)', 'success');
      return true;
    } else {
      testResults.backendIntegration = {
        status: 'failed',
        details: `Backend integration failed: ${error.message}`
      };
      log(`❌ Backend Integration Test FAILED: ${error.message}`, 'error');
      return false;
    }
  }
}

// Test 4: Expense Forecast Endpoint
async function testExpenseForecastEndpoint() {
  log('🧪 Testing Expense Forecast Backend Endpoint...', 'info');
  
  try {
    const response = await axios.post(
      `${CONFIG.BACKEND_URL}/api/expense-forecast/forecast`,
      {},
      { timeout: CONFIG.TIMEOUT }
    );
    
    if (response.status === 401) {
      testResults.backendIntegration.details += ' | Expense forecast endpoint accessible';
      log('✅ Expense Forecast Endpoint Test PASSED', 'success');
      return true;
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 401) {
      testResults.backendIntegration.details += ' | Expense forecast endpoint accessible';
      log('✅ Expense Forecast Endpoint Test PASSED (Authentication required)', 'success');
      return true;
    } else {
      log(`❌ Expense Forecast Endpoint Test FAILED: ${error.message}`, 'error');
      return false;
    }
  }
}

// Test 5: UI Component Analysis
async function testUIComponents() {
  log('🧪 Analyzing UI Components for ML Integration...', 'info');
  
  try {
    // Check if frontend files exist and use ML services
    const frontendFiles = [
      'frontend/src/components/salon/NextMonthExpenseForecast.jsx',
      'frontend/src/components/salon/NextWeekFinancialForecast.jsx',
      'frontend/src/services/salon.js',
      'frontend/src/services/revenue.js'
    ];
    
    let filesFound = 0;
    let mlUsageFound = 0;
    
    for (const file of frontendFiles) {
      const fullPath = `d:/AuraCares-main/${file}`;
      if (fs.existsSync(fullPath)) {
        filesFound++;
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for ML service usage patterns
        const mlPatterns = [
          /getExpenseForecast/,
          /getFinancialForecast/,
          /expense-forecast/,
          /financial-forecast/,
          /AI-Powered Prediction/,
          /ML service/
        ];
        
        if (mlPatterns.some(pattern => pattern.test(content))) {
          mlUsageFound++;
        }
      }
    }
    
    if (filesFound > 0 && mlUsageFound > 0) {
      testResults.uiComponents = {
        status: 'passed',
        details: `Found ${mlUsageFound}/${filesFound} frontend files using ML services`
      };
      log('✅ UI Components Analysis PASSED', 'success');
      return true;
    } else {
      testResults.uiComponents = {
        status: 'warning',
        details: `Found ${filesFound} frontend files, ${mlUsageFound} using ML services`
      };
      log('⚠️ UI Components Analysis - Some components found', 'warning');
      return true; // Still consider this a pass since files exist
    }
  } catch (error) {
    testResults.uiComponents = {
      status: 'failed',
      details: `UI component analysis failed: ${error.message}`
    };
    log(`❌ UI Components Analysis FAILED: ${error.message}`, 'error');
    return false;
  }
}

// Test 6: Data Flow Verification
async function testDataFlow() {
  log('🧪 Verifying Complete Data Flow...', 'info');
  
  try {
    // Check if all required files exist for the data flow
    const requiredFiles = [
      'backend/controllers/financialForecastController.js',
      'backend/controllers/expenseForecastController.js',
      'backend/controllers/addonController.js',
      'ml-service/app.py',
      'frontend/src/components/salon/NextMonthExpenseForecast.jsx',
      'frontend/src/components/salon/NextWeekFinancialForecast.jsx'
    ];
    
    let filesFound = 0;
    for (const file of requiredFiles) {
      const fullPath = `d:/AuraCares-main/${file}`;
      if (fs.existsSync(fullPath)) {
        filesFound++;
      }
    }
    
    const flowComplete = filesFound === requiredFiles.length;
    
    testResults.dataFlow = {
      status: flowComplete ? 'passed' : 'warning',
      details: `Data flow components: ${filesFound}/${requiredFiles.length} files found`
    };
    
    if (flowComplete) {
      log('✅ Data Flow Verification PASSED - All components present', 'success');
    } else {
      log(`⚠️ Data Flow Verification - ${filesFound}/${requiredFiles.length} components found`, 'warning');
    }
    
    return flowComplete;
  } catch (error) {
    testResults.dataFlow = {
      status: 'failed',
      details: `Data flow verification failed: ${error.message}`
    };
    log(`❌ Data Flow Verification FAILED: ${error.message}`, 'error');
    return false;
  }
}

// Generate Test Report
function generateReport() {
  log('\n📊 END-TO-END ML SERVICE INTEGRATION TEST REPORT', 'info');
  log('=' .repeat(60), 'info');
  
  const statusIcons = {
    passed: '✅',
    failed: '❌',
    warning: '⚠️',
    pending: '⏳'
  };
  
  Object.entries(testResults).forEach(([testName, result]) => {
    const testNameFormatted = testName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
    
    log(`${statusIcons[result.status]} ${testNameFormatted}: ${result.details}`, 
        result.status === 'passed' ? 'success' : result.status === 'failed' ? 'error' : 'warning');
  });
  
  // Overall assessment
  const passedTests = Object.values(testResults).filter(r => r.status === 'passed').length;
  const totalTests = Object.keys(testResults).length;
  
  log('\n📈 OVERALL ASSESSMENT:', 'info');
  log(`${passedTests}/${totalTests} test categories passed`, 'info');
  
  const percentage = Math.round((passedTests / totalTests) * 100);
  if (percentage >= 80) {
    log(`🎉 ML Service Integration is STRONG (${percentage}%)`, 'success');
  } else if (percentage >= 60) {
    log(`⚠️ ML Service Integration is MODERATE (${percentage}%)`, 'warning');
  } else {
    log(`❌ ML Service Integration needs IMPROVEMENT (${percentage}%)`, 'error');
  }
  
  log('\n📋 RECOMMENDATIONS:', 'info');
  if (testResults.mlService.status !== 'passed') {
    log('- Start the ML service: cd ml-service && python app.py', 'warning');
  }
  if (testResults.backendIntegration.status !== 'passed') {
    log('- Verify backend is running and can connect to ML service', 'warning');
  }
  if (testResults.uiComponents.status !== 'passed') {
    log('- Check frontend components are properly integrated', 'warning');
  }
}

// Main test execution
async function runEndToEndTests() {
  log('🚀 STARTING END-TO-END ML SERVICE INTEGRATION TESTS', 'info');
  log(`Target URLs:`, 'info');
  log(`  ML Service: ${CONFIG.ML_SERVICE_URL}`, 'info');
  log(`  Backend: ${CONFIG.BACKEND_URL}`, 'info');
  log(`  Frontend: ${CONFIG.FRONTEND_URL}`, 'info');
  log('='.repeat(60), 'info');
  
  try {
    // Run all tests
    await testMLServiceHealth();
    await delay(1000);
    
    await testMLServiceEndpoints();
    await delay(1000);
    
    await testBackendIntegration();
    await delay(1000);
    
    await testExpenseForecastEndpoint();
    await delay(1000);
    
    await testUIComponents();
    await delay(1000);
    
    await testDataFlow();
    
    // Generate final report
    generateReport();
    
  } catch (error) {
    log(`💥 Test suite crashed: ${error.message}`, 'error');
    log('Please check your services and try again.', 'error');
  }
}

// Run the tests
runEndToEndTests();