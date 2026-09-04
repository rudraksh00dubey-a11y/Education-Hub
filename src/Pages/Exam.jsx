import { useState, useEffect } from "react";
import {
  Target,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
} from "lucide-react";

/* ==========================================================================
   FALLBACK DATA
   ========================================================================== */
const defaultGpaData = {
  currentGPA: 3.42,
  targetGPA: 3.8,
  creditsCompleted: 45,
  creditsThisSemester: 15,
};

export const ExamPage = () => {
  const [gpaData, setGpaData] = useState(defaultGpaData);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [completedExams, setCompletedExams] = useState([]);

  // Fetch data from backend on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.gpaData) setGpaData(data.gpaData);
        if (data.upcomingExams) setUpcomingExams(data.upcomingExams);

        // Map the backend columns to the properties expected by the completed exams UI
        if (data.completedExams) {
          const mappedCompleted = data.completedExams.map((exam) => ({
            id: exam.id,
            subject: exam.subject,
            credits: exam.credits,
            score: exam.requiredScore, // Using requiredScore as the final score for completed items
            grade: exam.gradeNeeded, // Using gradeNeeded as the final grade achieved
          }));
          setCompletedExams(mappedCompleted);
        }
      })
      .catch((err) => console.error("Failed to load exams", err));
  }, []);

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
      <div className="w-full max-w-7xl ">
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Exams & Targets</h1>
            <p className="text-slate-400 text-xs">
              Track your deadlines and required scores to hit your GPA goal.
            </p>
          </div>
          <button className="px-5 py-2.5 bg-[#6C5DD3] rounded-xl font-semibold flex items-center gap-2 hover:bg-[#5a4db8] transition-colors shadow-[0_0_20px_rgba(108,93,211,0.3)]">
            <Calendar className="w-4 h-4" />
            Add Exam
          </button>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6 ">
          {/* Current GPA */}
          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Award className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">
                Current GPA
              </p>
              <h2 className="text-3xl font-bold text-white leading-none">
                {gpaData.currentGPA.toFixed(2)}
              </h2>
            </div>
          </div>

          {/* Target GPA */}
          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5 flex items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF75C3]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="w-12 h-12 rounded-full bg-[#FF75C3]/20 flex items-center justify-center border border-[#FF75C3]/30">
              <Target className="w-6 h-6 text-[#FF75C3]" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">
                Target GPA
              </p>
              <h2 className="text-3xl font-bold text-white leading-none">
                {gpaData.targetGPA.toFixed(2)}
              </h2>
            </div>
          </div>

          {/* Required Average */}
          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-[#6C5DD3]/20 flex items-center justify-center border border-[#6C5DD3]/30">
              <TrendingUp className="w-6 h-6 text-[#6C5DD3]" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">
                Required Avg. Score
              </p>
              <div className="flex items-end gap-2">
                <h2 className="text-3xl font-bold text-white leading-none">
                  88.5<span className="text-xl">%</span>
                </h2>
                <span className="text-sm font-semibold text-green-400 mb-0.5">
                  Maintainable
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Upcoming Exams */}
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#6C5DD3]" />
              Upcoming Deadlines & Targets
            </h3>

            <div className="space-y-4">
              {upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className={`
                    bg-[#25283B] rounded-2xl p-5 border flex items-center justify-between transition-transform hover:-translate-y-1
                    ${exam.status === "urgent" ? "border-[#FF75C3]/30 shadow-[0_0_15px_rgba(255,117,195,0.1)]" : "border-white/5"}
                  `}
                >
                  {/* Left: Date & Status */}
                  <div className="flex items-center gap-5 w-1/3">
                    <div
                      className={`
                      flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0
                      ${exam.status === "urgent" ? "bg-[#FF75C3]/20 text-[#FF75C3]" : "bg-[#1A1D2D] text-slate-300"}
                    `}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {exam.date.split(" ")[0]}
                      </span>
                      <span className="text-xl font-black leading-none">
                        {exam.date.split(" ")[1]}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-[15px] line-clamp-1">
                        {exam.subject}
                      </h4>
                      <p
                        className={`text-xs mt-1 font-medium ${exam.status === "urgent" ? "text-[#FF75C3]" : "text-slate-400"}`}
                      >
                        {exam.daysLeft} days left • {exam.credits} Credits
                      </p>
                    </div>
                  </div>

                  {/* Right: Required Score Visualizer */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">
                        Required to hit Target
                      </p>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-2xl font-bold text-white">
                          {exam.requiredScore}%
                        </span>
                        <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded text-slate-200">
                          Grade: {exam.gradeNeeded}
                        </span>
                      </div>
                    </div>

                    {/* Circular Progress Indicator for Required Score */}
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          className="stroke-[#1A1D2D]"
                          strokeWidth="4"
                          fill="none"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          className={`stroke-current ${exam.requiredScore >= 90 ? "text-[#FF75C3]" : "text-[#6C5DD3]"}`}
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="125"
                          strokeDashoffset={
                            125 - (125 * exam.requiredScore) / 100
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Insights & Completed */}
          <div className="w-full lg:w-87.5 flex flex-col gap-6">
            {/* Target Analyzer Card */}
            <div className="bg-[#25283B] rounded-2xl p-4 border border-white/5">
              <h3 className="text-base font-bold mb-4 text-white border-b border-white/10 pb-3">
                Target Analyzer
              </h3>

              <div className="flex items-start gap-3 ">
                <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  To raise your GPA from{" "}
                  <strong className="text-white">
                    {gpaData.currentGPA.toFixed(2)}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-white">
                    {gpaData.targetGPA.toFixed(2)}
                  </strong>{" "}
                  this semester, you must score an average of{" "}
                  <strong className="text-[#FF75C3]">88.5%</strong> across all
                  remaining exams.
                </p>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Margin of Error</span>
                  <span className="text-white font-mono">± 2.4%</span>
                </div>
                <div className="w-full bg-[#1A1D2D] rounded-full h-1.5">
                  <div className="bg-orange-400 h-1.5 rounded-full w-[15%]"></div>
                </div>
                <p className="text-[10px] text-slate-500 text-right">
                  Very little room for mistakes.
                </p>
              </div>
            </div>

            {/* Completed Exams */}
            <div className="bg-[#25283B] rounded-2xl p-4 border border-white/5 flex-1">
              <h3 className="text-base font-bold mb-4 text-white border-b border-white/10 pb-3 flex justify-between items-center">
                Completed
                <span className="text-xs font-normal text-slate-400 bg-white/5 px-2 py-1 rounded">
                  This Term
                </span>
              </h3>

              <div className="space-y-4">
                {completedExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex justify-between items-center bg-[#1A1D2D] p-3 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">
                          {exam.subject}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {exam.credits} Credits
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">
                        {exam.score}%
                      </span>
                      <span className="text-[10px] ml-2 text-green-400 font-bold">
                        {exam.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
