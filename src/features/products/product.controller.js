import Product from './product.model.js';
import AppError from '../../utils/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import { uploadToCloudinary } from '../../confige/cloudinary.js';

import { v2 as cloudinary } from 'cloudinary'; // استيراد كلوديناري للحذف

// 1. تعديل بيانات المنتج
export const updateProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!product) return next(new AppError('Product not found', 404));

    res.status(200).json({ status: 'success', product });
});

// 2. حذف المنتج نهائياً من الداتا بيز ومن كلوديناري
export const deleteProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));

    // لوف لمسح كل صور المنتج من على كلوديناري أولاً
    const deletePromises = product.images.map(img => cloudinary.uploader.destroy(img.publicId));
    await Promise.all(deletePromises);

    // مسح المنتج من MongoDB
    await product.deleteOne();

    res.status(204).json({ status: 'success', data: null });
});

// 1. إنشاء منتج جديد مع رفع صور متعددة (خاص بالأدمين والـ Super Admin)
export const createProduct = catchAsync(async (req, res, next) => {
    const { name, description, price, category, stock } = req.body;

    // التأكد إن الأدمين رفع صور فعلاً
    if (!req.files || req.files.length === 0) {
        return next(new AppError('Please upload at least one image for the product.', 400));
    }

    // لوف احترافية لرفع كل الصور بالتوازي (Promise.all) لتوفير الوقت
    const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
    const uploadResults = await Promise.all(uploadPromises);

    // تجهيز مصفوفة الصور بالشكل اللي الموديل مستنيه (url و publicId)
    const imagesData = uploadResults.map(result => ({
        url: result.url,
        publicId: result.publicId
    }));

    // إنشاء المنتج في الـ MongoDB
    const newProduct = await Product.create({
        name,
        description,
        price,
        category,
        stock,
        images: imagesData // الروابط اللي رجعت من كلوديناري
    });

    res.status(201).json({
        status: 'success',
        product: newProduct
    });
});

// 2. جلب كل المنتجات (متاح للجميع - زوار ومستخدمين)
export const getAllProducts = catchAsync(async (req, res, next) => {
    const products = await Product.find().sort('-createdAt'); // ترتيب من الأحدث للأقدم

    res.status(200).json({
        status: 'success',
        results: products.length,
        products
    });
});