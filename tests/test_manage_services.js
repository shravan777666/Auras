import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageServices from './frontend/src/pages/salon/ManageServices.jsx';
import { salonService } from './frontend/src/services/salon.js';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    search: '',
    pathname: '/salon/services'
  })
}));

jest.mock('./frontend/src/services/salon.js', () => ({
  salonService: {
    getServices: jest.fn(),
    deleteService: jest.fn()
  }
}));

jest.mock('./frontend/src/components/common/LoadingSpinner', () => () => <div>Loading...</div>);
jest.mock('./frontend/src/components/salon/AddServiceModal', () => () => <div>Add Service Modal</div>);

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn()
  }
}));

describe('ManageServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles successful service fetch with low bookings filter', async () => {
    // Mock successful API response with low bookings services
    const mockResponse = {
      data: {
        services: [
          {
            _id: '1',
            name: 'Hair Cut',
            description: 'Professional hair cutting service',
            category: 'Hair',
            price: 1500,
            duration: 30,
            totalBookings: 3,
            isActive: true
          },
          {
            _id: '2',
            name: 'Manicure',
            description: 'Nail care service',
            category: 'Nails',
            price: 800,
            duration: 45,
            totalBookings: 2,
            isActive: true
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 1,
          totalItems: 2
        }
      }
    };

    salonService.getServices.mockResolvedValue(mockResponse);

    render(<ManageServices />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that services are displayed
    expect(screen.getByText('Hair Cut')).toBeInTheDocument();
    expect(screen.getByText('Manicure')).toBeInTheDocument();

    // Check that low booking alerts are shown
    expect(screen.getByText('LOW BOOKING ALERT')).toBeInTheDocument();
    expect(screen.getByText('Bookings: 3/Month (Target: 20)')).toBeInTheDocument();
    expect(screen.getByText('Bookings: 2/Month (Target: 20)')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    // Mock API error
    salonService.getServices.mockRejectedValue(new Error('Failed to fetch services'));

    render(<ManageServices />);

    // Wait for error handling
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that error is handled (component should still render)
    expect(screen.getByText('No services found')).toBeInTheDocument();
  });

  test('handles undefined response data gracefully', async () => {
    // Mock response with missing data
    const mockResponse = {
      data: {}
    };

    salonService.getServices.mockResolvedValue(mockResponse);

    render(<ManageServices />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Should show no services found when data is missing
    expect(screen.getByText('No services found')).toBeInTheDocument();
  });

  test('handles null service properties gracefully', async () => {
    // Mock response with null/undefined service properties
    const mockResponse = {
      data: {
        services: [
          {
            _id: null,
            name: null,
            description: null,
            category: null,
            price: null,
            duration: null,
            totalBookings: null,
            isActive: null
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 1,
          totalItems: 1
        }
      }
    };

    salonService.getServices.mockResolvedValue(mockResponse);

    render(<ManageServices />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Should handle null values gracefully
    expect(screen.getByText('Unnamed Service')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
  });
});