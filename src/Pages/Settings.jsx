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
} from "lucide-react";

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Form state to hold user settings[cite: 17]
  const [formData, setFormData] = useState({
    fullName: "Alex Student",
    email: "alex@university.edu",
    university: "Tech Institute of Future",
    major: "Computer Science",
    targetGpa: "3.8",
    semester: "Fall 2024",
    strictMode: true,
  });

  // 1. Fetch data from backend on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (
          data.success &&
          data.settings &&
          Object.keys(data.settings).length > 0
        ) {
          setFormData((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch((err) => console.error("Failed to load settings", err));
  }, []);

  // 2. Universal input handler for text, selects, and checkboxes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 3. Save changes to backend
  const handleSave = () => {
    setIsSaving(true);
    fetch("http://localhost:5000/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Optional: You could add a toast notification here
          console.log("Settings successfully saved!");
        }
      })
      .catch((err) => console.error("Failed to save settings", err))
      .finally(() => setIsSaving(false));
  };

  const tabs = [
    { id: "profile", label: "Personal Profile", icon: User },
    { id: "academic", label: "Academic Goals", icon: Book },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Data", icon: Shield },
  ];

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
        {/* Header */}
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
          {/* Left Sidebar Tabs */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-medium
                  ${
                    activeTab === tab.id
                      ? "bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20"
                      : "bg-[#25283B] text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/5"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </div>
                {activeTab === tab.id && (
                  <ChevronRight className="w-4 h-4 opacity-50" />
                )}
              </button>
            ))}

            <button className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium border border-transparent hover:border-red-500/20">
              <Trash className="w-4 h-4" />
              Clear Data
            </button>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 bg-[#25283B] rounded-2xl p-8 border border-white/5">
            {/* PROFILE SETTINGS */}
            {activeTab === "profile" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">
                  Personal Profile
                </h2>

                {/* Avatar Upload */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative w-24 h-24 rounded-full bg-[#1A1D2D] border border-white/10 flex items-center justify-center group overflow-hidden cursor-pointer">
                    <User className="w-10 h-10 text-slate-500 group-hover:opacity-0 transition-opacity" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[10px] font-bold">CHANGE</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      Profile Picture
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      JPG, GIF or PNG. Max size of 800Kb
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
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      University
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Major
                    </label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ACADEMIC SETTINGS */}
            {activeTab === "academic" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">
                  Academic Goals
                </h2>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Target Semester GPA
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          name="targetGpa"
                          value={formData.targetGpa}
                          onChange={handleInputChange}
                          className="w-full pl-4 pr-10 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                          / 4.0
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Current Semester
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] appearance-none"
                      >
                        <option value="Fall 2024">Fall 2024</option>
                        <option value="Spring 2025">Spring 2025</option>
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
                        threshold required for final exams.
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

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">
                  Notifications
                </h2>

                <div className="space-y-6">
                  {[
                    {
                      title: "Upcoming Deadlines",
                      desc: "Get alerted 24 hours before an assignment or exam is due.",
                    },
                    {
                      title: "Attendance Warnings",
                      desc: "Receive immediate alerts when skipping a class impacts your 75% target.",
                    },
                    {
                      title: "Daily Summary",
                      desc: "A morning recap of tasks, classes, and focus goals for the day.",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#1A1D2D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C5DD3]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECURITY & DATA */}
            {activeTab === "security" && (
              <div className="animate-in fade-in duration-300 ">
                <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">
                  Security & Data
                </h2>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">
                      Export Academic Data
                    </h4>
                    <p className="text-sm text-slate-400 mb-4">
                      Download your grades, attendance records, and notes
                      metadata as a CSV file.
                    </p>
                    <div className="flex gap-5">
                      <button className="px-5 py-2.5 bg-[#1A1D2D] border border-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors">
                        Import Data
                      </button>
                      <button className="px-5 py-2.5 bg-[#1A1D2D] border border-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors">
                        Export Data
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
