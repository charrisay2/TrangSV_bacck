import express from 'express';
import { login, getMe, forgotPasswordRequest, changePassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPasswordRequest);
router.post('/change-password', protect, changePassword);

export default router;