import { useState, useEffect } from "react";
import {
  Target,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  Plus,
  X,
  Trash2,
} from "lucide-react";

export const ExamPage = () => {
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [completedExams, setCompletedExams] = useState([]);
  const [analysis, setAnalysis] = useState({
    currentGPA: 0,
    targetGPA: 3.8,
    requiredAvgScore: 0,
    marginOfError: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({
    id: "",
    subject: "",
    date: "",
    credits: 3,
    achievedScore: "",
  });

  const loadExams = () => {
    fetch("https://RudrakshDubey.pythonanywhere.com/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.gpaData) setAnalysis(data.gpaData);
        if (data.upcomingExams) setUpcomingExams(data.upcomingExams);
        if (data.completedExams) setCompletedExams(data.completedExams);
      })
      .catch((err) => console.error("Failed to load exams", err));
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleSaveExam = async () => {
    if (!formData.subject || !formData.date) return;
    const method = modalMode === "add" ? "POST" : "PUT";

    try {
      await fetch("https://RudrakshDubey.pythonanywhere.com/api/exams/crud", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setIsModalOpen(false);
      loadExams();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm("Delete this exam record?")) return;
    try {
      await fetch("https://RudrakshDubey.pythonanywhere.com/api/exams/crud", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setIsModalOpen(false);
      loadExams();
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (mode, exam = null) => {
    setModalMode(mode);
    setFormData(
      exam || { id: "", subject: "", date: "", credits: 3, achievedScore: "" },
    );
    setIsModalOpen(true);
  };

  const formatDateForUI = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d)
      ? dateStr
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDaysLeft = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex-1 h-full bg-[#1A1D2D] text-white font-sans p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50">
      <div className="w-full max-w-7xl">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Exams & Targets</h1>
            <p className="text-slate-400 text-xs">
              Track deadlines and dynamically monitor the scores required to hit
              your GPA goal.
            </p>
          </div>
          <button
            onClick={() => openModal("add")}
            className="px-5 py-2.5 bg-[#6C5DD3] rounded-xl font-semibold flex items-center gap-2 hover:bg-[#5a4db8] transition-colors shadow-[0_0_20px_rgba(108,93,211,0.3)]"
          >
            <Plus className="w-4 h-4" /> Add Exam
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-[#25283B] p-6 rounded-2xl border border-white/5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Award className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">
                Current GPA
              </p>
              <h2 className="text-3xl font-bold text-white leading-none">
                {analysis.currentGPA.toFixed(2)}
              </h2>
            </div>
          </div>

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
                {analysis.targetGPA.toFixed(2)}
              </h2>
            </div>
          </div>

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
                  {analysis.requiredAvgScore.toFixed(1)}
                  <span className="text-xl">%</span>
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#6C5DD3]" /> Upcoming Deadlines
            </h3>

            <div className="space-y-4">
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No upcoming exams. You're all caught up!
                </p>
              ) : (
                upcomingExams.map((exam, index) => {
                  const daysLeft = getDaysLeft(exam.date);
                  const isNearest = index === 0;

                  return (
                    <div
                      key={exam.id}
                      className={`
                        bg-[#25283B] rounded-2xl p-5 border flex items-center justify-between transition-transform hover:-translate-y-1 cursor-pointer
                        ${isNearest ? "border-[#FF75C3]/50 shadow-[0_0_15px_rgba(255,117,195,0.15)]" : "border-white/5 hover:border-[#6C5DD3]/30"}
                      `}
                      onClick={() => openModal("edit", exam)}
                    >
                      <div className="flex items-center gap-5 w-1/3">
                        <div
                          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0 ${isNearest ? "bg-[#FF75C3]/20 text-[#FF75C3]" : "bg-[#1A1D2D] text-slate-300"}`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {formatDateForUI(exam.date).split(" ")[0]}
                          </span>
                          <span className="text-xl font-black leading-none">
                            {formatDateForUI(exam.date).split(" ")[1]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-100 text-[15px] line-clamp-1">
                            {exam.subject}
                          </h4>
                          <p
                            className={`text-xs mt-1 font-medium ${isNearest ? "text-[#FF75C3]" : "text-slate-400"}`}
                          >
                            {daysLeft} days left • {exam.credits} Credits
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">
                            Target Score Needed
                          </p>
                          <span className="text-2xl font-bold text-white">
                            {analysis.requiredAvgScore.toFixed(0)}%
                          </span>
                        </div>
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
                              className={`stroke-current ${analysis.requiredAvgScore >= 90 ? "text-[#FF75C3]" : "text-[#6C5DD3]"}`}
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray="125"
                              strokeDashoffset={
                                125 - (125 * analysis.requiredAvgScore) / 100
                              }
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="w-full lg:w-87.5 flex flex-col gap-6">
            <div className="bg-[#25283B] rounded-2xl p-4 border border-white/5">
              <h3 className="text-base font-bold mb-4 text-white border-b border-white/10 pb-3">
                Target Analyzer
              </h3>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  To achieve your GPA goal of{" "}
                  <strong className="text-white">
                    {analysis.targetGPA.toFixed(2)}
                  </strong>{" "}
                  this semester, you must score an average of{" "}
                  <strong className="text-[#FF75C3]">
                    {analysis.requiredAvgScore.toFixed(1)}%
                  </strong>{" "}
                  across all remaining credits.
                </p>
              </div>
              <div className="space-y-3 mt-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Margin of Error</span>
                  <span className="text-white font-mono">
                    ± {analysis.marginOfError.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-[#1A1D2D] rounded-full h-1.5">
                  <div
                    className="bg-orange-400 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, analysis.marginOfError * 5)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 text-right">
                  {analysis.marginOfError < 3
                    ? "Very little room for mistakes."
                    : "You have some breathing room."}
                </p>
              </div>
            </div>

            <div className="bg-[#25283B] rounded-2xl p-4 border border-white/5 flex-1 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50">
              <h3 className="text-base font-bold mb-4 text-white border-b border-white/10 pb-3 flex justify-between items-center">
                Completed
                <span className="text-xs font-normal text-slate-400 bg-white/5 px-2 py-1 rounded">
                  Action Required
                </span>
              </h3>

              <div className="space-y-4">
                {completedExams.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Exams automatically move here once their deadline passes.
                  </p>
                ) : (
                  completedExams.map((exam) => (
                    <div
                      key={exam.id}
                      onClick={() => openModal("grade", exam)}
                      className="flex justify-between items-center bg-[#1A1D2D] p-3 rounded-xl border border-white/5 cursor-pointer hover:border-[#6C5DD3]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          className={`w-4 h-4 ${exam.achievedScore ? "text-green-400" : "text-yellow-500"}`}
                        />
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
                        {exam.achievedScore ? (
                          <span className="text-sm font-bold text-white">
                            {exam.achievedScore}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded font-bold">
                            Add Grade
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#25283B] border border-white/10 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">
              {modalMode === "add"
                ? "Schedule New Exam"
                : modalMode === "edit"
                  ? "Edit Exam Details"
                  : "Log Final Grade"}
            </h2>

            <div className="space-y-4">
              {modalMode !== "grade" && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                      placeholder="e.g. Calculus III"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold mb-1 block">
                      Course Credits
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={formData.credits}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          credits: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                    />
                  </div>
                </>
              )}

              {modalMode === "grade" && (
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">
                    Final Achieved Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 92"
                    value={formData.achievedScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        achievedScore: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                {modalMode !== "add" && (
                  <button
                    onClick={() => handleDeleteExam(formData.id)}
                    className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors border border-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleSaveExam}
                  className="flex-1 py-2.5 bg-[#6C5DD3] hover:bg-[#5a4db8] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {modalMode === "add" ? "Save Exam" : "Update Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
