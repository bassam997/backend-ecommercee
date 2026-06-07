import Banner from './banner.model.js';
import User from '../auth/user.model.js';
import Order from '../orders/order.model.js';
import AppError from '../../utils/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import { uploadToCloudinary } from '../../confige/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import Coupon from '../coupons/coupon.model.js';

// حذف بنر
export const deleteBanner = catchAsync(async (req, res, next) => {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return next(new AppError('Banner not found', 404));

    // حذف الصورة من كلوديناري
    await cloudinary.uploader.destroy(banner.publicId);
    await banner.deleteOne();

    res.status(204).json({ status: 'success', data: null });
});

// حذف كوبون خصم
export const deleteCoupon = catchAsync(async (req, res, next) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return next(new AppError('Coupon not found', 404));

    res.status(204).json({ status: 'success', data: null });
});

// ==================== 1. CONTROL BANNERS ====================

// رفع بنر جديد (أدمين فقط)
export const createBanner = catchAsync(async (req, res, next) => {
    const { title, subtitle, linkTo } = req.body;

    if (!req.file) {
        return next(new AppError('Please upload a banner image.', 400));
    }

    // رفع صورة البنر على كلوديناري
    const result = await uploadToCloudinary(req.file.buffer);

    const banner = await Banner.create({
        title,
        subtitle,
        linkTo,
        imageUrl: result.url,
        publicId: result.publicId
    });

    res.status(201).json({ status: 'success', banner });
});

// جلب البنرات الشغالة (متاح للكل - للفرونت إند في الهوم بيج)
export const getActiveBanners = catchAsync(async (req, res, next) => {
    const banners = await Banner.find({ isActive: true }).sort('-createdAt');
    res.status(200).json({ status: 'success', banners });
});

// ==================== 2. DASHBOARD STATS ====================

// جلب إحصائيات لوحة التحكم (أدمين فقط)
export const getDashboardStats = catchAsync(async (req, res, next) => {
    // تشغيل الـ Queries بالتوازي لتوفير الوقت سرعة خارقة
    const [userCount, orderCount, orders] = await Promise.all([
        User.countDocuments(),
        Order.countDocuments(),
        Order.find({ status: { $ne: 'cancelled' } }) // جلب الطلبات غير الملغية لحساب الأرباح
    ]);

    // حساب إجمالي الأرباح من المنصة
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    res.status(200).json({
        status: 'success',
        stats: {
            totalUsers: userCount,
            totalOrders: orderCount,
            totalSales: totalSales
        }
    });
});

// ==================== 3. USER MANAGEMENT ====================

// جلب كل المستخدمين في السيستم (أدمين فقط)
export const getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find().sort('-createdAt');
    res.status(200).json({ status: 'success', results: users.length, users });
});