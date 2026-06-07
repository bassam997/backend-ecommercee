import express from 'express';
import { createBanner, getActiveBanners, getDashboardStats, getAllUsers, deleteBanner } from './admin.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import { upload } from '../../confige/cloudinary.js';

const router = express.Router();

// Routes متاحة للجميع (مثل جلب البنرات للهوم بيج)
router.get('/banners', getActiveBanners);

// Routes المحمية للأدمين فقط
router.use(protect, restrictTo('admin', 'super-admin'));

router.post('/banners', upload.single('image'), createBanner);
router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.delete('/banners/:id', deleteBanner);

export default router;