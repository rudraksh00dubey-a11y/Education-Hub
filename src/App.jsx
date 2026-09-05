import { useState, useEffect } from "react";
import { Sidebar } from "./Components/SideBar";
import { DashboardPage } from "./Pages/DashBoard";
import { CalendarPage } from "./Pages/Calendar";
import { TasksPage } from "./Pages/Tasks";
import { ExamPage } from "./Pages/Exam";
import { NotesPage } from "./Pages/Note";
import { ResourcePage } from "./Pages/Resource";
import { ProgressPage } from "./Pages/Progress";
import { SettingsPage } from "./Pages/Settings";
import { Routes, Route, Navigate } from "react-router-dom";

// Helper function changed to use sessionStorage instead of localStorage
const getSavedState = (key, defaultValue) => {
  const saved = sessionStorage.getItem(key);
  return saved !== null ? JSON.parse(saved) : defaultValue;
};

export default function StudyDashboard() {
  // --- GLOBAL TIMER STATE (WITH SESSION STORAGE PERSISTENCE) ---
  const [inputHours, setInputHours] = useState(() =>
    getSavedState("timer_inputHours", 0),
  );
  const [inputMinutes, setInputMinutes] = useState(() =>
    getSavedState("timer_inputMinutes", 25),
  );
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(() =>
    getSavedState("timer_totalTime", 25 * 60),
  );
  const [timeLeft, setTimeLeft] = useState(() =>
    getSavedState("timer_timeLeft", 25 * 60),
  );
  const [isActive, setIsActive] = useState(() =>
    getSavedState("timer_isActive", false),
  );
  const [isPaused, setIsPaused] = useState(() =>
    getSavedState("timer_isPaused", false),
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync state changes back to Session Storage continuously
  useEffect(() => {
    sessionStorage.setItem("timer_inputHours", JSON.stringify(inputHours));
    sessionStorage.setItem("timer_inputMinutes", JSON.stringify(inputMinutes));
    sessionStorage.setItem("timer_totalTime", JSON.stringify(totalTimeSeconds));
    sessionStorage.setItem("timer_timeLeft", JSON.stringify(timeLeft));
    sessionStorage.setItem("timer_isActive", JSON.stringify(isActive));
    sessionStorage.setItem("timer_isPaused", JSON.stringify(isPaused));
  }, [
    inputHours,
    inputMinutes,
    totalTimeSeconds,
    timeLeft,
    isActive,
    isPaused,
  ]);

  // Sync inputs to total time when inactive
  useEffect(() => {
    if (!isActive) {
      const seconds = inputHours * 3600 + inputMinutes * 60;
      setTotalTimeSeconds(seconds > 0 ? seconds : 1);
      setTimeLeft(seconds);
    }
  }, [inputHours, inputMinutes, isActive]);

  // Global Interval Runner
  useEffect(() => {
    let interval = null;
    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleStop();
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft]);

  const handleStart = () => {
    if (timeLeft <= 0) return;
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => setIsPaused(true);
  const handleResume = () => setIsPaused(false);

  const handleStop = async () => {
    const elapsedSeconds = totalTimeSeconds - timeLeft;
    const elapsedHours = elapsedSeconds / 3600;

    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(totalTimeSeconds);

    if (elapsedHours > 0) {
      try {
        await fetch("https://RudrakshDubey.pythonanywhere.com/api/study-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hours: elapsedHours }),
        });
        // Trigger a dashboard refresh once the DB updates
        setRefreshKey((prev) => prev + 1);
      } catch (e) {
        console.error("Failed to log time", e);
      }
    }
  };

  const timerState = {
    inputHours,
    inputMinutes,
    totalTimeSeconds,
    timeLeft,
    isActive,
    isPaused,
    refreshKey,
  };
  const timerControls = {
    setInputHours,
    setInputMinutes,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans flex items-center justify-center">
      <div className="flex w-screen h-screen bg-[#121624] overflow-hidden shadow-2xl border border-white/5">
        <Sidebar />
        <Routes>
          <Route index element={<Navigate to="/Dashboard" replace />} />
          <Route
            path="/Dashboard"
            element={
              <DashboardPage
                timerState={timerState}
                timerControls={timerControls}
              />
            }
          />
          <Route path="/Calendar" element={<CalendarPage />} />
          <Route path="/Tasks" element={<TasksPage />} />
          <Route path="/Exams" element={<ExamPage />} />
          <Route path="/Notes" element={<NotesPage />} />
          <Route path="/Resources" element={<ResourcePage />} />
          <Route path="/Progress" element={<ProgressPage />} />
          <Route path="/Settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </div>
  );
}
