# Cloudinary Integration Fix for Production

## Problem
Staff profile pictures and documents were showing 404 errors on the production site (https://auracare-frontend.onrender.com/admin/staff) because:
1. Files were uploaded using local disk storage (`multer.diskStorage()`)
2. On Render, local file storage is ephemeral - files are deleted on each deployment
3. The backend was storing local file paths (e.g., `uploads/staff/profilePicture-123.jpg`) instead of Cloudinary URLs

## Solution
Migrated all file uploads from local storage to Cloudinary cloud storage.

## Changes Made

### 1. Backend Routes Updated

#### `/backend/routes/staff.js`
- **Changed from**: Local upload middleware (`upload` from `middleware/upload.js`)
- **Changed to**: Cloudinary upload middleware (`staffUpload` from `config/cloudinary.js`)
- **Routes affected**:
  - `POST /create` - Staff creation by salon owner
  - `POST /setup` - Staff profile setup
  - `PUT /profile` - Staff profile update
  - `PUT /:id` - Update staff by ID

#### `/backend/routes/salon.js`
- **Changed from**: Local upload middleware (`upload` and `salonSetupUploads`)
- **Changed to**: Cloudinary upload middleware (`salonUpload` from `config/cloudinary.js`)
- **Routes affected**:
  - `POST /setup` - Salon setup (businessLicense, salonLogo, salonImages)
  - `PATCH /profile` - Salon profile update (salonLogo, salonImage)

### 2. Backend Controllers Updated

#### `/backend/controllers/staffController.js`
Updated file upload handling to use Cloudinary URLs:
- **`createStaff()` function**: Lines 228-235
  - Changed from: `req.files.profilePicture[0].path`
  - Changed to: `req.files.profilePicture[0].secure_url || req.files.profilePicture[0].path || req.files.profilePicture[0].url`
  
- **`setupProfile()` function**: Lines 372-380
  - Same pattern applied for profilePicture and governmentId uploads
  
- **`updateStaffById()` function**: Lines 1122-1124
  - Same pattern applied

- **`updateProfile()` function**: Already using `secure_url` (lines 1162-1165)

#### `/backend/controllers/salonController.js`
Updated file upload handling to use Cloudinary URLs:
- **`setupSalon()` function**: Lines 264-277
  - Changed businessLicense, salonLogo, and salonImages to use `secure_url`
  
- **`updateProfile()` function**: Lines 968-980
  - Changed salonLogo and salonImage handling to use `secure_url`

#### `/backend/controllers/adminController.js`
- **`getFileUrl()` helper function**: Lines 29-35
  - Added check: If path starts with `http://` or `https://`, return as-is
  - This allows Cloudinary URLs to pass through unchanged

#### `/backend/controllers/customerController.js`
- Same fix applied to `getFileUrl()` helper function

### 3. URL Handling Pattern

All controllers now use this pattern for file uploads:
```javascript
// For Cloudinary uploads, use secure_url; fallback to path for local uploads
const imageUrl = req.files.fieldName[0].secure_url || 
                 req.files.fieldName[0].path || 
                 req.files.fieldName[0].url;
```

This ensures:
- **Production (Cloudinary)**: Uses `secure_url` (e.g., `https://res.cloudinary.com/...`)
- **Local development**: Falls back to `path` if Cloudinary not configured
- **Backward compatibility**: Falls back to `url` if neither is available

### 4. File Types Supported

**Staff uploads** (`auracare/staff` folder in Cloudinary):
- Profile pictures: JPG, PNG, JPEG
- Government IDs: JPG, PNG, JPEG, PDF

**Salon uploads** (`auracare/salons` folder in Cloudinary):
- Business licenses: JPG, PNG, JPEG, PDF
- Salon logos: JPG, PNG, JPEG
- Salon images: JPG, PNG, JPEG (up to 5 images)

**Customer uploads** (`auracare/customers` folder in Cloudinary):
- Profile pictures: JPG, PNG, JPEG

## Dependency Version Fix

### Problem
The deployment was failing due to a peer dependency conflict:
- `cloudinary@^2.8.0` was installed
- `multer-storage-cloudinary@4.0.0` requires `cloudinary@^1.21.0`

### Solution
Downgraded cloudinary to v1.41.0 in `backend/package.json`:
```json
"cloudinary": "^1.41.0"
```

This version is compatible with `multer-storage-cloudinary@4.0.0` and provides all the features we need.

## Environment Variables Required

### Production (Render)
Ensure these environment variables are set in Render dashboard:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Development
Can use default values from `backend/config/cloudinary.js`:
```javascript
cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzbjcacnn'
api_key: process.env.CLOUDINARY_API_KEY || '876578995275917'
api_secret: process.env.CLOUDINARY_API_SECRET || 'X5ELAMbkjO6-VOEMcAgc_0CNsfw'
```

## Testing
After deploying these changes:
1. Upload staff profile pictures and documents
2. Verify URLs in database are Cloudinary URLs (starting with `https://res.cloudinary.com/`)
3. Verify images display correctly on admin staff page
4. Verify images persist after redeployment (they won't be deleted like local files)

## Benefits
1. **Persistence**: Files stored in Cloudinary persist across deployments
2. **CDN**: Faster image delivery via Cloudinary's global CDN
3. **Scalability**: No local disk space limitations
4. **Optimization**: Automatic image optimization and transformation
5. **Reliability**: Professional cloud storage with 99.9% uptime

## Deployment Steps
1. Commit all changes to Git
2. Push to repository
3. Render will automatically detect changes and redeploy
4. Old staff records with local paths will still show 404s
5. New uploads will use Cloudinary and work correctly
6. Optionally: Re-upload existing staff documents to migrate old records
