import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  X,
  Plus,
} from "lucide-react";

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalHeld: 0,
    totalAttended: 0,
  });

  // Get reliable local today string (YYYY-MM-DD)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayContext, setSelectedDayContext] = useState({
    dateStr: "",
    isWeekend: false,
    isHoliday: false,
  });
  const [newEvent, setNewEvent] = useState({ type: "Event", title: "" });

  // Right-Panel Add Class State
  const [newClass, setNewClass] = useState({
    date: todayStr,
    title: "",
    time: "",
  });

  const loadCalendarData = () => {
    fetch(
      "[https://RudrakshDubey.pythonanywhere.com](https://RudrakshDubey.pythonanywhere.com)/api/calendar",
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.events) setEvents(data.events);
        if (data.attendance_records)
          setAttendanceRecords(data.attendance_records);
        if (data.attendance_stats) setAttendanceStats(data.attendance_stats);
      })
      .catch((err) => console.error("Failed to load calendar data", err));
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  const changeMonth = (offset) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1),
    );
  };

  const handleDayClick = (dateStr, isWeekend, isHoliday) => {
    setSelectedDayContext({ dateStr, isWeekend, isHoliday });
    setIsModalOpen(true);
  };

  const handleSaveModalEvent = async () => {
    if (!newEvent.title) return;
    try {
      await fetch(
        "[https://RudrakshDubey.pythonanywhere.com](https://RudrakshDubey.pythonanywhere.com)/api/calendar/event",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newEvent,
            date: selectedDayContext.dateStr,
            time: "",
          }),
        },
      );
      loadCalendarData();
      setIsModalOpen(false);
      setNewEvent({ type: "Event", title: "" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddClass = async () => {
    if (!newClass.title || !newClass.date) return;
    try {
      await fetch(
        "[https://RudrakshDubey.pythonanywhere.com](https://RudrakshDubey.pythonanywhere.com)/api/calendar/event",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "Class", ...newClass }),
        },
      );
      loadCalendarData();
      // Resets everyday for new entries
      setNewClass({ date: todayStr, title: "", time: "" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAttendance = async (status) => {
    try {
      await fetch(
        "[https://RudrakshDubey.pythonanywhere.com](https://RudrakshDubey.pythonanywhere.com)/api/calendar/attendance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDayContext.dateStr, status }),
        },
      );
      loadCalendarData();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Calendar Grid Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon = 0

  const blanks = Array.from({ length: startOffset }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarGrid = [...blanks, ...days];

  // Attendance Math
  const missed = attendanceStats.totalHeld - attendanceStats.totalAttended;
  const currentPercentage =
    attendanceStats.totalHeld > 0
      ? (
          (attendanceStats.totalAttended / attendanceStats.totalHeld) *
          100
        ).toFixed(1)
      : "100.0";
  const daysNeeded = Math.max(0, 3 * missed - attendanceStats.totalAttended);

  // Filter Upcoming Classes
  const upcomingClasses = events
    .filter((e) => e.type === "Class" && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex-1 h-full bg-[#1A1D2D] text-white font-sans p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50">
      <div className="w-full max-w-7xl py-2 flex gap-8 items-start">
        {/* Left Column: Calendar UI */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {monthName}{" "}
              <span className="text-slate-400 font-normal">{year}</span>
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 bg-[#6C5DD3] rounded-lg hover:bg-[#5a4db8] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 bg-[#6C5DD3] rounded-lg hover:bg-[#5a4db8] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-4">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <div
                key={day}
                className={`text-sm text-center font-medium ${day === "Saturday" || day === "Sunday" ? "text-slate-500" : "text-slate-300"}`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-4">
            {calendarGrid.map((day, idx) => {
              if (!day)
                return (
                  <div key={`blank-${idx}`} className="h-28 opacity-0"></div>
                );

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isWeekend = idx % 7 === 5 || idx % 7 === 6;
              const isToday = dateStr === todayStr;

              const dayEvents = events.filter((e) => e.date === dateStr);
              const isHoliday = dayEvents.some((e) => e.type === "Holiday");
              const attRecord = attendanceRecords.find(
                (a) => a.date === dateStr,
              );

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(dateStr, isWeekend, isHoliday)}
                  className={`
                    h-28 rounded-2xl p-3 relative transition-transform hover:-translate-y-1 cursor-pointer border border-white/5 overflow-hidden
                    ${isWeekend ? "bg-[#25283B]/50" : "bg-[#25283B]"}
                    ${isToday && !isHoliday ? "shadow-[0_0_20px_rgba(255,117,195,0.3)] border-[#FF75C3]/50" : ""}
                    ${isHoliday ? "bg-[#FF75C3]/20 border-[#FF75C3]/50" : ""}
                  `}
                >
                  <span
                    className={`font-semibold ${isToday ? "text-[#FF75C3]" : "text-slate-300"}`}
                  >
                    {day}
                  </span>

                  {/* FIXED: Constrained height and hidden scrollbar prevents grid breaking */}
                  <div className="mt-1 space-y-1 max-h-12.5 overflow-y-auto [&::-webkit-scrollbar]:hidden pb-2">
                    {dayEvents.map((ev, i) => (
                      <p
                        key={i}
                        className="text-[10px] text-slate-300 truncate border-l-2 border-[#6C5DD3] pl-1"
                      >
                        {ev.title}
                      </p>
                    ))}
                  </div>

                  {attRecord && (
                    <div className="absolute bottom-3 right-3 flex gap-1 z-10">
                      <div
                        className={`w-2 h-2 rounded-full ${attRecord.status === "attended" ? "bg-green-400" : "bg-red-400"}`}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Student Hub */}
        <div className="w-87.5 flex flex-col gap-6">
          <div className="bg-[#25283B] rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-6 text-white border-b border-white/10 pb-4">
              Attendance Hub
            </h3>
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
                  style={{ width: `${Math.min(currentPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500">
                Attended {attendanceStats.totalAttended} out of{" "}
                {attendanceStats.totalHeld} tracked days.
              </p>
            </div>

            <div className="bg-[#1A1D2D] rounded-xl p-4 border border-[#FF75C3]/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#FF75C3] mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-[#FF75C3]">
                    75% Criteria Projection
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    You must attend{" "}
                    <strong className="text-white">{daysNeeded}</strong>{" "}
                    consecutive future working days to restore or maintain your
                    75% minimum threshold.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Schedule & Add Class Form */}
          <div className="bg-[#25283B] rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-6 text-white border-b border-white/10 pb-4">
              Upcoming Classes
            </h3>
            <div className="space-y-4 max-h-40 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50">
              {upcomingClasses.length > 0 ? (
                upcomingClasses.map((item, i) => (
                  <div
                    key={i}
                    className="relative pl-4 border-l-2 border-[#6C5DD3]"
                  >
                    <p className="text-xs font-semibold text-[#6C5DD3] mb-1">
                      {item.date}
                    </p>
                    <h4 className="text-white font-medium mb-1">
                      {item.title}
                    </h4>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No upcoming classes scheduled.
                </p>
              )}
            </div>

            {/* Quick Add Class Form */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#6C5DD3]" /> Add New Class
              </h4>
              <div className="space-y-3">
                <input
                  type="date"
                  value={newClass.date}
                  onChange={(e) =>
                    setNewClass({ ...newClass, date: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1A1D2D] border border-white/5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-[#6C5DD3] [&::-webkit-calendar-picker-indicator]:invert"
                />
                <input
                  type="text"
                  placeholder="Class Title (e.g. Calculus III)"
                  value={newClass.title}
                  onChange={(e) =>
                    setNewClass({ ...newClass, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1A1D2D] border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-[#6C5DD3]"
                />
                <input
                  type="text"
                  placeholder="Time (e.g. 09:00 - 10:30 AM)"
                  value={newClass.time}
                  onChange={(e) =>
                    setNewClass({ ...newClass, time: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1A1D2D] border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-[#6C5DD3]"
                />
                <button
                  onClick={handleAddClass}
                  className="w-full py-2 bg-[#6C5DD3] hover:bg-[#5a4db8] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Save Class
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Context Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#25283B] border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-1">Manage Date</h2>
            <p className="text-sm text-slate-400 mb-6">
              {selectedDayContext.dateStr}
            </p>

            <div className="space-y-6">
              {/* Check-In Section - Disabled on Weekends/Holidays */}
              <div className="bg-[#1A1D2D] p-4 rounded-xl border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Mark Attendance
                </h3>

                {selectedDayContext.isWeekend ||
                selectedDayContext.isHoliday ? (
                  <div className="py-3 px-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-yellow-500 text-xs font-medium">
                    <AlertCircle className="w-4 h-4" /> Attendance tracking is
                    disabled on Weekends and Holidays.
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleMarkAttendance("attended")}
                      className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-semibold rounded-lg transition-colors border border-green-500/20"
                    >
                      Attended
                    </button>
                    <button
                      onClick={() => handleMarkAttendance("missed")}
                      className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-lg transition-colors border border-red-500/20"
                    >
                      Missed
                    </button>
                  </div>
                )}
              </div>

              {/* Add Calendar Event (No longer includes Classes) */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Add Label to Date
                </h3>
                <select
                  value={newEvent.type}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, type: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                >
                  <option value="Event">Event</option>
                  <option value="Holiday">Holiday</option>
                </select>
                <input
                  type="text"
                  placeholder="Title (e.g. Diwali, Career Fair)"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                />
                <button
                  onClick={handleSaveModalEvent}
                  className="w-full py-2.5 bg-[#6C5DD3] hover:bg-[#5a4db8] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  <Plus className="w-4 h-4" /> Save Label
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
