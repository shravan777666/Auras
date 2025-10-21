import React from 'react';
import BackButton from '../../components/common/BackButton';

const Report = () => {
  return (
    <div className="container mx-auto p-4">
      <BackButton fallbackPath="/admin/dashboard" className="mb-4" />
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder for report widgets */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Total Revenue</h2>
          <p className="text-3xl font-bold mt-2">$0</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Total Appointments</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">New Customers</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
      </div>
      <div className="mt-8">
        {/* Placeholder for charts */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Revenue Over Time</h2>
          <div className="h-64 bg-gray-200 rounded mt-2"></div>
        </div>
      </div>
    </div>
  );
};

export default Report;
