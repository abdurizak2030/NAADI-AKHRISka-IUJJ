import { handleUpload, UPLOAD_CONFIGS } from './uploads';
import cloudinary from './config/cloudinary';
import { PassThrough } from 'stream';
import { Buffer } from 'buffer';

// Mock Cloudinary
jest.mock('./config/cloudinary', () => ({
  __esModule: true,
  default: {
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

const mockCloudinaryUploadStream = cloudinary.uploader.upload_stream as jest.Mock;

describe('handleUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a mock Request with FormData
  const createMockRequest = (file: File | null, fieldName: string = 'file'): Request => {
    const formData = new FormData();
    if (file) {
      formData.append(fieldName, file);
    }
    return {
      formData: async () => formData,
    } as Request;
  };

  it('should return an error if no file is uploaded', async () => {
    const request = createMockRequest(null);
    const result = await handleUpload(request, 'image');

    expect(result).toEqual({ error: 'No file was uploaded.' });
    expect(mockCloudinaryUploadStream).not.toHaveBeenCalled();
  });

  it('should return an error for an invalid file type', async () => {
    const invalidFile = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' }); // Using a valid image type
    Object.defineProperty(invalidFile, 'type', { value: 'application/octet-stream' }); // Override type to make it invalid for image

    const request = createMockRequest(invalidFile);
    const result = await handleUpload(request, 'image');

    expect(result).toEqual({ error: UPLOAD_CONFIGS.image.errorMessage });
    expect(mockCloudinaryUploadStream).not.toHaveBeenCalled();
  });

  it('should return an error if file size exceeds max size', async () => {
    // Create a file larger than MAX_IMAGE_SIZE (8MB)
    const largeContent = Buffer.alloc(UPLOAD_CONFIGS.image.maxSize + 1);
    const largeFile = new File([largeContent], 'large.png', { type: 'image/png' });

    const request = createMockRequest(largeFile);
    const result = await handleUpload(request, 'image');

    expect(result).toEqual({ error: `File is too large. Maximum size is ${(UPLOAD_CONFIGS.image.maxSize / (1024 * 1024)).toFixed(0)}MB.` });
    expect(mockCloudinaryUploadStream).not.toHaveBeenCalled();
  });

  it('should successfully upload a valid image file to Cloudinary', async () => {
    const mockFile = new File(['image content'], 'test.png', { type: 'image/png' });
    const mockCloudinaryResponse = { secure_url: 'https://res.cloudinary.com/test/image/upload/v1/iujj/images/test.png' };

    mockCloudinaryUploadStream.mockImplementationOnce((options, callback) => {
      const mockStream = new PassThrough();
      callback(null, mockCloudinaryResponse);
      return mockStream;
    });

    const request = createMockRequest(mockFile);
    const result = await handleUpload(request, 'image');

    expect(mockCloudinaryUploadStream).toHaveBeenCalledTimes(1);
    expect(mockCloudinaryUploadStream).toHaveBeenCalledWith(
      {
        folder: 'iujj/images',
        resource_type: 'auto',
      },
      expect.any(Function)
    );
    expect(result).toEqual({
      file: {
        url: mockCloudinaryResponse.secure_url,
        originalName: mockFile.name,
        mimeType: mockFile.type,
        size: mockFile.size,
      },
    });
  });

  it('should successfully upload a valid PDF attachment to Cloudinary', async () => {
    const mockFile = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });
    const mockCloudinaryResponse = { secure_url: 'https://res.cloudinary.com/test/image/upload/v1/iujj/attachments/document.pdf' };

    mockCloudinaryUploadStream.mockImplementationOnce((options, callback) => {
      const mockStream = new PassThrough();
      callback(null, mockCloudinaryResponse);
      return mockStream;
    });

    const request = createMockRequest(mockFile);
    const result = await handleUpload(request, 'attachment');

    expect(mockCloudinaryUploadStream).toHaveBeenCalledTimes(1);
    expect(mockCloudinaryUploadStream).toHaveBeenCalledWith(
      {
        folder: 'iujj/attachments',
        resource_type: 'auto', // PDF is auto, not video
      },
      expect.any(Function)
    );
    expect(result).toEqual({
      file: {
        url: mockCloudinaryResponse.secure_url,
        originalName: mockFile.name,
        mimeType: mockFile.type,
        size: mockFile.size,
      },
    });
  });

  it('should successfully upload a valid video file to Cloudinary with resource_type video', async () => {
    const mockFile = new File(['video content'], 'clip.mp4', { type: 'video/mp4' });
    const mockCloudinaryResponse = { secure_url: 'https://res.cloudinary.com/test/video/upload/v1/iujj/videos/clip.mp4' };

    mockCloudinaryUploadStream.mockImplementationOnce((options, callback) => {
      const mockStream = new PassThrough();
      callback(null, mockCloudinaryResponse);
      return mockStream;
    });

    const request = createMockRequest(mockFile);
    const result = await handleUpload(request, 'video');

    expect(mockCloudinaryUploadStream).toHaveBeenCalledTimes(1);
    expect(mockCloudinaryUploadStream).toHaveBeenCalledWith(
      {
        folder: 'iujj/videos',
        resource_type: 'video', // Video should have resource_type video
      },
      expect.any(Function)
    );
    expect(result).toEqual({
      file: {
        url: mockCloudinaryResponse.secure_url,
        originalName: mockFile.name,
        mimeType: mockFile.type,
        size: mockFile.size,
      },
    });
  });

  it('should return an error if Cloudinary upload fails', async () => {
    const mockFile = new File(['image content'], 'test.png', { type: 'image/png' });
    const cloudinaryError = new Error('Cloudinary API error');

    mockCloudinaryUploadStream.mockImplementationOnce((options, callback) => {
      const mockStream = new PassThrough();
      callback(cloudinaryError, null);
      return mockStream;
    });

    const request = createMockRequest(mockFile);
    // Expect handleUpload to throw an error if cloudinary.uploader.upload_stream calls back with an error
    await expect(handleUpload(request, 'image')).rejects.toThrow('Cloudinary API error');
  });

  it('should return an error if Cloudinary response is malformed', async () => {
    const mockFile = new File(['image content'], 'test.png', { type: 'image/png' });
    const malformedCloudinaryResponse = { public_id: 'some_id' }; // Missing secure_url

    mockCloudinaryUploadStream.mockImplementationOnce((options, callback) => {
      const mockStream = new PassThrough();
      callback(null, malformedCloudinaryResponse);
      return mockStream;
    });

    const request = createMockRequest(mockFile);
    await expect(handleUpload(request, 'image')).rejects.toThrow('Cloudinary upload failed.');
  });
});
