import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Staff from './models/Staff.js';
import User from './models/User.js';
import path from 'path';
import fs from 'fs';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare'
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const createTestStaff = async () => {
  try {
    await connectDB();

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Check if test staff already exists
    const existingStaff = await Staff.findOne({ email: 'teststStaff@example.com' });
    if (existingStaff) {
      console.log('Test staff already exists, updating...');
      
      // Update with test document paths
      existingStaff.profilePicture = 'uploads/profile-test.jpg';
      existingStaff.documents = {
        governmentId: 'uploads/id-test.pdf',
        certificates: ['uploads/cert1-test.pdf', 'uploads/cert2-test.jpg']
      };
      existingStaff.approvalStatus = 'pending';
      await existingStaff.save();
      
      console.log('✅ Test staff updated with documents');
    } else {
      // Create a new user for test staff
      let testUser = await User.findOne({ email: 'teststaff@example.com' });
      if (!testUser) {
        testUser = await User.create({
          name: 'Test Staff Member',
          email: 'teststaff@example.com',
          password: 'password123',
          type: 'staff',
          setupCompleted: true
        });
      }

      // Create test staff
      const testStaff = await Staff.create({
        name: 'Test Staff Member',
        email: 'teststaff@example.com',
        user: testUser._id,
        contactNumber: '+91-9876543210',
        position: 'Hair Stylist',
        skills: ['Hair Cut', 'Hair Color', 'Styling'],
        experience: { years: 3, description: 'Experienced hair stylist' },
        profilePicture: 'uploads/profile-test.jpg',
        documents: {
          governmentId: 'uploads/id-test.pdf',
          certificates: ['uploads/cert1-test.pdf', 'uploads/cert2-test.jpg']
        },
        approvalStatus: 'pending',
        setupCompleted: true
      });

      console.log('✅ Test staff created with documents');
    }

    // Create placeholder files
    const placeholderImage = Buffer.from([]);
    const placeholderPdf = Buffer.from([]);

    const testFiles = [
      'uploads/profile-test.jpg',
      'uploads/id-test.pdf',
      'uploads/cert1-test.pdf',
      'uploads/cert2-test.jpg'
    ];

    for (const filePath of testFiles) {
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        // Create a simple placeholder file
        fs.writeFileSync(fullPath, `Test file: ${path.basename(filePath)}`);
        console.log(`Created placeholder file: ${filePath}`);
      }
    }

    console.log('✅ Test staff setup complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test staff:', error);
    process.exit(1);
  }
};

createTestStaff();