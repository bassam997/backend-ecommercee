import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// إعداد حساب كلوديناري بالمتغيرات من الـ .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// إعداد Multer لتخزين الملفات مؤقتاً في الـ Memory كـ Buffer بدل تخزينها على الهارد ديسك
const storage = multer.memoryStorage();

// فلتر للتأكد إن الملفات المرفوعة صور فقط
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // أقصى حجم للصورة 5 ميجا
});

// دالة مساعدة لرفع الصور المبعوتة كـ Buffer إلى Cloudinary مباشرة
export const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'ecommerce-products' }, // الفولدر اللي هيتخلق جوه كلوديناري
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        );
        uploadStream.end(fileBuffer);
    });
};

export { upload };