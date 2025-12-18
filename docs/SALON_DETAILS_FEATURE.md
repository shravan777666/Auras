# Salon Details Feature Documentation

## Overview

The Salon Details feature provides administrators with detailed financial analytics for individual salons. This feature allows admins to drill down from the Financial Summary dashboard to view salon-specific performance metrics, revenue trends, and expense breakdowns.

## Features

### 1. Navigation
- Accessible from the "View Details" button in the Salon P/L Performance table
- Back navigation to Financial Summary page
- Responsive design for all device sizes

### 2. Salon Information
- Salon name, owner, contact details, and status
- Clear identification of the selected salon

### 3. Financial Metrics
- **Total Revenue**: Aggregate revenue for the selected salon
- **Total Profit/Loss**: Net financial performance indicator
- **Profit Margin**: Percentage of revenue retained as profit
- **Avg. Revenue/Day**: Daily revenue average

### 4. Revenue Trend Analysis
- Interactive line/bar chart visualization
- Revenue, costs, and net profit trends over time
- Toggle between chart types

### 5. Expense Breakdown
- Pie/donut chart showing expense distribution
- Categorized expense details with amounts and percentages
- Visual progress bars for comparison

## Technical Implementation

### Frontend Components
- **SalonDetailsPage.jsx**: Main salon details page component
- **StatCard**: Reusable component for key metrics
- **ProgressBar**: Visual indicator for metrics

### Backend Services
- **getSalonById**: Retrieves basic salon information by ID
- **getSalonFinancialData**: Retrieves salon-specific financial summary
- **getSalonRevenueTrend**: Provides revenue trend data for charts
- **getSalonExpenseBreakdown**: Returns categorized expense data

### API Endpoints
```
GET /api/admin/salons/:id                    # Get salon details by ID
GET /api/admin/salons/:id/financial-data      # Salon financial summary
GET /api/admin/salons/:id/revenue-trend       # Revenue trend data
GET /api/admin/salons/:id/expense-breakdown   # Expense breakdown data
```

## User Flow

1. Admin navigates to Financial Summary dashboard
2. Admin views the Salon P/L Performance table
3. Admin clicks "View Details" for a specific salon
4. System navigates to `/admin/salon/[id]/details`
5. Salon details page loads with financial data
6. Admin can filter by time period or export reports
7. Admin can navigate back to Financial Summary

## Error Handling

### Loading States
- Skeleton loaders during initial data fetch
- Loading spinner during filter updates

### Error States
- "Salon Not Found" for invalid salon IDs
- "Error Loading Data" with retry functionality
- Empty states for missing financial data

### Validation
- Time period validation (end date cannot be before start date)
- Proper error messages for API failures

## Responsive Design

### Desktop
- Full-width dashboard layout
- Multi-column grid for metrics
- Side-by-side chart visualizations

### Tablet
- Responsive grid layout
- Adjusted chart sizes
- Maintained readability

### Mobile
- Single-column layout
- Touch-friendly navigation
- Scrollable content sections

## Accessibility

### Navigation
- Keyboard navigable interface
- Clear focus indicators
- Semantic HTML structure

### Visual Design
- Sufficient color contrast
- Meaningful iconography
- Consistent styling with Financial Summary

## Data Formats

### Currency
- Indian Rupee (₹) formatting
- Thousands separators
- Two decimal places for precision

### Percentages
- One decimal place precision
- Color-coded positive/negative values
- Trend indicators (↑/↓ arrows)

## Future Enhancements

1. **Advanced Analytics**
   - Year-over-year comparisons
   - Staff performance correlations
   - Service popularity trends

2. **Export Functionality**
   - PDF report generation
   - Excel data export
   - Custom report templates

3. **Enhanced Visualizations**
   - Interactive charts with drill-down capabilities
   - Geographic performance mapping
   - Comparative analysis tools

4. **Real-time Updates**
   - WebSocket integration for live data
   - Automated report generation
   - Alert system for significant changes