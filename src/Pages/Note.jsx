import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Plus,
  ExternalLink,
  X,
  BookOpen,
  Hash,
  Edit2,
  Trash2,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";

export const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [activeSubject, setActiveSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredPdf, setHoveredPdf] = useState(null);

  // Modal & Drag State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [isNewSubject, setIsNewSubject] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    subject: "",
    topic: "",
    description: "",
    pdfUrl: "",
    isCompleted: false,
  });

  const loadNotes = () => {
    fetch("https://RudrakshDubey.pythonanywhere.com/api/notes")
      .then((res) => res.json())
      .then((data) => setNotes(data))
      .catch((err) => console.error("Failed to load notes", err));
  };

  useEffect(() => {
    loadNotes();
  }, []);

  // --- Safe PDF Opener (Fixes the Blank Screen / Refresh Bug) ---
  const handleOpenPdf = (url) => {
    if (!url) return;
    if (url.startsWith("data:application/pdf;base64,")) {
      try {
        const base64 = url.split(",")[1];
        const binary = window.atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([array], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } catch (e) {
        console.error("Failed to parse Base64 PDF", e);
        window.open(url, "_blank"); // Fallback
      }
    } else {
      window.open(url, "_blank");
    }
  };

  // --- CRUD Operations ---
  const handleSaveNote = () => {
    if (!formData.title || !formData.subject || !formData.topic) return;
    const method = modalMode === "add" ? "POST" : "PUT";

    fetch("https://RudrakshDubey.pythonanywhere.com/api/notes/crud", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(() => {
        loadNotes();
        setIsModalOpen(false);
      })
      .catch((err) => console.error("Failed to save note", err));
  };

  const handleDeleteNote = (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    fetch("https://RudrakshDubey.pythonanywhere.com/api/notes/crud", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).then(() => {
      loadNotes();
      setIsModalOpen(false);
    });
  };

  const toggleComplete = (note) => {
    fetch("https://RudrakshDubey.pythonanywhere.com/api/notes/crud", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...note, isCompleted: !note.isCompleted }),
    }).then(() => loadNotes());
  };

  const openModal = (mode, note = null) => {
    setModalMode(mode);
    setIsNewSubject(false);
    setIsDragging(false);
    setFormData(
      note || {
        id: "",
        title: "",
        subject: "",
        topic: "",
        description: "",
        pdfUrl: "",
        isCompleted: false,
      },
    );
    setIsModalOpen(true);
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file) => {
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, pdfUrl: event.target.result });
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid PDF document.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e) => {
    processFile(e.target.files[0]);
  };

  // --- Filtering ---
  const subjectsList = [...new Set(notes.map((n) => n.subject))];

  const filteredNotes = notes.filter((note) => {
    const matchesSubject =
      activeSubject === "All" || note.subject === activeSubject;
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="flex-1 h-full bg-[#1A1D2D] text-white font-sans p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50 relative">
      <div className="w-full max-w-7xl mx-auto pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Study Vault</h1>
            <p className="text-slate-400 text-sm">
              Organize, describe, and access your notes instantly.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-[#25283B] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors w-64"
              />
            </div>
            <button
              onClick={() => openModal("add")}
              className="px-5 py-2.5 bg-[#6C5DD3] rounded-xl font-semibold flex items-center gap-2 hover:bg-[#5a4db8] transition-colors shadow-[0_0_20px_rgba(108,93,211,0.3)]"
            >
              <Plus className="w-4 h-4" /> New Note
            </button>
          </div>
        </div>

        {/* Subject Filters */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-4 [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveSubject("All")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSubject === "All" ? "bg-white/10 text-white border border-white/10" : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"}`}
          >
            All
          </button>
          {subjectsList.map((subject) => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSubject === subject ? "bg-white/10 text-white border border-white/10" : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"}`}
            >
              {subject}
            </button>
          ))}
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onMouseEnter={() => setHoveredPdf(note.pdfUrl || "dummy.pdf")}
                onMouseLeave={() => setHoveredPdf(null)}
                onClick={() => handleOpenPdf(note.pdfUrl || "dummy.pdf")}
                className="group bg-[#25283B] rounded-2xl p-6 border border-white/5 hover:border-[#6C5DD3]/50 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(108,93,211,0.15)] transition-all flex flex-col h-70 relative cursor-pointer"
              >
                {/* Header Actions */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20">
                      <BookOpen className="w-3 h-3" /> {note.subject}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#FF75C3]/10 text-[#FF75C3] px-2.5 py-1 rounded-md border border-[#FF75C3]/20">
                      <Hash className="w-3 h-3" /> {note.topic}
                    </span>
                  </div>
                </div>

                <div className="mb-auto">
                  <h3
                    className={`text-lg font-bold mb-2 leading-tight transition-colors ${note.isCompleted ? "text-slate-400 line-through" : "text-white group-hover:text-[#6C5DD3]"}`}
                  >
                    {note.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                    {note.description}
                  </p>
                </div>

                {/* Footer Controls (Stop Propagation on Click) */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(note);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${note.isCompleted ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-white/5 text-slate-300 border-white/10 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20"}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />{" "}
                      {note.isCompleted ? "Completed" : "Mark Done"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("edit", note);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium text-slate-300 group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4 text-red-400" />{" "}
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>No notes found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Hover Preview Panel */}
      {hoveredPdf && hoveredPdf !== "dummy.pdf" && (
        <div className="fixed bottom-10 right-10 w-80 h-96 bg-[#1A1D2D] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#6C5DD3]/50 overflow-hidden z-40 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col">
          <div className="bg-[#25283B] px-4 py-2 text-xs text-slate-300 font-bold border-b border-white/10 flex items-center justify-between">
            Document Preview
            <FileText className="w-3 h-3 text-[#6C5DD3]" />
          </div>
          <iframe
            src={hoveredPdf}
            className="w-full h-full bg-white"
            title="PDF Preview"
          />
        </div>
      )}

      {/* Unified CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#25283B] border border-white/10 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">
              {modalMode === "add" ? "Upload New Note" : "Edit Note"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  Note Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                  placeholder="e.g. Chapter 4 Summary"
                />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">
                    Subject Category
                  </label>
                  {isNewSubject ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                        placeholder="New Subject"
                      />
                      <button
                        onClick={() => {
                          setIsNewSubject(false);
                          setFormData({ ...formData, subject: "" });
                        }}
                        className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={
                        subjectsList.includes(formData.subject)
                          ? formData.subject
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value === "NEW") {
                          setIsNewSubject(true);
                          setFormData({ ...formData, subject: "" });
                        } else
                          setFormData({ ...formData, subject: e.target.value });
                      }}
                      className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] appearance-none"
                    >
                      <option value="" disabled>
                        Select Subject
                      </option>
                      {subjectsList.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                      <option value="NEW" className="text-[#6C5DD3] font-bold">
                        + Create New Category
                      </option>
                    </select>
                  )}
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                    placeholder="e.g. Thermodynamics"
                  />
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  Document source
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("fileUpload").click()}
                  className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer 
                    ${isDragging ? "border-[#6C5DD3] bg-[#6C5DD3]/10" : "border-slate-600 bg-[#1A1D2D] hover:border-[#6C5DD3]"}
                  `}
                >
                  <input
                    type="file"
                    id="fileUpload"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <UploadCloud
                    className={`w-8 h-8 mb-2 ${formData.pdfUrl && formData.pdfUrl.startsWith("data:application/pdf") ? "text-green-400" : isDragging ? "text-[#6C5DD3]" : "text-slate-400"}`}
                  />
                  <p className="text-sm font-semibold text-white mb-1">
                    {formData.pdfUrl &&
                    formData.pdfUrl.startsWith("data:application/pdf")
                      ? "PDF Loaded Successfully"
                      : "Click or drag PDF to upload"}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <hr className="flex-1 border-white/10" />
                  <span className="text-xs text-slate-500">OR PASTE URL</span>
                  <hr className="flex-1 border-white/10" />
                </div>
                <input
                  type="text"
                  value={
                    formData.pdfUrl && !formData.pdfUrl.startsWith("data:")
                      ? formData.pdfUrl
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, pdfUrl: e.target.value })
                  }
                  className="mt-3 w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] resize-none"
                  placeholder="Briefly describe the contents..."
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                {modalMode === "edit" && (
                  <button
                    onClick={() => handleDeleteNote(formData.id)}
                    className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors border border-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleSaveNote}
                  className="flex-1 py-2.5 bg-[#6C5DD3] hover:bg-[#5a4db8] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {modalMode === "add" ? "Save Note" : "Update Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
