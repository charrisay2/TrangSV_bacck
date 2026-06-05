import express from 'express';
import { 
  getTeacherExams, createExam, uploadQuestions, publishExam, 
  getStudentExams, getExamForStudent, submitExam, 
  getSubmissions, gradeSubmission,getExamResultForStudent
} from '../controllers/examController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/teacher', protect, authorize('TEACHER'), getTeacherExams);
router.post('/', protect, authorize('TEACHER'), createExam);
router.post('/:id/questions', protect, authorize('TEACHER'), uploadQuestions);
router.put('/:id/publish', protect, authorize('TEACHER'), publishExam);

router.get('/student', protect, authorize('STUDENT'), getStudentExams);
router.get('/:id/take', protect, authorize('STUDENT'), getExamForStudent);
router.get('/:id/result', protect, authorize('STUDENT'), getExamResultForStudent);
router.post('/:id/submit', protect, authorize('STUDENT'), submitExam);

router.get('/:id/submissions', protect, authorize('TEACHER'), getSubmissions);
router.put('/submissions/:submissionId/grade', protect, authorize('TEACHER'), gradeSubmission);

export default router;
