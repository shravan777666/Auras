# Talk to Aura - Chatbot Implementation Documentation

## Overview
"Talk to Aura" is an intelligent chatbot assistant integrated into the AuraCares Customer Dashboard. It helps customers discover salons, browse services and offers, select staff members, check available time slots, monitor queue status, and complete bookings through a conversational interface.

## Features

### Core Capabilities
1. **Salon Discovery**
   - Browse all approved salons
   - Search salons by location
   - View salon details, ratings, and reviews
   - Check salon operating hours

2. **Service Management**
   - View available services by category
   - See service details (price, duration, description)
   - Filter services by preferences

3. **Offer Management**
   - Browse active promotional offers
   - View offer details and savings
   - Apply offers to bookings

4. **Staff Selection**
   - View available staff members
   - See staff specializations and ratings
   - Optional staff selection (any staff member option)

5. **Appointment Scheduling**
   - View available time slots
   - Select date and time
   - Review booking summary
   - Confirm bookings

6. **Queue Management**
   - Check real-time queue status
   - View estimated wait times
   - See current service in progress

7. **Conversation Management**
   - Session persistence with 30-minute timeout
   - Conversation history
   - Reset session capability
   - Natural language processing for common intents

## Architecture

### Backend Components

#### 1. Controller: `backend/controllers/chatbotController.js`
**Purpose**: Handles all chatbot logic, conversation flow, and state management

**Key Functions**:
- `processMessage()`: Main entry point for processing user messages
- `handleAction()`: Routes action-based requests to appropriate handlers
- `handleMessage()`: Processes natural language text input with intent detection
- `handleStartBooking()`: Initiates the booking flow
- `handleBrowseSalons()`: Fetches and displays salon list
- `handleSelectSalon()`: Processes salon selection
- `handleViewServices()`: Displays available services
- `handleSelectService()`: Processes service selection
- `handleViewOffers()`: Shows active offers
- `handleSelectOffer()`: Processes offer selection
- `handleViewStaff()`: Lists available staff members
- `handleSelectStaff()`: Processes staff selection
- `handleViewSlots()`: Shows available time slots
- `handleSelectSlot()`: Processes time slot selection
- `handleCheckQueue()`: Retrieves queue status
- `handleConfirmBooking()`: Creates appointment and confirms booking
- `handleCancelBooking()`: Cancels current booking flow
- `getConversationHistory()`: Retrieves session history
- `resetSession()`: Clears session data

**Session Management**:
- In-memory session store (Map structure)
- 30-minute session timeout
- Automatic cleanup of expired sessions every 5 minutes
- Session data includes:
  - `userId`: Customer ID
  - `state`: Current conversation state
  - `conversationHistory`: Array of messages
  - `bookingData`: Temporary booking information
  - `lastActivity`: Timestamp of last interaction

**States**:
- `initial`: Starting state
- `selecting_salon`: Browsing salons
- `salon_selected`: Salon chosen
- `viewing_services`: Browsing services
- `service_selected`: Service chosen
- `viewing_offers`: Browsing offers
- `offer_selected`: Offer chosen
- `viewing_staff`: Browsing staff
- `staff_selected`: Staff chosen
- `viewing_slots`: Browsing time slots
- `slot_selected`: Time slot chosen (booking ready)

#### 2. Routes: `backend/routes/chatbot.js`
**Purpose**: Defines API endpoints for chatbot functionality

**Endpoints**:
```javascript
POST   /api/chatbot/message     // Process user message
GET    /api/chatbot/history     // Get conversation history
POST   /api/chatbot/reset       // Reset chat session
```

**Authentication**: All endpoints require customer authentication

#### 3. Server Integration: `backend/server.js`
- Imported chatbot routes
- Mounted at `/api/chatbot`

### Frontend Components

#### 1. Service: `frontend/src/services/chatbot.js`
**Purpose**: API communication layer for chatbot

**Functions**:
- `sendMessage(message, action, data)`: Sends message to backend
- `getHistory()`: Retrieves conversation history
- `resetSession()`: Resets chat session

#### 2. Component: `frontend/src/components/customer/ChatbotButton.jsx`
**Purpose**: Floating action button to open/close chatbot

**Features**:
- Fixed positioning (bottom-right corner)
- Gradient purple-pink styling
- Bounce animation to attract attention
- Unread message badge
- Smooth open/close transitions
- Responsive design (mobile & desktop)
- Tooltip on hover

**State Management**:
- `isOpen`: Controls chat window visibility
- `hasUnreadMessage`: Shows notification badge

#### 3. Component: `frontend/src/components/customer/ChatbotWindow.jsx`
**Purpose**: Main chat interface component

**Features**:
- Message display with user/bot avatars
- Auto-scroll to latest message
- Interactive option buttons
- Quick action buttons
- Text input with send button
- Typing indicator
- Session reset button
- Markdown-style text formatting (bold)
- Timestamp display
- Error handling

**State Management**:
- `messages`: Conversation history
- `inputMessage`: Current input text
- `isLoading`: Loading state for API calls
- `isInitialized`: Initialization status

**Message Structure**:
```javascript
{
  role: 'user' | 'assistant',
  content: 'message text',
  options: [
    {
      label: 'Display text',
      sublabel: 'Optional subtitle',
      action: 'action_name',
      data: { /* action data */ }
    }
  ],
  data: { /* additional response data */ },
  timestamp: Date
}
```

### Integration Points

#### Customer Pages with Chatbot
1. **CustomerDashboard.jsx** - Main dashboard
2. **ExploreSalons.jsx** - Salon browsing
3. **MyBookings.jsx** - Booking history
4. **SalonDetails.jsx** - Individual salon details

The chatbot is available as a floating button on all these pages, maintaining context across navigation.

## Conversation Flow

### Basic Flow
```
1. User opens chatbot
   ↓
2. Aura greets and shows options
   ↓
3. User selects "Book an Appointment"
   ↓
4. Aura shows salon options
   ↓
5. User selects salon
   ↓
6. Aura offers services/offers/queue check
   ↓
7. User selects service or offer
   ↓
8. Aura shows staff options
   ↓
9. User selects staff (or skips)
   ↓
10. Aura shows available time slots
    ↓
11. User selects time slot
    ↓
12. Aura shows booking summary
    ↓
13. User confirms
    ↓
14. Booking created ✓
```

### Intent Detection
Natural language inputs are analyzed for keywords:
- "book", "appointment" → Start booking
- "salon", "browse" → Browse salons
- "offer", "deal", "discount" → View offers
- "queue", "wait" → Check queue status
- "help" → Show help menu

## Data Models

### Booking Data Structure
```javascript
{
  salonId: ObjectId,
  salonName: String,
  serviceId: ObjectId,
  serviceName: String,
  servicePrice: Number,
  serviceDuration: Number,
  offerId: ObjectId,
  offerName: String,
  offerPrice: Number,
  staffId: ObjectId,
  staffName: String,
  date: String,
  timeSlot: String
}
```

### Response Format
```javascript
{
  success: Boolean,
  data: {
    message: String,
    options: Array,
    data: Object
  }
}
```

## API Integration

### Existing APIs Used
1. **Salon APIs**
   - `Salon.find()`: Browse salons
   - `Salon.findById()`: Get salon details

2. **Service APIs**
   - `Service.find()`: List services
   - `Service.findById()`: Get service details

3. **Offer APIs**
   - `AddOnOffer.find()`: List active offers
   - `AddOnOffer.findById()`: Get offer details

4. **Staff APIs**
   - `Staff.find()`: List staff members
   - `Staff.findById()`: Get staff details

5. **Queue APIs**
   - `Queue.find()`: Get queue entries
   - Calculate wait times

6. **Appointment APIs**
   - `Appointment.find()`: Check existing appointments
   - `new Appointment()`: Create booking

## Security

### Authentication & Authorization
- All chatbot endpoints require authentication (`requireAuth`)
- Restricted to customer role only (`requireCustomer`)
- Session data is user-specific (isolated by userId)
- No cross-user data access

### Data Validation
- ObjectId validation for all IDs
- Required field checks before booking
- Duplicate slot booking prevention
- Session timeout handling

### Error Handling
- Try-catch blocks for all async operations
- User-friendly error messages
- Fallback responses on API failures
- Graceful degradation

## Deployment Considerations

### Production Recommendations
1. **Session Storage**: Replace in-memory Map with Redis for scalability
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Caching**: Cache salon/service data to reduce database queries
4. **Analytics**: Track conversation paths and success rates
5. **Monitoring**: Log errors and performance metrics
6. **AI Enhancement**: Integrate NLP service for better intent detection

### Environment Variables
No additional environment variables required. Uses existing:
- `VITE_API_URL`: Frontend API base URL

## Testing

### Manual Testing Checklist
- [ ] Chatbot opens and closes properly
- [ ] Welcome message displays
- [ ] Salon browsing works
- [ ] Service selection works
- [ ] Offer selection works
- [ ] Staff selection works
- [ ] Time slot selection works
- [ ] Queue check displays data
- [ ] Booking confirmation creates appointment
- [ ] Session reset clears data
- [ ] Text input processes correctly
- [ ] Options buttons work
- [ ] Error handling displays messages
- [ ] Mobile responsive design
- [ ] Multi-page navigation maintains context

### Edge Cases
- Empty salon list
- No services available
- No staff members
- All time slots booked
- Network errors
- Session timeout
- Invalid selections

## Maintenance

### Future Enhancements
1. **AI Integration**: Use GPT/Claude for natural language understanding
2. **Voice Support**: Add voice input/output
3. **Multi-language**: Support multiple languages
4. **Payment Integration**: Complete payment in chat
5. **Recommendations**: Personalized suggestions based on history
6. **Loyalty Integration**: Show points and rewards
7. **Cancellation**: Allow canceling bookings through chat
8. **Rescheduling**: Enable rescheduling in chat
9. **FAQs**: Answer common questions about policies
10. **Rich Media**: Send images, carousels, maps

### Known Limitations
1. In-memory sessions (not suitable for horizontal scaling)
2. Basic intent detection (keyword matching)
3. Limited error recovery paths
4. No payment handling
5. Simplified slot availability logic
6. No real-time notifications

## Support & Contact
For issues or questions about the chatbot implementation, refer to the main AuraCares development documentation.

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: Production Ready
