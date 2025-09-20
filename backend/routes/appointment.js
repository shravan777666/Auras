import express from 'express';
import {
  bookAppointment,
  getAppointmentDetails,
  updateAppointment,
  getAvailableSlots,
  getAppointmentsSummary,
  submitReview
} from '../controllers/appointmentController.js';
import { requireAuth, requireCustomer } from '../middleware/roleAuth.js';
import { validateAppointment, validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Booking (customers only)
router.post('/book', requireCustomer, validateAppointment, bookAppointment);

// Get available time slots (public for authenticated users)
router.get('/slots/available', getAvailableSlots);

// Appointment management
router.get('/summary', getAppointmentsSummary);
router.get('/:appointmentId', validateObjectId('appointmentId'), getAppointmentDetails);
router.patch('/:appointmentId', validateObjectId('appointmentId'), updateAppointment);
router.post('/:appointmentId/review', requireCustomer, validateObjectId('appointmentId'), submitReview);

export default router;