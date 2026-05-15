import express from 'express';
import { createRequest, getRequests, updateRequestStatus } from '../controllers/requestController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, createRequest);
router.get('/', protect, getRequests);
router.put('/:id', protect, authorize('ADMIN'), updateRequestStatus);

export default router;
