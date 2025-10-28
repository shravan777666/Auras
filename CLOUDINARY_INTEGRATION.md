# Cloudinary Integration Documentation

## Overview
This document explains how Cloudinary is integrated into the Auracare application for handling image uploads and storage.

## Configuration

### Backend Configuration
Cloudinary is configured in `backend/config/cloudinary.js`:

- Uses environment variables for credentials:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

- Configured storage engines for different entity types:
  - Customer profile images
  - Staff profile images
  - Salon images

### Frontend Configuration
Frontend uses environment variables:
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_API_KEY`

## Implementation Details

### Backend
1. **Routes**: `/api/image-upload/*` endpoints handle image uploads
2. **Controllers**: `imageController.js` processes upload requests
3. **Storage**: Cloudinary storage via `multer-storage-cloudinary`
4. **Models**: Entities store image URLs directly

### Frontend
1. **Components**: `ImageUpload` component handles UI
2. **Services**: `imageService.js` manages API calls
3. **Display**: Images are displayed using direct URLs from backend

## API Endpoints

### Customer Profile Image
- `POST /api/image-upload/customer/profile` - Upload customer profile image

### Staff Profile Image
- `POST /api/image-upload/staff/profile` - Upload staff profile image

### Salon Image
- `POST /api/image-upload/salon/image` - Upload salon image

## Usage Examples

### Uploading an Image (Frontend)
```javascript
import imageService from '../services/imageService';

// Upload customer profile image
const response = await imageService.uploadCustomerProfileImage(file);
const imageUrl = response.data.profilePic;
```

### Displaying an Image (Frontend)
```jsx
<img src={imageUrl} alt="Profile" />
```

## Deployment

### Render Configuration
Environment variables are configured in `render.yaml`:
- Backend service includes Cloudinary credentials
- Frontend service includes public Cloudinary configuration

## Troubleshooting

### Common Issues
1. **404 Errors**: Ensure image URLs are correctly formed
2. **Upload Failures**: Check Cloudinary credentials in environment variables
3. **Display Issues**: Verify image URLs are accessible

### Testing
Use the test page at `/customer/test-image-upload` to verify functionality.
