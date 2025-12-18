# Render Deployment Checklist for AuraCare

## ✅ Pre-Deployment Checklist

### 1. Code & Dependencies
- [x] All code pushed to GitHub
- [x] `package.json` has correct dependencies
- [x] `package-lock.json` is up to date
- [x] No `.env` file committed to Git
- [x] Cloudinary integration complete

### 2. Database
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Network access configured (allow from anywhere: 0.0.0.0/0)
- [ ] Connection string copied

### 3. Email Service
- [ ] **Choose ONE:**
  - [ ] Resend account created + API key obtained
  - [ ] Gmail App Password generated
- [ ] Test email sending locally
- [ ] Verify email arrives (check spam)

## 🚀 Render Deployment Steps

### Step 1: Create Backend Service

1. **Login to Render:**
   - Go to https://dashboard.render.com
   - Sign in with GitHub

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `AuraCares-main` repo

3. **Configure Service:**
   ```
   Name: auracare-backend
   Region: Oregon (US West) or closest to you
   Branch: master
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

### Step 2: Add Environment Variables

**Click "Environment" → Add these variables:**

#### Required - Database
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/auracare
```

#### Required - Authentication
```
JWT_SECRET = your-secure-random-string-here
NODE_ENV = production
PORT = 5000
```

#### Required - URLs
```
BASE_URL = https://auracare-backend.onrender.com
FRONTEND_URL = https://auracare-frontend.onrender.com
```

#### Required - Email (CHOOSE ONE OPTION)

**Option A: Resend (Recommended)**
```
RESEND_API_KEY = re_your_api_key_here
EMAIL_FROM = "AuraCare Beauty Parlor" <noreply@yourdomain.com>
```

**Option B: Gmail**
```
EMAIL_USER = your-email@gmail.com
EMAIL_PASS = your-16-char-app-password
EMAIL_FROM = "AuraCare Beauty Parlor" <your-email@gmail.com>
```

#### Required - Cloudinary
```
CLOUDINARY_CLOUD_NAME = dzbjcacnn
CLOUDINARY_API_KEY = 876578995275917
CLOUDINARY_API_SECRET = X5ELAMbkjO6-VOEMcAgc_0CNsfw
```

4. **Click "Save Changes"**

### Step 3: Deploy Backend

1. Click "Manual Deploy" → "Deploy latest commit"
2. Wait 3-5 minutes for deployment
3. Check logs for errors
4. Look for: `✅ Server is running on port 5000`

### Step 4: Create Frontend Service

1. **Create New Static Site:**
   - Click "New +" → "Static Site"
   - Select same GitHub repo
   - Branch: `master`

2. **Configure Static Site:**
   ```
   Name: auracare-frontend
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   ```

3. **Add Frontend Environment Variables:**
   ```
   REACT_APP_API_URL = https://auracare-backend.onrender.com/api
   ```

4. **Deploy Frontend**

### Step 5: Update Backend FRONTEND_URL

1. Go back to backend service
2. Update `FRONTEND_URL` with actual frontend URL
3. Save changes (will redeploy)

## 🧪 Testing Checklist

### Test Email Service
- [ ] Go to hosted website
- [ ] Click "Forgot Password"
- [ ] Enter test email
- [ ] Click "Send OTP"
- [ ] **Email should arrive within 1 minute**
- [ ] Check spam folder if not in inbox
- [ ] Verify OTP works for password reset

### Test Other Features
- [ ] User registration
- [ ] User login
- [ ] Image uploads (Cloudinary)
- [ ] Salon creation
- [ ] Staff management
- [ ] Appointment booking

## 🐛 Troubleshooting

### Email Not Sending

**1. Check Render Logs:**
```
Dashboard → Backend Service → Logs → Search for:
- "Email transporter verified successfully" ✅
- "Email configuration missing" ❌
- "Email authentication failed" ❌
```

**2. Common Issues:**

| Error | Solution |
|-------|----------|
| "Email configuration missing" | Add EMAIL_USER/EMAIL_PASS or RESEND_API_KEY to Render |
| "Email authentication failed" | Gmail: Use App Password, not regular password |
| "Failed to connect" | Check API key is correct for Resend |
| Email in spam | Normal for first sends, ask users to add to contacts |

**3. Verify Environment Variables:**
- Dashboard → Service → Environment
- Scroll down to "Environment Variables"
- Verify all email variables are present
- **No quotes** needed around values
- Click "Save Changes" if you made edits

### Deployment Failing

**Check Build Logs:**
```
Dashboard → Service → Logs → "Deploy"
```

**Common Issues:**
- Missing dependencies → Check `package.json`
- Wrong Node version → Render uses Node 20 by default
- Build timeout → Optimize build process

### Database Connection Failed

**Verify:**
- MongoDB Atlas network access: `0.0.0.0/0`
- Connection string format correct
- Username/password have no special characters (or URL-encoded)
- Database name is correct

## 📧 Email Service Setup Details

### Using Resend (Recommended)

**Advantages:**
- ✅ More reliable than Gmail
- ✅ Better deliverability
- ✅ 100 free emails/day
- ✅ Easy setup
- ✅ Professional

**Setup Steps:**
1. Sign up: https://resend.com
2. Get API key: https://resend.com/api-keys
3. Add to Render: `RESEND_API_KEY=re_xxx...`
4. Set sender: `EMAIL_FROM="AuraCare" <noreply@yourdomain.com>`

### Using Gmail

**Advantages:**
- ✅ Free forever
- ✅ Easy to setup
- ✅ No domain needed

**Disadvantages:**
- ⚠️ May go to spam more often
- ⚠️ 500 emails/day limit
- ⚠️ Requires App Password setup

**Setup Steps:**
1. Enable 2-Step Verification on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to Render:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-password
   ```

## 🎯 Post-Deployment

### Monitor Your App
- [ ] Check Render logs regularly
- [ ] Monitor email sending success rate
- [ ] Test all critical features weekly
- [ ] Keep dependencies updated

### Performance
- [ ] Render Free tier spins down after 15 min inactivity
- [ ] First request after spin-down takes ~30 seconds
- [ ] Consider upgrading to paid plan for always-on

### Security
- [ ] Rotate JWT_SECRET periodically
- [ ] Never expose API keys in frontend code
- [ ] Use HTTPS for all requests (Render provides this)
- [ ] Monitor MongoDB Atlas access logs

## ✨ Success Criteria

Your deployment is successful when:
- ✅ Backend responds at https://your-backend.onrender.com/health
- ✅ Frontend loads at https://your-frontend.onrender.com
- ✅ OTP emails are sent and received
- ✅ Users can register, login, and use all features
- ✅ Images upload to Cloudinary successfully
- ✅ Database operations work correctly

## 📞 Support Resources

- **Render Docs:** https://render.com/docs
- **Resend Docs:** https://resend.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/
- **Cloudinary Docs:** https://cloudinary.com/documentation

---

**Last Updated:** After Cloudinary migration and email service integration
**Deployment Status:** Ready for production ✅
