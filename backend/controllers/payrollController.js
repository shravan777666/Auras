import PayrollConfiguration from '../models/PayrollConfiguration.js';
import PayrollRecord from '../models/PayrollRecord.js';
import Staff from '../models/Staff.js';
import Attendance from '../models/Attendance.js';
import Salon from '../models/Salon.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Helper function to get working days in a month
const getWorkingDaysInMonth = (year, month) => {
  try {
    // Get the total days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Count weekends (Saturday and Sunday)
    let weekendDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day); // month is 0-indexed in Date
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
        weekendDays++;
      }
    }
    
    // TODO: In a future enhancement, consider public holidays
    // For now, we'll use a fixed list of common public holidays in India
    // This is a simplified approach and would need to be enhanced for production use
    const publicHolidays = [
      // Format: 'YYYY-MM-DD'
      // Add common holidays here
      // `${year}-01-26`, // Republic Day
      // `${year}-08-15`, // Independence Day
      // `${year}-10-02`, // Gandhi Jayanti
    ];
    
    // Count public holidays that fall on weekdays
    let publicHolidayCount = 0;
    for (const holiday of publicHolidays) {
      const holidayDate = new Date(holiday);
      // Check if the holiday is in the requested month and year
      if (holidayDate.getFullYear() === year && holidayDate.getMonth() === month - 1) {
        const dayOfWeek = holidayDate.getDay();
        // Only count if it's not already a weekend
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          publicHolidayCount++;
        }
      }
    }
    
    // Working days = total days - weekends - public holidays
    return daysInMonth - weekendDays - publicHolidayCount;
  } catch (error) {
    console.error(`Error calculating working days for ${year}/${month}:`, error);
    // Return a default value of 22 working days if there's an error
    return 22;
  }
};

// Helper function to calculate total absent days for a staff member in a month
const calculateAbsentDays = async (staffId, year, month) => {
  try {
    // Create date range for the month
    const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in Date constructor
    const endDate = new Date(year, month, 0); // Last day of the month
    
    // Format dates as YYYY-MM-DD strings for comparison with Attendance model
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Find all absent records for the staff member in the given month
    // We consider both 'Absent' status and other non-present statuses that should count as absent
    const absentRecords = await Attendance.find({
      staffId: staffId,
      date: {
        $gte: startDateStr,
        $lte: endDateStr
      },
      status: { $in: ['Absent', 'Late', 'Half-Day'] }
    });
    
    // For Half-Day, we might want to count it as 0.5 days absent
    let totalAbsentDays = 0;
    for (const record of absentRecords) {
      if (record.status === 'Half-Day') {
        totalAbsentDays += 0.5;
      } else {
        totalAbsentDays += 1;
      }
    }
    
    return totalAbsentDays;
  } catch (error) {
    console.error(`Error calculating absent days for staff ${staffId}:`, error);
    // Return 0 absent days if there's an error to prevent payroll processing from failing
    return 0;
  }
};

// Create or update payroll configuration for a job role and experience level
export const createOrUpdatePayrollConfig = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;
  const { 
    jobRole, 
    experienceLevel, 
    basicSalaryFixed, 
    allowancesFixed,
    employeeEpfRate,
    professionalTax,
    leaveThresholdDays,
    productDeductionsMonthly
  } = req.body;
  
  // Validate required fields
  if (!jobRole || !experienceLevel || basicSalaryFixed === undefined) {
    return errorResponse(res, 'Job role, experience level, and basic salary are required', 400);
  }
  
  // Find the salon owner's salon
  const salon = await Salon.findOne({ ownerId: salonOwnerId });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }
  
  console.log(`Creating/updating payroll configuration for salon ${salon._id}:`, {
    jobRole,
    experienceLevel,
    basicSalaryFixed,
    allowancesFixed,
    employeeEpfRate,
    professionalTax,
    leaveThresholdDays,
    productDeductionsMonthly
  });
  
  // Create or update payroll configuration
  const payrollConfig = await PayrollConfiguration.findOneAndUpdate(
    { 
      salonId: salon._id, 
      jobRole, 
      experienceLevel 
    },
    {
      salonId: salon._id,
      jobRole,
      experienceLevel,
      basicSalaryFixed,
      allowancesFixed: allowancesFixed || 0,
      employeeEpfRate: employeeEpfRate || 0.12,
      professionalTax: professionalTax || 0,
      leaveThresholdDays: leaveThresholdDays || 2,
      productDeductionsMonthly: productDeductionsMonthly || 0
    },
    { 
      new: true, 
      upsert: true,
      runValidators: true
    }
  );
  
  console.log(`Payroll configuration saved successfully:`, payrollConfig);
  
  return successResponse(res, payrollConfig, 'Payroll configuration saved successfully');
});

// Get all payroll configurations for a salon
export const getPayrollConfigurations = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;
  
  // Find the salon owner's salon
  const salon = await Salon.findOne({ ownerId: salonOwnerId });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }
  
  const configurations = await PayrollConfiguration.find({ salonId: salon._id });
  
  console.log(`Retrieved ${configurations.length} payroll configurations for salon ${salon._id}:`, configurations);
  
  return successResponse(res, configurations, 'Payroll configurations retrieved successfully');
});

// Get payroll configuration by job role and experience level
export const getPayrollConfigByRoleAndLevel = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;
  const { jobRole, experienceLevel } = req.params;
  
  // Find the salon owner's salon
  const salon = await Salon.findOne({ ownerId: salonOwnerId });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }
  
  const configuration = await PayrollConfiguration.findOne({ 
    salonId: salon._id, 
    jobRole, 
    experienceLevel 
  });
  
  if (!configuration) {
    return notFoundResponse(res, 'Payroll configuration');
  }
  
  return successResponse(res, configuration, 'Payroll configuration retrieved successfully');
});

// Delete payroll configuration
export const deletePayrollConfig = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;
  const { id } = req.params;
  
  // Find the salon owner's salon
  const salon = await Salon.findOne({ ownerId: salonOwnerId });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }
  
  const configuration = await PayrollConfiguration.findOneAndDelete({ 
    _id: id, 
    salonId: salon._id 
  });
  
  if (!configuration) {
    return notFoundResponse(res, 'Payroll configuration');
  }
  
  return successResponse(res, null, 'Payroll configuration deleted successfully');
});

// Process payroll for all staff members
export const processPayrollForAllStaff = asyncHandler(async (req, res) => {
  try {
    const salonOwnerId = req.user.id;
    const { payrollMonth, payrollYear } = req.body;
    
    // Validate required fields
    if (!payrollMonth || !payrollYear) {
      return errorResponse(res, 'Payroll month and year are required', 400);
    }
    
    // Validate month and year
    if (payrollMonth < 1 || payrollMonth > 12) {
      return errorResponse(res, 'Payroll month must be between 1 and 12', 400);
    }
    
    if (payrollYear < 2020 || payrollYear > 2030) {
      return errorResponse(res, 'Payroll year must be between 2020 and 2030', 400);
    }
    
    // Find the salon owner's salon
    const salon = await Salon.findOne({ ownerId: salonOwnerId });
    if (!salon) {
      return notFoundResponse(res, 'Salon');
    }
    
    // Log the start of payroll processing
    console.log(`Starting payroll processing for salon ${salon._id} for ${payrollMonth}/${payrollYear}`);
    
    // Get all staff members for this salon
    const staffMembers = await Staff.find({ assignedSalon: salon._id, isActive: true });
    
    if (staffMembers.length === 0) {
      console.log('No active staff members found for this salon');
      return successResponse(res, [], 'No active staff members found for this salon');
    }
    
    console.log(`Found ${staffMembers.length} active staff members for payroll processing`);
    
    // Get working days in the month
    const workingDaysInMonth = getWorkingDaysInMonth(payrollYear, payrollMonth);
    
    // Process payroll for each staff member
    const payrollRecords = [];
    const errors = [];
    
    for (const staff of staffMembers) {
      try {
        console.log(`Processing payroll for staff: ${staff.name} (${staff._id})`);
        console.log(`Staff details: position=${staff.position}, experience=${JSON.stringify(staff.experience)}`);
        
        // Skip staff without position (job role)
        if (!staff.position) {
          const errorMsg = `Staff ${staff.name} skipped: No job role specified`;
          console.warn(errorMsg);
          errors.push(errorMsg);
          continue;
        }
        
        // Determine experience level based on years of experience
        // In a real implementation, you might want to get this from staff profile
        const experienceYears = staff.experience?.years || 0;
        const experienceLevel = experienceYears >= 5 ? 'Master' : 
                              experienceYears >= 2 ? 'Senior' : 'Junior';
        
        console.log(`Staff ${staff.name} has position: ${staff.position}, experience years: ${experienceYears}, determined experience level: ${experienceLevel}`);
        
        // Get payroll configuration for this job role and experience level
        console.log(`Looking for payroll configuration for salon ${salon._id}, job role: ${staff.position}, experience level: ${experienceLevel}`);
        const payrollConfig = await PayrollConfiguration.findOne({ 
          salonId: salon._id, 
          jobRole: staff.position,
          experienceLevel: experienceLevel
        });
        console.log(`Found payroll configuration:`, payrollConfig);
        
        if (!payrollConfig) {
          const errorMsg = `Staff ${staff.name} skipped: No payroll configuration found for ${staff.position} - ${experienceLevel}`;
          console.warn(errorMsg);
          errors.push(errorMsg);
          continue;
        }
        
        console.log(`Found payroll configuration for ${staff.name}: ${staff.position} - ${experienceLevel}`);
        
        // Calculate absent days for this staff member
        const totalAbsentDays = await calculateAbsentDays(staff._id, payrollYear, payrollMonth);
        console.log(`Staff ${staff.name} absent days: ${totalAbsentDays}`);
        
        // Calculate days absent exceeding limit
        const daysAbsentExceedingLimit = Math.max(0, totalAbsentDays - payrollConfig.leaveThresholdDays);
        console.log(`Staff ${staff.name} days absent exceeding limit: ${daysAbsentExceedingLimit}`);
        
        // Calculate per day rate
        const perDayRate = (payrollConfig.basicSalaryFixed + payrollConfig.allowancesFixed) / workingDaysInMonth;
        console.log(`Staff ${staff.name} per day rate: ${perDayRate}`);
        
        // Calculate attendance deduction
        const attendanceDeduction = perDayRate * daysAbsentExceedingLimit;
        console.log(`Staff ${staff.name} attendance deduction: ${attendanceDeduction}`);
        
        // Calculate gross salary
        const grossSalary = (payrollConfig.basicSalaryFixed + payrollConfig.allowancesFixed) - attendanceDeduction;
        console.log(`Staff ${staff.name} gross salary: ${grossSalary}`);
        
        // Calculate EPF deduction
        const epfDeduction = payrollConfig.basicSalaryFixed * payrollConfig.employeeEpfRate;
        console.log(`Staff ${staff.name} EPF deduction: ${epfDeduction}`);
        
        // Calculate attendance deduction detail
        const attendanceDeductionDetail = attendanceDeduction;
        
        // Calculate total deductions
        const totalDeductions = epfDeduction + payrollConfig.professionalTax + payrollConfig.productDeductionsMonthly;
        console.log(`Staff ${staff.name} total deductions: ${totalDeductions}`);
        
        // Calculate net salary
        const netSalary = grossSalary - totalDeductions;
        console.log(`Staff ${staff.name} net salary: ${netSalary}`);
        
        // Create or update payroll record
        const payrollRecord = await PayrollRecord.findOneAndUpdate(
          { 
            staffId: staff._id, 
            payrollMonth, 
            payrollYear 
          },
          {
            salonId: salon._id,
            staffId: staff._id,
            payrollMonth,
            payrollYear,
            staffName: staff.name,
            jobRole: staff.position,
            experienceLevel: experienceLevel,
            basicSalaryFixed: payrollConfig.basicSalaryFixed,
            allowancesFixed: payrollConfig.allowancesFixed,
            workingDaysInMonth,
            totalAbsentDays,
            leaveThresholdDays: payrollConfig.leaveThresholdDays,
            employeeEpfRate: payrollConfig.employeeEpfRate,
            professionalTax: payrollConfig.professionalTax,
            productDeductionsMonthly: payrollConfig.productDeductionsMonthly,
            daysAbsentExceedingLimit,
            perDayRate,
            attendanceDeduction,
            grossSalary,
            totalDeductions,
            netSalary,
            epfDeduction,
            attendanceDeductionDetail,
            processedBy: salonOwnerId,
            status: 'processed'
          },
          { 
            new: true, 
            upsert: true,
            runValidators: true
          }
        );
        
        console.log(`Successfully processed payroll for staff: ${staff.name}`);
        payrollRecords.push(payrollRecord);
      } catch (error) {
        const errorMsg = `Error processing payroll for ${staff.name}: ${error.message}`;
        console.error(errorMsg, error);
        errors.push(errorMsg);
      }
    }
    
    console.log(`Payroll processing completed. Processed: ${payrollRecords.length}, Errors: ${errors.length}`);
    
    return successResponse(res, {
      payrollRecords,
      errors,
      processedCount: payrollRecords.length,
      errorCount: errors.length
    }, 'Payroll processing completed');
  } catch (error) {
    console.error('Unexpected error in payroll processing:', error);
    return errorResponse(res, `An unexpected error occurred during payroll processing: ${error.message}`, 500);
  }
});

// Get payroll records for a specific month/year
export const getPayrollRecords = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;
  const { payrollMonth, payrollYear } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Find the salon owner's salon
  const salon = await Salon.findOne({ ownerId: salonOwnerId });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }
  
  // Build filter
  const filter = { salonId: salon._id };
  
  if (payrollMonth) {
    filter.payrollMonth = parseInt(payrollMonth);
  }
  
  if (payrollYear) {
    filter.payrollYear = parseInt(payrollYear);
  }
  
  const [payrollRecords, totalRecords] = await Promise.all([
    PayrollRecord.find(filter)
      .populate('staffId', 'name email position')
      .sort({ processedAt: -1 })
      .skip(skip)
      .limit(limit),
    PayrollRecord.countDocuments(filter)
  ]);
  
  const totalPages = Math.ceil(totalRecords / limit);
  
  return paginatedResponse(res, payrollRecords, {
    page,
    limit,
    totalPages,
    totalItems: totalRecords
  });
});

// Get payroll record by ID
export const getPayrollRecordById = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;
  const { id } = req.params;
  
  // Find the salon owner's salon
  const salon = await Salon.findOne({ ownerId: salonOwnerId });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }
  
  const payrollRecord = await PayrollRecord.findOne({ 
    _id: id, 
    salonId: salon._id 
  }).populate('staffId', 'name email position');
  
  if (!payrollRecord) {
    return notFoundResponse(res, 'Payroll record');
  }
  
  return successResponse(res, payrollRecord, 'Payroll record retrieved successfully');
});

// Mark payroll as paid (one-click payment processing)
export const markPayrollAsPaid = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;
  const { id } = req.params;
  const { paymentReference } = req.body;
  
  // Validate required parameters
  if (!id) {
    return errorResponse(res, 'Payroll record ID is required', 400);
  }
  
  // Find the salon owner's salon
  const salon = await Salon.findOne({ ownerId: salonOwnerId });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }
  
  // Find the payroll record to ensure it exists and belongs to this salon
  const existingRecord = await PayrollRecord.findOne({ 
    _id: id, 
    salonId: salon._id
  });
  
  if (!existingRecord) {
    return notFoundResponse(res, 'Payroll record not found');
  }
  
  // Check if the record is already paid
  if (existingRecord.status === 'paid') {
    return errorResponse(res, 'Payroll record is already marked as paid', 400);
  }
  
  // Only allow marking processed records as paid
  if (existingRecord.status !== 'processed') {
    return errorResponse(res, 'Payroll record must be in processed status to be marked as paid', 400);
  }
  
  // Update the payroll record
  const payrollRecord = await PayrollRecord.findByIdAndUpdate(
    id,
    {
      status: 'paid',
      paymentDate: new Date(),
      paymentReference: paymentReference || `Payment to ${existingRecord.staffName}`,
      updatedAt: new Date()
    },
    { 
      new: true,
      runValidators: true
    }
  );
  
  // Create an expense record for this payment
  try {
    const Expense = (await import('../models/Expense.js')).default;
    
    await Expense.create({
      salonId: salon._id,
      category: 'Salaries',
      amount: payrollRecord.netSalary,
      description: `Salary payment to ${payrollRecord.staffName} for ${new Date(payrollRecord.payrollYear, payrollRecord.payrollMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      date: new Date(),
      type: 'Salary',
      staffMemberId: payrollRecord.staffId,
      staffName: payrollRecord.staffName
    });
  } catch (error) {
    console.error('Error creating salary expense record:', error);
    // Don't fail the whole operation if expense creation fails
    // Add error to response for debugging
    payrollRecord.expenseCreationError = error.message;
  }
  
  return successResponse(res, payrollRecord, 'Payroll marked as paid successfully');
});

// Get staff payroll records (for staff dashboard)
export const getStaffPayrollRecords = asyncHandler(async (req, res) => {
  const staffUserId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Find the staff member
  const staff = await Staff.findOne({ user: staffUserId });
  if (!staff) {
    return notFoundResponse(res, 'Staff profile');
  }
  
  const [payrollRecords, totalRecords] = await Promise.all([
    PayrollRecord.find({ staffId: staff._id, status: 'paid' })
      .sort({ payrollYear: -1, payrollMonth: -1 })
      .skip(skip)
      .limit(limit),
    PayrollRecord.countDocuments({ staffId: staff._id, status: 'paid' })
  ]);
  
  const totalPages = Math.ceil(totalRecords / limit);
  
  return paginatedResponse(res, payrollRecords, {
    page,
    limit,
    totalPages,
    totalItems: totalRecords
  });
});

// Get specific staff payroll record (for payslip view)
export const getStaffPayrollRecordById = asyncHandler(async (req, res) => {
  const staffUserId = req.user.id;
  const { id } = req.params;
  
  // Find the staff member
  const staff = await Staff.findOne({ user: staffUserId });
  if (!staff) {
    return notFoundResponse(res, 'Staff profile');
  }
  
  const payrollRecord = await PayrollRecord.findOne({ 
    _id: id, 
    staffId: staff._id,
    status: 'paid'
  });
  
  if (!payrollRecord) {
    return notFoundResponse(res, 'Payroll record or record not paid');
  }
  
  return successResponse(res, payrollRecord, 'Payroll record retrieved successfully');
});

export default {
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
};