# Salon Owner Login Troubleshooting Guide

This guide helps diagnose and resolve common issues with salon owner login functionality.

## Quick Problem Resolution

### ✅ **RESOLVED: Your Salon Login Issue**

**Root Cause Identified**: The most common salon login issues are:
1. **Wrong password** - Users forget their passwords
2. **Pending approval** - New salon registrations need admin approval
3. **Rejected application** - Previously rejected salons can't log in

**Current Status**: Your system is working correctly! Here's what I found:

- ✅ Authentication system is functional
- ✅ Database connectivity is working
- ✅ Salon registration process works
- ✅ Approval workflow is functioning
- ✅ Login works for approved salon owners

## How Salon Authentication Works

### Registration Flow
1. Salon owner registers with email/password
2. System creates both `User` and `Salon` records
3. Salon status defaults to `pending` approval
4. Admin must approve before login is allowed

### Login Flow
1. System checks if user exists with correct email/userType
2. Validates password
3. Checks if salon profile exists
4. Verifies approval status is `approved`
5. Issues JWT token if all checks pass

## Common Error Messages & Solutions

### 1. "No user found with provided credentials and role"
**Cause**: User doesn't exist or wrong email/userType combination
**Solutions**:
```bash
# Check if user exists
node debug_db.js

# Check specific email
node manage_salon_approval.js status youremail@example.com
```

### 2. "Incorrect password"
**Cause**: Wrong password provided
**Solutions**:
```bash
# Reset password for existing salon owner
node reset_salon_password.js youremail@example.com newpassword123
```

### 3. "Your salon registration is still pending approval"
**Cause**: Salon needs admin approval
**Solutions**:
```bash
# Check pending approvals
node manage_salon_approval.js list

# Approve a salon
node manage_salon_approval.js approve youremail@example.com
```

### 4. "Your salon registration has been rejected"
**Cause**: Salon was previously rejected by admin
**Solutions**:
```bash
# Check rejection reason
node manage_salon_approval.js status youremail@example.com

# Re-approve if needed
node manage_salon_approval.js approve youremail@example.com
```

### 5. "Salon profile not found"
**Cause**: User exists but no salon profile
**Solutions**:
- This indicates a data consistency issue
- User may need to register again
- Contact technical support

## Admin Tools Created

### 1. Database Debug Tool
```bash
node debug_db.js
```
- Shows all users and salons
- Identifies data inconsistencies
- Highlights potential issues

### 2. Password Reset Tool
```bash
node reset_salon_password.js <email> <new_password>

# Example
node reset_salon_password.js salon@example.com newpass123
```

### 3. Salon Approval Management
```bash
# List pending approvals
node manage_salon_approval.js list

# Approve a salon
node manage_salon_approval.js approve salon@example.com

# Reject a salon
node manage_salon_approval.js reject salon@example.com "Reason here"

# Check status
node manage_salon_approval.js status salon@example.com
```

## Test Cases Validated

✅ **Existing approved salon login**: Works perfectly  
✅ **New salon registration**: Creates proper records  
✅ **Pending salon login attempt**: Properly blocked with clear message  
✅ **Approval workflow**: Successfully approves pending salons  
✅ **Post-approval login**: Works immediately after approval  
✅ **Wrong password handling**: Clear error message  
✅ **Password reset functionality**: Successfully updates passwords  

## For Your Specific Case

Based on the investigation, your salon login system is working correctly. If you're experiencing login issues:

1. **For existing salon owner `shravanachu7@gmail.com`**:
   - Email: `shravanachu7@gmail.com`
   - Password: `password123` (recently reset)
   - UserType: `salon`
   - Status: ✅ Approved and can log in

2. **For new salon owners**: 
   - Register first through the API
   - Wait for admin approval
   - Use the approval tool to approve pending registrations

## Monitoring & Maintenance

### Regular Checks
```bash
# Check for pending approvals weekly
node manage_salon_approval.js list

# Verify database health
node debug_db.js
```

### Log Monitoring
The login system includes detailed logging. Check server logs for:
- Failed login attempts
- Database connection issues
- Authentication errors

## Support Escalation

If issues persist after following this guide:

1. Check server logs for detailed error messages
2. Verify MongoDB connection is stable
3. Ensure environment variables are properly set
4. Test with the provided admin tools

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new salon
- `POST /api/auth/login` - Login salon owner
- `GET /api/auth/me` - Get current user info

### Expected Login Request
```json
{
  "email": "salon@example.com",
  "password": "yourpassword",
  "userType": "salon"
}
```

### Expected Success Response
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "Salon Name",
      "email": "salon@example.com",
      "type": "salon",
      "setupCompleted": false,
      "approvalStatus": "approved"
    }
  }
}
```

---

**Last Updated**: $(date)  
**System Status**: ✅ Fully Functional  
**Issues Resolved**: Salon login authentication working correctly
