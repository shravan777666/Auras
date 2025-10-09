// MongoDB Shell Script to fix schedule request salonId
// Run this in MongoDB shell or MongoDB Compass

// First, find the staff member and get their assigned salon
var staffId = ObjectId("68ccef3cfaf3e420e3dae39d");
var staff = db.staffs.findOne({ _id: staffId });

if (!staff) {
  print("Staff member not found");
} else if (!staff.assignedSalon) {
  print("Staff member has no assigned salon");
} else {
  print("Found staff member with assigned salon: " + staff.assignedSalon);
  
  // Update the schedule request with the salonId
  var scheduleRequestId = ObjectId("68e4798fa8966bcdaf2f99b0");
  var result = db.schedulerequests.updateOne(
    { _id: scheduleRequestId },
    { $set: { salonId: staff.assignedSalon } }
  );
  
  if (result.modifiedCount > 0) {
    print("Successfully updated schedule request with salonId");
  } else {
    print("Failed to update schedule request");
  }
}