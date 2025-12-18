# Salon Approval Email Notification Feature

## Overview
This feature automatically sends email notifications to salon owners when their salon registration is approved or rejected by an admin. The emails provide immediate feedback and next steps for the salon owner.

## Features Implemented

### 1. Salon Approval Email
- **Trigger**: When a salon is approved via admin panel or CLI tool
- **Recipients**: Salon owner's registered email address
- **Content**: 
  - Confirmation of approval
  - Salon name and owner name
  - Link to login dashboard
  - Professional styling with AuraCare branding

### 2. Salon Rejection Email
- **Trigger**: When a salon is rejected via admin panel or CLI tool
- **Recipients**: Salon owner's registered email address
- **Content**:
  - Notification of rejection
  - Reason for rejection
  - Contact information for support
  - Professional styling with AuraCare branding

## Implementation Details

### Email Configuration
The email system uses Nodemailer with Gmail SMTP:
- Service: Gmail
- Authentication: EMAIL_USER and EMAIL_PASS environment variables
- Template Engine: HTML with inline CSS for email client compatibility

### Email Functions
Located in `backend/config/email.js`:
1. `sendSalonApprovalEmail(email, salonName, ownerName)` - Sends approval notification
2. `sendSalonRejectionEmail(email, salonName, ownerName, rejectionReason)` - Sends rejection notification

### Integration Points
1. **Admin Controller** (`backend/controllers/adminController.js`):
   - `approveSalon` function sends approval email after database update
   - `rejectSalon` function sends rejection email after database update

2. **CLI Management Tool** (`backend/manage_salon_approval.js`):
   - `approveSalon` function sends approval email
   - `rejectSalon` function sends rejection email

## Email Templates

### Approval Email Template
```html
Subject: Your Salon Has Been Approved - AuraCare

Body:
- Header with AuraCare branding
- Personalized greeting with owner name
- Confirmation message with salon name
- Green success box highlighting approval
- Login button linking to dashboard
- Professional footer with copyright
```

### Rejection Email Template
```html
Subject: Salon Application Update - AuraCare

Body:
- Header with AuraCare branding
- Personalized greeting with owner name
- Rejection notification with salon name
- Red error box with rejection reason
- Support contact information
- Professional footer with copyright
```

## Testing

### Test Scripts
1. `backend/test_salon_approval_email.js` - Tests email sending functionality
2. `backend/test_admin_approval.js` - Tests salon approval workflow

### Manual Testing
1. Approve a salon via admin panel and verify email is sent
2. Reject a salon via CLI tool and verify email is sent
3. Check email content for proper personalization

## Error Handling

### Email Delivery Failures
- Non-blocking: Email failures don't affect approval/rejection process
- Logging: Failed emails are logged with error details
- Retry: No automatic retry (admin can manually re-approve if needed)

### Configuration Issues
- Validation: Checks for EMAIL_USER and EMAIL_PASS environment variables
- Verification: Tests email transporter configuration before sending
- Error Messages: Specific error messages for common issues (auth, connection)

## Security Considerations

### Email Content
- No sensitive information included in emails
- Professional language without exposing system details
- Branded templates to prevent phishing concerns

### Rate Limiting
- No rate limiting on email sending (assumed to be low volume)
- Admin actions are already rate-limited by authentication

## Future Enhancements

### Email Tracking
- Add email open tracking
- Add click tracking for dashboard links
- Delivery status monitoring

### Template Customization
- Locale-specific email templates
- Customizable email content per salon type
- Rich media content (images, logos)

### Retry Mechanism
- Automatic retry for failed emails
- Queue system for email delivery
- Dead letter queue for persistent failures