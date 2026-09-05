import { useState, useEffect } from "react";
import {
  User,
  Book,
  Bell,
  Shield,
  Save,
  Trash,
  Camera,
  ChevronRight,
  UploadCloud,
  Download,
} from "lucide-react";

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);

  // Dynamic Indian Semester Generator based on current date
  const getCurrentSemester = () => {
    const d = new Date();
    const yr = d.getFullYear();
    // Jan (0) to May (4) -> Even Semester
    return d.getMonth() <= 4
      ? `Even Semester (Jan-May) ${yr}`
      : `Odd Semester (July-Dec) ${yr}`;
  };

  const currentYear = new Date().getFullYear();
  const indianSemesters = [
    `Even Semester (Jan-May) ${currentYear}`,
    `Odd Semester (July-Dec) ${currentYear}`,
    `Even Semester (Jan-May) ${currentYear + 1}`,
    `Odd Semester (July-Dec) ${currentYear + 1}`,
  ];

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    university: "",
    major: "",
    targetGpa: "",
    semester: getCurrentSemester(),
    strictMode: false,
    avatar: "",
    notif_deadlines: true,
    notif_attendance: true,
    notif_summary: true,
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (
          data.success &&
          data.settings &&
          Object.keys(data.settings).length > 0
        ) {
          setFormData((prev) => ({
            ...prev,
            ...data.settings,
            semester: data.settings.semester || getCurrentSemester(),
          }));
        }
      })
      .catch(console.error);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Strict Warning for Semester Change Workspace Shift
    if (name === "semester" && value !== formData.semester) {
      if (
        !window.confirm(
          "Changing your semester will switch your active workspace and hide data from the current term. Are you sure you want to proceed?",
        )
      ) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    fetch("http://localhost:5000/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(() => setIsSaving(false))
      .catch(() => setIsSaving(false));
  };

  const handleClearData = async () => {
    if (
      !window.confirm(
        "Are you sure you want to completely erase all your data? This action cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch("http://localhost:5000/api/clear-data", {
        method: "POST",
      });
      if (res.ok) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to clear data:", err);
    }
  };

  const processAvatar = (file) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type))
      return alert("Only JPG, PNG, or GIF files are allowed.");
    if (file.size > 800 * 1024) return alert("File exceeds 800KB max size.");

    const reader = new FileReader();
    reader.onload = (e) =>
      setFormData({ ...formData, avatar: e.target.result });
    reader.readAsDataURL(file);
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    processAvatar(e.dataTransfer.files[0]);
  };

  const handleExport = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `academic_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const payload = JSON.parse(event.target.result);
        const res = await fetch("http://localhost:5000/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) window.location.reload();
      } catch (err) {
        alert("Invalid backup file. Import failed.");
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: "profile", label: "Personal Profile", icon: User },
    { id: "academic", label: "Academic Goals", icon: Book },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Data", icon: Shield },
  ];

  return (
    <div className="flex-1 h-full bg-[#1A1D2D] text-white font-sans p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50 transition-colors">
      <div className="w-full max-w-7xl mx-auto pb-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400 text-sm">
              Manage your profile, academic targets, and app preferences.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#6C5DD3] rounded-xl font-semibold flex items-center gap-2 hover:bg-[#5a4db8] transition-colors shadow-[0_0_20px_rgba(108,93,211,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === tab.id ? "bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20" : "bg-[#25283B] text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/5"}`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </div>
                {activeTab === tab.id && (
                  <ChevronRight className="w-4 h-4 opacity-50" />
                )}
              </button>
            ))}

            <button
              onClick={handleClearData}
              className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium border border-transparent hover:border-red-500/20"
            >
              <Trash className="w-4 h-4" /> Clear Data
            </button>
          </div>

          <div className="flex-1 bg-[#25283B] rounded-2xl p-8 border border-white/5">
            {activeTab === "profile" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">
                  Personal Profile
                </h2>

                <div className="flex items-center gap-6 mb-8">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingAvatar(true);
                    }}
                    onDragLeave={() => setIsDraggingAvatar(false)}
                    onDrop={handleAvatarDrop}
                    onClick={() =>
                      document.getElementById("avatarUpload").click()
                    }
                    className={`relative w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center group overflow-hidden cursor-pointer transition-colors ${isDraggingAvatar ? "border-[#6C5DD3] bg-[#6C5DD3]/20" : "border-white/10 bg-[#1A1D2D] hover:border-[#6C5DD3]/50"}`}
                  >
                    <input
                      type="file"
                      id="avatarUpload"
                      accept="image/png, image/jpeg, image/gif"
                      className="hidden"
                      onChange={(e) => processAvatar(e.target.files[0])}
                    />
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User
                        className={`w-10 h-10 transition-opacity ${isDraggingAvatar ? "text-[#6C5DD3]" : "text-slate-500 group-hover:opacity-0"}`}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[9px] font-bold text-center">
                        DROP OR
                        <br />
                        CLICK
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      Profile Picture
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      JPG, GIF or PNG. Max size of 800Kb.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. Arnav Sharma"
                      className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. arnav@college.edu.in"
                      className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      University / College
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={formData.university || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. IIT Delhi"
                      className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Degree Major
                    </label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. B.Tech Computer Science"
                      className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "academic" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">
                  Academic Goals
                </h2>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Target Semester CGPA
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          max="10"
                          name="targetGpa"
                          placeholder="e.g. 8.5"
                          value={formData.targetGpa || ""}
                          onChange={handleInputChange}
                          className="w-full pl-4 pr-12 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                          / 10.0
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Current Semester
                      </label>
                      <select
                        name="semester"
                        value={formData.semester || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] appearance-none"
                      >
                        <option value="" disabled>
                          Select Term...
                        </option>
                        {indianSemesters.map((sem) => (
                          <option key={sem} value={sem}>
                            {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-[#1A1D2D] p-5 rounded-xl border border-[#FF75C3]/20 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FF75C3]/10 flex items-center justify-center shrink-0">
                      <Book className="w-5 h-5 text-[#FF75C3]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        Attendance Strict Mode
                      </h4>
                      <p className="text-xs text-slate-400 mb-3">
                        Warn me aggressively if my attendance drops near the 75%
                        UGC minimum criteria required for finals.
                      </p>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="strictMode"
                          checked={formData.strictMode}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#25283B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF75C3]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">
                  Dashboard Notifications
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Upcoming Deadlines
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Show alerts for exams and assignments due within 72
                        hours.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                      <input
                        type="checkbox"
                        name="notif_deadlines"
                        checked={formData.notif_deadlines}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#1A1D2D] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C5DD3]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Attendance Warnings
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Trigger dashboard banners when attendance falls below
                        75%.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                      <input
                        type="checkbox"
                        name="notif_attendance"
                        checked={formData.notif_attendance}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#1A1D2D] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C5DD3]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Daily Summary
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Show a morning recap of classes and timetable events for
                        the day.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                      <input
                        type="checkbox"
                        name="notif_summary"
                        checked={formData.notif_summary}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#1A1D2D] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C5DD3]"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">
                  Security & Data
                </h2>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">
                      Import & Export Setup
                    </h4>
                    <p className="text-sm text-slate-400 mb-4">
                      Create JSON backups of your settings, notes, schedules,
                      and analytics, or restore from a previously exported
                      backup file.
                    </p>
                    <div className="flex gap-5">
                      <label className="cursor-pointer px-5 py-2.5 bg-[#1A1D2D] border border-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                        <UploadCloud className="w-4 h-4" /> Import Data
                        <input
                          type="file"
                          accept="application/json"
                          className="hidden"
                          onChange={handleImport}
                        />
                      </label>
                      <button
                        onClick={handleExport}
                        className="px-5 py-2.5 bg-[#1A1D2D] border border-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Export Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
