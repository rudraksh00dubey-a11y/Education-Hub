import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Play,
  Pause,
  Square,
  Plus,
  Minus,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const StatCard = ({ icon: Icon, title, value, subtitle, color, iconBg }) => (
  <div className="bg-[#1A1F2C] p-6 rounded-2xl flex flex-col justify-between border border-white/5">
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}
    >
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-slate-500 text-xs">{subtitle}</p>
    </div>
  </div>
);

const WeeklyChart = ({ weeklyData }) => {
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: weeklyData || [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "#3b82f6",
        borderRadius: 4,
        barThickness: 16,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 1, // Forces the Y-axis to reach at least 1 hour
        ticks: {
          color: "#64748b",
          stepSize: 1, // Adjusted to 1 for better scaling
          precision: 0, // Strictly prevents decimal values on the axis (e.g., 0.5h)
          callback: (value) => `${value}h`,
        },
        grid: { display: false },
        border: { display: false },
      },
      x: {
        ticks: { color: "#64748b", font: { size: 10 } },
        grid: { display: false },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const h = Math.floor(context.raw || 0);
            const m = Math.round(((context.raw || 0) - h) * 60);
            return ` ${h} hr ${m} min`;
          },
        },
      },
    },
  };

  return (
    <div className="h-60 w-full mt-4">
      <Bar data={data} options={options} />
    </div>
  );
};

export const DashboardPage = ({ timerState, timerControls }) => {
  const [userName, setUserName] = useState("");
  const [semester, setSemester] = useState("Loading...");
  const [schedule, setSchedule] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [totalStudyHours, setTotalStudyHours] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
  const [userLevel, setUserLevel] = useState(1);

  const {
    inputHours = 0,
    inputMinutes = 25,
    totalTimeSeconds = 1500,
    timeLeft = 1500,
    isActive = false,
    isPaused = false,
    refreshKey = 0,
  } = timerState || {};
  const {
    setInputHours = () => {},
    setInputMinutes = () => {},
    handleStart = () => {},
    handlePause = () => {},
    handleResume = () => {},
    handleStop = () => {},
  } = timerControls || {};

  const currentYear = new Date().getFullYear();
  const indianSemesters = [
    `Even Semester (Jan-May) ${currentYear}`,
    `Odd Semester (July-Dec) ${currentYear}`,
    `Even Semester (Jan-May) ${currentYear + 1}`,
    `Odd Semester (July-Dec) ${currentYear + 1}`,
  ];

  const fetchDashboardData = () => {
    fetch(
      "[https://RudrakshDubey.pythonanywhere.com](https://RudrakshDubey.pythonanywhere.com)/api/dashboard",
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setUserName(data.name);

        // Fix: Pull active_semester directly from backend injection
        if (data.active_semester) {
          setSemester(data.active_semester);
        }

        if (data.weekly_data) setWeeklyData(data.weekly_data);
        if (data.total_week_hours !== undefined)
          setTotalStudyHours(data.total_week_hours);

        // Fix: Truncate schedule to top 3 items
        if (data.schedule) setSchedule(data.schedule.slice(0, 4));

        if (data.notifications) {
          setNotifications(data.notifications);
          const currentSignature = data.notifications
            .map((n) => n.title)
            .join("|");
          const savedSignature = sessionStorage.getItem("seenNotifs");

          if (
            data.notifications.length > 0 &&
            currentSignature !== savedSignature
          ) {
            setHasUnread(true);
          } else if (data.notifications.length === 0) {
            setHasUnread(false);
          }
        }
      })
      .catch(console.error);

    fetch(
      "[https://RudrakshDubey.pythonanywhere.com](https://RudrakshDubey.pythonanywhere.com)/api/exams",
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.upcomingExams) {
          const formattedExams = data.upcomingExams.map((exam, idx) => {
            const [month, day] = exam.date.split("-").slice(1, 3);
            const themeColors = [
              { color: "text-purple-400", bg: "bg-purple-500/20" },
              { color: "text-blue-400", bg: "bg-blue-500/20" },
              { color: "text-green-400", bg: "bg-green-500/20" },
              { color: "text-orange-400", bg: "bg-orange-500/20" },
            ];
            const theme = themeColors[idx % themeColors.length];
            const daysLeft = Math.ceil(
              (new Date(exam.date) - new Date()) / (1000 * 60 * 60 * 24),
            );
            return {
              month: new Date(exam.date)
                .toLocaleString("default", { month: "short" })
                .toUpperCase(),
              day,
              title: exam.subject,
              time: `${daysLeft} Days Left`,
              color: theme.color,
              bg: theme.bg,
            };
          });

          // Fix: Truncate upcoming exams to top 3 items
          setUpcomingExams(formattedExams.slice(0, 3));
        }
      })
      .catch(console.error);

    fetch(
      "[https://RudrakshDubey.pythonanywhere.com](https://RudrakshDubey.pythonanywhere.com)/api/progress",
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setUserLevel(data.stats.level);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && hasUnread) {
      setHasUnread(false);
      const currentSignature = notifications.map((n) => n.title).join("|");
      sessionStorage.setItem("seenNotifs", currentSignature);
    }
  };

  const handleSemesterChange = async (newSem) => {
    if (
      !window.confirm(
        `Changing your semester will switch your active workspace and hide data from the current term. Are you sure you want to proceed to ${newSem}?`,
      )
    )
      return;

    setSemester(newSem);
    setShowSemesterDropdown(false);
    try {
      const res = await fetch(
        "[https://RudrakshDubey.pythonanywhere.com](https://RudrakshDubey.pythonanywhere.com)/api/settings",
      );
      const data = await res.json();
      if (data.success) {
        const updatedSettings = { ...data.settings, semester: newSem };
        await fetch(
          "[https://RudrakshDubey.pythonanywhere.com](https://RudrakshDubey.pythonanywhere.com)/api/settings",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedSettings),
          },
        );
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to update semester", e);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const currentSessionHours =
    isActive || isPaused ? (totalTimeSeconds - timeLeft) / 3600 : 0;
  const liveDisplayHours = totalStudyHours + currentSessionHours;

  const formatTotalHours = (decimalHours) => {
    if (!decimalHours || decimalHours === 0) return "0m";
    const totalMinutes = Math.round(decimalHours * 60);
    if (totalMinutes === 0) return "<1m";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const circleDashoffset =
    totalTimeSeconds > 0 ? (440 * timeLeft) / totalTimeSeconds : 440;

  return (
    <main className="flex-1 p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full relative">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here's what's happening with your semester.
          </p>
        </div>
        <div className="flex items-center gap-4 relative">
          <button
            onClick={toggleNotifications}
            className="relative w-10 h-10 rounded-full bg-[#1A1F2C] flex items-center justify-center border border-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
            {hasUnread && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-[#FF75C3] rounded-full ring-2 ring-[#1A1D2D]"></span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A1F2C] border border-white/5 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              {semester} <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showSemesterDropdown && (
              <div className="absolute top-12 right-0 w-64 bg-[#25283B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-white/5 font-bold text-xs text-slate-400 uppercase tracking-wider">
                  Select Semester
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {indianSemesters.map((sem) => (
                    <button
                      key={sem}
                      onClick={() => handleSemesterChange(sem)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5 ${semester === sem ? "text-[#6C5DD3] font-bold bg-[#6C5DD3]/10" : "text-slate-300"}`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showNotifications && (
            <div className="absolute top-14 right-0 w-80 bg-[#25283B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-white/5 font-bold text-white flex justify-between items-center">
                Notifications
                <span className="text-xs bg-[#6C5DD3] px-2 py-0.5 rounded text-white">
                  {notifications.length} Active
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div
                      key={i}
                      className="p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-default"
                    >
                      <p
                        className={`text-xs font-bold mb-1 ${n.type === "urgent" ? "text-[#FF75C3]" : n.type === "warning" ? "text-orange-400" : "text-[#6C5DD3]"}`}
                      >
                        {n.title}
                      </p>
                      <p className="text-sm text-slate-300">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    You are all caught up!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={Calendar}
          title="Activities"
          value={schedule.length}
          subtitle="Today"
          color="text-purple-400"
          iconBg="bg-purple-500/20"
        />
        <StatCard
          icon={CheckCircle2}
          title="Exams"
          value={upcomingExams.length}
          subtitle="Pending"
          color="text-blue-400"
          iconBg="bg-blue-500/20"
        />
        <StatCard
          icon={Clock}
          title="Study Hours"
          value={formatTotalHours(liveDisplayHours)}
          subtitle="This Week"
          color="text-green-400"
          iconBg="bg-green-500/20"
        />
        <div className="bg-[#1A1F2C] p-6 rounded-2xl flex flex-col justify-between border border-white/5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-orange-500/20">
            <Target className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Rank Level
            </p>
            <h3 className="text-3xl font-bold text-white mb-1">{userLevel}</h3>
            <p className="text-slate-500 text-xs">Keep learning!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1A1F2C] rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-6">
              Today's Schedule
            </h2>
            <div className="relative border-l-2 border-slate-700/50 ml-3 space-y-8">
              {schedule.length > 0 ? (
                schedule.map((item, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div
                      className={`absolute -left-1.25 top-1.5 w-2 h-2 rounded-full ${item.color} ring-4 ring-[#1A1F2C]`}
                    ></div>
                    <div className="flex gap-4">
                      <span className="text-sm font-medium text-slate-400 w-16 shrink-0">
                        {item.time}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.room}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No classes scheduled today.
                </p>
              )}
            </div>
          </div>
          <div>
            {/* Fix: Click routes to Calendar */}
            <Link to={"/Calendar"}>
              <button className="w-full mt-8 py-3 rounded-xl bg-white/5 text-sm font-medium text-purple-400 hover:bg-white/10 transition-colors">
                View Full Calendar
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-[#1A1F2C] rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-6">
              Upcoming Exams
            </h2>
            <div className="space-y-4">
              {upcomingExams.length > 0 ? (
                upcomingExams.map((exam, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-2">
                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${exam.bg}`}
                    >
                      <span className={`text-[10px] font-bold ${exam.color}`}>
                        {exam.month}
                      </span>
                      <span
                        className={`text-xl font-bold ${exam.color} leading-none`}
                      >
                        {exam.day}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-200">
                        {exam.title}
                      </h4>
                      <p className={`text-xs mt-0.5 ${exam.color}`}>
                        {exam.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No upcoming exams.</p>
              )}
            </div>
          </div>
          <div>
            {/* Fix: Click routes to Exams */}
            <Link to={"/Exams"}>
              <button className="w-full mt-8 py-3 rounded-xl bg-white/5 text-sm font-medium text-purple-400 hover:bg-white/10 transition-colors">
                View All Exams
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-6">
        <div className="bg-[#1A1F2C] rounded-3xl p-6 border border-white/5 relative">
          <h2 className="text-lg font-semibold text-white mb-2">
            Weekly Study Progress
          </h2>
          <WeeklyChart weeklyData={weeklyData} />
        </div>

        <div className="bg-[#1A1F2C] rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-between">
          <div className="w-full flex justify-between items-start mb-2">
            <h2 className="text-lg font-semibold text-white">Focus Timer</h2>
            {!isActive && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold mb-1 tracking-wider">
                    HRS
                  </span>
                  <div className="flex items-center bg-[#25283B] rounded-lg border border-white/10 overflow-hidden shadow-inner">
                    <button
                      onClick={() => setInputHours(Math.max(0, inputHours - 1))}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-white select-none">
                      {inputHours}
                    </span>
                    <button
                      onClick={() =>
                        setInputHours(Math.min(24, inputHours + 1))
                      }
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold mb-1 tracking-wider">
                    MIN
                  </span>
                  <div className="flex items-center bg-[#25283B] rounded-lg border border-white/10 overflow-hidden shadow-inner">
                    <button
                      onClick={() =>
                        setInputMinutes(Math.max(0, inputMinutes - 1))
                      }
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-white select-none">
                      {inputMinutes}
                    </span>
                    <button
                      onClick={() =>
                        setInputMinutes(Math.min(59, inputMinutes + 1))
                      }
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center my-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-linear"
                strokeWidth="8"
                fill="none"
                strokeDasharray="440"
                strokeDashoffset={circleDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center mt-2">
              <span className="text-3xl font-bold text-white tracking-wider">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                {isActive ? (isPaused ? "Paused" : "Focusing") : "Ready"}
              </span>
            </div>
          </div>

          <div className="flex gap-3 w-full mt-2">
            {!isActive ? (
              <button
                onClick={handleStart}
                disabled={timeLeft <= 0}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white flex justify-center items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" /> Start
              </button>
            ) : (
              <>
                <button
                  onClick={isPaused ? handleResume : handlePause}
                  className="flex-1 py-3 rounded-xl bg-[#25283B] hover:bg-[#32364E] text-white flex justify-center items-center gap-2 transition-colors border border-white/5"
                >
                  {isPaused ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 flex justify-center items-center gap-2 transition-colors border border-red-500/20"
                >
                  <Square className="w-4 h-4" /> Stop
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
