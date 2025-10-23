// Test if the component can be imported and instantiated
import React from 'react';

// Mock the dependencies
jest.mock('../../services/salon', () => ({
  salonService: {
    getExpenseForecast: jest.fn()
  }
}));

jest.mock('../../components/common/BackButton', () => () => <div>BackButton</div>);
jest.mock('../../components/salon/NextMonthExpenseForecast', () => () => <div>NextMonthExpenseForecast</div>);

// Test if we can import the component
import ExpenseTracking from './frontend/src/pages/salon/ExpenseTracking.jsx';

console.log('ExpenseTracking component imported successfully');

// Test if we can import the forecast component
import NextMonthExpenseForecast from './frontend/src/components/salon/NextMonthExpenseForecast.jsx';

console.log('NextMonthExpenseForecast component imported successfully');

console.log('All components imported successfully!');