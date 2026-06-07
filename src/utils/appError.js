class AppError extends Error {
    constructor(message, statusCode) {
        super(message); 
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';   // 
        this.isOperational = true; // عشان نفرق بين أخطاء الكود وأخطاء السيستم الـ Operational

        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;