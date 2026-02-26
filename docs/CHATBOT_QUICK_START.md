# Talk to Aura Chatbot - Quick Start Guide

## Getting Started

### Prerequisites
- AuraCares application running
- Backend server running on port 5002
- Frontend running with Vite
- MongoDB database connected
- User authenticated as a customer

### Installation
No additional installations required! The chatbot uses existing dependencies:
- React
- Lucide icons
- React Hot Toast
- Axios (via existing api service)

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Chatbot**
   - Navigate to the Customer Dashboard
   - Look for the floating purple-pink chat icon in the bottom-right corner
   - Click to open the chatbot

### First Interaction

1. **Open Chatbot**: Click the floating chat icon
2. **Greeting**: Aura will greet you with options
3. **Choose Action**: Select "Book an Appointment"
4. **Browse Salons**: View available salons
5. **Select Salon**: Click on a salon
6. **Choose Service/Offer**: Select what you want
7. **Pick Staff**: Choose a stylist (or skip)
8. **Select Time**: Choose available time slot
9. **Confirm**: Review and confirm booking
10. **Done**: Your appointment is booked!

## Usage Examples

### Example 1: Quick Booking
```
User: Opens chatbot
Aura: "How can I help you today?"
      [Book an Appointment] [Browse Salons] [View Offers]

User: Clicks "Book an Appointment"
Aura: "Let's find the perfect salon for you."
      [Browse All Salons] [Search by Location]

User: Clicks "Browse All Salons"
Aura: "I found 15 salons for you!"
      [Salon A] [Salon B] [Salon C]...

User: Clicks "Salon A"
Aura: "Great choice! You selected Salon A"
      [View Services] [View Active Offers] [Check Queue]

User: Clicks "View Services"
Aura: Shows list of services with prices
      [Haircut - ₹500] [Hair Color - ₹1500]...

User: Clicks "Haircut - ₹500"
Aura: "Perfect! You've selected Haircut"
      [Choose Staff Member] [View Available Slots]

User: Clicks "View Available Slots"
Aura: Shows available time slots
      [10:00] [10:30] [11:00]...

User: Clicks "10:30"
Aura: Shows booking summary
      "Booking Summary: Salon A, Haircut, 10:30..."
      [Confirm Booking] [Change Time] [Cancel]

User: Clicks "Confirm Booking"
Aura: "🎉 Booking Confirmed! Booking ID: 12345"
```

### Example 2: Natural Language
```
User: Types "I want to book a haircut"
Aura: Starts booking flow automatically

User: Types "show me offers"
Aura: Displays all active offers

User: Types "help"
Aura: Shows help menu with all capabilities
```

### Example 3: Check Queue
```
User: Opens chatbot
Aura: Shows initial options

User: Clicks "Check Queue Status"
Aura: "Please select a salon first"
      [Browse Salons]

User: Selects salon
Aura: "Queue Status for Salon A:
       🔴 Currently serving: Token #5
       👥 People waiting: 3
       ⏱️ Estimated wait time: 90 minutes"
      [Book Appointment] [Choose Different Salon]
```

## Troubleshooting

### Chatbot Not Appearing
- **Check**: User is logged in as a customer
- **Check**: On a supported page (Dashboard, Explore Salons, My Bookings, Salon Details)
- **Fix**: Refresh the page

### "Failed to initialize chat"
- **Cause**: Backend not responding
- **Check**: Backend server is running
- **Check**: API_URL is correct
- **Fix**: Check backend logs for errors

### Session Expired
- **Cause**: 30-minute timeout reached
- **Fix**: Click the reset button (↻) or refresh chat

### No Salons/Services Showing
- **Cause**: No data in database
- **Fix**: Ensure salons are approved and have setupComplete = true

### Booking Not Created
- **Check**: All required fields are filled
- **Check**: Time slot is still available
- **Check**: Customer authentication is valid
- **Fix**: Try booking again

## Developer Tips

### Debugging

1. **Enable Console Logs**
   - Backend: Check `chatbotController.js` console.error lines
   - Frontend: Check browser console for API errors

2. **Check Session State**
   ```javascript
   // In browser console
   await fetch('/api/chatbot/history', {
     headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
   }).then(r => r.json()).then(console.log)
   ```

3. **Reset Session**
   - Click the reset button (↻) in chat
   - Or call `/api/chatbot/reset` endpoint

### Customization

#### Change Chatbot Colors
Edit `ChatbotButton.jsx`:
```jsx
// Line ~19
className="... from-purple-600 to-pink-600 ..."
// Change to your brand colors
className="... from-blue-600 to-teal-600 ..."
```

#### Modify Welcome Message
Edit `chatbotController.js`:
```javascript
// Line ~108
return {
  message: "Your custom welcome message!",
  options: [...]
};
```

#### Add New Actions
1. Add action handler in `chatbotController.js`:
   ```javascript
   case 'your_new_action':
     return await handleYourNewAction(data, session);
   ```

2. Implement handler function:
   ```javascript
   const handleYourNewAction = async (data, session) => {
     // Your logic here
     return {
       message: "Response message",
       options: [...]
     };
   };
   ```

#### Add Quick Action Buttons
Edit `ChatbotWindow.jsx` (line ~336):
```jsx
<button onClick={() => handleSendMessage(null, 'your_action', null)}>
  🎯 Your Action
</button>
```

### Testing

#### Manual Test Script
```javascript
// 1. Open browser console
// 2. Copy and run:

const testChatbot = async () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // Test 1: Initialize
  let res = await fetch('/api/chatbot/message', {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  console.log('Init:', await res.json());
  
  // Test 2: Start booking
  res = await fetch('/api/chatbot/message', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'start_booking' })
  });
  console.log('Start Booking:', await res.json());
  
  // Test 3: Browse salons
  res = await fetch('/api/chatbot/message', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'browse_salons', data: {} })
  });
  console.log('Browse Salons:', await res.json());
};

testChatbot();
```

## Best Practices

### For Users
1. Be specific in your requests
2. Use the quick action buttons for faster navigation
3. Review booking summary carefully before confirming
4. Keep the chat window open while browsing
5. Use reset button if you want to start over

### For Developers
1. Always handle errors gracefully
2. Validate all user inputs
3. Keep session data minimal
4. Add logging for debugging
5. Test on both mobile and desktop
6. Consider accessibility (keyboard navigation, screen readers)

## FAQ

**Q: Can I use the chatbot on mobile?**  
A: Yes! The chatbot is fully responsive and works on all devices.

**Q: Does the chatbot remember my conversation?**  
A: Yes, for 30 minutes. After that, the session expires.

**Q: Can I book multiple appointments in one session?**  
A: Currently, you need to complete one booking, then start a new one.

**Q: What if I close the chatbot accidentally?**  
A: Your conversation is saved! Just reopen it and continue.

**Q: Can the chatbot cancel my bookings?**  
A: Not yet. Use the My Bookings page to cancel appointments.

**Q: Is my conversation private?**  
A: Yes, all conversations are user-specific and secure.

**Q: Can I customize the chatbot appearance?**  
A: Yes! Edit the component files to change colors, icons, and styling.

## Additional Resources

- [Full Implementation Documentation](./CHATBOT_IMPLEMENTATION.md)
- [Backend API Documentation](./backend/README.md)
- [Frontend Component Guide](./frontend/README.md)

## Support

For issues or feature requests:
1. Check the console for errors
2. Review the troubleshooting section
3. Check the main documentation
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: February 2026
