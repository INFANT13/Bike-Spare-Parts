const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let isCloudinaryConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  isCloudinaryConfigured = true;
  console.log('Cloudinary service integrated successfully.');
} else {
  console.log('Cloudinary credentials missing. Uploads will fall back to local storage.');
}

const uploadToCloudinary = async (file) => {
  if (!file) return null;

  const localPath = file.path;
  const relativeUrl = `/uploads/${file.filename}`;

  if (!isCloudinaryConfigured) {
    // Return the local relative URL for static hosting fallback
    return relativeUrl;
  }

  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'bike_parts_store'
    });

    // Delete local file after upload succeeds
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Failed, using local fallback:', error.message);
    return relativeUrl;
  }
};

module.exports = { uploadToCloudinary };
