import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  X,
  ExternalLink,
  Video,
  Globe,
  Box,
  BookOpen,
  Hash,
  Link as LinkIcon,
  CheckCircle2,
  Edit2,
  Trash2,
} from "lucide-react";

const getTypeIcon = (type) => {
  switch (type) {
    case "Video":
      return <Video className="w-8 h-8 text-white opacity-80" />;
    case "Interactive":
      return <Box className="w-8 h-8 text-white opacity-80" />;
    case "Article":
    default:
      return <Globe className="w-8 h-8 text-white opacity-80" />;
  }
};

export const ResourcePage = () => {
  const [resources, setResources] = useState([]);
  const [activeSubject, setActiveSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [isNewSubject, setIsNewSubject] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    subject: "",
    topic: "",
    type: "",
    description: "",
    url: "",
    isCompleted: false,
  });

  const loadResources = () => {
    fetch("https://RudrakshDubey.pythonanywhere.com/api/resources")
      .then((res) => res.json())
      .then((data) => setResources(data))
      .catch((err) => console.error("Failed to load resources", err));
  };

  useEffect(() => {
    loadResources();
  }, []);

  // CRUD Operations
  const handleSaveResource = () => {
    if (!formData.title || !formData.url || !formData.subject) return;
    const method = modalMode === "add" ? "POST" : "PUT";

    fetch("https://RudrakshDubey.pythonanywhere.com/api/resources/crud", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(() => {
        loadResources();
        setIsModalOpen(false);
      })
      .catch((err) => console.error("Failed to save resource", err));
  };

  const handleDeleteResource = (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?"))
      return;
    fetch("https://RudrakshDubey.pythonanywhere.com/api/resources/crud", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).then(() => {
      loadResources();
      setIsModalOpen(false);
    });
  };

  const toggleComplete = (res) => {
    fetch("https://RudrakshDubey.pythonanywhere.com/api/resources/crud", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...res, isCompleted: !res.isCompleted }),
    }).then(() => loadResources());
  };

  const openModal = (mode, resource = null) => {
    setModalMode(mode);
    setIsNewSubject(false);
    setFormData(
      resource || {
        id: "",
        title: "",
        subject: "",
        topic: "",
        type: "",
        description: "",
        url: "",
        isCompleted: false,
      },
    );
    setIsModalOpen(true);
  };

  const subjectsList = [...new Set(resources.map((r) => r.subject))];

  const filteredResources = resources.filter((res) => {
    const matchesSubject =
      activeSubject === "All" || res.subject === activeSubject;
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="flex-1 h-full bg-[#1A1D2D] text-white font-sans p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-[#6C5DD3]/50 relative">
      <div className="w-full max-w-7xl mx-auto pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Resource Hub</h1>
            <p className="text-slate-400 text-sm">
              Save, visualize, and organize helpful links and tools.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-[#25283B] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors w-64"
              />
            </div>
            <button
              onClick={() => openModal("add")}
              className="px-5 py-2.5 bg-[#6C5DD3] rounded-xl font-semibold flex items-center gap-2 hover:bg-[#5a4db8] transition-colors shadow-[0_0_20px_rgba(108,93,211,0.3)]"
            >
              <Plus className="w-4 h-4" /> Add Resource
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

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.length > 0 ? (
            filteredResources.map((res) => (
              <div
                key={res.id}
                onClick={() => window.open(res.url, "_blank")}
                className="group bg-[#25283B] rounded-2xl overflow-hidden border border-white/5 hover:border-[#6C5DD3]/50 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(108,93,211,0.15)] transition-all cursor-pointer flex flex-col h-90 relative"
              >
                <div
                  className={`h-36 w-full bg-linear-to-br ${res.visualizerBg} relative flex items-center justify-center`}
                >
                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                  <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                    {getTypeIcon(res.type)}
                  </div>
                  <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white/90">
                    {res.type}
                  </div>
                  <div className="absolute inset-0 bg-[#1A1D2D]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-20">
                    <span className="flex items-center gap-2 bg-[#6C5DD3] text-white px-4 py-2 rounded-full font-bold text-sm">
                      Open Resource <ExternalLink className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1 bg-[#25283B]">
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                      <BookOpen className="w-3 h-3" /> {res.subject}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#FF75C3]/10 text-[#FF75C3] px-2 py-0.5 rounded border border-[#FF75C3]/20">
                      <Hash className="w-3 h-3" /> {res.topic}
                    </span>
                  </div>
                  <h3
                    className={`text-lg font-bold mb-2 leading-tight transition-colors ${res.isCompleted ? "text-slate-400 line-through" : "text-white group-hover:text-[#6C5DD3]"}`}
                  >
                    {res.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                    {res.description}
                  </p>
                </div>

                {/* Footer Controls (Stop Propagation on Click) */}
                <div className="px-6 pb-6 pt-4 border-t border-white/5 flex justify-between items-center z-30 relative bg-[#25283B]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(res);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${res.isCompleted ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-white/5 text-slate-300 border-white/10 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20"}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />{" "}
                      {res.isCompleted ? "Completed" : "Mark Done"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("edit", res);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
              <LinkIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>No resources found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

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
              {modalMode === "add" ? "Add New Resource" : "Edit Resource"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  Resource URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-mono text-sm">
                      URL://
                    </span>
                  </div>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="w-full pl-16 pr-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
                  placeholder="e.g. Calculus Made Easy"
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
                    Format Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] appearance-none"
                  >
                    <option value="" disabled>
                      Select Type
                    </option>
                    <option value="Video">Video / Tutorial</option>
                    <option value="Article">Article / Documentation</option>
                    <option value="Interactive">Interactive / Tool</option>
                  </select>
                </div>
              </div>

              <div>
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
                  placeholder="Describe why this is useful..."
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                {modalMode === "edit" && (
                  <button
                    onClick={() => handleDeleteResource(formData.id)}
                    className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors border border-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleSaveResource}
                  className="flex-1 py-2.5 bg-[#6C5DD3] hover:bg-[#5a4db8] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {modalMode === "add" ? "Save Resource" : "Update Resource"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
