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
} from "lucide-react";

/* ==========================================================================
   HELPER FUNCTIONS
   ========================================================================== */
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

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export const ResourcePage = () => {
  const [resources, setResources] = useState([]);
  const [activeSubject, setActiveSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state for adding new resources
  const [newResource, setNewResource] = useState({
    url: "",
    title: "",
    type: "",
    subject: "",
    topic: "",
    description: "",
  });

  // 1. Fetch data from backend
  const loadResources = () => {
    fetch("http://localhost:5000/api/resources")
      .then((res) => res.json())
      .then((data) => setResources(data))
      .catch((err) => console.error("Failed to load resources", err));
  };

  useEffect(() => {
    loadResources();
  }, []);

  // 2. Handle form submission
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewResource((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveResource = () => {
    if (!newResource.title || !newResource.url || !newResource.type) return;

    fetch("http://localhost:5000/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newResource),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadResources(); // Refresh grid
          setIsAddOpen(false); // Close form
          setNewResource({
            url: "",
            title: "",
            type: "",
            subject: "",
            topic: "",
            description: "",
          }); // Reset form
        }
      })
      .catch((err) => console.error("Failed to save resource", err));
  };

  // Dynamically generate subject filters based on fetched data
  const subjectsList = ["All", ...new Set(resources.map((r) => r.subject))];

  // Filter logic
  const filteredResources = resources.filter((res) => {
    const matchesSubject =
      activeSubject === "All" || res.subject === activeSubject;
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

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
              onClick={() => setIsAddOpen(!isAddOpen)}
              className="px-5 py-2.5 bg-[#6C5DD3] rounded-xl font-semibold flex items-center gap-2 hover:bg-[#5a4db8] transition-colors shadow-[0_0_20px_rgba(108,93,211,0.3)]"
            >
              {isAddOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isAddOpen ? "Close" : "Add Resource"}
            </button>
          </div>
        </div>

        {/* Add Resource Form (Frictionless Link Addition) */}
        {isAddOpen && (
          <div className="bg-[#25283B] rounded-2xl p-6 border border-[#6C5DD3]/30 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-[#6C5DD3]" /> Add New Resource
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-mono text-sm">
                    URL://
                  </span>
                </div>
                <input
                  type="url"
                  name="url"
                  value={newResource.url}
                  onChange={handleInputChange}
                  placeholder="Paste website, YouTube, or tool link here..."
                  className="w-full pl-16 pr-4 py-3 bg-[#1A1D2D] border border-[#6C5DD3]/50 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] transition-colors shadow-[0_0_15px_rgba(108,93,211,0.1)]"
                />
              </div>

              <input
                type="text"
                name="title"
                value={newResource.title}
                onChange={handleInputChange}
                placeholder="Title of Resource"
                className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
              />

              <select
                name="type"
                value={newResource.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-[#6C5DD3] appearance-none"
              >
                <option value="" disabled>
                  Select Resource Type...
                </option>
                <option value="Video">Video / Tutorial</option>
                <option value="Article">Article / Documentation</option>
                <option value="Interactive">
                  Interactive Tool / Visualizer
                </option>
              </select>

              <input
                type="text"
                name="subject"
                value={newResource.subject}
                onChange={handleInputChange}
                placeholder="Subject (e.g., Mathematics)"
                className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
              />
              <input
                type="text"
                name="topic"
                value={newResource.topic}
                onChange={handleInputChange}
                placeholder="Topic (e.g., Calculus)"
                className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3]"
              />

              <div className="col-span-1 md:col-span-2">
                <textarea
                  name="description"
                  value={newResource.description}
                  onChange={handleInputChange}
                  placeholder="Describe why this resource is useful..."
                  rows="2"
                  className="w-full px-4 py-3 bg-[#1A1D2D] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#6C5DD3] resize-none"
                ></textarea>
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end">
                <button
                  onClick={handleSaveResource}
                  className="px-8 py-2.5 bg-[#6C5DD3] text-white rounded-xl text-sm font-semibold hover:bg-[#5a4db8] transition-colors"
                >
                  Save Resource
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subject Filters */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-4 [&::-webkit-scrollbar]:hidden">
          {subjectsList.map((subject) => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${
                  activeSubject === subject
                    ? "bg-white/10 text-white border border-white/10"
                    : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }
              `}
            >
              {subject}
            </button>
          ))}
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.length > 0 ? (
            filteredResources.map((res) => (
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                key={res.id}
                className="group bg-[#25283B] rounded-2xl overflow-hidden border border-white/5 hover:border-[#6C5DD3]/50 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(108,93,211,0.15)] transition-all cursor-pointer flex flex-col h-85"
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
                  <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-[#6C5DD3] transition-colors">
                    {res.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                    {res.description}
                  </p>
                </div>
              </a>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
              <LinkIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>No resources found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
