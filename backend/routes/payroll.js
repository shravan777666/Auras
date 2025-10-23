import express from 'express';
import {
  createOrUpdatePayrollConfig,
  getPayrollConfigurations,
  getPayrollConfigByRoleAndLevel,
  deletePayrollConfig,
  processPayrollForAllStaff,
  getPayrollRecords,
  getPayrollRecordById,
  markPayrollAsPaid,
  getStaffPayrollRecords,
  getStaffPayrollRecordById
} from '../controllers/payrollController.js';
import { requireSalonOwner, requireStaff } from '../middleware/roleAuth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Staff routes (for viewing payslips) - These should come first before salon owner middleware
router.get('/staff/records', requireStaff, getStaffPayrollRecords);
router.get('/staff/records/:id', requireStaff, validateObjectId('id'), getStaffPayrollRecordById);

// Salon owner routes - Apply middleware only to these routes
router.use(requireSalonOwner);

// Payroll configuration management
router.post('/config', createOrUpdatePayrollConfig);
router.get('/config', getPayrollConfigurations);
router.get('/config/:jobRole/:experienceLevel', getPayrollConfigByRoleAndLevel);
router.delete('/config/:id', validateObjectId('id'), deletePayrollConfig);

// Payroll processing
router.post('/process', processPayrollForAllStaff);

// Payroll records management
router.get('/records', getPayrollRecords);
router.get('/records/:id', validateObjectId('id'), getPayrollRecordById);
router.patch('/records/:id/pay', validateObjectId('id'), markPayrollAsPaid);

export default router;