# Gift Card Verification & Redemption Feature

## Overview
This feature allows salon owners to verify and redeem gift cards using unique codes when customers present them for payment.

## Implementation Summary

### Backend Changes

#### 1. Controllers (`backend/controllers/giftCardController.js`)
- **`verifyGiftCardByCode()`**: Verifies a gift card by its unique code
  - Checks if the card exists for the salon
  - Validates expiry date
  - Checks available balance
  - Returns full card details including validity status

- **`redeemGiftCardByCode()`**: Redeems a gift card
  - Validates the card can be redeemed
  - Supports partial redemption (specify amount) or full redemption
  - Updates balance and status
  - Tracks redemption history in metadata
  - Marks card as "REDEEMED" when balance reaches zero

#### 2. Routes (`backend/routes/giftCard.js`)
- **POST `/api/gift-card/salon/verify-code`**: Verify a gift card
  - Requires: `code` (string)
  - Returns: Card details with validity status

- **POST `/api/gift-card/salon/redeem-code`**: Redeem a gift card
  - Requires: `code` (string)
  - Optional: `amount` (number), `notes` (string)
  - Returns: Redemption details with remaining balance

### Frontend Changes

#### 1. Service (`frontend/src/services/giftCardService.js`)
- **`verifyGiftCardByCode(code)`**: Calls verification API
- **`redeemGiftCardByCode(code, amount, notes)`**: Calls redemption API

#### 2. Component (`frontend/src/components/salon/GiftCardRedemption.jsx`)
A comprehensive UI component with:
- Code input and verification
- Real-time card status display
- Balance information
- Redemption form with partial/full amount support
- Notes field for record keeping
- Success/error messaging
- Auto-reset after full redemption

#### 3. Page (`frontend/src/pages/salon/GiftCardRedemption.jsx`)
Wrapper page for the component

#### 4. Routing (`frontend/src/App.jsx`)
- Added route: `/salon/gift-card-redemption`
- Protected route (salon owners only)

#### 5. Dashboard Integration (`frontend/src/pages/salon/SalonDashboard.jsx`)
- Added "Redeem Gift Card" button in Gift Cards section
- Updated feature list to include redemption

## How to Use

### For Salon Owners:

1. **Navigate to Redemption Page**
   - From Salon Dashboard → Gift Cards → Click "Redeem Gift Card" button
   - Or navigate directly to `/salon/gift-card-redemption`

2. **Verify Gift Card**
   - Enter the gift card code (e.g., AURA-1A2B3C)
   - Click "Verify" button
   - View card details including:
     - Original amount
     - Current balance
     - Expiry date
     - Usage type
     - Recipient information
     - Validity status

3. **Redeem Gift Card**
   - If card is valid, enter redemption amount
   - Add optional notes (e.g., service details, appointment ID)
   - Click "Redeem" button
   - Card balance is updated immediately
   - If fully redeemed, card status changes to "REDEEMED"

### API Examples

**Verify a Gift Card:**
```javascript
POST /api/gift-card/salon/verify-code
{
  "code": "AURA-1A2B3C"
}
```

**Redeem a Gift Card (Full Balance):**
```javascript
POST /api/gift-card/salon/redeem-code
{
  "code": "AURA-1A2B3C"
}
```

**Redeem a Gift Card (Partial Amount):**
```javascript
POST /api/gift-card/salon/redeem-code
{
  "code": "AURA-1A2B3C",
  "amount": 500,
  "notes": "Used for haircut service - Appointment #12345"
}
```

## Features

### Validation
- Code format validation (4-20 characters)
- Salon ownership verification
- Expiry date checking
- Balance verification
- Status validation (must be ACTIVE)

### Redemption Tracking
- Redemption count
- Redemption history in metadata
- Timestamp of redemption
- User who redeemed the card
- Optional notes for each redemption

### User Experience
- Real-time feedback
- Color-coded status indicators
- Automatic form reset after full redemption
- Comprehensive error messages
- Success confirmations
- Responsive design

## Business Logic

### Card States
- **ACTIVE**: Card is valid and has balance
- **EXPIRED**: Past expiry date
- **REDEEMED**: Balance is zero
- **INACTIVE**: Manually deactivated

### Redemption Rules
1. Card must be ACTIVE
2. Card must not be expired
3. Card must have remaining balance
4. Redemption amount cannot exceed balance
5. Partial redemption is allowed
6. Full redemption changes status to REDEEMED

## Security
- Salon owner authentication required
- Cards can only be verified/redeemed by their owning salon
- Input validation on both frontend and backend
- Error messages don't expose sensitive information

## Next Steps (Optional Enhancements)
- Add QR code scanning for gift card codes
- Generate redemption receipts/PDFs
- Send email notifications on redemption
- Analytics dashboard for gift card usage
- Integration with appointment/service booking
- Multi-card redemption for single transaction
