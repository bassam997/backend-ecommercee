import { createClient } from 'redis';
import dotenv from 'dotenv';

// بنشغل دوت إنف جوه الملف نفسه كحماية تالتة
dotenv.config();

// هنا بنعمل تشيك صريح: لو المتغير مش موجود أو فاضي، استخدم الرابط المحلي فوراً كـ String صريح
const connectionUrl = process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '' 
    ? process.env.REDIS_URL 
    : 'redis://127.0.0.1:6379';

console.log(`🔄 Attempting to connect to Redis using: ${connectionUrl}`);

const redisClient = createClient({
    url: connectionUrl
});


redisClient.on('connect', () => {
    console.log('⚡ Redis Connected Successfully');
});


redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
});


const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (error) {
        console.error(`❌ Failed to complete Redis handshake: ${error.message}`);
    }
};

export { redisClient, connectRedis };