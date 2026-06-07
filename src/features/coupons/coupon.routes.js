import express from 'express';
import { createCoupon, applyCoupon, getAllCoupons } from './coupon.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';

const router = express.Router();

// جلب جميع الكوبونات (لأدمين فقط)
router.get('/', protect, restrictTo('admin', 'super-admin'), getAllCoupons);

router.use(protect); // كل الـ routes اللي تحت محتاجة تسجيل دخول

router.post('/apply', applyCoupon); // مستخدم عادي يطبق الكوبون
router.post('/', restrictTo('admin', 'super-admin'), createCoupon); // أدمين فقط يضيف كوبون

export default router;