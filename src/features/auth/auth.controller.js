import jwt from 'jsonwebtoken';
import { redisClient } from '../../confige/redis.js';
import User from './user.model.js';
import AppError from '../../utils/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import { generateTokens, storeRefreshToken, removeRefreshToken } from './auth.service.js';

// دالة مساعدة لترسيل الـ Cookies للمتصفح بشكل آمن
const sendTokensResponse = async (user, statusCode, res) => {
    const { accessToken, refreshToken } = generateTokens(user._id);

    // حفظ الـ Refresh Token في الـ Redis كاش
    await storeRefreshToken(user._id, refreshToken);

    // إعدادات الـ Cookie للأمان (حماية ضد الـ XSS والـ CSRF)
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 أيام
        httpOnly: true, // تمنع الـ JavaScript في الفروينت من قراءتها (تحمي من XSS)
        secure: process.env.NODE_ENV === 'production', // تشتتغل HTTPS بس في الـ Production
        sameSite: 'strict' // تحمي من الـ CSRF attacks
    };

    // بنبعت الـ Refresh Token في كوكيز مؤمنة، والـ Access Token في الـ JSON body
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // إخفاء الباسورد من الـ response
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        accessToken,
        user
    });
};

// 1. تسجيل مستخدم جديد (Register)
export const register = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

    // التأكد إن الإيميل مش مستخدم قبل كده
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Email already exists', 400));
    }

    // إنشاء المستخدم (تلقائياً الـ role هتكون user)
    const newUser = await User.create({ name, email, password });

    // ✨ التعديل هنا: غيرنا الـ 21 وخليناها 201 (HTTP Created)
    await sendTokensResponse(newUser, 201, res);
});

// 2. تسجيل الدخول (Login)
export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // بنعمل select للـ password صراحة لأنه مخفي في الموديل
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    await sendTokensResponse(user, 200, res);
});

// 3. تسجيل الخروج (Logout)
export const logout = catchAsync(async (req, res, next) => { // ✨ تعديل البارامتر لـ next العادي
    const { refreshToken } = req.cookies;

    if (refreshToken) {
        // فك التوكن لمعرفة الـ User ID ومسحه من الـ Redis
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            await removeRefreshToken(decoded.id);
        } catch (err) {
            // لو التوكن بايظ أو expired كمل برضه وامسح الكوكيز
        }
    }

    // مسح الكوكيز من المتصفح
    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

// 4. ترقية مستخدم إلى أدمين (خاص بالـ Super Admin فقط)
export const makeAdmin = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Please provide the user email.', 400));
    }

    // البحث عن المستخدم وتحديث الـ role بتاعته لـ admin
    const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { role: 'admin' },
        { new: true, runValidators: true } // يرجع المستخدم بعد التعديل ويشغل الـ validations
    );

    if (!user) {
        return next(new AppError('No user found with this email address.', 404));
    }

    res.status(200).json({
        status: 'success',
        message: `User ${user.name} has been promoted to Admin successfully.`,
        user
    });
});

// 5. تجديد الـ Access Token (Refresh Token Logic)
export const refreshAccessToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return next(new AppError('Refresh Token not found, please login again.', 401));
    }

    // 1. فك وتأكيد الـ Refresh Token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 2. التأكد إن الـ Token لسه موجود وصالح جوه الـ Redis (مش معمول له Blacklist)
    const cachedToken = await redisClient.get(`refresh_token:${decoded.id}`);
    if (!cachedToken || cachedToken !== refreshToken) {
        return next(new AppError('Invalid or expired refresh token.', 401));
    }

    // 3. توليد Access Token جديد وصافي
    const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '15m'
    });

    res.status(200).json({
        status: 'success',
        accessToken
    });
});