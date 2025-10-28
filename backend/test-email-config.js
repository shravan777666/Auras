import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendOTPEmail } from './config/email.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEmailConfiguration() {
  log('\n🔍 Email Configuration Diagnostic Tool', 'bright');
  log('='.repeat(50), 'blue');
  
  // Check environment variables
  log('\n📋 Step 1: Checking Environment Variables...', 'blue');
  
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasGmail = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  const hasEmailFrom = !!process.env.EMAIL_FROM;
  
  if (hasResend) {
    log('✅ RESEND_API_KEY found', 'green');
    log(`   Value: ${process.env.RESEND_API_KEY.substring(0, 10)}...`, 'green');
  } else {
    log('❌ RESEND_API_KEY not found', 'red');
  }
  
  if (hasGmail) {
    log('✅ EMAIL_USER found', 'green');
    log(`   Value: ${process.env.EMAIL_USER}`, 'green');
    log('✅ EMAIL_PASS found', 'green');
    log(`   Value: ${'*'.repeat(16)}`, 'green');
  } else {
    if (!process.env.EMAIL_USER) {
      log('❌ EMAIL_USER not found', 'red');
    }
    if (!process.env.EMAIL_PASS) {
      log('❌ EMAIL_PASS not found', 'red');
    }
  }
  
  if (hasEmailFrom) {
    log('✅ EMAIL_FROM found', 'green');
    log(`   Value: ${process.env.EMAIL_FROM}`, 'green');
  } else {
    log('⚠️  EMAIL_FROM not found (will use default)', 'yellow');
  }
  
  // Determine which service will be used
  log('\n🌐 Step 2: Email Service Selection...', 'blue');
  
  if (hasResend) {
    log('✅ Will use RESEND SMTP service', 'green');
    log('   Host: smtp.resend.com', 'green');
    log('   Port: 465 (secure)', 'green');
  } else if (hasGmail) {
    log('✅ Will use GMAIL SMTP service', 'green');
    log('   Host: smtp.gmail.com', 'green');
    log('   Port: 587', 'green');
  } else {
    log('❌ NO EMAIL SERVICE CONFIGURED!', 'red');
    log('   Development mode: OTP will be returned in API response', 'yellow');
    log('   This will NOT work in production!', 'red');
    log('\n📝 Next Steps:', 'yellow');
    log('   1. Choose either Resend or Gmail', 'yellow');
    log('   2. Follow EMAIL_SERVICE_FIX.md instructions', 'yellow');
    log('   3. Add environment variables to Render', 'yellow');
    return;
  }
  
  // Test email sending
  log('\n📧 Step 3: Testing Email Sending...', 'blue');
  log('   This will send a test OTP email', 'blue');
  
  // Prompt for test email
  const testEmail = process.argv[2] || process.env.EMAIL_USER || 'test@example.com';
  const testOTP = '123456';
  const userType = 'customer';
  
  log(`   Sending to: ${testEmail}`, 'blue');
  log(`   Test OTP: ${testOTP}`, 'blue');
  
  try {
    const result = await sendOTPEmail(testEmail, testOTP, userType);
    
    if (result.success) {
      log('\n✅ EMAIL SENT SUCCESSFULLY!', 'green');
      log(`   Message ID: ${result.messageId}`, 'green');
      log(`   \n📬 Check your inbox: ${testEmail}`, 'bright');
      log('   (Also check spam folder)', 'yellow');
    } else {
      log('\n❌ EMAIL SENDING FAILED!', 'red');
      log(`   Error: ${result.error}`, 'red');
      
      if (result.error.includes('authentication')) {
        log('\n💡 Troubleshooting:', 'yellow');
        log('   - Gmail: Use App Password, not regular password', 'yellow');
        log('   - Resend: Verify API key is correct', 'yellow');
      }
    }
  } catch (error) {
    log('\n❌ UNEXPECTED ERROR!', 'red');
    log(`   ${error.message}`, 'red');
    log(`\n📋 Full error:`, 'yellow');
    console.error(error);
  }
  
  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Configuration Summary:', 'bright');
  log('='.repeat(50), 'blue');
  
  if (hasResend) {
    log('✅ Email Service: Resend', 'green');
  } else if (hasGmail) {
    log('✅ Email Service: Gmail', 'green');
  } else {
    log('❌ Email Service: Not Configured', 'red');
  }
  
  log('\n📝 To use this configuration on Render:', 'blue');
  log('   1. Go to https://dashboard.render.com', 'blue');
  log('   2. Select your backend service', 'blue');
  log('   3. Go to Environment section', 'blue');
  log('   4. Add the same variables you have locally', 'blue');
  log('   5. Save and wait for redeployment', 'blue');
  
  log('\n✨ Done!\n', 'bright');
}

// Show usage if no test email provided
if (!process.argv[2]) {
  log('\n💡 Usage:', 'yellow');
  log('   node test-email-config.js your-email@example.com', 'yellow');
  log('   (If no email provided, will use EMAIL_USER from .env)\n', 'yellow');
}

// Run the test
testEmailConfiguration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
