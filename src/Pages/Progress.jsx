import { useState, useEffect } from "react";
import {
  TrendingUp,
  Flame,
  Target,
  Award,
  Milestone,
  CheckCircle2,
  BrainCircuit,
  Activity,
  Edit2,
  Save,
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

const TrajectoryChart = ({ labels, scores }) => {
  const data = {
    labels: labels.length ? labels : ["No Quizzes Yet"],
    datasets: [
      {
        label: "Quiz Scores",
        data: scores.length ? scores : [0],
        borderColor: "#6C5DD3",
        backgroundColor: "rgba(108, 93, 211, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#1A1D2D",
        pointBorderColor: "#6C5DD3",
        pointRadius: 4,
        fill: true,
        tension: 0.4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
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

const SubjectMasteryChart = ({ labels, scores }) => {
  const data = {
    labels: labels.length ? labels : ["No Data"],
    datasets: [
      {
        label: "Combined Mastery %",
        data: scores.length ? scores : [0],
        backgroundColor: "rgba(34, 211, 238, 0.2)",
        borderColor: "rgba(34, 211, 238, 1)",
        pointBackgroundColor: "rgba(34, 211, 238, 1)",
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

const ExtracurricularChart = ({ labels, hours }) => {
  const safeLabels = labels.length ? labels : ["No Events Scheduled"];
  const safeHours = hours.length ? hours : [1];
  const totalHours = hours.length ? hours.reduce((a, b) => a + b, 0) : 0;

  const data = {
    labels: safeLabels,
    datasets: [
      {
        data: safeHours,
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
        <span className="text-2xl font-bold text-white">{totalHours}</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          Total Logs
        </span>
      </div>
    </div>
  );
};

export const ProgressPage = () => {
  const [data, setData] = useState({
    stats: {
      level: 1,
      currentXP: 0,
      requiredXP: 500,
      streak: 0,
      dailyGoal: 2.0,
    },
    trajectory: { labels: [], scores: [] },
    mastery: { labels: [], scores: [] },
    extracurriculars: { labels: [], hours: [] },
  });

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(2.0);
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(0);

  const loadProgress = () => {
    fetch("https://RudrakshDubey.pythonanywhere.com/api/progress")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setGoalInput(json.stats.dailyGoal);
      });

    // Fetch dashboard to calculate consistency against goal
    fetch("https://RudrakshDubey.pythonanywhere.com/api/dashboard")
      .then((res) => res.json())
      .then((dash) => setWeeklyStudyHours(dash.total_week_hours || 0));
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleUpdateGoal = () => {
    fetch("https://RudrakshDubey.pythonanywhere.com/api/progress/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: goalInput }),
    }).then(() => {
      setIsEditingGoal(false);
      loadProgress();
    });
  };

  const xpPercentage = Math.min(
    100,
    (data.stats.currentXP / data.stats.requiredXP) * 100,
  );
  const consistencyScore =
    Math.min(
      100,
      Math.round((weeklyStudyHours / (data.stats.dailyGoal * 7)) * 100),
    ) || 0;

  const dynamicMilestones = [
    { id: 1, title: `Reach Level ${data.stats.level + 1}`, status: "current" },
    {
      id: 2,
      title: `Accumulate ${data.stats.level * 500 + 500} Total XP`,
      status: "upcoming",
    },
    {
      id: 3,
      title: "Maintain a 7-Day Streak",
      status: data.stats.streak >= 7 ? "completed" : "upcoming",
    },
  ];

  return (
    <div className="flex-1 h-full bg-[#1A1D2D] text-white font-sans p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50">
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
                    {data.stats.level}
                  </span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">
                    Current Level
                  </p>
                  <h3 className="text-xl font-bold text-white">Scholar Rank</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">
                  {data.stats.currentXP.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">
                  {" "}
                  / {data.stats.requiredXP.toLocaleString()} XP
                </span>
              </div>
            </div>
            <div className="w-full bg-[#1A1D2D] rounded-full h-3 border border-white/5 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-cyan-400 to-[#6C5DD3] rounded-full relative transition-all duration-1000"
                style={{ width: `${xpPercentage}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/20 animate-pulse rounded-full blur-[2px]"></div>
              </div>
            </div>
          </div>

          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <Flame
              className={`w-10 h-10 mb-2 ${data.stats.streak > 0 ? "text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" : "text-slate-600"}`}
            />
            <h2 className="text-4xl font-black text-white leading-none">
              {data.stats.streak}
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Day Login Streak
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-[#25283B] p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF75C3]" /> Quiz Trajectory
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Historical score mapping across all engineering subjects.
            </p>
            <TrajectoryChart
              labels={data.trajectory.labels}
              scores={data.trajectory.scores}
            />
          </div>

          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" /> Goal Targeting
              </h3>
              {isEditingGoal ? (
                <button
                  onClick={handleUpdateGoal}
                  className="text-green-400 hover:bg-green-400/10 p-1 rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingGoal(true)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditingGoal ? (
              <div className="flex items-center gap-2 mb-6">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={goalInput}
                  onChange={(e) => setGoalInput(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-[#1A1D2D] border border-white/10 rounded text-sm text-center focus:outline-none focus:border-cyan-400"
                />
                <span className="text-xs text-slate-400">Hours / Day</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-6">
                Hit{" "}
                <strong className="text-white">
                  {data.stats.dailyGoal} hours/day
                </strong>{" "}
                to maintain consistency.
              </p>
            )}

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
                    className="stroke-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all duration-1000"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray="351"
                    strokeDashoffset={351 - (351 * consistencyScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-white">
                    {consistencyScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-cyan-400" /> Subject Mastery
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Aggregated weights from Quizzes, Notes, & Resources.
            </p>
            <SubjectMasteryChart
              labels={data.mastery.labels}
              scores={data.mastery.scores}
            />
          </div>

          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" /> Extracurriculars
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Events logged via Calendar tracking.
            </p>
            <ExtracurricularChart
              labels={data.extracurriculars.labels}
              hours={data.extracurriculars.hours}
            />
          </div>

          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Milestone className="w-5 h-5 text-orange-400" /> Dynamic
              Milestones
            </h3>
            <div className="relative border-l-2 border-[#1A1D2D] ml-4 space-y-8 mt-4">
              {dynamicMilestones.map((step) => (
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
