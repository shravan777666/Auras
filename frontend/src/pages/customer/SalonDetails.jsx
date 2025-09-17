import React from "react";
import { useParams } from "react-router-dom";

const SalonDetails = () => {
  const { salonId } = useParams();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white shadow rounded-md p-6">
        <h1 className="text-2xl font-semibold mb-2">Salon Details</h1>
        <p className="text-gray-600">Showing details for salon ID: <span className="font-mono">{salonId}</span></p>
        {/* TODO: Fetch and display salon details by ID */}
      </div>
    </div>
  );
};

export default SalonDetails;