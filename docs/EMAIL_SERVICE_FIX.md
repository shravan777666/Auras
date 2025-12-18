# Email Service Fix for Render Deployment

## Problem
Email/OTP service works on localhost but fails on the hosted Render website because environment variables are not configured.

## Root Cause
The email configuration in `backend/config/email.js` requires these environment variables:

**Option 1: Using Resend (Recommended for Production)**
- `RESEND_API_KEY` - Your Resend API key

**Option 2: Using Gmail SMTP (Alternative)**
- `EMAIL_USER` - Your Gmail address
- `EMAIL_PASS` - Your Gmail app password (NOT your regular password)
- `EMAIL_FROM` - Display name and email for sender

## Solution: Configure Environment Variables on Render

### Step 1: Choose Your Email Service

#### **Option A: Resend (Recommended - More Reliable)**

1. **Sign up for Resend:**
   - Go to https://resend.com
   - Sign up for a free account
   - Get 100 emails/day free (perfect for OTP)

2. **Get Your API Key:**
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Name it: `AuraCare Production`
   - Copy the API key (starts with `re_`)

3. **Verify Your Domain (Optional but Recommended):**
   - Go to https://resend.com/domains
   - Add your domain or use `onrender.com`
   - Follow verification instructions

#### **Option B: Gmail SMTP (Easier Setup)**

1. **Enable 2-Step Verification:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" → Type "AuraCare"
   - Click "Generate"
   - **IMPORTANT:** Copy the 16-character password (you won't see it again)

### Step 2: Add Environment Variables to Render

1. **Login to Render Dashboard:**
   - Go to https://dashboard.render.com
   - Find your backend service (e.g., `auracare-backend`)

2. **Navigate to Environment Variables:**
   - Click on your service
   - Click "Environment" in the left sidebar
   - Scroll to "Environment Variables" section

3. **Add Variables:**

   **If Using Resend:**
   ```
   Key: RESEND_API_KEY
   Value: re_your_api_key_here
   ```

   ```
   Key: EMAIL_FROM
   Value: "AuraCare Beauty Parlor" <noreply@yourdomain.com>
   ```

   **If Using Gmail:**
   ```
   Key: EMAIL_USER
   Value: your-email@gmail.com
   ```

   ```
   Key: EMAIL_PASS
   Value: your-16-char-app-password
   ```

   ```
   Key: EMAIL_FROM
   Value: "AuraCare Beauty Parlor" <your-email@gmail.com>
   ```

4. **Click "Save Changes"**

5. **Wait for Re-deployment:**
   - Render will automatically redeploy your service
   - Wait 2-3 minutes for the deployment to complete

### Step 3: Test Email Service

1. **Go to your hosted website**
2. **Navigate to Forgot Password**
3. **Enter an email address**
4. **Click "Send OTP"**
5. **Check your email inbox** (and spam folder)

You should receive an email with the OTP!

## Troubleshooting

### Issue 1: Still Not Receiving Emails

**Check Render Logs:**
1. Go to Render Dashboard → Your Service → Logs
2. Look for email-related errors:
   ```
   ❌ Email authentication failed
   ❌ Failed to connect to email service
   ```

**Solutions:**
- **If using Gmail:** Make sure you used the App Password, NOT your regular password
- **If using Resend:** Verify your API key is correct
- **Check spam folder:** First emails might go to spam

### Issue 2: "Email authentication failed"

**For Gmail:**
- Ensure 2-Step Verification is enabled
- Regenerate App Password
- Try a different Gmail account

**For Resend:**
- Verify API key is active
- Check domain verification status

### Issue 3: "Failed to connect to email service"

- Check internet connectivity on Render (rare)
- Verify no typos in environment variables
- Try switching between Resend and Gmail

### Issue 4: Emails Going to Spam

**For Gmail:**
- Send from a professional email address
- Ask users to add you to contacts

**For Resend:**
- Verify your domain
- Set up SPF and DKIM records
- Use a custom domain instead of `onrender.com`

## Environment Variables Summary

### Complete List for Render

**Resend Configuration (Recommended):**
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="AuraCare Beauty Parlor" <noreply@yourdomain.com>
FRONTEND_URL=https://your-frontend-url.onrender.com
```

**Gmail Configuration (Alternative):**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM="AuraCare Beauty Parlor" <your-email@gmail.com>
FRONTEND_URL=https://your-frontend-url.onrender.com
```

**Other Important Variables:**
```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
NODE_ENV=production
PORT=5000
CLOUDINARY_CLOUD_NAME=dzbjcacnn
CLOUDINARY_API_KEY=876578995275917
CLOUDINARY_API_SECRET=X5ELAMbkjO6-VOEMcAgc_0CNsfw
```

## Email Service Flow

### How It Works:

1. **User Requests OTP:**
   - Frontend sends email + userType to backend
   - Backend checks if user exists

2. **OTP Generation:**
   - Generate 6-digit random OTP
   - Save to MongoDB with 5-minute expiration
   - Log OTP to console (for debugging)

3. **Email Sending:**
   - Check environment variables
   - **If RESEND_API_KEY exists:** Use Resend SMTP
   - **Else if EMAIL_USER exists:** Use Gmail SMTP
   - **Else:** Development mode (OTP in response, no email)

4. **Production Check:**
   ```javascript
   // This code runs on Render
   if (!process.env.EMAIL_USER && !process.env.RESEND_API_KEY) {
     // ❌ NO EMAIL VARIABLES = NO EMAILS SENT
     console.log('Email configuration missing - development mode');
   }
   ```

## Quick Fix Commands

### Check Render Environment Variables:

1. **Via Dashboard:**
   - Go to https://dashboard.render.com
   - Service → Environment
   - Verify all email variables are set

2. **Via Logs:**
   - Service → Logs
   - Search for: `"Email transporter verified successfully"`
   - If you see: `"Email configuration missing"` → Variables not set

## Testing Checklist

- [ ] Environment variables added to Render
- [ ] Service redeployed successfully
- [ ] Can send OTP to test email
- [ ] OTP received in inbox (check spam)
- [ ] OTP works for password reset
- [ ] Emails have correct sender name
- [ ] Email links point to production URL

## Best Practices

### Security:
- ✅ Never commit `.env` file to Git
- ✅ Use App Passwords for Gmail (never regular password)
- ✅ Rotate API keys periodically
- ✅ Use environment-specific configurations

### Reliability:
- ✅ Resend is more reliable than Gmail for production
- ✅ Set up domain verification for better deliverability
- ✅ Monitor email sending in Render logs
- ✅ Have fallback error handling

### User Experience:
- ✅ Clear error messages for failed sends
- ✅ OTP expires after 5 minutes
- ✅ Professional email templates
- ✅ Branded sender name and email

## Support

If you're still having issues:

1. **Check Render Logs:**
   ```bash
   # Look for these log messages:
   ✅ Email transporter verified successfully
   ✅ OTP email sent successfully
   ❌ Email authentication failed
   ❌ Failed to connect to email service
   ```

2. **Test Locally First:**
   - Add variables to local `.env`
   - Test OTP sending
   - Verify email receipt
   - Then apply same config to Render

3. **Contact Support:**
   - Resend: https://resend.com/support
   - Gmail: https://support.google.com/mail

## Summary

The fix is simple:
1. ✅ Choose Resend or Gmail
2. ✅ Get API key or App Password
3. ✅ Add to Render Environment Variables
4. ✅ Wait for automatic redeployment
5. ✅ Test OTP email sending

Your email service will work perfectly after this! 🎉
