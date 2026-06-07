import Order from './order.model.js';
import Product from '../products/product.model.js';
import { redisClient } from '../../confige/redis.js';
import AppError from '../../utils/appError.js';
import catchAsync from '../../utils/catchAsync.js';

// جلب جميع الطلبات للمستخدم الحالي أو جميع الطلبات للأدمين
export const getAllOrders = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const userRole = req.user.role;

    let orders;
    if (userRole === 'admin' || userRole === 'super-admin') {
        // الأدمين يرى جميع الطلبات
        orders = await Order.find().sort('-createdAt').populate('userId', 'name email');
    } else {
        // المستخدم العادي يرى طلباته فقط
        orders = await Order.find({ userId }).sort('-createdAt');
    }

    res.status(200).json({
        status: 'success',
        results: orders.length,
        orders
    });
});

export const checkout = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
        return next(new AppError('Please provide a shipping address.', 400));
    }

    // 1. جلب محتويات السلة من الـ Redis
    const cartData = await redisClient.get(`cart:${userId}`);
    if (!cartData) {
        return next(new AppError('Your cart is empty', 400));
    }

    const cart = JSON.parse(cartData);
    if (cart.items.length === 0) {
        return next(new AppError('Your cart is empty', 400));
    }

    // 2. التحقق من الـ Stock وتحديثه جوه الـ MongoDB
    // بنعمل Loop على المنتجات اللي في السلة نخصمها من المخزن
    for (const item of cart.items) {
        const product = await Product.findById(item.productId);
        
        if (!product) {
            return next(new AppError(`Product ${item.name} no longer exists.`, 404));
        }

        if (product.stock < item.quantity) {
            return next(new AppError(`Not enough stock for ${item.name}. Only ${product.stock} left.`, 400));
        }

        // تقليل الكمية في المخزن
        product.stock -= item.quantity;
        await product.save();
    }

    // 3. إنشاء طلب جديد في الـ MongoDB
    const newOrder = await Order.create({
        userId,
        items: cart.items,
        totalPrice: cart.totalPrice,
        shippingAddress
    });

    // 4. تفريغ السلة من الـ Redis تماماً بعد نجاح العملية
    await redisClient.del(`cart:${userId}`);

    res.status(201).json({
        status: 'success',
        message: 'Order placed successfully',
        order: newOrder
    });
});


// تحديث حالة الطلب (خاص بالأدمين والـ Super Admin فقط)
export const updateOrderStatus = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;
    const { status } = req.body;

    // التأكد إن الحالة المدخلة تتبع الـ enum المعرف في الموديل
    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
        return next(new AppError('Invalid order status.', 400));
    }

    const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true, runValidators: true }
    );

    if (!order) {
        return next(new AppError('No order found with this ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        message: `Order status updated to ${status} successfully.`,
        order
    });
});