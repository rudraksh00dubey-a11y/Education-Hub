import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
} from "lucide-react";

export const CalendarPage = () => {
  // 1. State for backend data (with fallbacks)
  const [attendanceData, setAttendanceData] = useState({
    totalHeld: 45,
    totalAttended: 31,
  });

  const [upcomingClasses, setUpcomingClasses] = useState([
    {
      date: "Dec 25th",
      title: "Calculus III",
      time: "09:00 - 10:30 AM",
      status: "Mandatory",
    },
    {
      date: "Dec 26th",
      title: "Data Structures",
      time: "11:00 - 12:30 PM",
      status: "Mandatory",
    },
  ]);

  // 2. Fetch data from backend on load
  useEffect(() => {
    fetch("http://localhost:5000/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        if (data.attendance) setAttendanceData(data.attendance);
        if (data.upcomingClasses) setUpcomingClasses(data.upcomingClasses);
      })
      .catch((err) => console.error("Failed to load calendar data", err));
  }, []);

  // Math: Calculate additional consecutive days needed to hit 75%
  const currentPercentage = (
    (attendanceData.totalAttended / attendanceData.totalHeld) *
    100
  ).toFixed(1);

  const daysNeeded = Math.max(
    0,
    3 * attendanceData.totalHeld - 4 * attendanceData.totalAttended,
  );

  // Basic calendar generation
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const calendarDays = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <div
      className="
      flex-1 h-full bg-[#1A1D2D] text-white font-sans p-8 overflow-y-auto
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-track]:rounded-full
      [&::-webkit-scrollbar-thumb]:bg-slate-700/50
      [&::-webkit-scrollbar-thumb]:rounded-full
      hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50
      transition-colors
    "
    >
      <div className="w-full max-w-7xl py-2 flex gap-8 items-center ">
        {/* Left Column: Calendar UI */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              December <span className="text-slate-400 font-normal">2024</span>
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </h1>
            <div className="flex gap-3">
              <button className="p-2 bg-[#6C5DD3] rounded-lg hover:bg-[#5a4db8] transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 bg-[#6C5DD3] rounded-lg hover:bg-[#5a4db8] transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className={`text-sm text-center font-medium ${day === "Saturday" || day === "Sunday" ? "text-slate-500" : "text-slate-300"}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
            {calendarDays.map((day, idx) => {
              const isWeekend = idx % 7 === 5 || idx % 7 === 6;
              const isToday = day === 24;
              const isHoliday = day === 6;

              return (
                <div
                  key={idx}
                  className={`
                    h-28 rounded-2xl p-3 relative transition-transform hover:-translate-y-1 cursor-pointer
                    ${isWeekend ? "bg-[#25283B]/50" : "bg-[#25283B]"}
                    ${isToday ? "bg-[#FF75C3] shadow-[0_0_20px_rgba(255,117,195,0.3)]" : ""}
                    ${isHoliday ? "bg-[#FF75C3]" : ""}
                    ${day > 31 ? "opacity-0 pointer-events-none" : "opacity-100"}
                  `}
                >
                  <span
                    className={`font-semibold ${isToday || isHoliday ? "text-white" : "text-slate-300"}`}
                  >
                    {day <= 31 ? day : ""}
                  </span>

                  {day === 10 && (
                    <div className="absolute bottom-3 left-3 border-l-2 border-[#6C5DD3] pl-2">
                      <p className="text-[10px] text-slate-300">Physics Lab</p>
                    </div>
                  )}
                  {day === 27 && (
                    <div className="absolute bottom-3 right-3 flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <div className="w-2 h-2 rounded-full bg-[#6C5DD3]"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Student Hub */}
        <div className="w-87.5 flex flex-col gap-6">
          <button className="w-full py-3 bg-[#6C5DD3] rounded-xl font-semibold flex justify-center items-center gap-2 hover:bg-[#5a4db8] transition-colors shadow-[0_0_20px_rgba(108,93,211,0.3)]">
            <CalendarIcon className="w-5 h-5" />
            Sync Timetable
          </button>

          <div className="bg-[#25283B] rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-6 text-white border-b border-white/10 pb-4">
              Attendance Hub
            </h3>

            {/* Current Status */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Current Status</span>
                <span
                  className={
                    currentPercentage >= 75
                      ? "text-green-400"
                      : "text-[#FF75C3]"
                  }
                >
                  {currentPercentage}%
                </span>
              </div>
              <div className="w-full bg-[#1A1D2D] rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${currentPercentage >= 75 ? "bg-green-400" : "bg-[#FF75C3]"}`}
                  style={{ width: `${currentPercentage}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500">
                Attended {attendanceData.totalAttended} out of{" "}
                {attendanceData.totalHeld} working days.
              </p>
            </div>

            {/* Criteria Calculation */}
            <div className="bg-[#1A1D2D] rounded-xl p-4 border border-[#FF75C3]/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#FF75C3] mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-[#FF75C3]">
                    75% Criteria Warning
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Excluding weekends, you must attend exactly{" "}
                    <strong className="text-white">
                      {daysNeeded} consecutive working days
                    </strong>{" "}
                    to restore your attendance to the 75% minimum threshold.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="bg-[#25283B] rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-6 text-white border-b border-white/10 pb-4">
              Upcoming Classes
            </h3>

            <div className="space-y-6">
              {upcomingClasses.map((item, i) => (
                <div
                  key={i}
                  className="relative pl-4 border-l-2 border-[#6C5DD3]"
                >
                  <p className="text-xs font-semibold text-[#6C5DD3] mb-1">
                    {item.date}
                  </p>
                  <h4 className="text-white font-medium mb-2">{item.title}</h4>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </span>
                    <span>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
