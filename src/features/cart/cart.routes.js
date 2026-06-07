import express from 'express';
import { addToCart, getCart, removeFromCart, updateCartItemQuantity } from './cart.controller.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// كل الـ Routes اللي تحت السطر ده هتعدي على الـ protect تلقائياً لتقليل تكرار الكود
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/remove', removeFromCart);
router.put('/quantity', updateCartItemQuantity);

export default router;