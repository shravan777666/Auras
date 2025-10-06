import express from 'express';
import { getNeedsAttentionAlerts } from '../controllers/alertsController.js';
import { requireSalonOwner } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes require salon owner authentication
router.use(requireSalonOwner);

// Get needs attention alerts for salon owner dashboard
router.get('/needs-attention', getNeedsAttentionAlerts);

export default router;