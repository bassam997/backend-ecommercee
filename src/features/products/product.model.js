import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A product must have a name'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'A product must have a description']
    },
    price: {
        type: Number,
        required: [true, 'A product must have a price']
    },
    // مصفوفة (Array) لحفظ روابط الصور والـ public_id بتاعها عشان لما نحب نمسحها بعدين
    images: [
        {
            url: { type: String, required: true },
            publicId: { type: String, required: true }
        }
    ],
    category: {
        type: String,
        required: [true, 'A product must belong to a category']
    },
    stock: {
        type: Number,
        required: [true, 'A product must have a stock quantity'],
        default: 10
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;