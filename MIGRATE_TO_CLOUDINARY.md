# Migrate Local Uploads to Cloudinary

## Problem
Your local files in `D:\AuraCares-main\backend\uploads` are **not** on the Render server. They need to be uploaded to Cloudinary to appear on the hosted website.

## Solution
Use the migration script to upload all local files to Cloudinary and update database records.

## How to Run the Migration

### Step 1: Make sure your local server can connect to MongoDB

The script needs to connect to your production MongoDB database to update records.

Check your `.env` file has the correct MongoDB connection string:
```
MONGODB_URI=your_production_mongodb_connection_string
```

### Step 2: Run the Migration Script

Open PowerShell in the backend directory and run:

```powershell
cd D:\AuraCares-main\backend
node migrate-uploads-to-cloudinary.js
```

### Step 3: What the Script Does

The script will:
1. ✅ Connect to your MongoDB database
2. ✅ Find all records with local file paths (e.g., `uploads/staff/photo.jpg`)
3. ✅ Check if files exist in your local `uploads/` folder
4. ✅ Upload found files to Cloudinary
5. ✅ Update database records with new Cloudinary URLs
6. ✅ Show progress for each file

### Step 4: Expected Output

You should see output like this:

```
🚀 Starting Cloudinary Migration...
================================================

✅ Connected to MongoDB

📂 Migrating Staff Uploads...

Found 5 staff members with local file paths

👤 Processing: John Doe (64abc123...)
  📸 Uploading profile picture...
  ✅ Profile picture uploaded: https://res.cloudinary.com/dzbjcacnn/image/upload/v1234/auracare/staff/xyz.jpg
  💾 Database updated successfully

👤 Processing: Jane Smith (64abc456...)
  📸 Uploading profile picture...
  ✅ Profile picture uploaded: https://res.cloudinary.com/dzbjcacnn/image/upload/v1234/auracare/staff/abc.jpg
  💾 Database updated successfully

✅ Staff Migration Complete: 5 migrated, 0 failed

🏢 Migrating Salon Uploads...
✅ Salon Migration Complete: 3 migrated, 0 failed

👥 Migrating Customer Uploads...
✅ Customer Migration Complete: 2 migrated, 0 failed

================================================
✅ Migration Complete!
================================================
```

## What Gets Migrated

### Staff:
- ✅ Profile pictures (`uploads/staff/profilePicture-*.jpg`)
- ✅ Government IDs (`uploads/staff/governmentId-*.jpg`)

### Salons:
- ✅ Business licenses (`uploads/salons/businessLicense-*.jpg`)
- ✅ Salon logos (`uploads/salons/salonLogo-*.jpg`)
- ✅ Salon images (`uploads/salons/salonImages-*.jpg`)

### Customers:
- ✅ Profile pictures (`uploads/customers/profilePicture-*.jpg`)

## After Migration

Once migration completes:

1. **Check your hosted website** - All migrated images should now display!
2. **Cloudinary Dashboard** - Login to see all uploaded files
3. **Database** - Records now have Cloudinary URLs like:
   ```
   https://res.cloudinary.com/dzbjcacnn/image/upload/v1234/auracare/staff/photo.jpg
   ```

## Troubleshooting

### Error: "File not found locally"
- **Cause:** File path in database doesn't match actual file location
- **Solution:** File was already deleted or never existed. Skip it or manually upload.

### Error: "Failed to upload to Cloudinary"
- **Cause:** Cloudinary credentials incorrect or API limit reached
- **Solution:** Check `.env` file has correct:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### Error: "Cannot connect to MongoDB"
- **Cause:** MongoDB connection string incorrect
- **Solution:** Check `MONGODB_URI` in `.env` file

### Some files still showing 404
- **Cause:** Files don't exist in your local `uploads/` folder
- **Solution:** These files are lost. Re-upload them manually via the admin interface.

## Manual Re-upload Alternative

If you prefer not to run the script, you can manually re-upload images:

1. **Login as Admin**
2. **Navigate to Manage Staff**
3. **Edit each staff member**
4. **Upload profile picture again**
5. **Save** - New upload automatically goes to Cloudinary ✅

## Important Notes

⚠️ **Run only once** - The script is idempotent but uploads cost bandwidth
⚠️ **Backup first** - Consider backing up your MongoDB database
⚠️ **Local files required** - You must have the files in `D:\AuraCares-main\backend\uploads`
✅ **Safe operation** - Only updates records that currently have local paths
✅ **No data loss** - Original database data preserved if upload fails

## After Successful Migration

You can safely:
- ✅ Deploy to Render - All images now in Cloudinary
- ✅ Delete local `uploads/` folder (optional, keep as backup)
- ✅ Future uploads automatically use Cloudinary

## Questions?

- Check the script output for detailed error messages
- Each file upload is logged with success/failure status
- Database records only updated on successful upload
