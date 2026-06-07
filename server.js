import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// 1. استدعي dotenv وشغله فوراً في أول سطر خالص قبل أي import تاني لحماية السيستم
import dotenv from 'dotenv';

// 2. دلوقتي تقدر تستورد ملفات الـ config وإنت مطمن إن الـ .env مقروء وزي الفل
import connectDB from './src/confige/db.js'; // 
import { connectRedis } from './src/confige/redis.js';
import globalErrorHandler from './src/middleware/errorMiddleware.js';
import AppError from './src/utils/appError.js';
import seedSuperAdmin from './src/scripts/seedAdmin.js';
import authRoutes from "./src/features/auth/auth.routes.js"
import productRoutes from "./src/features/products/product.routes.js"
import cartRoutes from './src/features/cart/cart.routes.js'; // 👈 السطر الجديد
import orderRoutes from './src/features/orders/order.routes.js'; // 👈 سطر جديد
import adminRoutes from "./src/features/admin/admin.routes.js"
import couponRoutes from "./src/features/coupons/coupon.routes.js"


// إنشاء تطبيق Express
const app = express();

dotenv.config();
// الاتصال بقواعد البيانات
connectDB().then(() => {
    seedSuperAdmin(); // هيشتغل ويتأكد من الحساب في الخلفية
});;


connectRedis();

// الـ Middlewares الأساسية
app.use(cors({ 
    origin: 'http://localhost:5173', // فرونت اند Vite
    credentials: true 
})); 


app.use(express.json());
app.use(cookieParser());

// Base Route للتأكد إن السيرفر شغال
app.use("/api/v1/auth" , authRoutes)
app.use("/api/v1/products" , productRoutes)
app.use('/api/v1/cart', cartRoutes); // 
app.use('/api/v1/orders', orderRoutes); 
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/coupons', couponRoutes)
// التعامل مع الـ Routes اللي مش موجودة
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// تشغيل المعالج المركزي للأخطاء
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});