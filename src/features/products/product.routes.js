import express from 'express';
import { createProduct, deleteProduct, getAllProducts, updateProduct } from './product.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import { upload } from '../../confige/cloudinary.js';

const router = express.Router();

// جلب المنتجات متاح لأي حد
router.get('/', getAllProducts);

// إنشاء منتج: لازم حماية (protect) + صلاحية أدمين أو سوبر أدمين + ميديا لرفع الصور
router.post(
    '/', 
    protect, 
    restrictTo('admin', 'super-admin'), 
    upload.array('images', 5), // 'images' هو اسم الحقل اللي هنبعته من الـ Postman
    createProduct
);

router.patch('/:id', protect, restrictTo('admin', 'super-admin'), updateProduct);
router.delete('/:id', protect, restrictTo('admin', 'super-admin'), deleteProduct);
export default router;