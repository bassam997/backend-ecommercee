import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        uppercase: true, // بيتحفظ حروف كابيتال تلقائي منعاً للغلط
        trim: true
    },
    discountPercentage: {
        type: Number,
        required: [true, 'Discount percentage is required'],
        min: [1, 'Discount must be at least 1%'],
        max: [100, 'Discount cannot exceed 100%']
    },
    expirationDate: {
        type: Date,
        required: [true, 'Expiration date is required']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// دالة (Method) للتحقق لو الكوبون منتهي الصلاحية أو غير نشط
couponSchema.methods.isValid = function() {
    return this.isActive && this.expirationDate > new Date();
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;