# Loyalty Points Redemption Feature

## Overview
This feature allows customers to redeem their loyalty points during the booking process to get discounts on their appointments. Customers can redeem points in multiples of 100, with each 100 points equaling ₹100 discount.

## Frontend Components

### 1. CustomerLoyaltyCard Component (Dashboard)
Located at: `frontend/src/components/customer/CustomerLoyaltyCard.jsx`

**Enhancements:**
- Added "Redeem" button next to the redemption information
- Clicking the button navigates to the booking page with redemption pre-enabled
- Button is disabled if customer has less than 100 points

### 2. LoyaltyRedemptionWidget Component (Booking Page)
Located at: `frontend/src/components/customer/LoyaltyRedemptionWidget.jsx`

**Features:**
- Toggle to enable/disable points redemption
- Points input field with validation (min 100, max available, multiples of 100)
- Real-time calculation of discount and final amount
- Visual display of available points and maximum redeemable amount
- Error prevention for service total less than discount amount

### 3. BookAppointment Page
Located at: `frontend/src/pages/customer/BookAppointment.jsx`

**Enhancements:**
- Integrated LoyaltyRedemptionWidget after date/time selection
- Added state management for redemption data
- Updated booking submission to include redemption information
- Added service total and final amount display
- Enhanced validation for points redemption

## Backend Implementation

### 1. Enhanced Booking Endpoint
**Endpoint:** `POST /api/appointment/book`

**Request Body:**
```json
{
  "salonId": "68cceb54faf3e420e3dae255",
  "services": [...],
  "appointmentDate": "2025-10-17",
  "appointmentTime": "10:00",
  "pointsToRedeem": 100,
  "discountAmount": 100
}
```

### 2. Points Processing Logic
Located at: `backend/controllers/appointmentController.js`

**Validation:**
- Minimum redemption: 100 points
- Multiples of 100 points only
- Sufficient points in customer account
- Discount amount equals points redeemed
- Discount doesn't exceed service total

**Processing:**
- Deduct points from customer's loyaltyPoints balance
- Update customer's totalPointsRedeemed
- Set appointment's pointsRedeemed and discountFromPoints fields
- Adjust finalAmount based on discount

## Integration Flow

### Customer Journey:
1. **Dashboard:** Customer sees 338 loyalty points on dashboard
2. **Redeem Points:** Clicks "Redeem" button on loyalty card
3. **Booking Page:** Navigates to booking page with redemption pre-enabled
4. **Service Selection:** Selects services (e.g., Haircut for ₹300)
5. **Points Redemption:** 
   - Sees available 338 points
   - Enters 100 points to redeem
   - Sees discount of ₹100
   - Sees final amount of ₹200
6. **Booking Confirmation:** Completes booking with discount applied
7. **Points Update:** Loyalty points reduced from 338 to 238

## Validation & Error Handling

### Frontend Validation:
- Points input validation (min 100, max available, multiples of 100)
- Service total vs discount comparison
- Real-time error messaging
- Disabled booking button when validation fails

### Backend Validation:
- Points sufficiency check
- Minimum redemption requirement
- Multiples of 100 validation
- Discount amount matching points validation
- Service total vs discount validation

### Error Messages:
- "Insufficient points. You have X points available."
- "Minimum redemption is 100 points"
- "Points must be redeemed in multiples of 100"
- "Discount amount cannot exceed service total"
- "Invalid discount amount. Points redemption value must equal points count."

## Testing

### Test Cases:
1. Successful redemption of 100 points for ₹100 discount
2. Redemption with maximum available points
3. Insufficient points error handling
4. Minimum redemption validation
5. Multiples of 100 validation
6. Discount exceeding service total prevention
7. Points to discount amount matching validation

### Test Data:
- Customer with 338 loyalty points
- Service total: ₹300
- Points to redeem: 100
- Expected discount: ₹100
- Expected final amount: ₹200
- Expected remaining points: 238

## API Endpoints

### Booking with Points Redemption
```
POST /api/appointment/book
```

**Request:**
```json
{
  "salonId": "68cceb54faf3e420e3dae255",
  "services": [
    {
      "serviceId": "service_id",
      "serviceName": "Haircut",
      "price": 300,
      "duration": 30
    }
  ],
  "appointmentDate": "2025-10-17",
  "appointmentTime": "10:00",
  "pointsToRedeem": 100,
  "discountAmount": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "appointment_id",
      "customerId": "customer_id",
      "salonId": "salon_id",
      "services": [...],
      "appointmentDate": "2025-10-17T10:00",
      "totalAmount": 300,
      "finalAmount": 200,
      "pointsRedeemed": 100,
      "discountFromPoints": 100,
      "status": "Pending"
    }
  },
  "message": "Appointment booked successfully! Confirmation email sent."
}
```