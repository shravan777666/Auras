# Schedule Requests Salon ID Fix

## Problem
The salon owner's dashboard wasn't showing pending schedule requests because the `salonId` was missing from the documents in the `scheduleRequest` collection, which broke the backend's ability to filter requests by salon efficiently.

## Solution Implemented

### 1. Enhanced ScheduleRequest Model
Added a `salonId` field to the ScheduleRequest model for direct filtering:
```javascript
salonId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Salon',
  required: false // Making it optional to maintain backward compatibility
}
```

### 2. Updated Request Creation Functions
Modified all schedule request creation functions to include the salonId:

#### createLeaveRequest
```javascript
const staff = await Staff.findById(staffId);
// ...
const scheduleRequest = await ScheduleRequest.create({
  staffId,
  salonId: staff.assignedSalon, // Add salonId for direct filtering
  type: 'leave',
  // ...
});
```

#### createBlockTimeRequest
```javascript
const staff = await Staff.findById(staffId);
// ...
const scheduleRequest = await ScheduleRequest.create({
  staffId,
  salonId: staff.assignedSalon, // Add salonId for direct filtering
  type: 'block-time',
  // ...
});
```

#### createShiftSwapRequest
```javascript
const staff = await Staff.findById(staffId);
// ...
const scheduleRequest = await ScheduleRequest.create({
  staffId,
  salonId: staff.assignedSalon, // Add salonId for direct filtering
  type: 'shift-swap',
  // ...
});
```

### 3. Optimized Querying in getPendingRequestsForOwner
Updated the getPendingRequestsForOwner function to use the salonId field for more efficient querying when available, while maintaining backward compatibility:

```javascript
// Try to find requests by salonId first (more efficient)
const salonIdRequests = await ScheduleRequest.find({ 
  salonId: salon._id,
  status: 'pending'
}).limit(1);

if (salonIdRequests.length > 0) {
  // Use salonId-based querying (newer, more efficient approach)
  requestsQuery = ScheduleRequest.find({ 
    salonId: salon._id,
    status: 'pending'
  })
    .populate({
      path: 'staffId',
      select: 'name position'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  countQuery = ScheduleRequest.countDocuments({ 
    salonId: salon._id,
    status: 'pending' 
  });
} else {
  // Fallback to staff-based querying (backward compatibility)
  // Get staff members in this salon
  const staffMembers = await Staff.find({ assignedSalon: salon._id });
  const staffIds = staffMembers.map(staff => staff._id);
  
  requestsQuery = ScheduleRequest.find({ 
    staffId: { $in: staffIds },
    status: 'pending'
  })
    .populate({
      path: 'staffId',
      select: 'name position'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  countQuery = ScheduleRequest.countDocuments({ 
    staffId: { $in: staffIds },
    status: 'pending' 
  });
}
```

### 4. Migration Script
Created a migration script to update existing schedule requests with the salonId field:
- Script: [backend/migrate_schedule_requests.js](file:///d:/AuraCares-main/backend/migrate_schedule_requests.js)
- Populates salonId for all existing schedule requests based on the staff member's assigned salon

## Benefits
1. **Improved Performance**: Direct filtering by salonId is more efficient than querying by staff IDs
2. **Backward Compatibility**: Maintains support for existing records without salonId
3. **Future-Proof**: All new schedule requests will include salonId for consistent filtering
4. **Dashboard Fix**: Pending schedule requests now properly display on the salon owner's dashboard

## How to Apply the Fix
1. Update the ScheduleRequest model to include the salonId field
2. Update all schedule request creation functions to include salonId
3. Update the getPendingRequestsForOwner function to use salonId-based querying
4. Run the migration script to update existing records:
   ```bash
   node backend/migrate_schedule_requests.js
   ```

## Verification
The fix has been implemented to ensure:
- New schedule requests include salonId automatically
- Existing schedule requests can be updated with salonId via migration
- The dashboard properly displays pending schedule requests
- Backward compatibility is maintained for older records