import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PLTrendBarChart = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 font-medium">Error loading chart data</div>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500">No data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Format data for Chart.js
  const chartData = {
    labels: data.map(item => {
      // Format period based on the date format (YYYY-MM for monthly, YYYY-WW for weekly, YYYY-MM-DD for daily)
      const period = item.period;
      if (period.includes('-') && period.length === 7) {
        // Monthly format: YYYY-MM
        const [year, month] = period.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
      } else if (period.includes('-') && period.length === 10) {
        // Daily format: YYYY-MM-DD
        const [year, month, day] = period.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
      } else if (period.includes('-') && period.length === 8) {
        // Weekly format: YYYY-WW
        const [year, week] = period.split('-');
        return `W${week} ${year}`;
      }
      return period;
    }),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue),
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // green-500 with opacity
        borderColor: '#10B981', // green-500
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Costs',
        data: data.map(item => item.costs),
        backgroundColor: 'rgba(245, 158, 11, 0.7)', // amber-500 with opacity
        borderColor: '#F59E0B', // amber-500
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Net Profit/Loss',
        data: data.map(item => item.profit),
        backgroundColor: data.map(item => item.profit >= 0 
          ? 'rgba(16, 185, 129, 0.7)'  // green-500 for profit
          : 'rgba(220, 38, 38, 0.7)'), // red-600 for loss
        borderColor: data.map(item => item.profit >= 0 
          ? '#10B981'  // green-500 for profit
          : '#DC2626'), // red-600 for loss
        borderWidth: 1,
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(tooltipItems) {
            return `Period: ${tooltipItems[0].label}`;
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              // Format currency in Indian format
              label += new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(context.parsed.y);
              
              // Add indicator for profit/loss
              if (context.dataset.label === 'Net Profit/Loss') {
                label += context.parsed.y >= 0 ? ' (Profit)' : ' (Loss)';
              }
            }
            return label;
          },
          afterBody: function(tooltipItems) {
            // Add profit margin calculation
            const revenueItem = tooltipItems.find(item => item.dataset.label === 'Revenue');
            const profitItem = tooltipItems.find(item => item.dataset.label === 'Net Profit/Loss');
            
            if (revenueItem && profitItem && revenueItem.parsed.y > 0) {
              const margin = ((profitItem.parsed.y / revenueItem.parsed.y) * 100).toFixed(1);
              return [`Profit Margin: ${margin}%`];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Period',
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'normal'
          }
        },
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Revenue & Costs (₹)',
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'normal'
          }
        },
        grid: {
          drawTicks: false,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#6B7280',
          callback: function(value) {
            // Format large numbers in readable format (K, L for lakhs, Cr for crores)
            if (value >= 10000000) {
              return '₹' + (value / 10000000).toFixed(1) + 'Cr';
            } else if (value >= 100000) {
              return '₹' + (value / 100000).toFixed(1) + 'L';
            } else if (value >= 1000) {
              return '₹' + (value / 1000).toFixed(1) + 'K';
            }
            return '₹' + value;
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Net Profit/Loss (₹)',
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'normal'
          }
        },
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
        ticks: {
          color: '#6B7280',
          callback: function(value) {
            // Format large numbers in readable format (K, L for lakhs, Cr for crores)
            if (value >= 10000000) {
              return '₹' + (value / 10000000).toFixed(1) + 'Cr';
            } else if (value >= 100000) {
              return '₹' + (value / 100000).toFixed(1) + 'L';
            } else if (value >= 1000) {
              return '₹' + (value / 1000).toFixed(1) + 'K';
            }
            return '₹' + value;
          }
        }
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default PLTrendBarChart;