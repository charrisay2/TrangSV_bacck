import express from 'express';
import { getWarnings, createWarning, updateWarningStatus, evaluateRules,getStudentWarnings } from '../controllers/warningController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, authorize('ADMIN'), getWarnings);
router.post('/', protect, authorize('ADMIN'), createWarning);
router.put('/:id', protect, authorize('ADMIN'), updateWarningStatus);
router.post('/evaluate', protect, authorize('ADMIN'), evaluateRules);

// Student routes
router.get('/student', protect, authorize('STUDENT'), getStudentWarnings);
export default router;
