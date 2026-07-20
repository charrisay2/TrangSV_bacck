import express from 'express';
import { getCourseAttendance, saveAttendance, getStudentAttendance, markAttendanceQR, reportLocationViolation } from '../controllers/attendanceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, authorize('TEACHER', 'ADMIN'), saveAttendance);
router.post('/qr-scan', protect, authorize('STUDENT'), markAttendanceQR);
router.post('/location-violation', protect, authorize('STUDENT'), reportLocationViolation);
router.get('/course/:courseId', protect, authorize('TEACHER', 'ADMIN'), getCourseAttendance);
router.get('/student/:studentId', protect, getStudentAttendance);

export default router;
