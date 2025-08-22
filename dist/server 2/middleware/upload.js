import multer from "multer";
// Configure multer for memory storage
const storage = multer.memoryStorage();
// File filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed!'), false);
    }
};
// Configure upload limits (increase to 15MB to accommodate large banners)
const limits = {
    fileSize: 15 * 1024 * 1024, // 15MB limit
    files: 1 // Only allow 1 file
};
export const upload = multer({
    storage,
    fileFilter,
    limits
});
