import User from '../features/auth/user.model.js';
import dotenv from "dotenv"

dotenv.config();

const seedSuperAdmin = async () => {
    try {
        // التأكد إن الإيميل مكتوب في الـ .env
        const adminEmail = process.env.SUPER_ADMIN_EMAIL;
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.log('⚠️ Super Admin credentials not found in .env, skipping seed.');
            return;
        }

        // التشيك إذا كان موجود فعلاً في الداتا بيز
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'super-admin'
            });
            
            console.log('👑 Super Admin account seeded successfully!');
        } else {
            console.log('ℹ️ Super Admin account already exists.');
        }
    } catch (error) {
        console.error('❌ Error seeding Super Admin:', error.message);
    }
};

export default seedSuperAdmin;