import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload an image buffer to Cloudinary
const uploadImageToCloudinary = (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return reject(new Error('Failed to upload image to Cloudinary.'));
        }
        resolve(result);
      }
    );
    uploadStream.end(imageBuffer);
  });
};

export { cloudinary, uploadImageToCloudinary };
