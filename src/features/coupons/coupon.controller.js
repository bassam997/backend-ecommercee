import Coupon from './coupon.model.js';
import { redisClient } from '../../confige/redis.js';
import AppError from '../../utils/appError.js';
import catchAsync from '../../utils/catchAsync.js';

// جلب جميع الكوبونات (لأدمين فقط)
export const getAllCoupons = catchAsync(async (req, res, next) => {
    const coupons = await Coupon.find().sort('-createdAt');
    res.status(200).json({
        status: 'success',
        results: coupons.length,
        coupons
    });
});

// 1. إنشاء كوبون جديد (خاص بالأدمين)
export const createCoupon = catchAsync(async (req, res, next) => {
    const { code, discountPercentage, expirationDate } = req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
        return next(new AppError('Coupon code already exists', 400));
    }

    const newCoupon = await Coupon.create({
        code,
        discountPercentage,
        expirationDate
    });

    res.status(201).json({ status: 'success', coupon: newCoupon });
});

// 2. تطبيق الكوبون على السلة في الـ Redis (متاح للمستخدمين)
export const applyCoupon = catchAsync(async (req, res, next) => {
    const { code } = req.body;
    const userId = req.user._id;

    // البحث عن الكوبون
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    // التأكد إن الكوبون موجود وصالح ومش منتهي
    if (!coupon || !coupon.isValid()) {
        return next(new AppError('Invalid or expired coupon code.', 400));
    }

    // جلب سلة المستخدم الحالية من الـ Redis
    const cartData = await redisClient.get(`cart:${userId}`);
    if (!cartData) {
        return next(new AppError('Your cart is empty', 400));
    }

    const cart = JSON.parse(cartData);
    if (cart.items.length === 0) {
        return next(new AppError('Your cart is empty', 400));
    }

    // حساب الخصم الجديد وتعديل الـ totalPrice
    const discountAmount = (cart.totalPrice * coupon.discountPercentage) / 100;
    cart.totalPrice = cart.totalPrice - discountAmount;

    // حفظ السلة المخصومة مؤقتاً في الـ Redis
    await redisClient.set(`cart:${userId}`, JSON.stringify(cart), { EX: 14 * 24 * 60 * 60 });

    res.status(200).json({
        status: 'success',
        message: `Coupon applied successfully! You got ${coupon.discountPercentage}% discount.`,
        discountAmount,
        cart
    });
});