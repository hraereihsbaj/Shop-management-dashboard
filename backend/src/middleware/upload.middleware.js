import multer from "multer";
// Configure multer to store files in memory as Buffers
const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
