"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleUploadToCloudinary = exports.upload = void 0;
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
exports.multipleUploadToCloudinary = multipleUploadToCloudinary;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary using environment variables.
// Support two common patterns:
// 1) A single CLOUDINARY_URL string (cloudinary://<api_key>:<api_secret>@<cloud_name>)
// 2) Individual variables CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
if (process.env.CLOUDINARY_URL) {
    // cloudinary.v2 will read CLOUDINARY_URL automatically when calling config() with no args,
    // but passing it explicitly keeps intent clear.
    cloudinary_1.v2.config({
        cloudinary_url: process.env.CLOUDINARY_URL,
        secure: true,
    });
}
else {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}
// Use memory storage so files are available as buffers
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({ storage });
// Helper to upload a buffer to Cloudinary
function uploadBufferToCloudinary(buffer, options) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({
            folder: options === null || options === void 0 ? void 0 : options.folder,
            public_id: options === null || options === void 0 ? void 0 : options.public_id,
            resource_type: "image",
        }, (error, result) => {
            if (error)
                return reject(error);
            resolve(result);
        });
        stream.end(buffer);
    });
}
const singleUploadToCloudinary = (fieldName, targetField = "image_url", folder) => {
    const single = exports.upload.single(fieldName);
    return async (req, res, next) => {
        single(req, res, async (err) => {
            if (err)
                return next(err);
            // req.file and req.body are now properly populated
            const file = req.file;
            if (!file)
                return next(); // no file uploaded
            try {
                const result = await uploadBufferToCloudinary(file.buffer, { folder });
                req.body = req.body || {};
                req.body[targetField] = result.secure_url || result.url;
                req.body[`${targetField}_public_id`] = result.public_id;
                return next();
            }
            catch (error) {
                console.error("Cloudinary upload failed:", error);
                return next(error);
            }
        });
    };
};
exports.singleUploadToCloudinary = singleUploadToCloudinary;
// Middleware wrapper for multiple files (array)
function multipleUploadToCloudinary(fieldName, maxCount = 5, targetField = "image_urls", folder) {
    return async (req, res, next) => {
        const array = exports.upload.array(fieldName, maxCount);
        array(req, res, async (err) => {
            if (err)
                return next(err);
            const files = req.files;
            if (!files || files.length === 0)
                return next();
            try {
                const uploads = await Promise.all(files.map((f) => uploadBufferToCloudinary(f.buffer, { folder })));
                req.body[targetField] = uploads.map((r) => ({
                    url: r.secure_url || r.url,
                    public_id: r.public_id,
                }));
                return next();
            }
            catch (uploadErr) {
                return next(uploadErr);
            }
        });
    };
}
exports.default = {
    upload: exports.upload,
    uploadBufferToCloudinary,
    singleUploadToCloudinary: exports.singleUploadToCloudinary,
    multipleUploadToCloudinary,
};
