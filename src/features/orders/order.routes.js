import express from 'express';
import { checkout, updateOrderStatus, getAllOrders } from './order.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';

const router = express.Router();

// جلب جميع الطلبات (للمستخدمين العاديين - طلباتهم الخاصة، وللأدمين - جميع الطلبات)
router.get('/', protect, getAllOrders);

router.post('/checkout', protect, checkout);

router.patch('/:orderId/status', protect, restrictTo('admin', 'super-admin'), updateOrderStatus);

export default router;