import express from 'express';
import { register, login, logout, makeAdmin, refreshAccessToken } from './auth.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshAccessToken);

// الـ Route ده محمي: لازم يكون مسجل دخول + يكون دوره super-admin بس
router.patch('/make-admin', protect, restrictTo('super-admin'), makeAdmin);

export default router;