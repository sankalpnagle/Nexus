import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

export const uploadToCloud = (
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'video' | 'auto' = 'auto'
): Promise<{ url: string; publicId: string }> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: `nexus/${folder}`, resource_type: resourceType },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    ).end(buffer);
  });

export const deleteFromCloud = (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
