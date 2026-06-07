import { redisClient } from '../../confige/redis.js';
import Product from '../products/product.model.js';
import AppError from '../../utils/appError.js';
import catchAsync from '../../utils/catchAsync.js';

// دالة مساعدة لجلب السلة من الـ Redis أو إرجاع سلة فاضية لو مش موجودة
const getCartFromRedis = async (userId) => {
    const cartData = await redisClient.get(`cart:${userId}`);
    return cartData ? JSON.parse(cartData) : { items: [], totalPrice: 0 };
};

// دالة مساعدة لحفظ السلة جوه الـ Redis (صلاحيتها مثلاً 14 يوم)
const saveCartToRedis = async (userId, cart) => {
    await redisClient.set(`cart:${userId}`, JSON.stringify(cart), {
        EX: 14 * 24 * 60 * 60 // 14 يوم بالثواني
    });
};

// 1. إضافة منتج للسلة (أو زيادة الكمية)
export const addToCart = catchAsync(async (req, res, next) => {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    // التأكد إن المنتج موجود في الداتا بيز وصاحي
    const product = await Product.findById(productId);
    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    // جلب السلة الحالية للمستخدم من الـ Redis
    const cart = await getCartFromRedis(userId);

    // التشيك لو المنتج ده موجود في السلة أصلاً
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingItemIndex > -1) {
        // لو موجود، نزود الكمية بتاعته
        cart.items[existingItemIndex].quantity += Number(quantity);
    } else {
        // لو مش موجود، نضيفه كـ عنصر جديد
        cart.items.push({
            productId: productId,
            name: product.name,
            price: product.price,
            image: product.images[0]?.url || '',
            quantity: Number(quantity)
        });
    }

    // إعادة حساب السعر الإجمالي للسلة كلها
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // حفظ التحديثات في الـ Redis
    await saveCartToRedis(userId, cart);

    res.status(200).json({
        status: 'success',
        cart
    });
});

// 2. جلب محتويات السلة للمستخدم الحالي
export const getCart = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const cart = await getCartFromRedis(userId);

    res.status(200).json({
        status: 'success',
        cart
    });
});

// 3. حذف عنصر تماماً من السلة
export const removeFromCart = catchAsync(async (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user._id;

    const cart = await getCartFromRedis(userId);

    // فلترة المصفوفة لحذف المنتج
    cart.items = cart.items.filter(item => item.productId !== productId);

    // إعادة حساب السعر الإجمالي
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    await saveCartToRedis(userId, cart);

    res.status(200).json({
        status: 'success',
        message: 'Item removed from cart',
        cart
    });
});

// 4. تعديل كمية منتج في السلة مباشرة
export const updateCartItemQuantity = catchAsync(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (quantity === undefined || isNaN(Number(quantity))) {
        return next(new AppError('Please provide a valid quantity', 400));
    }

    const cart = await getCartFromRedis(userId);
    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
        const qty = Number(quantity);
        if (qty <= 0) {
            // حذف العنصر تماماً لو الكمية صفر أو أقل
            cart.items = cart.items.filter(item => item.productId !== productId);
        } else {
            // تعديل الكمية مباشرة
            cart.items[itemIndex].quantity = qty;
        }
    } else {
        return next(new AppError('Product not found in cart', 404));
    }

    // إعادة حساب السعر الإجمالي
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    await saveCartToRedis(userId, cart);

    res.status(200).json({
        status: 'success',
        message: 'Cart item quantity updated',
        cart
    });
});