import jwt from 'jsonwebtoken';
import { redisClient } from '../../confige/redis.js';

// 1. توليد الـ Tokens
export const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '15m'
    });

    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d'
    });

    return { accessToken, refreshToken };
};

// 2. حفظ الـ Refresh Token في الـ Redis
export const storeRefreshToken = async (userId, refreshToken) => {
    // بنسجله بـ Key مميز وجواه الـ token وصلاحية 7 أيام بالثواني
    await redisClient.set(`refresh_token:${userId}`, refreshToken, {
        EX: 7 * 24 * 60 * 60 
    });
};

// 3. حذف الـ Token من الـ Redis عند تسجيل الخروج (Logout)
export const removeRefreshToken = async (userId) => {
    await redisClient.del(`refresh_token:${userId}`);
};