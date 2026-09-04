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
export default function StudyDashboard() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans flex items-center justify-center">
      {/* Outer Dashboard Container */}
      <div className="flex w-screen h-screen bg-[#121624] overflow-hidden shadow-2xl border border-white/5">
        <Sidebar />
        <Routes>
          <Route path="/" />

          {/* Automatically redirect from "/" to "/Dashboard" */}
          <Route index element={<Navigate to="/Dashboard" replace />} />
          <Route path="/Dashboard" element={<DashboardPage />}></Route>
          <Route path="/Calendar" element={<CalendarPage />}></Route>
          <Route path="/Tasks" element={<TasksPage />}></Route>
          <Route path="/Exams" element={<ExamPage />}></Route>
          <Route path="/Notes" element={<NotesPage />}></Route>
          <Route path="/Resources" element={<ResourcePage />}></Route>
          <Route path="/Progress" element={<ProgressPage />}></Route>
          <Route path="/Settings" element={<SettingsPage />}></Route>
        </Routes>
      </div>
    </div>
  );
}
