import jwt from 'jsonwebtoken';
import User from '../features/auth/user.model.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

// 1. حماية الـ Routes (تأكيد تسجيل الدخول)
export const protect = catchAsync(async (req, res, next) => {
    let token;

    // بنشيك لو التوكن مبعوت في الـ Authorization Header (Bearer Token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // التأكد إن المستخدم لسه موجود في الداتا بيز ممتمسحش
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // بنشيل بيانات المستخدم في الـ req عشان الـ routes اللي بعد كده تستخدمها
    req.user = currentUser;
    next();
});


// 2. التحكم في الصلاحيات والأدوار (Roles Authorization)
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles عبارة عن Array زي ['admin', 'super-admin']
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403)); // 403 Forbidden
        }
        next();
    };
};


