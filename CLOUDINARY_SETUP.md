# Cloudinary Setup Guide for AccreditEx

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Cloudinary Account
1. Go to [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Sign up for a free account (No credit card required)
3. Verify your email

### Step 2: Get Your Credentials
1. Log in to [Cloudinary Console](https://console.cloudinary.com/)
2. You'll see your **Dashboard** with:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (keep this secure!)

### Step 3: Create Upload Preset
1. In Cloudinary Console, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `accreditex_documents`
   - **Signing mode**: Select **Unsigned** (for client-side uploads)
   - **Folder**: Leave empty (we'll set it dynamically)
   - **Resource type**: Auto
   - **Access mode**: Public
5. Click **Save**

### Step 4: Update .env File
Open `d:\_Projects\accreditex\.env` and update:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=accreditex_documents
VITE_CLOUDINARY_API_KEY=your_api_key_here
```

Example:
```env
VITE_CLOUDINARY_CLOUD_NAME=dxyz123abc
VITE_CLOUDINARY_UPLOAD_PRESET=accreditex_documents
VITE_CLOUDINARY_API_KEY=123456789012345
```

### Step 5: Restart Development Server
```bash
npm run dev
```

## ✅ Features Enabled

### Document Uploads
- **Automatic folder organization**: `accreditex/documents/policy`, `accreditex/documents/procedure`, etc.
- **Progress tracking**: Real-time upload progress
- **Automatic optimization**: PDFs, Word docs, Excel files
- **Tagged uploads**: All files tagged with `accreditex` for easy search

### Image Uploads
- **Automatic format conversion**: WebP for modern browsers
- **Quality optimization**: `auto` quality setting
- **Responsive images**: Generate thumbnails on-the-fly
- **CDN delivery**: Fast global delivery

### File Management
- **Search by tags**: Find files by `accreditex`, `documents`, `policy`, etc.
- **Folder structure**: Organized by document type
- **Secure URLs**: HTTPS by default

## 🎯 Usage in Code

### Upload Document
```typescript
import { cloudinaryService } from '@/services/cloudinaryService';

// Upload with progress
const url = await cloudinaryService.uploadDocument(
  file,
  'accreditex/documents/policy',
  (progress) => {
    console.log(`Upload: ${progress.progress}%`);
  }
);
```

### Upload Image
```typescript
// Upload with automatic optimization
const url = await cloudinaryService.uploadImage(
  imageFile,
  'accreditex/images',
  (progress) => {
    console.log(`Upload: ${progress.progress}%`);
  }
);
```

### Generate Thumbnail
```typescript
const thumbnailUrl = cloudinaryService.getThumbnailUrl(
  originalUrl,
  200, // width
  200  // height
);
```

## 📊 Free Tier Limits
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Admin API calls**: 500/hour

This is more than enough for most small to medium applications!

## 🔒 Security Notes

### Current Setup (Client-Side)
- Uses **unsigned upload preset** (no authentication required)
- Suitable for: Development, internal tools, trusted users
- Files are public by default

### Production Recommendations
1. **Implement backend proxy**: Handle uploads through your server
2. **Use signed uploads**: Generate signed URLs on backend
3. **Add file validation**: Check file types and sizes on server
4. **Rate limiting**: Prevent abuse

### Example Backend Endpoint (Node.js)
```javascript
// server.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.post('/api/upload-signature', (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: req.body.folder },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({ signature, timestamp });
});
```

## 🎨 Advanced Features

### Image Transformations
Cloudinary can transform images on-the-fly via URL:

```
Original:
https://res.cloudinary.com/demo/image/upload/sample.jpg

Resized (200x200):
https://res.cloudinary.com/demo/image/upload/w_200,h_200/sample.jpg

Cropped and rounded:
https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill,r_max/sample.jpg

Grayscale:
https://res.cloudinary.com/demo/image/upload/e_grayscale/sample.jpg
```

### Document Preview Thumbnails
Generate preview images for PDFs:
```
https://res.cloudinary.com/your-cloud/image/upload/f_jpg,pg_1/document.pdf
```

## 🐛 Troubleshooting

### "Upload failed with status 400"
- Check your **Cloud Name** is correct
- Verify **Upload Preset** name matches exactly
- Ensure upload preset is set to **Unsigned**

### "CORS Error"
- Cloudinary handles CORS automatically
- If you see CORS errors, check your preset settings

### "File too large"
Free tier limits:
- Max file size: 10 MB (unsigned)
- Max file size: 100 MB (signed)

### Check Configuration
```typescript
const info = cloudinaryService.getConfigInfo();
console.log(info);
// { cloudName: 'demo', uploadPreset: 'ml_default', configured: false }
```

## 📚 Resources
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [React SDK Guide](https://cloudinary.com/documentation/react_integration)
- [Upload Presets](https://cloudinary.com/documentation/upload_presets)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)

## 🎉 You're All Set!
Your AccreditEx app now uses Cloudinary for all document and image uploads with automatic optimization and CDN delivery!
