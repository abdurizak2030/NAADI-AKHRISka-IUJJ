/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * File upload handling using Cloudinary.
 */

import cloudinary from './config/cloudinary';

export const BUCKETS = ['avatars', 'images', 'attachments', 'videos'] as const;
export type UploadBucket = (typeof BUCKETS)[number];

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']);
const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);
const AUDIO_MIME_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/mp3', 'audio/x-m4a']);

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 300 * 1024 * 1024; // 300MB

export interface SavedFile {
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface UploadConfig {
  bucket: UploadBucket;
  allowedTypes: Set<string>;
  maxSize: number;
  errorMessage: string;
}

export const UPLOAD_CONFIGS: Record<'avatar' | 'image' | 'attachment' | 'video', UploadConfig> = {
  avatar: { bucket: 'avatars', allowedTypes: IMAGE_MIME_TYPES, maxSize: MAX_IMAGE_SIZE, errorMessage: 'Only image files (JPG, PNG, GIF, WEBP, SVG) are allowed.' },
  image: { bucket: 'images', allowedTypes: IMAGE_MIME_TYPES, maxSize: MAX_IMAGE_SIZE, errorMessage: 'Only image files (JPG, PNG, GIF, WEBP, SVG) are allowed.' },
  attachment: {
    bucket: 'attachments',
    allowedTypes: new Set([...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES, ...AUDIO_MIME_TYPES]),
    maxSize: MAX_ATTACHMENT_SIZE,
    errorMessage: 'Only images, PDF, DOCX, or voice recordings are allowed as attachments.',
  },
  video: { bucket: 'videos', allowedTypes: VIDEO_MIME_TYPES, maxSize: MAX_VIDEO_SIZE, errorMessage: 'Only MP4, WEBM, OGG, or MOV video files are allowed.' },
};

/** Result is either a saved file or a client-facing error message. */
export async function handleUpload(
  request: Request,
  kind: keyof typeof UPLOAD_CONFIGS
): Promise<{ file: SavedFile } | { error: string }> {
  const config = UPLOAD_CONFIGS[kind];

  const formData = await request.formData();
  const entry = formData.get('file');
  if (!entry || typeof entry === 'string') {
    return { error: 'No file was uploaded.' };
  }
  const file = entry as File;

  if (!config.allowedTypes.has(file.type)) {
    return { error: config.errorMessage };
  }
  if (file.size > config.maxSize) {
    return { error: `File is too large. Maximum size is ${(config.maxSize / (1024 * 1024)).toFixed(0)}MB.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const resource_type = file.type.startsWith('video') ? 'video' : 'auto';

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `iujj/${config.bucket}`,
        resource_type,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });

  if (!result || typeof result !== 'object' || !('secure_url' in result)) {
    throw new Error('Cloudinary upload failed.');
  }

  const uploadResult = result as { secure_url: string; };

  return {
    file: {
      url: uploadResult.secure_url,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    },
  };
}

export async function deleteFile(url: string): Promise<void> {
  const publicIdMatch = url.match(/\/iujj\/(avatars|images|attachments|videos)\/([^./]+)/);
  if (!publicIdMatch) {
    throw new Error('Invalid file URL.');
  }

  const [, bucket, publicId] = publicIdMatch;
  const resource_type = bucket === 'videos' ? 'video' : 'image';

  await cloudinary.uploader.destroy(`iujj/${bucket}/${publicId}`, { resource_type });
}

