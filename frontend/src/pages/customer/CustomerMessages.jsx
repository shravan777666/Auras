import React from 'react';
import CustomerMessages from '../../components/customer/CustomerMessages';
import BackButton from '../../components/common/BackButton';

const CustomerMessagesPage = () => {
  return (
    <div className="p-4">
      <BackButton fallbackPath="/customer/dashboard" className="mb-4" />
      <CustomerMessages />
    </div>
  );
};

export default CustomerMessagesPage;
