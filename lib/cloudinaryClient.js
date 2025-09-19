import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';

// Configure Cloudinary with your cloud name
// API Key and Secret are NOT needed on the client-side for URL generation
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
});

// Helper function to get Cloudinary image URL from public ID
const getCloudinaryImageUrl = (publicId, options = {}) => {
  if (!publicId) return null;

  const image = cld.image(publicId);

  // Apply transformations (example: resize to fill 500x500)
  image.resize(fill(options.width || 500, options.height || 500));

  // You can add more transformations based on the 'options' object if needed
  // e.g., image.quality(options.quality || 'auto');

  return image.toURL();
};

export { getCloudinaryImageUrl };