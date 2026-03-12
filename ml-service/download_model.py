"""
Download ML Model from Google Drive
Automatically downloads the face shape model from Google Drive if it doesn't exist locally
"""

import os
import requests


def get_google_drive_download_url(sharing_link):
    """
    Convert a Google Drive sharing link to a direct download URL
    
    Args:
        sharing_link: Google Drive sharing link (e.g., https://drive.google.com/file/d/FILE_ID/view?usp=sharing)
        
    Returns:
        Direct download URL
    """
    # Extract the file ID from the sharing link
    if '/file/d/' in sharing_link:
        file_id = sharing_link.split('/file/d/')[1].split('/')[0]
    elif 'id=' in sharing_link:
        file_id = sharing_link.split('id=')[1].split('&')[0]
    else:
        raise ValueError("Invalid Google Drive sharing link format")
    
    # Return the direct download URL
    return f"https://drive.google.com/uc?export=download&id={file_id}"


def download_file_from_google_drive(file_id, destination):
    """
    Download a file from Google Drive
    
    Args:
        file_id: Google Drive file ID
        destination: Local path where the file should be saved
    """
    URL = "https://drive.google.com/uc?export=download"
    
    session = requests.Session()
    
    response = session.get(URL, params={'id': file_id}, stream=True)
    token = None
    
    # Handle virus scan warning for large files
    for key, value in response.cookies.items():
        if key.startswith('download_warning'):
            token = value
            break
    
    if token:
        params = {'id': file_id, 'confirm': token}
        response = session.get(URL, params=params, stream=True)
    
    # Save the file
    with open(destination, "wb") as f:
        for chunk in response.iter_content(chunk_size=32768):
            if chunk:
                f.write(chunk)


def download_model_if_missing(google_drive_link, model_path="model/face_shape_model.h5"):
    """
    Download the ML model from Google Drive if it doesn't exist locally
    
    Args:
        google_drive_link: Google Drive sharing link for the model
        model_path: Local path where the model should be saved
    """
    # Get absolute path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    full_model_path = os.path.join(script_dir, model_path)
    
    # Create model directory if it doesn't exist
    model_dir = os.path.dirname(full_model_path)
    os.makedirs(model_dir, exist_ok=True)
    
    # Check if model already exists
    if os.path.exists(full_model_path):
        print(f"✓ Model already exists at {full_model_path}")
        return
    
    print(f"⬇ Model not found. Downloading from Google Drive...")
    print(f"   Destination: {full_model_path}")
    
    try:
        # Extract file ID from Google Drive link
        if '/file/d/' in google_drive_link:
            file_id = google_drive_link.split('/file/d/')[1].split('/')[0]
        elif 'id=' in google_drive_link:
            file_id = google_drive_link.split('id=')[1].split('&')[0]
        else:
            raise ValueError("Invalid Google Drive sharing link format")
        
        # Download the file
        download_file_from_google_drive(file_id, full_model_path)
        
        print(f"✓ Model downloaded successfully!")
        
        # Verify the file exists and has content
        if os.path.exists(full_model_path):
            file_size = os.path.getsize(full_model_path) / (1024 * 1024)  # Size in MB
            print(f"   File size: {file_size:.2f} MB")
        else:
            raise Exception("Download completed but file not found")
            
    except Exception as e:
        print(f"✗ Error downloading model: {str(e)}")
        raise


if __name__ == "__main__":
    # Example usage
    print("=== ML Model Downloader ===\n")
    
    # Replace with your actual Google Drive sharing link
    GOOGLE_DRIVE_LINK = "https://drive.google.com/file/d/YOUR_FILE_ID_HERE/view?usp=sharing"
    
    # Download model if it doesn't exist
    download_model_if_missing(GOOGLE_DRIVE_LINK)
