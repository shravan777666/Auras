# Attendance Marking Implementation

## Overview
This document describes the implementation of attendance marking functionality for the Salon Dashboard, specifically through the Staff Availability Calendar component.

## Features Implemented

### 1. Backend Implementation
- **Attendance Model**: Created a new MongoDB model to track staff attendance with fields for date, status, check-in/out times, and notes.
- **API Endpoints**: Added two new endpoints to the salon routes:
  - `POST /salon/staff/:staffId/attendance` - Mark staff attendance
  - `POST /salon/staff/:staffId/shifts` - Add staff shifts
- **Controller Functions**: Implemented `markStaffAttendance` and `addStaffShift` functions in the salon controller to handle the business logic.
- **Route Imports**: Updated the salon routes file to properly import the new controller functions.

### 2. Frontend Implementation
- **Service Methods**: Added `markStaffAttendance` and `addStaffShift` methods to the salon service.
- **UI Enhancement**: Updated both calendar components with:
  - Visual indicators for today's date
  - Action buttons for marking attendance (checkmark icon) and adding shifts (plus icon) visible for all dates
  - Increased calendar cell height to accommodate buttons and appointments
  - Action guide for users
  - Added missing functionality to the individual staff view (StaffAppointmentsCalendar.jsx)

### 3. User Workflow
1. Navigate to the Staff Availability Calendar from the Salon Dashboard
2. Select the desired month using the navigation arrows
3. For any date in the calendar:
   - For staff with scheduled appointments: Click the green checkmark button to mark them as present
   - For staff without scheduled appointments: Click the blue plus button to add a shift for them

## Technical Details

### Attendance Model Schema
```javascript
{
  staffId: ObjectId (reference to Staff),
  salonId: ObjectId (reference to Salon),
  date: String (YYYY-MM-DD format),
  status: String (Present, Absent, Late, Half-Day),
  checkInTime: String (HH:mm format),
  checkOutTime: String (HH:mm format),
  notes: String,
  createdBy: ObjectId (reference to User)
}
```

### Dummy Customer for Staff Shifts
For staff shifts that don't involve actual customers, a dummy customer with ID `000000000000000000000000` is used to satisfy the Appointment model requirements.

### API Endpoints

#### Mark Attendance
```
POST /salon/staff/:staffId/attendance
Body: {
  date: "YYYY-MM-DD",
  status: "Present|Absent|Late|Half-Day",
  checkInTime: "HH:mm",
  checkOutTime: "HH:mm",
  notes: "Optional notes"
}
```

#### Add Shift
```
POST /salon/staff/:staffId/shifts
Body: {
  date: "YYYY-MM-DD",
  startTime: "HH:mm",
  endTime: "HH:mm",
  notes: "Optional notes"
}
```

## Usage Instructions

### Marking Attendance for Scheduled Staff
1. Navigate to the Salon Dashboard
2. Click "View Calendar" in the Staff Availability Calendar section
3. Select the desired month using the navigation arrows
4. Find the date with the staff member's scheduled appointments
5. Click the green checkmark icon to mark them as present

### Adding Shifts for Unscheduled Staff
1. Navigate to the Salon Dashboard
2. Click "View Calendar" in the Staff Availability Calendar section
3. Select the desired month using the navigation arrows
4. Find the date where you want to add a shift for a staff member
5. Click the blue plus icon to add a shift for them

## Troubleshooting
If you encounter a "ReferenceError: markStaffAttendance is not defined" error:
1. Ensure that the controller functions are properly imported in the salon routes file
2. Verify that the function names match exactly between the controller and routes files
3. Restart the backend server after making changes

## Testing
Unit tests have been created for the attendance marking functionality:
- `markStaffAttendance` controller function
- `addStaffShift` controller function
- Error handling for invalid staff IDs

To run the tests:
```bash
cd backend
npx jest __tests__/attendanceController.test.js
```

A test script is also available at `backend/test_attendance.js` for manual testing.

## Future Enhancements
- Add a modal for entering detailed attendance information (check-in time, check-out time, notes)
- Implement attendance reporting and analytics
- Add notifications to staff when their attendance is marked
- Include attendance status visualization in the calendar