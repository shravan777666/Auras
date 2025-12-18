# Attendance Function Scope Fix

## Issue Identified
When trying to mark attendance in the individual staff view, the console showed the error:
```
"StaffAppointmentsCalendar.jsx:701 Error marking attendance: ReferenceError: fetchStaffAvailability is not defined
    at markAttendance (StaffAppointmentsCalendar.jsx:696:7)
```

## Root Cause
The `markAttendance` and `addShift` functions were incorrectly placed after the component's return statement and export, which meant they were not part of the component scope. This caused them to be unable to access the `fetchStaffAvailability` function that was defined within the component.

## Solution Implemented
Moved the `markAttendance` and `addShift` functions to the correct location within the component scope, specifically after the `assignStaffToAppointment` function and before the component's return statement.

## Files Modified
1. `frontend/src/components/salon/StaffAppointmentsCalendar.jsx` - Corrected function placement

## Verification
The error should now be resolved, and the attendance marking functionality should work correctly in the individual staff view.