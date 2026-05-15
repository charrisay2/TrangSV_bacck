import express from 'express';
import { importUsers, importCourses, importCurriculum } from '../controllers/importController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/users', protect, authorize('ADMIN'), importUsers);
router.post('/courses', protect, authorize('ADMIN'), importCourses);
router.post('/curriculum', protect, authorize('ADMIN'), importCurriculum);

export default router;
