import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import PayrollConfiguration from '../models/PayrollConfiguration.js';
import PayrollRecord from '../models/PayrollRecord.js';
import Attendance from '../models/Attendance.js';
import { 
  createOrUpdatePayrollConfig,
  getPayrollConfigurations,
  getPayrollConfigByRoleAndLevel,
  deletePayrollConfig,
  processPayrollForAllStaff,
  getPayrollRecords,
  getPayrollRecordById,
  markPayrollAsPaid,
  getStaffPayrollRecords,
  getStaffPayrollRecordById
} from '../controllers/payrollController.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/responses.js';

// Mock the responses utility
jest.mock('../utils/responses.js', () => ({
  successResponse: jest.fn(),
  errorResponse: jest.fn(),
  notFoundResponse: jest.fn(),
  paginatedResponse: jest.fn(),
  asyncHandler: fn => fn
}));

let mongoServer;
let mockRequest;
let mockResponse;

describe('Payroll Controller', () => {
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
      body: {},
      query: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    jest.clearAllMocks();
  });

  describe('createOrUpdatePayrollConfig', () => {
    it('should create a new payroll configuration successfully', async () => {
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
      
      // Set up request
      mockRequest.user.id = testUser._id.toString();
      mockRequest.body = {
        jobRole: 'Hair Specialist',
        experienceLevel: 'Senior',
        basicSalaryFixed: 25000,
        allowancesFixed: 5000,
        employeeEpfRate: 0.12,
        professionalTax: 200,
        leaveThresholdDays: 2,
        productDeductionsMonthly: 100
      };
      
      // Execute controller function
      await createOrUpdatePayrollConfig(mockRequest, mockResponse);
      
      // Verify success response
      expect(successResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          salonId: testSalon._id,
          jobRole: 'Hair Specialist',
          experienceLevel: 'Senior',
          basicSalaryFixed: 25000
        }),
        'Payroll configuration saved successfully'
      );
      
      // Verify payroll configuration was created
      const payrollConfig = await PayrollConfiguration.findOne({
        salonId: testSalon._id,
        jobRole: 'Hair Specialist',
        experienceLevel: 'Senior'
      });
      
      expect(payrollConfig).toBeDefined();
      expect(payrollConfig.basicSalaryFixed).toBe(25000);
      expect(payrollConfig.allowancesFixed).toBe(5000);
    });
    
    it('should return error if required fields are missing', async () => {
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
      
      // Set up request with missing required fields
      mockRequest.user.id = testUser._id.toString();
      mockRequest.body = {
        // jobRole is missing
        experienceLevel: 'Senior',
        basicSalaryFixed: 25000
      };
      
      // Execute controller function
      await createOrUpdatePayrollConfig(mockRequest, mockResponse);
      
      // Verify error response
      expect(errorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Job role, experience level, and basic salary are required',
        400
      );
    });
  });

  describe('processPayrollForAllStaff', () => {
    it('should process payroll for all staff members successfully', async () => {
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
        assignedSalon: testSalon._id,
        position: 'Hair Specialist',
        experience: { years: 3 },
        isActive: true
      });
      
      // Create payroll configuration
      await PayrollConfiguration.create({
        salonId: testSalon._id,
        jobRole: 'Hair Specialist',
        experienceLevel: 'Senior',
        basicSalaryFixed: 25000,
        allowancesFixed: 5000,
        employeeEpfRate: 0.12,
        professionalTax: 200,
        leaveThresholdDays: 2,
        productDeductionsMonthly: 100
      });
      
      // Create some attendance records
      await Attendance.create({
        staffId: testStaff._id,
        salonId: testSalon._id,
        date: '2025-10-15',
        status: 'Absent',
        createdBy: testUser._id
      });
      
      // Set up request
      mockRequest.user.id = testUser._id.toString();
      mockRequest.body = {
        payrollMonth: 10,
        payrollYear: 2025
      };
      
      // Execute controller function
      await processPayrollForAllStaff(mockRequest, mockResponse);
      
      // Verify success response
      expect(successResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          processedCount: 1,
          errorCount: 0
        }),
        'Payroll processing completed'
      );
      
      // Verify payroll record was created
      const payrollRecord = await PayrollRecord.findOne({
        staffId: testStaff._id,
        payrollMonth: 10,
        payrollYear: 2025
      });
      
      expect(payrollRecord).toBeDefined();
      expect(payrollRecord.staffName).toBe('Test Staff');
      expect(payrollRecord.jobRole).toBe('Hair Specialist');
      expect(payrollRecord.experienceLevel).toBe('Senior');
      expect(payrollRecord.basicSalaryFixed).toBe(25000);
      expect(payrollRecord.grossSalary).toBeDefined();
      expect(payrollRecord.netSalary).toBeDefined();
    });
    
    it('should return error if payroll month and year are missing', async () => {
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
      
      // Set up request with missing required fields
      mockRequest.user.id = testUser._id.toString();
      mockRequest.body = {
        // payrollMonth and payrollYear are missing
      };
      
      // Execute controller function
      await processPayrollForAllStaff(mockRequest, mockResponse);
      
      // Verify error response
      expect(errorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Payroll month and year are required',
        400
      );
    });
  });

  describe('markPayrollAsPaid', () => {
    it('should mark payroll as paid successfully', async () => {
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
        assignedSalon: testSalon._id,
        position: 'Hair Specialist'
      });
      
      const testPayrollRecord = await PayrollRecord.create({
        salonId: testSalon._id,
        staffId: testStaff._id,
        payrollMonth: 10,
        payrollYear: 2025,
        staffName: 'Test Staff',
        jobRole: 'Hair Specialist',
        experienceLevel: 'Senior',
        basicSalaryFixed: 25000,
        allowancesFixed: 5000,
        workingDaysInMonth: 22,
        totalAbsentDays: 1,
        leaveThresholdDays: 2,
        employeeEpfRate: 0.12,
        professionalTax: 200,
        productDeductionsMonthly: 100,
        daysAbsentExceedingLimit: 0,
        perDayRate: 1363.64,
        attendanceDeduction: 0,
        grossSalary: 30000,
        totalDeductions: 3300,
        netSalary: 26700,
        epfDeduction: 3000,
        attendanceDeductionDetail: 0,
        processedBy: testUser._id,
        status: 'processed'
      });
      
      // Set up request
      mockRequest.user.id = testUser._id.toString();
      mockRequest.params.id = testPayrollRecord._id.toString();
      mockRequest.body = {
        paymentReference: 'Transfer to Test Staff'
      };
      
      // Execute controller function
      await markPayrollAsPaid(mockRequest, mockResponse);
      
      // Verify success response
      expect(successResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          _id: testPayrollRecord._id,
          status: 'paid'
        }),
        'Payroll marked as paid successfully'
      );
      
      // Verify payroll record was updated
      const updatedRecord = await PayrollRecord.findById(testPayrollRecord._id);
      expect(updatedRecord.status).toBe('paid');
      expect(updatedRecord.paymentDate).toBeDefined();
      expect(updatedRecord.paymentReference).toBe('Transfer to Test Staff');
    });
    
    it('should return error if payroll record is not found', async () => {
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
      
      // Set up request with non-existent payroll record ID
      mockRequest.user.id = testUser._id.toString();
      mockRequest.params.id = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      mockRequest.body = {};
      
      // Execute controller function
      await markPayrollAsPaid(mockRequest, mockResponse);
      
      // Verify error response
      expect(notFoundResponse).toHaveBeenCalledWith(
        mockResponse,
        'Payroll record not found'
      );
    });
  });
});