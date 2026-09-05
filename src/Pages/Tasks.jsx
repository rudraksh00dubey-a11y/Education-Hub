import { useState, useEffect } from "react";
import { MoreHorizontal, CheckCircle2, RefreshCw } from "lucide-react";

/* ==========================================================================
   EMPTY BOARD STRUCTURE
   The data will now be injected by the backend API.
   ========================================================================== */
const emptyBoard = {
  todo: { id: "todo", title: "To Do", tasks: [] },
  inProgress: { id: "inProgress", title: "In Progress", tasks: [] },
  approval: { id: "approval", title: "Approval", tasks: [] },
  completed: { id: "completed", title: "Completed", tasks: [] },
};

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export const TasksPage = () => {
  const [columns, setColumns] = useState(emptyBoard);
  const [activeDragCol, setActiveDragCol] = useState(null);

  // 1. Fetch initial task data from the backend
  useEffect(() => {
    fetch("http://localhost:5000/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.todo) {
          setColumns(data);
        }
      })
      .catch((err) => console.error("Failed to load tasks", err));
  }, []);

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

    // 2. Optimistic UI update (move it instantly on screen)
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

    // 3. Send update to the backend database
    fetch("http://localhost:5000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, column_id: targetColId }),
    }).catch((err) => console.error("Failed to sync task move", err));
  };

  return (
    <div
      className="
      flex h-screen bg-[#1A1D2D] text-white font-sans p-10 
      [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-track]:rounded-full
      [&::-webkit-scrollbar-thumb]:bg-slate-700/50
      [&::-webkit-scrollbar-thumb]:rounded-full
      hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50
      transition-colors
    "
    >
      <div className="min-w-screen pb-10">
        <h1 className="text-3xl font-bold mb-8 text-white">Homework</h1>

        {/* Kanban Board Grid */}
        {/* Kanban Board Grid */}
        <div className="flex gap-6 items-start">
          {/* Explicitly define your strict column order here */}
          {["todo", "inProgress", "approval", "completed"].map((colId) => {
            const column = columns[colId];
            if (!column) return null; // Safety check while backend loads

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
                {/* Column Header */}
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

                {/* Task Cards */}
                <div
                  className="flex flex-col gap-4 flex-1 mt-6 overflow-auto
                              [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
                              [&::-webkit-scrollbar-track]:bg-transparent
                              [&::-webkit-scrollbar-track]:rounded-full
                            [&::-webkit-scrollbar-thumb]:bg-slate-700/50
                              [&::-webkit-scrollbar-thumb]:rounded-full
                              hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50"
                >
                  {column.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, task.id, column.id)
                      }
                      className="
                        bg-[#1A1D2D] p-5 rounded-xl cursor-grab active:cursor-grabbing 
                        border border-white/5 hover:border-[#6C5DD3]/50 
                        shadow-lg shadow-black/10 transition-colors
                      "
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/5 text-slate-300">
                          {task.tag}
                        </span>
                        <button className="text-slate-500 hover:text-white transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>

                      <h3 className="text-[15px] font-semibold text-slate-100 leading-snug mb-3">
                        {task.title}
                      </h3>

                      <p className="text-xs text-slate-400 font-medium">
                        {task.count} tasks
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
