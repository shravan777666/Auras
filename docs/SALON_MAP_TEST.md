# Salon Map Testing Guide

## How to Test the Salon Map Fix

### 1. Check Browser Console
When you visit `/customer/map`, open the browser console (F12) and look for:
- `Loaded salons for map: X salons` or `Using salons from props: X salons`
- `Sample salon data: {...}` - This should show the first salon's data including services array

### 2. Click on a Marker
When you click on any salon marker on the map:
- A popup should appear
- The console should show:
  - `Creating popup for salon: [Salon Name]`
  - `Services: [...]` - Array of service objects
  - `Full salon data: {...}` - Complete salon object

### 3. What You Should See in the Popup
- **Salon Name** (bold heading at top)
- **Address** (if available)
- **Phone Number** (with 📞 icon, if available)
- **Services Available:** header
- List of up to 5 services with prices (e.g., "Hair Color - ₹1499")
- If more than 5 services: "+X more services"
- Two buttons: "View Details" and "Book Now"

### 4. Common Issues & Solutions

#### Issue: Popup appears but shows "Services will be displayed soon"
**Cause:** The salon has no services in the database
**Solution:** Check another salon marker

#### Issue: No popup appears at all
**Cause 1:** Map not initialized properly
**Cause 2:** Markers not created
**Check:** Console for error messages

#### Issue: Popup appears but is empty/blank
**Cause:** HTML rendering issue
**Check:** Console for the popup HTML being generated

#### Issue: Services array is empty []
**Cause:** Backend not populating services or salon has no services
**Check:** Test database directly (see test script below)

### 5. Test Database Directly
Run this command to check if salons have services in the database:
```bash
cd backend
node test_salon_map_data.js
```

This will show:
- How many active/approved salons exist
- Their coordinates
- Number of services each has
- Sample service data

### 6. Expected Salon Object Structure
```javascript
{
  _id: "...",
  name: "Salon Name",
  salonName: "Salon Name",  // Alternative field
  address: "Full address string",
  phone: "1234567890",
  lat: 12.345678,
  lng: 76.543210,
  services: [
    {
      _id: "...",
      name: "Hair Color",
      price: 1499,
      category: "Hair",
      duration: 27
    },
    // ... more services
  ]
}
```

### 7. If Still Not Working

Please provide:
1. Screenshot of the browser console when visiting /customer/map
2. Screenshot of what you see when clicking a marker
3. Copy-paste of the "Sample salon data" from console
4. Any error messages in red

This will help identify exactly where the issue is!
