import React, { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// ✅ Use "index.css" instead of "main.css"
import "../../styles/fullcalendar.css";

const StaffSchedule = () => {
  const calendarOptions = useMemo(
    () => ({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: "dayGridMonth",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      },
      height: "auto",
      editable: false,
      selectable: true,
      dayMaxEventRows: true,
    }),
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">My Schedule</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <FullCalendar {...calendarOptions} />
        </div>
      </div>
    </div>
  );
};

export default StaffSchedule;
