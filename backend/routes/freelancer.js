import express from 'express';
import { 
  getDashboardStats, 
  getProfile, 
  updateProfile, 
  getRecentAppointments, 
  getAppointments, 
  updateAvailability, 
  getSchedule,
  updateSchedule,
  getApprovedFreelancers,
  getFreelancerById,
  getFreelancerServices,
  addFreelancerService,
  updateFreelancerService,
  deleteFreelancerService,
  approveAppointment,
  rejectAppointment
} from '../controllers/freelancerController.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRoles } from '../middleware/roleAuth.js';

import { freelancerUpload } from '../config/cloudinary.js';


const router = express.Router();

// Dashboard routes
router.get('/dashboard/stats', authenticateToken, verifyRoles(['freelancer']), getDashboardStats);

// Profile routes
router.get('/profile', authenticateToken, verifyRoles(['freelancer']), getProfile);
router.put('/profile', authenticateToken, verifyRoles(['freelancer']), freelancerUpload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'governmentId', maxCount: 1 },
    { name: 'certificates', maxCount: 5 }
]), updateProfile);


// Appointment routes
router.get('/appointments/recent', authenticateToken, verifyRoles(['freelancer']), getRecentAppointments);
router.get('/appointments', authenticateToken, verifyRoles(['freelancer']), getAppointments);
router.put('/appointments/:appointmentId/approve', authenticateToken, verifyRoles(['freelancer']), approveAppointment);
router.put('/appointments/:appointmentId/reject', authenticateToken, verifyRoles(['freelancer']), rejectAppointment);

// Availability/Schedule routes
router.get('/schedule', authenticateToken, verifyRoles(['freelancer']), getSchedule);
router.put('/schedule', authenticateToken, verifyRoles(['freelancer']), updateSchedule);
router.put('/availability', authenticateToken, verifyRoles(['freelancer']), updateAvailability);

// Public route for approved freelancers
router.get('/approved', getApprovedFreelancers);

// Public route for freelancer details (should come after specific routes)
router.get('/:id', getFreelancerById);

// Service management routes
router.get('/services', authenticateToken, verifyRoles(['freelancer']), getFreelancerServices);
router.post('/services', authenticateToken, verifyRoles(['freelancer']), addFreelancerService);
router.put('/services/:id', authenticateToken, verifyRoles(['freelancer']), updateFreelancerService);
router.delete('/services/:id', authenticateToken, verifyRoles(['freelancer']), deleteFreelancerService);

export default router;