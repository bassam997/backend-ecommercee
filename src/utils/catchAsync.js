const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next); // أي خطأ هيروح تلقائي للـ globalErrorHandler
    };
};

export default catchAsync;