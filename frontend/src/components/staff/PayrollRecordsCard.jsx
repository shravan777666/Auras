import React, { useState, useEffect } from 'react';
import { FileText, Calendar, IndianRupee, Info } from 'lucide-react';
import { staffService } from '../../services/staff';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const PayrollRecordsCard = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await staffService.getStaffPayrollRecords({ limit: 5 });
        if (response.success) {
          setRecords(response.data.items || response.data);
        }
      } catch (error) {
        toast.error('Failed to fetch payroll records');
        console.error('Error fetching payroll records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Payroll Records</h3>
        </div>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No payroll records available yet.</p>
          <div className="mt-2 text-gray-400 text-sm max-w-md mx-auto">
            <p className="flex items-center justify-center mb-2">
              <Info className="h-4 w-4 mr-1" />
              Payroll records will appear here after your salon owner processes and marks them as paid.
            </p>
            <p>
              Your salon owner must first process payroll and then transfer the payment to make records visible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Payroll Records</h3>
        </div>
        <span className="text-sm text-gray-500">{records.length} records</span>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <div 
            key={record._id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => setSelectedRecord(record)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-900">
                    {new Date(record.payrollYear, record.payrollMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <IndianRupee className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-lg font-bold text-gray-900">
                    {record.netSalary?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  record.status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {record.status}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  Processed on {new Date(record.processedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedRecord && (
        <PayrollDetailModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} 
        />
      )}
    </div>
  );
};

// Payroll Detail Modal Component
const PayrollDetailModal = ({ record, onClose }) => {
  if (!record) return null;

  const earnings = [
    { name: 'Basic Salary', amount: record.basicSalaryFixed },
    { name: 'Allowances', amount: record.allowancesFixed },
    { name: 'Attendance Bonus/Deduction', amount: -record.attendanceDeductionDetail }
  ];

  const deductions = [
    { name: 'EPF Contribution', amount: record.epfDeduction },
    { name: 'Professional Tax', amount: record.professionalTax },
    { name: 'Product Deductions', amount: record.productDeductionsMonthly },
    { name: 'Attendance Deduction', amount: record.attendanceDeductionDetail }
  ];

  const totalEarnings = earnings.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalDeductions = deductions.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Payslip</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {new Date(record.payrollYear, record.payrollMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-gray-600 mt-1">Payroll ID: {record._id.slice(-8)}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  record.status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {record.status === 'paid' ? 'Paid' : 'Processed'}
                </span>
                <p className="text-sm text-gray-500 mt-2">
                  Processed on {new Date(record.processedAt).toLocaleDateString()}
                </p>
                {record.paymentDate && (
                  <p className="text-sm text-gray-500">
                    Paid on {new Date(record.paymentDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Employee Details</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Name:</span> {record.staffName}</p>
                <p><span className="text-gray-500">Position:</span> {record.jobRole}</p>
                <p><span className="text-gray-500">Level:</span> {record.experienceLevel}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Payroll Period</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Month:</span> {new Date(record.payrollYear, record.payrollMonth - 1).toLocaleString('default', { month: 'long' })}</p>
                <p><span className="text-gray-500">Year:</span> {record.payrollYear}</p>
                <p><span className="text-gray-500">Working Days:</span> {record.workingDaysInMonth}</p>
                <p><span className="text-gray-500">Absent Days:</span> {record.totalAbsentDays}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Earnings</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {earnings.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium">₹{item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between font-semibold">
                    <span>Total Earnings</span>
                    <span>₹{totalEarnings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Deductions</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {deductions.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium">₹{item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between font-semibold">
                    <span>Total Deductions</span>
                    <span>₹{totalDeductions?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Net Pay (Take-Home Pay)</span>
              <span className="text-2xl font-bold text-blue-700">
                ₹{record.netSalary?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>This is a computer-generated payslip and does not require a signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollRecordsCard;