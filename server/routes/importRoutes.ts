import express from 'express';
import { importUsers, importCourses, importCurriculum, importSubjects, importEnrollments } from '../controllers/importController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/users', protect, authorize('ADMIN'), importUsers);
router.post('/courses', protect, authorize('ADMIN'), importCourses);
router.post('/curriculum', protect, authorize('ADMIN'), importCurriculum);
router.post('/subjects', protect, authorize('ADMIN'), importSubjects);
router.post('/enrollments', protect, authorize('ADMIN'), importEnrollments);

export default router;
