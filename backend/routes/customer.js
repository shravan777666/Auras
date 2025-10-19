import express from 'express';
import {
  getDashboard,
  getProfile,
  updateProfile,
  browseSalons,
  getSalonDetails,
  searchServices,
  getBookings,
  cancelBooking,
  rateAppointment,
  getSalonAvailability,
  updateFavoriteSalon,
  getRecentSalons
} from '../controllers/customerController.js';
import { requireCustomer } from '../middleware/roleAuth.js';
import { upload } from '../middleware/upload.js';
import { validatePagination, validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// All routes require customer authentication
router.use(requireCustomer);

// Dashboard and Profile
router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
// Accept profile uploads under consistent field name 'profilePicture'
router.patch('/profile', upload.single('profilePicture'), updateProfile);

// Browse Salons and Services
router.get('/salons', validatePagination, browseSalons);
router.get('/salons/:salonId', validateObjectId('salonId'), getSalonDetails);
router.get('/services/search', validatePagination, searchServices);

// Salon Availability
router.get('/salons/:salonId/availability', getSalonAvailability);

// Booking Management
router.get('/bookings', validatePagination, getBookings);
router.patch('/bookings/:appointmentId/cancel', 
  validateObjectId('appointmentId'), 
  cancelBooking
);
router.post('/bookings/:appointmentId/rate', 
  validateObjectId('appointmentId'), 
  rateAppointment
);

// Favorite and Recent Salons
router.patch('/favorite-salon', updateFavoriteSalon);
router.get('/recent-salons', getRecentSalons);

export default router;