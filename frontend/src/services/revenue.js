import { api } from './api';

class RevenueService {
  // Get comprehensive revenue data for dashboard
  async getRevenueData() {
    try {
      const response = await api.get('/revenue/data');
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
  }

  // Get detailed revenue records with pagination and filters
  async getRevenueRecords(params = {}) {
    try {
      const response = await api.get('/revenue/records', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue records:', error);
      throw error;
    }
  }

  // Get revenue analytics for charts
  async getRevenueAnalytics() {
    try {
      const response = await api.get('/revenue/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  }

  // Helper method to format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  // Helper method to format date
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Helper method to format date and time
  formatDateTime(date) {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calculate profit/loss
  calculateProfit(revenue, expenses) {
    return revenue - expenses;
  }

  // Get profit status (profit/loss) with color coding
  getProfitStatus(profit) {
    if (profit > 0) {
      return { status: 'Profit', color: 'text-green-600', bgColor: 'bg-green-100' };
    } else if (profit < 0) {
      return { status: 'Loss', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else {
      return { status: 'Break-even', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  }

  // Export revenue data to CSV
  exportToCSV(records, filename = 'revenue_records') {
    if (!records || records.length === 0) {
      throw new Error('No data to export');
    }

    const headers = ['Date', 'Customer', 'Service/Sale', 'Amount (₹)'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        this.formatDate(record.date),
        record.customer?.name || 'N/A',
        record.service || 'N/A',
        record.amount || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Get financial forecast for next week
  async getFinancialForecast() {
    try {
      const response = await api.get('/financial-forecast/forecast');
      return response.data;
    } catch (error) {
      console.error('Error fetching financial forecast:', error);
      throw error;
    }
  }
}

export const revenueService = new RevenueService();
export default revenueService;
