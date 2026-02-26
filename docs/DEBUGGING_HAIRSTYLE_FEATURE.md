# Hairstyle Recommendation - Debugging Guide

## ✅ Status Check

1. **ML Service**: ✓ Running on http://localhost:5001 (verified working)
2. **Frontend**: Please start if not running
3. **Backend Endpoint**: ✓ Tested and working perfectly

## 🐛 Debugging Steps

### Step 1: Test with Standalone HTML Page

Open this file in your browser to test camera and API without React:
```
D:\AuraCares-main\test-hairstyle-recommendation.html
```

**Just double-click the file** or open it in your browser. This will:
- Test camera access
- Test API connection
- Show detailed console logs
- Verify the entire flow works

### Step 2: Check the React Frontend

1. **Start the Frontend** (if not running):
   ```powershell
   cd frontend
   npm run dev
   ```

2. **Access the page**:
   - Navigate to http://localhost:5173 (or whatever port Vite shows)
   - Login as a customer
   - Go to Customer Dashboard
   - Click "Hairstyle Recommendation" button

3. **Open Browser DevTools**:
   - Press `F12` or `Ctrl+Shift+I`
   - Go to **Console** tab
   - Look for errors or log messages

### Step 3: Common Issues and Fixes

#### Issue: Camera opens but no analysis happens

**Fix 1: Check Console Logs**
- The updated frontend now shows detailed console logs
- Look for messages like:
  - "Starting capture and analysis..."
  - "Video dimensions: X x Y"
  - "Sending request to: ..."
  - "Response status: ..."

**Fix 2: CORS Error**
If you see CORS errors in console:
```
Access to fetch at 'http://localhost:5001/analyze-face-shape' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

The ML service already has CORS enabled, but you can verify by checking the response headers in DevTools > Network tab.

**Fix 3: Video Not Ready**
The updated code now checks if video dimensions are ready. If you see:
```
"Video not ready. Please wait a moment and try again."
```
Wait 1-2 seconds after camera starts before clicking analyze.

**Fix 4: Network Error**
If you see network errors, ensure:
- ML service is running on port 5001: `netstat -ano | findstr :5001`
- No firewall blocking localhost connections

#### Issue: "No face detected" message

This means the API worked but couldn't detect a face. Try:
- Ensure good lighting
- Position face clearly in center of frame
- Face the camera directly
- Remove glasses/masks that might interfere

### Step 4: Verify ML Service Status

```powershell
# Check if running on port 5001
netstat -ano | findstr :5001

# If not running, start it:
cd ml-service
venv\Scripts\Activate.ps1
python app.py
```

### Step 5: Test API Directly

```powershell
cd ml-service
venv\Scripts\Activate.ps1
python test_endpoint.py
```

Expected output:
```
✓ Endpoint is working!
Status Code: 200
Response: {'success': True, 'data': {...}}
```

### Step 6: Check Frontend Environment Variable

The frontend expects ML service at:
```javascript
const API_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';
```

If you have a `.env` file in frontend with a different URL, update it:
```
VITE_ML_SERVICE_URL=http://localhost:5001
```

## 📊 Expected Behavior

### Successful Flow:
1. Click "Start Camera" → Camera permission popup → Camera starts
2. Position face in frame
3. Click "Capture & Analyze" → Loading spinner shows
4. After 1-3 seconds → Results appear:
   - Face shape (e.g., "Oval", "Round", "Long")
   - 5-6 hairstyle recommendations
   - Face measurements
   - Styling tips

### Console Logs (Normal):
```
Starting capture and analysis...
Video dimensions: 1280 x 720
Image captured, size: 123456 bytes
Blob created, size: 123456 bytes
Sending request to: http://localhost:5001/analyze-face-shape
Response status: 200
Response data: {success: true, data: {...}}
```

## 🔍 Troubleshooting Checklist

- [ ] ML service running on port 5001
- [ ] Frontend running (check with `netstat -ano | findstr :5173`)
- [ ] Browser DevTools Console open (F12)
- [ ] Camera permission granted
- [ ] Face clearly visible in good lighting
- [ ] No CORS errors in console
- [ ] Standalone test page works (`test-hairstyle-recommendation.html`)

## 🛠️ Quick Fixes Applied

I've updated the frontend with:
- ✓ Video readiness check before capture
- ✓ Detailed console logging at each step
- ✓ Better error messages
- ✓ Video dimension validation

## 📞 Next Steps

1. **Try the standalone HTML test page first** - This will confirm if the API works
2. **Start the React frontend** if not running
3. **Open browser console** and look for any errors
4. **Report back** with:
   - What you see in the console
   - Any error messages
   - Whether the standalone test page works

## 🎯 Files Modified

- `frontend/src/pages/customer/HairstyleRecommendation.jsx` - Added debugging logs
- `test-hairstyle-recommendation.html` - Standalone test page (NEW)
- `ml-service/test_endpoint.py` - Endpoint testing script

---

**Current Status**: ML Service is confirmed working. Testing frontend connection now.
