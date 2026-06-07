import AppError from './appError.js';

class PathError extends AppError {
    constructor(message, inputPath) {
        // بنبعت الرسالة و الـ Status Code (400 لـ Bad Request) للـ AppError الأساسي
        super(message, 400); 
        
        this.inputPath = inputPath; // بنحتفظ بالـ Path اللي عمل المشكلة عشان يظهر في الـ Logs
        this.name = 'PathError';
    }
}

export default PathError;