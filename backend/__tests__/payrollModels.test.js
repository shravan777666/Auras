import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import PayrollConfiguration from '../models/PayrollConfiguration.js';
import PayrollRecord from '../models/PayrollRecord.js';

let mongoServer;

describe('Payroll Models', () => {
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
  });

  describe('PayrollConfiguration', () => {
    it('should create a payroll configuration successfully', async () => {
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
      
      const payrollConfig = await PayrollConfiguration.create({
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
      
      expect(payrollConfig.salonId.toString()).toBe(testSalon._id.toString());
      expect(payrollConfig.jobRole).toBe('Hair Specialist');
      expect(payrollConfig.experienceLevel).toBe('Senior');
      expect(payrollConfig.basicSalaryFixed).toBe(25000);
      expect(payrollConfig.allowancesFixed).toBe(5000);
      expect(payrollConfig.employeeEpfRate).toBe(0.12);
      expect(payrollConfig.professionalTax).toBe(200);
      expect(payrollConfig.leaveThresholdDays).toBe(2);
      expect(payrollConfig.productDeductionsMonthly).toBe(100);
    });
    
    it('should enforce unique combination of salonId, jobRole, and experienceLevel', async () => {
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
      
      // Create first payroll configuration
      await PayrollConfiguration.create({
        salonId: testSalon._id,
        jobRole: 'Hair Specialist',
        experienceLevel: 'Senior',
        basicSalaryFixed: 25000
      });
      
      // Try to create duplicate configuration
      await expect(PayrollConfiguration.create({
        salonId: testSalon._id,
        jobRole: 'Hair Specialist',
        experienceLevel: 'Senior',
        basicSalaryFixed: 30000
      })).rejects.toThrow();
    });
    
    it('should validate experienceLevel enum values', async () => {
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
      
      // Try to create configuration with invalid experienceLevel
      await expect(PayrollConfiguration.create({
        salonId: testSalon._id,
        jobRole: 'Hair Specialist',
        experienceLevel: 'InvalidLevel',
        basicSalaryFixed: 25000
      })).rejects.toThrow();
    });
  });

  describe('PayrollRecord', () => {
    it('should create a payroll record successfully', async () => {
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
      
      const payrollRecord = await PayrollRecord.create({
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
      
      expect(payrollRecord.salonId.toString()).toBe(testSalon._id.toString());
      expect(payrollRecord.staffId.toString()).toBe(testStaff._id.toString());
      expect(payrollRecord.payrollMonth).toBe(10);
      expect(payrollRecord.payrollYear).toBe(2025);
      expect(payrollRecord.staffName).toBe('Test Staff');
      expect(payrollRecord.jobRole).toBe('Hair Specialist');
      expect(payrollRecord.experienceLevel).toBe('Senior');
      expect(payrollRecord.basicSalaryFixed).toBe(25000);
      expect(payrollRecord.allowancesFixed).toBe(5000);
      expect(payrollRecord.workingDaysInMonth).toBe(22);
      expect(payrollRecord.totalAbsentDays).toBe(1);
      expect(payrollRecord.leaveThresholdDays).toBe(2);
      expect(payrollRecord.employeeEpfRate).toBe(0.12);
      expect(payrollRecord.professionalTax).toBe(200);
      expect(payrollRecord.productDeductionsMonthly).toBe(100);
      expect(payrollRecord.daysAbsentExceedingLimit).toBe(0);
      expect(payrollRecord.perDayRate).toBeCloseTo(1363.64, 2);
      expect(payrollRecord.attendanceDeduction).toBe(0);
      expect(payrollRecord.grossSalary).toBe(30000);
      expect(payrollRecord.totalDeductions).toBe(3300);
      expect(payrollRecord.netSalary).toBe(26700);
      expect(payrollRecord.epfDeduction).toBe(3000);
      expect(payrollRecord.attendanceDeductionDetail).toBe(0);
      expect(payrollRecord.processedBy.toString()).toBe(testUser._id.toString());
      expect(payrollRecord.status).toBe('processed');
    });
    
    it('should enforce unique payroll record per staff per month/year', async () => {
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
      
      // Create first payroll record
      await PayrollRecord.create({
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
      
      // Try to create duplicate payroll record
      await expect(PayrollRecord.create({
        salonId: testSalon._id,
        staffId: testStaff._id,
        payrollMonth: 10,
        payrollYear: 2025,
        staffName: 'Test Staff',
        jobRole: 'Hair Specialist',
        experienceLevel: 'Senior',
        basicSalaryFixed: 30000,
        allowancesFixed: 6000,
        workingDaysInMonth: 22,
        totalAbsentDays: 1,
        leaveThresholdDays: 2,
        employeeEpfRate: 0.12,
        professionalTax: 200,
        productDeductionsMonthly: 100,
        daysAbsentExceedingLimit: 0,
        perDayRate: 1363.64,
        attendanceDeduction: 0,
        grossSalary: 36000,
        totalDeductions: 3300,
        netSalary: 32700,
        epfDeduction: 3000,
        attendanceDeductionDetail: 0,
        processedBy: testUser._id,
        status: 'processed'
      })).rejects.toThrow();
    });
    
    it('should validate status enum values', async () => {
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
      
      // Try to create payroll record with invalid status
      await expect(PayrollRecord.create({
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
        status: 'invalid_status'
      })).rejects.toThrow();
    });
  });
});