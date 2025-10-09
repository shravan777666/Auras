# Salon Owner Dashboard - Pending Leave Requests Fix

## Problem
The salon owner's dashboard was not displaying pending leave requests in the "Pending Schedule Request" card, even though the schedulerequest collection contained multiple valid requests with type: "leave" and leave.status: "pending".

## Root Cause
The issue was in the `getPendingRequestsForOwner` function in [backend/controllers/scheduleRequestController.js](file:///d:/AuraCares-main/backend/controllers/scheduleRequestController.js). The function was only looking up salons by the `ownerId` field, but some salon records in the database did not have this field populated, even though they had a corresponding user account.

## Solution
Modified the `getPendingRequestsForOwner` function to add a fallback mechanism:

1. First try to find the salon by `ownerId` (existing behavior)
2. If not found, fallback to looking up the User by ID and then find the Salon by the user's email

This ensures that even if the `ownerId` field is not set on the Salon document, the function can still find the correct salon by matching the user's email.

## Code Changes
In [backend/controllers/scheduleRequestController.js](file:///d:/AuraCares-main/backend/controllers/scheduleRequestController.js), the `getPendingRequestsForOwner` function was updated:

```javascript
// First get the salon owned by this user
// Try to find by ownerId first, then fallback to email matching
let salon = await Salon.findOne({ ownerId: salonOwnerId });

// If not found by ownerId, try to find by user email
if (!salon) {
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(salonOwnerId);
  if (user && user.type === 'salon') {
    salon = await Salon.findOne({ email: user.email });
  }
}
```

## Verification
Created and ran a test script that verifies the fix works correctly:
- The function correctly handles the case where a salon doesn't have ownerId set
- Falls back to email-based lookup successfully
- Returns the correct pending schedule requests with staff information populated
- Maintains compatibility with existing salon records that do have ownerId set

## Result
The "Pending Schedule Requests" section on the Salon Owner's dashboard now properly displays pending leave requests and other schedule requests, resolving the issue where the card was showing "No pending schedule requests" despite valid requests existing in the database.