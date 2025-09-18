import express from 'express';
import {
  getDashboardStats,
  getApprovedSalonsCount,
  getAllSalons,
  getAllSalonsDetails,
  updateSalonStatus,
  deleteSalon,
  getAllStaff,
  getPendingStaff,
  approveStaff,
  rejectStaff,
  getAllCustomers,
  getAllAppointments,
  getPendingSalons,
  approveSalon,
  rejectSalon
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyRoles } from '../middleware/roleAuth.js';
import { validatePagination, validateObjectId } from '../middleware/validation.js';
import Salon from '../models/Salon.js'; // Import Salon model

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(verifyRoles(['admin']));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/salons/count', getApprovedSalonsCount);

// Salon Management
router.get('/salons', validatePagination, getAllSalons);
router.get('/salons/all-details', getAllSalonsDetails);
router.get('/salons/pending', validatePagination, getPendingSalons);
router.patch('/salons/:salonId/status', validateObjectId('salonId'), updateSalonStatus);
router.delete('/salons/:salonId', validateObjectId('salonId'), deleteSalon);
router.post('/salons/:salonId/approve', validateObjectId('salonId'), approveSalon);
router.post('/salons/:salonId/reject', validateObjectId('salonId'), rejectSalon);

// Staff Management
router.get('/staff', validatePagination, getAllStaff);
router.get('/staff/pending', getPendingStaff);
router.post('/staff/:staffId/approve', validateObjectId('staffId'), approveStaff);
router.post('/staff/:staffId/reject', validateObjectId('staffId'), rejectStaff);

// Debug route to check all staff
router.get('/staff/debug', async (req, res) => {
  try {
    const Staff = (await import('../models/Staff.js')).default;
    const allStaff = await Staff.find({}).select('name email approvalStatus role isActive setupCompleted').lean();
    res.json({ 
      success: true,
      count: allStaff.length,
      staff: allStaff 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Customer Management
router.get('/customers', validatePagination, getAllCustomers);

// Appointment Management
router.get('/appointments', validatePagination, getAllAppointments);

export default router;