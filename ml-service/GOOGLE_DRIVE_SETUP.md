# Google Drive Model Download Setup

This guide explains how to automatically download your ML model from Google Drive when deploying to Render.

## Why is this needed?

Your `face_shape_model.h5` file is 127 MB, which exceeds GitHub's 100 MB file size limit. Instead of committing it to your repository, the model is downloaded from Google Drive when the application starts.

## Setup Steps

### 1. Upload your model to Google Drive

1. Go to [Google Drive](https://drive.google.com)
2. Upload `face_shape_model.h5`
3. Right-click the file and select "Share"
4. Change access to "Anyone with the link"
5. Copy the sharing link (it will look like: `https://drive.google.com/file/d/1ABC...XYZ/view?usp=sharing`)

### 2. Configure the download link

**For local testing:**

Edit `ml-service/download_model.py` at the bottom where it says:
```python
GOOGLE_DRIVE_LINK = "https://drive.google.com/file/d/YOUR_FILE_ID_HERE/view?usp=sharing"
```

Replace `YOUR_FILE_ID_HERE` with your actual file ID.

**For Render deployment:**

Set an environment variable in Render Dashboard:
- Key: `FACE_MODEL_DRIVE_LINK`
- Value: Your full Google Drive sharing link

### 3. How it works

The `download_model.py` script:

1. **Checks if model exists** - If `model/face_shape_model.h5` already exists, it skips the download
2. **Downloads if missing** - If the model is not found, it downloads from Google Drive
3. **Handles large files** - Automatically handles Google's virus scan warning for files > 100MB
4. **Prints status** - Shows clear messages about download progress

### 4. Integration

The model download is integrated into `app.py` and runs automatically when the Flask app starts:

```python
from download_model import download_model_if_missing

# At app startup
download_model_if_missing(GOOGLE_DRIVE_MODEL_LINK)
```

## Testing Locally

1. Delete your local model file (if it exists):
   ```powershell
   Remove-Item ml-service\model\face_shape_model.h5
   ```

2. Run the download script directly:
   ```powershell
   cd ml-service
   python download_model.py
   ```

3. You should see:
   ```
   ⬇ Model not found. Downloading from Google Drive...
      Destination: D:\AuraCares-main\ml-service\model\face_shape_model.h5
   ✓ Model downloaded successfully!
      File size: 127.45 MB
   ```

## Troubleshooting

### "Invalid Google Drive sharing link format"
Make sure your link looks like one of these formats:
- `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
- `https://drive.google.com/open?id=FILE_ID`

### "Download completed but file not found"
The model directory might not have write permissions. Check that `ml-service/model/` exists and is writable.

### Large file stuck at download
For files over 100MB, Google shows a virus scan warning. The script handles this automatically by confirming the download.

## Dependencies

The script only requires the `requests` library, which should already be in your `requirements.txt`:

```
requests>=2.28.0
```

## Example Google Drive Links

**Sharing link format:**
```
https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view?usp=sharing
```

The script extracts the file ID (`1a2b3c4d5e6f7g8h9i0j`) and converts it to a direct download URL:
```
https://drive.google.com/uc?export=download&id=1a2b3c4d5e6f7g8h9i0j
```
