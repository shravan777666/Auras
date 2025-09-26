import express from 'express';
import {
  getRecentClients,
  getClients,
  getClientRecommendations,
  sendRecommendations
} from '../controllers/recommendationController.js';
import { requireSalonOwner } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes require salon owner authentication
router.use(requireSalonOwner);

// Client routes
router.get('/recent', getRecentClients);
router.get('/clients', getClients);
router.get('/client/:id', getClientRecommendations);
router.post('/send', sendRecommendations);

export default router;