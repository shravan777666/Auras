# Loyalty Points System for AuraCares

## Overview

The Loyalty Points System is a comprehensive rewards program integrated into the AuraCares beauty parlor management application. It allows customers to earn points for their purchases and redeem them for discounts on future bookings.

## System Architecture

### Database Schema Updates

#### Customer Model Enhancements
```javascript
// Added to existing Customer schema
loyaltyPoints: { type: Number, default: 0 },
totalPointsEarned: { type: Number, default: 0 },
totalPointsRedeemed: { type: Number, default: 0 },
loyaltyTier: { type: String, default: 'Standard' }
```

#### Appointment Model Enhancements
```javascript
// Added to existing Appointment schema
pointsEarned: { type: Number, default: 0 },
pointsRedeemed: { type: Number, default: 0 },
discountFromPoints: { type: Number, default: 0 }
```

### Business Rules

1. **Earning Rate**: 1 Point for every ₹10 spent
2. **Redemption Value**: 100 Points = ₹100 discount
3. **Minimum Redemption**: 100 points minimum
4. **Loyalty Tiers**:
   - Standard: 0-499 points
   - Silver: 500-1999 points
   - Gold: 2000-4999 points
   - Platinum: 5000+ points

## Implementation Details

### Backend Components

#### 1. Database Models
- **Customer.js**: Enhanced with loyalty fields
- **Appointment.js**: Enhanced with points tracking and automatic points calculation on completion

#### 2. Controller
- **loyaltyController.js**: Handles all loyalty-related operations
  - Point redemption
  - Customer loyalty details retrieval
  - Salon analytics metrics
  - Top loyalty customers

#### 3. Routes
- **loyalty.js**: API endpoints for loyalty operations
  - `POST /api/loyalty/customer/redeem` - Redeem points
  - `GET /api/loyalty/customer/:customerId/details` - Get customer loyalty details
  - `GET /api/loyalty/salon/dashboard-metrics` - Get loyalty analytics
  - `GET /api/loyalty/salon/top-customers` - Get top loyalty customers

### Frontend Components

#### 1. Customer Components
- **CustomerLoyaltyCard.jsx**: Displays loyalty points in customer dashboard
- **LoyaltyRedemptionWidget.jsx**: Allows point redemption during checkout

#### 2. Salon Components
- **LoyaltyAnalyticsCard.jsx**: Shows loyalty program metrics in salon dashboard
- **TopLoyaltyClients.jsx**: Displays top loyalty customers

## Display Locations

### 1. Customer Profile Dashboard
- **Component**: CustomerLoyaltyCard
- **Location**: Integrated into CustomerDashboard
- **Features**:
  - Current loyalty points balance
  - Rupee equivalent value
  - Loyalty tier status
  - Total points earned/redeemed

### 2. Checkout/Billing Screen
- **Component**: LoyaltyRedemptionWidget
- **Location**: Can be integrated into booking confirmation flow
- **Features**:
  - Current available points balance
  - Input field for points redemption
  - Real-time discount calculation
  - Updated final amount after redemption

### 3. Owner/Staff Dashboard
- **Components**: LoyaltyAnalyticsCard, TopLoyaltyClients
- **Location**: Integrated into FinancialDashboard
- **Features**:
  - Total points issued this month
  - Points redeemed ratio
  - Top 5 loyalty clients
  - Loyalty program performance metrics

## API Endpoints

### Customer Endpoints
```
POST /api/loyalty/customer/redeem
  Body: { customerId, pointsToRedeem, appointmentId }
  Response: Updated customer and appointment data

GET /api/loyalty/customer/:customerId/details
  Response: { loyaltyPoints, totalPointsEarned, totalPointsRedeemed, loyaltyTier }
```

### Salon Endpoints
```
GET /api/loyalty/salon/dashboard-metrics
  Response: { totalPointsIssued, totalPointsRedeemed, redemptionRatio }

GET /api/loyalty/salon/top-customers?limit=5
  Response: Array of top customers with loyalty data
```

## Integration Points

### 1. Appointment Completion
When an appointment status is updated to "Completed", the system automatically:
1. Calculates points earned (₹ spent / 10)
2. Updates customer loyalty points balance
3. Updates customer total points earned
4. Updates loyalty tier based on total points
5. Records points earned in appointment

### 2. Point Redemption
When customers redeem points:
1. Validates sufficient points balance
2. Validates minimum redemption amount (100 points)
3. Calculates discount amount (points = rupees)
4. Updates appointment total
5. Updates customer points balance

## Testing

### Backend Tests
- **test_loyalty_system.js**: Comprehensive test suite for loyalty functionality

### Manual Verification
1. Create a customer account
2. Complete an appointment to earn points
3. Verify points appear in customer dashboard
4. Redeem points during checkout
5. Verify updated balances and discounts

## Future Enhancements

1. **Advanced Tiers**: Add exclusive benefits for higher tiers
2. **Special Promotions**: Bonus points for specific services or periods
3. **Referral Program**: Points for referring new customers
4. **Birthday Rewards**: Special point bonuses
5. **Anniversary Rewards**: Points for loyalty milestones

## Troubleshooting

### Common Issues

1. **Points Not Awarded**
   - Verify appointment status is set to "Completed"
   - Check customer ID association
   - Review backend logs for errors

2. **Redemption Errors**
   - Verify sufficient points balance
   - Check minimum redemption requirements
   - Ensure appointment ID is valid

3. **Tier Not Updating**
   - Verify total points earned calculation
   - Check tier threshold values
   - Review customer data integrity

## Security Considerations

1. **Authentication**: All loyalty endpoints require proper authentication
2. **Authorization**: Customers can only access their own data
3. **Validation**: Input validation for all point transactions
4. **Audit Trail**: All point transactions are recorded in appointment data

## Performance Optimization

1. **Database Indexes**: Indexed on customer ID and appointment status
2. **Caching**: Customer loyalty data cached for dashboard display
3. **Pagination**: Top customers list uses pagination
4. **Efficient Queries**: Aggregation pipelines for analytics data