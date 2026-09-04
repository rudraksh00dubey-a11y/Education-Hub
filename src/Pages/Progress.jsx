import { useState, useEffect } from "react";
import {
  TrendingUp,
  Flame,
  Target,
  Award,
  Milestone,
  CheckCircle2,
  CircleDashed,
  BrainCircuit,
  Activity,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line, Radar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
);

/* ==========================================================================
   STATIC FALLBACK DATA
   ========================================================================== */
const userStats = {
  level: 24,
  currentXP: 8450,
  requiredXP: 10000,
  streak: 14,
  consistencyScore: 92,
};

const trajectoryData = {
  labels: [
    "Week 1",
    "Week 2",
    "Week 3",
    "Week 4",
    "Week 5",
    "Week 6 (Now)",
    "Week 7",
    "Week 8",
  ],
  historical: [72, 75, 74, 82, 85, 88, null, null],
  projected: [null, null, null, null, null, 88, 92, 95],
};

const extracurricularData = {
  labels: ["Hackathons", "Robotics Club", "Sports", "Volunteering"],
  hours: [12, 8, 5, 3],
};

const defaultMilestones = [
  { id: 1, title: "Take First Quiz", date: "Pending", status: "upcoming" },
  { id: 2, title: "Complete 5 Quizzes", date: "Pending", status: "upcoming" },
  { id: 3, title: "Score 100% on a Quiz", date: "Pending", status: "upcoming" },
  {
    id: 4,
    title: "Target: 3.8 GPA",
    date: "End of Semester",
    status: "upcoming",
  },
];

const weeklyConsistency = [
  { day: "M", status: "done" },
  { day: "T", status: "done" },
  { day: "W", status: "done" },
  { day: "T", status: "missed" },
  { day: "F", status: "done" },
  { day: "S", status: "done" },
  { day: "S", status: "pending" },
];

/* ==========================================================================
   CHART COMPONENTS
   ========================================================================== */
const TrajectoryChart = () => {
  const data = {
    labels: trajectoryData.labels,
    datasets: [
      {
        label: "Past Performance",
        data: trajectoryData.historical,
        borderColor: "#6C5DD3",
        backgroundColor: "rgba(108, 93, 211, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#1A1D2D",
        pointBorderColor: "#6C5DD3",
        pointRadius: 4,
        fill: true,
        tension: 0.4,
      },
      {
        label: "Projected Trajectory",
        data: trajectoryData.projected,
        borderColor: "#FF75C3",
        borderWidth: 3,
        borderDash: [5, 5],
        pointBackgroundColor: "#1A1D2D",
        pointBorderColor: "#FF75C3",
        pointRadius: 4,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 60,
        max: 100,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#64748b" },
      },
      x: { grid: { display: false }, ticks: { color: "#64748b" } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0B0F19",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 12,
      },
    },
  };

  return (
    <div className="h-64 w-full mt-4">
      <Line data={data} options={options} />
    </div>
  );
};

const SubjectMasteryChart = ({ labels, masteryData }) => {
  const data = {
    labels: labels.length ? labels : ["No Data Yet"],
    datasets: [
      {
        label: "Notes Completion",
        data: labels.map(() => 85),
        backgroundColor: "rgba(34, 211, 238, 0.2)",
        borderColor: "rgba(34, 211, 238, 1)",
        pointBackgroundColor: "rgba(34, 211, 238, 1)",
        pointBorderColor: "#fff",
        borderWidth: 2,
      },
      {
        label: "Subject Mastery (Quiz %)",
        data: masteryData.length ? masteryData : [0],
        backgroundColor: "rgba(255, 117, 195, 0.2)",
        borderColor: "rgba(255, 117, 195, 1)",
        pointBackgroundColor: "rgba(255, 117, 195, 1)",
        pointBorderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: "rgba(255, 255, 255, 0.1)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        pointLabels: {
          color: "#cbd5e1",
          font: { family: "sans-serif", size: 10 },
        },
        ticks: { display: false, min: 0, max: 100 },
      },
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#cbd5e1",
          font: { size: 10 },
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: "#0B0F19",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="h-64 w-full mt-4">
      <Radar data={data} options={options} />
    </div>
  );
};

const ExtracurricularChart = () => {
  const data = {
    labels: extracurricularData.labels,
    datasets: [
      {
        data: extracurricularData.hours,
        backgroundColor: ["#6C5DD3", "#22D3EE", "#FF75C3", "#FB923C"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#cbd5e1",
          font: { size: 11 },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "#0B0F19",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="h-64 w-full mt-4 relative">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
        <span className="text-2xl font-bold text-white">28</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          Hrs / Week
        </span>
      </div>
    </div>
  );
};

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export const ProgressPage = () => {
  const [radarLabels, setRadarLabels] = useState([]);
  const [radarMastery, setRadarMastery] = useState([]);
  const [milestones, setMilestones] = useState(defaultMilestones);

  const xpPercentage = (userStats.currentXP / userStats.requiredXP) * 100;

  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.progress) {
          // 1. Map dynamic database data to Radar Chart[cite: 16]
          const subjectTotals = {};
          let perfectScoreAchieved = false;

          data.progress.forEach((p) => {
            if (!subjectTotals[p.subject]) {
              subjectTotals[p.subject] = { score: 0, total: 0 };
            }
            subjectTotals[p.subject].score += p.score;
            subjectTotals[p.subject].total += p.total;
            if (p.score === p.total && p.total > 0) perfectScoreAchieved = true;
          });

          const labels = Object.keys(subjectTotals);
          const mastery = labels.map((l) =>
            Math.round((subjectTotals[l].score / subjectTotals[l].total) * 100),
          );

          setRadarLabels(labels);
          setRadarMastery(mastery);

          // 2. Unlock milestones dynamically based on DB rows[cite: 16]
          const quizCount = data.progress.length;
          const updatedMilestones = [...defaultMilestones];

          if (quizCount >= 1) {
            updatedMilestones[0].status = "completed";
            updatedMilestones[0].date = "Recently";
            updatedMilestones[1].status = "current";
          }
          if (quizCount >= 5) {
            updatedMilestones[1].status = "completed";
            updatedMilestones[1].date = "Recently";
          }
          if (perfectScoreAchieved) {
            updatedMilestones[2].status = "completed";
            updatedMilestones[2].date = "Recently";
          }

          setMilestones(updatedMilestones);
        }
      })
      .catch((err) =>
        console.error("Failed to fetch progress from backend", err),
      );
  }, []);

  return (
    <div
      className="
      flex-1 h-full bg-[#1A1D2D] text-white font-sans p-8 overflow-y-auto
      [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full
      hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50 transition-colors
    "
    >
      <div className="w-full max-w-7xl mx-auto pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Progress & Trajectory
          </h1>
          <p className="text-slate-400 text-sm">
            Analyze your consistency, track milestones, and forecast future
            growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2 bg-[#25283B] p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-linear-to-br from-[#6C5DD3] to-purple-800 rounded-xl flex items-center justify-center border border-[#6C5DD3]/50 shadow-[0_0_15px_rgba(108,93,211,0.3)]">
                  <span className="text-xl font-black text-white">
                    {userStats.level}
                  </span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">
                    Current Level
                  </p>
                  <h3 className="text-xl font-bold text-white">
                    Academic Scholar
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">
                  {userStats.currentXP.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">
                  {" "}
                  / {userStats.requiredXP.toLocaleString()} XP
                </span>
              </div>
            </div>
            <div className="w-full bg-[#1A1D2D] rounded-full h-3 border border-white/5 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-cyan-400 to-[#6C5DD3] rounded-full relative"
                style={{ width: `${xpPercentage}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/20 animate-pulse rounded-full blur-[2px]"></div>
              </div>
            </div>
          </div>

          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <Flame className="w-10 h-10 text-orange-400 mb-2 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
            <h2 className="text-4xl font-black text-white leading-none">
              {userStats.streak}
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Day Learning Streak
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-[#25283B] p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#FF75C3]" /> Trajectory
                Forecast
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 bg-[#FF75C3]/10 text-[#FF75C3] rounded-md border border-[#FF75C3]/20">
                +12% Projected Growth
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Based on your current learning velocity and consistency.
            </p>
            <TrajectoryChart />
          </div>

          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5 flex flex-col">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" /> Consistency Target
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Hit your daily goals to maintain your score.
            </p>
            <div className="flex-1 flex flex-col justify-center items-center mb-6">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    className="stroke-[#1A1D2D]"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    className="stroke-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray="351"
                    strokeDashoffset={
                      351 - (351 * userStats.consistencyScore) / 100
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-white">
                    {userStats.consistencyScore}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2 mt-auto">
              {weeklyConsistency.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${item.status === "done" ? "bg-cyan-400/20 border-cyan-400 text-cyan-400" : item.status === "missed" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-[#1A1D2D] border-white/5 text-slate-500"}`}
                  >
                    {item.status === "done" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : item.status === "missed" ? (
                      <span className="text-xs">✕</span>
                    ) : (
                      <CircleDashed className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-cyan-400" /> Subject Mastery
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Based on actual quiz scores.
            </p>
            <SubjectMasteryChart
              labels={radarLabels}
              masteryData={radarMastery}
            />
          </div>

          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" /> Extracurriculars
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Weekly time distribution.
            </p>
            <ExtracurricularChart />
          </div>

          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Milestone className="w-5 h-5 text-orange-400" /> Milestones
            </h3>

            <div className="relative border-l-2 border-[#1A1D2D] ml-4 space-y-8 mt-4">
              {milestones.map((step) => (
                <div key={step.id} className="relative pl-8">
                  <div
                    className={`absolute -left-4.25 top-0 w-8 h-8 rounded-full border-4 border-[#25283B] flex items-center justify-center ${step.status === "completed" ? "bg-[#6C5DD3] text-white" : step.status === "current" ? "bg-[#FF75C3] text-white shadow-[0_0_15px_rgba(255,117,195,0.5)]" : "bg-[#1A1D2D] text-slate-500 border-white/10"}`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : step.status === "current" ? (
                      <Award className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{step.id}</span>
                    )}
                  </div>
                  <div>
                    <h4
                      className={`text-base font-bold line-clamp-1 ${step.status === "upcoming" ? "text-slate-400" : "text-white"}`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {step.date}
                    </p>
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
