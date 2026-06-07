import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A banner must have a title'],
        trim: true
    },
    subtitle: String,
    imageUrl: {
        type: String,
        required: [true, 'A banner must have an image']
    },
    publicId: {
        type: String,
        required: [true, 'A banner must have a Cloudinary publicId']
    },
    linkTo: {
        type: String, 
        default: '/' // مثلاً يوديه لصفحة /products/shoes لما يضغط عليه
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;