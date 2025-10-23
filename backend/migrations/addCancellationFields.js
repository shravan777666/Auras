// Migration script to add cancellation policy fields to existing appointments
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from '../models/Appointment.js';
import connectDB from '../config/database.js';

dotenv.config();

const migrateAppointments = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Add new fields to all existing appointments
    const result = await Appointment.updateMany(
      {
        $or: [
          { cancellationPolicyAgreed: { $exists: false } },
          { cancellationFee: { $exists: false } },
          { cancellationFeePaid: { $exists: false } },
          { cancellationType: { $exists: false } },
          { cancellationReminderSent: { $exists: false } }
        ]
      },
      {
        $set: {
          cancellationPolicyAgreed: { $ifNull: ['$cancellationPolicyAgreed', false] },
          cancellationFee: { $ifNull: ['$cancellationFee', 0] },
          cancellationFeePaid: { $ifNull: ['$cancellationFeePaid', false] },
          cancellationType: { $ifNull: ['$cancellationType', 'Early'] },
          cancellationReminderSent: { $ifNull: ['$cancellationReminderSent', false] }
        }
      },
      { multi: true }
    );

    console.log(`Migration completed. Modified ${result.nModified} appointments.`);

    // Close connection
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    mongoose.connection.close();
  }
};

// Run migration
migrateAppointments();