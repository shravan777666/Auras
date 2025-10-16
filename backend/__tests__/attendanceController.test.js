import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { markStaffAttendance, addStaffShift } from '../controllers/salonController.js';
import { successResponse, errorResponse } from '../utils/responses.js';

// Mock the responses utility
jest.mock('../utils/responses.js', () => ({
  successResponse: jest.fn(),
  errorResponse: jest.fn(),
  paginatedResponse: jest.fn(),
  notFoundResponse: jest.fn(),
  asyncHandler: fn => fn
}));

let mongoServer;
let mockRequest;
let mockResponse;

describe('Attendance Controller', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    mockRequest = {
      user: { id: 'user123' },
      params: {},
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    jest.clearAllMocks();
  });

  describe('markStaffAttendance', () => {
    it('should mark staff attendance successfully', async () => {
      // Create test data
      const testUser = await User.create({
        name: 'Test Salon Owner',
        email: 'salon@test.com',
        password: 'password123',
        type: 'salon'
      });
      
      const testSalon = await Salon.create({
        ownerId: testUser._id,
        salonName: 'Test Salon',
        email: 'salon@test.com',
        password: 'password123'
      });
      
      const testStaff = await Staff.create({
        name: 'Test Staff',
        email: 'staff@test.com',
        assignedSalon: testSalon._id
      });
      
      // Set up request
      mockRequest.user.id = testUser._id.toString();
      mockRequest.params.staffId = testStaff._id.toString();
      mockRequest.body = {
        date: '2025-10-15',
        status: 'Present',
        checkInTime: '09:00',
        checkOutTime: '17:00'
      };
      
      // Execute controller function
      await markStaffAttendance(mockRequest, mockResponse);
      
      // Verify success response
      expect(successResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          staffId: testStaff._id,
          salonId: testSalon._id,
          date: '2025-10-15',
          status: 'Present'
        }),
        'Attendance marked successfully'
      );
      
      // Verify attendance record was created
      const attendanceRecord = await Attendance.findOne({
        staffId: testStaff._id,
        date: '2025-10-15'
      });
      
      expect(attendanceRecord).toBeDefined();
      expect(attendanceRecord.status).toBe('Present');
      expect(attendanceRecord.checkInTime).toBe('09:00');
      expect(attendanceRecord.checkOutTime).toBe('17:00');
    });
    
    it('should return error if staff member is not found', async () => {
      // Create test data
      const testUser = await User.create({
        name: 'Test Salon Owner',
        email: 'salon@test.com',
        password: 'password123',
        type: 'salon'
      });
      
      const testSalon = await Salon.create({
        ownerId: testUser._id,
        salonName: 'Test Salon',
        email: 'salon@test.com',
        password: 'password123'
      });
      
      // Set up request with non-existent staff ID
      mockRequest.user.id = testUser._id.toString();
      mockRequest.params.staffId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      mockRequest.body = { date: '2025-10-15' };
      
      // Execute controller function
      await markStaffAttendance(mockRequest, mockResponse);
      
      // Verify error response
      expect(errorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Staff member not found or not assigned to your salon',
        404
      );
    });
  });
  
  describe('addStaffShift', () => {
    it('should add staff shift successfully', async () => {
      // Create test data
      const testUser = await User.create({
        name: 'Test Salon Owner',
        email: 'salon@test.com',
        password: 'password123',
        type: 'salon'
      });
      
      const testSalon = await Salon.create({
        ownerId: testUser._id,
        salonName: 'Test Salon',
        email: 'salon@test.com',
        password: 'password123'
      });
      
      const testStaff = await Staff.create({
        name: 'Test Staff',
        email: 'staff@test.com',
        assignedSalon: testSalon._id
      });
      
      // Set up request
      mockRequest.user.id = testUser._id.toString();
      mockRequest.params.staffId = testStaff._id.toString();
      mockRequest.body = {
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '17:00',
        notes: 'Regular shift'
      };
      
      // Mock the Customer model to avoid database dependency
      jest.mock('../models/Customer.js', () => ({
        default: {
          create: jest.fn().mockResolvedValue({
            _id: 'customer123',
            name: 'Test Customer',
            email: 'customer@test.com'
          })
        }
      }));
      
      // Execute controller function
      await addStaffShift(mockRequest, mockResponse);
      
      // Verify success response was called
      expect(successResponse).toHaveBeenCalled();
    });
  });
});