import React from 'react';
import BroadcastList from '../../components/staff/BroadcastList';
import BackButton from '../../components/common/BackButton';

const StaffBroadcasts = () => {
  return (
    <div className="p-4">
      <BackButton fallbackPath="/staff/dashboard" className="mb-4" />
      <BroadcastList />
    </div>
  );
};

export default StaffBroadcasts;
