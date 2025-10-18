# Salon Appointment Reschedule Feature

## Overview
This feature allows salon owners to reschedule appointments directly from the appointments page. Salon owners can modify the date, time, staff assignment, and status of an appointment.

## Frontend Components

### 1. RescheduleModal Component
Located at: `frontend/src/components/salon/RescheduleModal.jsx`

Features:
- Date/time picker for new appointment time
- Staff assignment dropdown with salon staff members
- Status selection dropdown
- Notes field for rescheduling reasons
- Form validation
- Loading states

### 2. SalonAppointments Page
Modified to include:
- Reschedule button on each appointment card
- Integration with RescheduleModal
- Refresh functionality after rescheduling
- Real-time updates to appointment counts

## Backend Implementation

### 1. API Endpoint
```
PATCH /api/salon/appointments/:id/reschedule
```

#### Request Body
```json
{
  "newDateTime": "2025-10-17T10:00:00.000Z",
  "newStaffId": "staff_object_id",
  "newStatus": "Approved",
  "notes": "Rescheduled from October 18"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "appointment": {
      // Updated appointment object
    }
  },
  "message": "Appointment rescheduled successfully"
}
```

### 2. Controller Function
Located at: `backend/controllers/appointmentController.js`
- Function: `rescheduleAppointment`
- Validates salon owner permissions
- Checks staff availability for new time slots
- Updates appointment fields
- Appends rescheduling notes with timestamp

### 3. Service Function
Located at: `frontend/src/services/salon.js`
- Function: `rescheduleAppointment`
- Handles API call to backend
- Error handling and response processing

## Usage Flow

1. Salon owner views appointments on the `/appointments` page
2. Finds the appointment for "Ronaldo" with "Cancelled" status
3. Clicks the "Reschedule" button on that appointment card
4. Reschedule modal opens with current appointment details pre-filled
5. Salon owner modifies:
   - Date to today (2025-10-17)
   - Time to 10:00
   - Status from "Cancelled" to "Approved"
   - Staff remains as "Lamala" (or can be changed)
   - Adds notes: "Rescheduled from October 18"
6. Salon owner submits the form
7. Backend validates the changes and updates the appointment
8. Frontend refreshes the appointment list and status counters
9. Success notification is displayed

## Validation & Error Handling

### Backend Validation
- Salon owner permissions (must own the salon)
- Staff belongs to the same salon
- Staff availability for new time slots
- Required fields validation
- Staff skill requirements for services

### Frontend Validation
- Form field validation
- Error messaging
- Loading states during API calls
- Success/error notifications

## Integration Points

1. **Appointment Counts**: Status counters update in real-time
2. **Staff Assignment**: Dropdown shows available salon staff
3. **Real-time Updates**: UI updates immediately after rescheduling
4. **Notes System**: Rescheduling notes are appended to salon notes with timestamp

## Testing

To test the reschedule feature:
1. Run the backend server
2. Log in as a salon owner
3. Navigate to the `/appointments` page
4. Find an appointment with "Cancelled" status
5. Click the "Reschedule" button
6. Change date to today (2025-10-17)
7. Change status to "Approved"
8. Submit the form
9. Verify the appointment is updated in the UI and status counters