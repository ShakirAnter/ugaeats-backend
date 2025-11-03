import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables.
// Support two common patterns:
// 1) A single CLOUDINARY_URL string (cloudinary://<api_key>:<api_secret>@<cloud_name>)
// 2) Individual variables CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
if (process.env.CLOUDINARY_URL) {
  // cloudinary.v2 will read CLOUDINARY_URL automatically when calling config() with no args,
  // but passing it explicitly keeps intent clear.
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL, secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Use memory storage so files are available as buffers
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Helper to upload a buffer to Cloudinary
export function uploadBufferToCloudinary(buffer: Buffer, options?: { folder?: string; public_id?: string }) {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: options?.folder, public_id: options?.public_id, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

// Middleware wrapper: expects a single file under `fieldName` (uses multer)
// Uploads the file to Cloudinary and attaches the secure_url to req.body[targetField]
export function singleUploadToCloudinary(fieldName: string, targetField = 'image_url', folder?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const single = upload.single(fieldName);

    single(req as any, res as any, async (err: any) => {
      if (err) return next(err);

  const file = (req as any).file as any | undefined;
      if (!file) return next(); // nothing to do

      try {
        const result = await uploadBufferToCloudinary(file.buffer, { folder });
        // attach URL(s) to body for downstream handlers
        (req as any).body[targetField] = result.secure_url || result.url;
        (req as any).body[`${targetField}_public_id`] = result.public_id;
        return next();
      } catch (uploadErr) {
        return next(uploadErr);
      }
    });
  };
}

// Middleware wrapper for multiple files (array)
export function multipleUploadToCloudinary(fieldName: string, maxCount = 5, targetField = 'image_urls', folder?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const array = upload.array(fieldName, maxCount);

    array(req as any, res as any, async (err: any) => {
      if (err) return next(err);

  const files = (req as any).files as any[] | undefined;
      if (!files || files.length === 0) return next();

      try {
        const uploads = await Promise.all(
          files.map((f) => uploadBufferToCloudinary(f.buffer, { folder }))
        );

        (req as any).body[targetField] = uploads.map((r) => ({ url: r.secure_url || r.url, public_id: r.public_id }));
        return next();
      } catch (uploadErr) {
        return next(uploadErr);
      }
    });
  };
}

export default {
  upload,
  uploadBufferToCloudinary,
  singleUploadToCloudinary,
  multipleUploadToCloudinary,
};
