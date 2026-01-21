import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getFile } from '../controllers/fileController.js';

const router = express.Router();

router.get('/:encodedPath', authenticateToken, getFile);

export default router;
