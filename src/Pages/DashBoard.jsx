import { useState, useEffect } from "react";
import {
  Bell,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
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

const scheduleData = [
  {
    time: "09:00 AM",
    title: "Data Structures",
    room: "Room 301",
    color: "bg-purple-500",
  },
  {
    time: "11:00 AM",
    title: "Operating Systems",
    room: "Room 204",
    color: "bg-blue-500",
  },
  {
    time: "02:00 PM",
    title: "Database Management",
    room: "Room 105",
    color: "bg-green-500",
  },
  {
    time: "04:00 PM",
    title: "Machine Learning",
    room: "Lab 1",
    color: "bg-purple-500",
  },
];

const fallbackExams = [
  {
    month: "MAY",
    day: "15",
    title: "Data Structures",
    time: "2 Days Left",
    color: "text-purple-400",
    bg: "bg-purple-500/20",
  },
  {
    month: "MAY",
    day: "20",
    title: "Operating Systems",
    time: "7 Days Left",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
  },
];

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

const WeeklyChart = () => {
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [6, 8, 10, 8, 6, 3, 0],
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
        max: 12,
        ticks: { color: "#64748b", stepSize: 4, font: { size: 10 } },
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
      tooltip: { backgroundColor: "#0f172a", padding: 10, cornerRadius: 8 },
    },
  };

  return (
    <div className="h-48 w-full mt-4">
      <Bar data={data} options={options} />
    </div>
  );
};

export const DashboardPage = () => {
  const [userName, setUserName] = useState("Student");
  const [upcomingExams, setUpcomingExams] = useState(fallbackExams);

  useEffect(() => {
    // 1. Fetch User Data
    fetch("http://localhost:5000/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setUserName(data.name);
      })
      .catch((err) => console.error("Failed to fetch dashboard user", err));

    // 2. Fetch Exam Data
    fetch("http://localhost:5000/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.upcomingExams) {
          const formattedExams = data.upcomingExams.map((exam, idx) => {
            const [month, day] = exam.date.split(" ");
            const themeColors = [
              { color: "text-purple-400", bg: "bg-purple-500/20" },
              { color: "text-blue-400", bg: "bg-blue-500/20" },
              { color: "text-green-400", bg: "bg-green-500/20" },
              { color: "text-orange-400", bg: "bg-orange-500/20" },
            ];
            const theme = themeColors[idx % themeColors.length];

            return {
              month: month.toUpperCase(),
              day: day,
              title: exam.subject,
              time: `${exam.daysLeft} Days Left`,
              color: theme.color,
              bg: theme.bg,
            };
          });
          setUpcomingExams(formattedExams);
        }
      })
      .catch((err) => console.error("Failed to fetch exams", err));
  }, []);

  return (
    <main
      className="flex-1 p-8 overflow-y-auto
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:bg-transparent
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-slate-700/50
  [&::-webkit-scrollbar-thumb]:rounded-full
  hover:[&::-webkit-scrollbar-thumb]:bg-purple-600/50
  transition-colors
    "
    >
      {/* Top Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Welcome back, {userName}! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here's what's happening with your semester.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-[#1A1F2C] flex items-center justify-center border border-white/5 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A1F2C] border border-white/5 text-sm font-medium hover:bg-white/5 transition-colors">
            Spring 2024
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </header>

      {/* 4-Column Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={Calendar}
          title="Classes"
          value="5"
          subtitle="This Week"
          color="text-purple-400"
          iconBg="bg-purple-500/20"
        />
        <StatCard
          icon={CheckCircle2}
          title="Tasks"
          value="12"
          subtitle="Pending"
          color="text-blue-400"
          iconBg="bg-blue-500/20"
        />
        <StatCard
          icon={Clock}
          title="Study Hours"
          value="24h"
          subtitle="This Week"
          color="text-green-400"
          iconBg="bg-green-500/20"
        />
        <StatCard
          icon={Target}
          title="Progress"
          value="75%"
          subtitle="Overall"
          color="text-orange-400"
          iconBg="bg-orange-500/20"
        />
      </div>

      {/* Middle Grid: Schedule & Exams */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Today's Schedule Container */}
        <div className="bg-[#1A1F2C] rounded-3xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-6">
            Today's Schedule
          </h2>
          <div className="relative border-l-2 border-slate-700/50 ml-3 space-y-8">
            {scheduleData.map((item, idx) => (
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
                    <p className="text-xs text-slate-500 mt-0.5">{item.room}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl bg-white/5 text-sm font-medium text-purple-400 hover:bg-white/10 transition-colors">
            View Full Calendar
          </button>
        </div>

        {/* Upcoming Exams Container */}
        <div className="bg-[#1A1F2C] rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-6">
              Upcoming Exams
            </h2>
            <div className="space-y-4">
              {upcomingExams.map((exam, idx) => (
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
              ))}
            </div>
          </div>
          <div>
            <button className="w-full mt-8 py-3 rounded-xl bg-white/5 text-sm font-medium text-purple-400 hover:bg-white/10 transition-colors">
              View All Exams
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Chart & Timer */}
      <div className="grid grid-cols-[2fr_1fr] gap-6">
        {/* Weekly Study Progress */}
        <div className="bg-[#1A1F2C] rounded-3xl p-6 border border-white/5 relative">
          <h2 className="text-lg font-semibold text-white mb-2">
            Weekly Study Progress
          </h2>
          <WeeklyChart />

          <div className="absolute bottom-6 left-6 right-6 pt-4 border-t border-white/5 flex gap-3 items-center">
            <span className="text-xl text-purple-500 font-serif leading-none mt-1">
              "
            </span>
            <p className="text-xs text-slate-400">
              Small steps every day lead to big results.
            </p>
            <span className="text-xl text-purple-500 font-serif leading-none mt-1">
              "
            </span>
          </div>
        </div>

        {/* Focus Timer */}
        <div className="bg-[#1A1F2C] rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-between">
          <h2 className="text-lg font-semibold text-white w-full text-left">
            Focus Timer
          </h2>

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
                className="stroke-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                strokeWidth="8"
                fill="none"
                strokeDasharray="440"
                strokeDashoffset="110"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center mt-2">
              <span className="text-3xl font-bold text-white tracking-wider">
                25:00
              </span>
              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                Press start to begin
              </span>
            </div>
          </div>

          <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors shadow-lg shadow-purple-900/40">
            Start Focus Session
          </button>
        </div>
      </div>
    </main>
  );
};
