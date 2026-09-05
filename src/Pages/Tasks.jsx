import { useState, useEffect } from "react";
import { CheckCircle2, RefreshCw, Edit2, Plus, X, Trash2 } from "lucide-react";

const emptyBoard = {
  todo: { id: "todo", title: "To Do", tasks: [] },
  inProgress: { id: "inProgress", title: "In Progress", tasks: [] },
  approval: { id: "approval", title: "Approval", tasks: [] },
  completed: { id: "completed", title: "Completed", tasks: [] },
};

export const TasksPage = () => {
  const [columns, setColumns] = useState(emptyBoard);
  const [activeDragCol, setActiveDragCol] = useState(null);
  const [lastWeekPerf, setLastWeekPerf] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    tag: "",
    count: 1,
  });

  const loadTasks = () => {
    fetch("http://localhost:5000/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.board) {
          setColumns(data.board);
          setLastWeekPerf(data.performance);
        }
      })
      .catch((err) => console.error("Failed to load tasks", err));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // --- CRUD Handlers ---
  const handleSaveTask = async () => {
    if (!formData.title || !formData.tag) return;
    const method = modalMode === "add" ? "POST" : "PUT";

    try {
      await fetch("http://localhost:5000/api/tasks/crud", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setIsModalOpen(false);
      loadTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await fetch("http://localhost:5000/api/tasks/crud", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setIsModalOpen(false);
      loadTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ id: "", title: "", tag: "", count: 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setModalMode("edit");
    setFormData(task);
    setIsModalOpen(true);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, taskId, sourceColId) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceColId", sourceColId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, targetColId) => {
    e.preventDefault();
    setActiveDragCol(targetColId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setActiveDragCol(null);
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    setActiveDragCol(null);

    const taskId = e.dataTransfer.getData("taskId");
    const sourceColId = e.dataTransfer.getData("sourceColId");

    if (sourceColId === targetColId) return;

    setColumns((prev) => {
      const sourceCol = prev[sourceColId];
      const targetCol = prev[targetColId];
      const taskToMove = sourceCol.tasks.find((t) => t.id === taskId);
      const newSourceTasks = sourceCol.tasks.filter((t) => t.id !== taskId);
      const newTargetTasks = [...targetCol.tasks, taskToMove];

      return {
        ...prev,
        [sourceColId]: { ...sourceCol, tasks: newSourceTasks },
        [targetColId]: { ...targetCol, tasks: newTargetTasks },
      };
    });

    fetch("http://localhost:5000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, column_id: targetColId }),
    }).catch((err) => console.error("Failed to sync task move", err));
  };

  return (
    <div className="flex h-screen bg-[#1A1D2D] text-white font-sans p-10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50 transition-colors">
      <div className="min-w-screen pb-10 w-full">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Homework</h1>
            {lastWeekPerf && (
              <p className="text-sm text-green-400 font-medium bg-green-400/10 px-3 py-1.5 rounded-lg inline-block border border-green-400/20">
                Performance: You completed {lastWeekPerf.completed_count} tasks
                last week! 🏆
              </p>
            )}
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-[#6C5DD3] hover:bg-[#5a4db8] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#6C5DD3]/20"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>

        {/* Kanban Board Grid */}
        <div className="flex gap-6 items-start">
          {["todo", "inProgress", "approval", "completed"].map((colId) => {
            const column = columns[colId];
            if (!column) return null;

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`
                  w-[18vw] min-w-70 bg-[#25283B] rounded-2xl p-3.5 flex flex-col shrink-0 
                  border-2 transition-colors duration-200 max-h-[80vh]
                  ${activeDragCol === column.id ? "border-[#6C5DD3]/50 bg-[#25283B]/80" : "border-white/5"}
                `}
              >
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-lg font-bold text-slate-200">
                    {column.title}
                  </h2>
                  {column.id === "approval" && (
                    <RefreshCw className="w-5 h-5 text-orange-400 bg-orange-400/10 p-1 rounded-full" />
                  )}
                  {column.id === "completed" && (
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 bg-cyan-400/10 p-1 rounded-full" />
                  )}
                </div>

                <div className="flex flex-col gap-4 flex-1 mt-6 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50 pr-1">
                  {column.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, task.id, column.id)
                      }
                      className="bg-[#1A1D2D] p-5 rounded-xl cursor-grab active:cursor-grabbing border border-white/5 hover:border-[#6C5DD3]/50 shadow-lg shadow-black/10 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/5 text-slate-300">
                          {task.tag}
                        </span>
                        <button
                          onClick={() => openEditModal(task)}
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="text-[15px] font-semibold text-slate-100 leading-snug mb-3">
                        {task.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {task.count} steps
                      </p>
                    </div>
                  ))}

                  {/* NEW: Inline Add Task Button for the To Do column */}
                  {column.id === "todo" && (
                    <button
                      onClick={openAddModal}
                      className="mt-2 w-full py-4 rounded-xl border-2 border-dashed border-white/10 text-slate-400 hover:text-white hover:border-[#6C5DD3]/50 hover:bg-[#6C5DD3]/10 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Plus className="w-4 h-4" /> Add New Task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CRUD Modal */}
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
              {modalMode === "add" ? "Create New Task" : "Edit Task"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  Task Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                  placeholder="e.g. Read Chapter 4"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  Subject Tag
                </label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) =>
                    setFormData({ ...formData, tag: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                  placeholder="e.g. Physics"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  Sub-tasks Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.count}
                  onChange={(e) =>
                    setFormData({ ...formData, count: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                {modalMode === "edit" && (
                  <button
                    onClick={() => handleDeleteTask(formData.id)}
                    className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors border border-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleSaveTask}
                  className="flex-1 py-2.5 bg-[#6C5DD3] hover:bg-[#5a4db8] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {modalMode === "add" ? "Add Task" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
