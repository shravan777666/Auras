import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendOTPEmail } from './config/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n🔍 EMAIL CONFIGURATION TEST FOR RENDER\n');
console.log('='.repeat(60));

// Check what the code will see
console.log('\n📋 Environment Variables Check:');
console.log('================================\n');

const hasEmailUser = !!process.env.EMAIL_USER;
const hasEmailPass = !!process.env.EMAIL_PASS;
const hasResendKey = !!process.env.RESEND_API_KEY;

console.log(`EMAIL_USER: ${hasEmailUser ? '✅ SET' : '❌ MISSING'}`);
if (hasEmailUser) {
  console.log(`  Value: ${process.env.EMAIL_USER}`);
}

console.log(`\nEMAIL_PASS: ${hasEmailPass ? '✅ SET' : '❌ MISSING'}`);
if (hasEmailPass) {
  console.log(`  Value: ${'*'.repeat(Math.min(process.env.EMAIL_PASS?.length || 0, 16))}`);
}

console.log(`\nRESEND_API_KEY: ${hasResendKey ? '⚠️  SET' : '✅ NOT SET'}`);
if (hasResendKey) {
  console.log(`  Value: ${process.env.RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`  ⚠️  WARNING: Resend will be used instead of Gmail!`);
}

console.log(`\nEMAIL_FROM: ${process.env.EMAIL_FROM || '"AuraCare Beauty Parlor" <noreply@auracare.com>'}`);

// Check what will happen based on the logic
console.log('\n\n🌐 Email Service Selection:');
console.log('================================\n');

if (!hasEmailUser || !hasEmailPass) {
  console.log('❌ DEVELOPMENT MODE DETECTED!');
  console.log('   Reason: EMAIL_USER or EMAIL_PASS is missing');
  console.log('   Result: OTP will be returned in API response (NOT sent via email)');
  console.log('\n⚠️  THIS IS WHY EMAILS ARE NOT WORKING ON RENDER!\n');
  console.log('📝 Solution:');
  console.log('   1. Go to Render Dashboard');
  console.log('   2. Add: EMAIL_USER = shravanachu7@gmail.com');
  console.log('   3. Add: EMAIL_PASS = oboouxbkuttkhmhw');
  console.log('   4. Update: EMAIL_FROM = "AuraCare Beauty Parlor" <shravanachu7@gmail.com>');
  console.log('   5. Save Changes → Wait for redeploy\n');
  process.exit(0);
}

if (hasResendKey) {
  console.log('⚠️  Will use: RESEND SMTP');
  console.log('   Host: smtp.resend.com');
  console.log('   Port: 465');
  console.log('\n   ⚠️  NOTE: Resend domain needs verification!');
  console.log('   If Resend fails, remove RESEND_API_KEY from Render to use Gmail');
} else {
  console.log('✅ Will use: GMAIL SMTP');
  console.log('   Service: gmail');
  console.log('   User:', process.env.EMAIL_USER);
}

// Test sending
console.log('\n\n📧 Testing Email Send:');
console.log('================================\n');

const testEmail = process.argv[2] || process.env.EMAIL_USER || 'test@example.com';
const testOTP = '123456';

console.log(`Sending test OTP to: ${testEmail}`);
console.log(`Test OTP: ${testOTP}\n`);

try {
  const result = await sendOTPEmail(testEmail, testOTP, 'customer');
  
  if (result.success) {
    console.log('✅ EMAIL SENT SUCCESSFULLY!\n');
    console.log(`Message ID: ${result.messageId}`);
    console.log(`\n📬 Check inbox: ${testEmail}`);
    console.log('   (Also check spam folder)\n');
    console.log('✨ Your email configuration is working correctly!');
    console.log('   The same variables should work on Render.\n');
  } else {
    console.log('❌ EMAIL SENDING FAILED!\n');
    console.log(`Error: ${result.error}\n`);
    
    if (result.error.includes('authentication')) {
      console.log('💡 Possible causes:');
      console.log('   - Gmail App Password is incorrect');
      console.log('   - 2-Step Verification not enabled');
      console.log('   - App Password was revoked\n');
      console.log('📝 Solution:');
      console.log('   1. Go to: https://myaccount.google.com/apppasswords');
      console.log('   2. Generate new App Password');
      console.log('   3. Update EMAIL_PASS in Render\n');
    }
    
    if (result.error.includes('domain')) {
      console.log('💡 This is a Resend domain verification issue');
      console.log('📝 Quick fix:');
      console.log('   - Remove RESEND_API_KEY from Render');
      console.log('   - This will force Gmail SMTP usage\n');
    }
  }
} catch (error) {
  console.log('❌ UNEXPECTED ERROR!\n');
  console.log(error.message);
  console.log('\n📋 Full error:');
  console.error(error);
}

console.log('\n' + '='.repeat(60));
console.log('✨ Test Complete\n');
