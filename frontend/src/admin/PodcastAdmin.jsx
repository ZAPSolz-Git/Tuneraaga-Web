// admin/PodcastAdmin.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Music,
  X,
  Upload,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Globe,
  Loader2,
  AlertTriangle,
  ListMusic,
  Grid3x3,
  List,
  Image,
  Info,
  Edit,
  ChevronDown,
  Search,
  Mic,
  Clock,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";

const BUCKET_NAME = "TuneRaaga";

const LANGUAGES = [
  "Hindi",
  "Tamil",
  "Telugu",
  "English",
  "Punjabi",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Kannada",
  "Bhojpuri",
];

const PODCAST_TYPES = [
  "Interview",
  "Storytelling",
  "Educational",
  "Entertainment",
  "News",
  "Tech",
];

// Searchable Select for Episodes
const SearchableEpisodeSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const selectedOption = options.find((opt) => opt.id == value);
  const displayValue = selectedOption
    ? `${selectedOption.episode_title} - Ep ${selectedOption.episode_number}`
    : "";
  const filteredOptions = options.filter((opt) =>
    opt.episode_title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm flex justify-between items-center"
      >
        <span className="truncate">{displayValue || placeholder}</span>
        <ChevronDown size={16} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-auto">
          <div className="p-2 border-b sticky top-0 bg-white">
            <input
              type="text"
              className="w-full p-1 border rounded text-sm"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {filteredOptions.map((opt) => (
            <div
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
                setIsOpen(false);
              }}
              className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm border-b"
            >
              <div className="font-medium">
                Ep {opt.episode_number}: {opt.episode_title}
              </div>
              <div className="text-xs text-gray-500">{opt.duration}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PodcastAdmin = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [podcasts, setPodcasts] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [currentPodcast, setCurrentPodcast] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState(null);
  const [editData, setEditData] = useState({});
  const [editImageFile, setEditImageFile] = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [newEpisodeId, setNewEpisodeId] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    host: "",
    year: new Date().getFullYear(),
    genre: "",
    language: "Hindi",
    type: "Interview",
    description: "",
    copyright_holder: "",
    publisher: "",
    image: null,
    imagePreview: null,
  });
  const [episodes, setEpisodes] = useState([]);
  const [tempEpisode, setTempEpisode] = useState({
    title: "",
    number: "",
    duration: "",
    audio: null,
    audioPreview: null,
  });

  const fetchPodcasts = async () => {
    setFetching(true);
    const { data } = await supabase
      .from("podcasts")
      .select("*, podcast_episodes(*)")
      .order("created_at", { ascending: false });
    setPodcasts(data || []);
    setFetching(false);
  };

  const fetchEpisodes = async () => {
    const { data } = await supabase
      .from("podcast_episodes")
      .select("*")
      .limit(500);
    setAllEpisodes(data || []);
  };

  useEffect(() => {
    fetchPodcasts();
    fetchEpisodes();
  }, []);

  const uploadImage = async (file) => {
    const fileName = `podcasts/${Date.now()}-${file.name}`;
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file);
    if (data) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
      return publicUrl;
    }
    return null;
  };

  const uploadAudio = async (file) => {
    const fileName = `podcast_audio/${Date.now()}-${file.name}`;
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file);
    if (data) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
      return publicUrl;
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.host)
      return Swal.fire("Error", "Title & Host required", "error");
    if (episodes.length === 0)
      return Swal.fire("Error", "Add at least one episode", "error");
    if (!formData.copyright_holder)
      return Swal.fire("Error", "Copyright Holder required", "error");

    setLoading(true);
    try {
      const imageUrl = formData.image
        ? await uploadImage(formData.image)
        : null;
      const { data: podcast } = await supabase
        .from("podcasts")
        .insert({
          title: formData.title,
          host: formData.host,
          year: formData.year,
          genre: formData.genre,
          language: formData.language,
          type: formData.type,
          description: formData.description,
          copyright_holder: formData.copyright_holder,
          publisher: formData.publisher,
          image_url: imageUrl,
          total_episodes: episodes.length,
        })
        .select()
        .single();

      for (let ep of episodes) {
        const audioUrl = ep.audio ? await uploadAudio(ep.audio) : null;
        await supabase.from("podcast_episodes").insert({
          podcast_id: podcast.id,
          episode_title: ep.title,
          episode_number: parseInt(ep.number),
          duration: ep.duration,
          audio_url: audioUrl,
        });
      }

      Swal.fire("Success", "Podcast Created!", "success");
      setStep(0);
      setFormData({
        title: "",
        host: "",
        year: new Date().getFullYear(),
        genre: "",
        language: "Hindi",
        type: "Interview",
        description: "",
        copyright_holder: "",
        publisher: "",
        image: null,
        imagePreview: null,
      });
      setEpisodes([]);
      fetchPodcasts();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = editingPodcast.image_url;
      if (editImageFile) {
        imageUrl = await uploadImage(editImageFile);
      }
      await supabase
        .from("podcasts")
        .update({
          title: editData.title,
          host: editData.host,
          year: parseInt(editData.year),
          genre: editData.genre,
          language: editData.language,
          type: editData.type,
          description: editData.description,
          copyright_holder: editData.copyright_holder,
          publisher: editData.publisher,
          image_url: imageUrl,
        })
        .eq("id", editingPodcast.id);

      Swal.fire("Success", "Updated!", "success");
      setIsEditOpen(false);
      fetchPodcasts();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete?",
      icon: "warning",
      showCancelButton: true,
    });
    if (confirm.isConfirmed) {
      await supabase.from("podcasts").delete().eq("id", id);
      fetchPodcasts();
      Swal.fire("Deleted!", "", "success");
    }
  };

  const addEpisode = (e) => {
    e.preventDefault();
    if (!tempEpisode.title)
      return Swal.fire("Error", "Episode title required", "error");
    if (!tempEpisode.audio)
      return Swal.fire("Error", "Audio file required", "error");

    const newEpisode = {
      id: Date.now(),
      title: tempEpisode.title,
      number: tempEpisode.number || episodes.length + 1,
      duration: tempEpisode.duration,
      audio: tempEpisode.audio,
      audioPreview: URL.createObjectURL(tempEpisode.audio),
    };
    setEpisodes([...episodes, newEpisode]);
    setTempEpisode({
      title: "",
      number: "",
      duration: "",
      audio: null,
      audioPreview: null,
    });
  };

  const removeEpisode = (id) =>
    setEpisodes(episodes.filter((e) => e.id !== id));

  const addEpisodeToExisting = async (e) => {
    e.preventDefault();
    if (!newEpisodeId) return Swal.fire("Error", "Select an episode", "error");
    const selected = allEpisodes.find((e) => e.id == newEpisodeId);
    if (!selected) return;

    await supabase.from("podcast_episodes").insert({
      podcast_id: currentPodcast.id,
      episode_title: selected.episode_title,
      episode_number: selected.episode_number,
      duration: selected.duration,
      audio_url: selected.audio_url,
    });

    const newTotal = (currentPodcast.total_episodes || 0) + 1;
    await supabase
      .from("podcasts")
      .update({ total_episodes: newTotal })
      .eq("id", currentPodcast.id);

    const { data } = await supabase
      .from("podcasts")
      .select("*, podcast_episodes(*)")
      .eq("id", currentPodcast.id)
      .single();
    setCurrentPodcast(data);
    setPodcasts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    setNewEpisodeId("");
    Swal.fire("Added!", "", "success");
  };

  const steps = [
    { id: "upload", label: "Cover", icon: Image },
    { id: "info", label: "Info", icon: Info },
    { id: "episodes", label: "Episodes", icon: Mic },
    { id: "rights", label: "Rights", icon: Globe },
    { id: "finish", label: "Finish", icon: CheckCircle2 },
  ];

  const nextStep = () => {
    if (step === 1 && !formData.image)
      return Swal.fire("Required", "Upload cover", "warning");
    if (step === 2 && (!formData.title || !formData.host))
      return Swal.fire("Required", "Title & Host required", "warning");
    if (step === 3 && episodes.length === 0)
      return Swal.fire("Required", "Add at least one episode", "warning");
    if (step < 5) setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            Manage <span className="text-purple-600">Podcasts</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Create and manage podcast shows
          </p>
        </div>
        {step === 0 && (
          <div className="flex gap-3">
            <div className="flex bg-white rounded-lg border p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${viewMode === "grid" ? "bg-purple-100 text-purple-700" : "text-gray-400"}`}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded ${viewMode === "table" ? "bg-purple-100 text-purple-700" : "text-gray-400"}`}
              >
                <List size={18} />
              </button>
            </div>
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white font-bold flex items-center gap-2"
            >
              <Plus size={18} /> New Podcast
            </button>
          </div>
        )}
      </div>

      {/* Wizard - Same as Charts */}
      {step > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden mb-8">
          <div className="bg-slate-50 border-b px-8 py-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step - 1 >= i ? "border-purple-600 bg-purple-600 text-white" : "border-gray-300 text-gray-400 bg-white"}`}
                    >
                      {step - 1 > i ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <s.icon size={16} />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase ${step - 1 >= i ? "text-purple-700" : "text-gray-400"}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-full mx-2 ${step - 1 > i ? "bg-purple-600" : "bg-gray-200"}`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 bg-white">
            {step === 1 && (
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-xl font-bold mb-2">Upload Cover</h3>
                <div
                  onClick={() => document.getElementById("coverInput").click()}
                  className={`border-2 border-dashed rounded-xl p-10 cursor-pointer ${formData.image ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-purple-400 bg-gray-50"}`}
                >
                  <input
                    id="coverInput"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file)
                        setFormData({
                          ...formData,
                          image: file,
                          imagePreview: URL.createObjectURL(file),
                        });
                    }}
                  />
                  {!formData.image ? (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p>Click to upload cover</p>
                    </>
                  ) : (
                    <img
                      src={formData.imagePreview}
                      className="w-48 h-48 mx-auto rounded-lg object-cover"
                      alt=""
                    />
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-bold mb-6">Podcast Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label>Podcast Title *</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label>Host Name *</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      value={formData.host}
                      onChange={(e) =>
                        setFormData({ ...formData, host: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Year</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Genre</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      value={formData.genre}
                      onChange={(e) =>
                        setFormData({ ...formData, genre: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Type</label>
                    <select
                      className="w-full border rounded-lg p-2"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      {PODCAST_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Language</label>
                    <select
                      className="w-full border rounded-lg p-2"
                      value={formData.language}
                      onChange={(e) =>
                        setFormData({ ...formData, language: e.target.value })
                      }
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label>Description</label>
                    <textarea
                      rows="3"
                      className="w-full border rounded-lg p-2"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-slate-50 p-6 rounded-xl border">
                    <h4 className="font-bold mb-4">
                      <Plus size={18} /> Add Episode
                    </h4>
                    <form onSubmit={addEpisode} className="space-y-3">
                      <input
                        type="text"
                        placeholder="Episode Title *"
                        className="w-full border rounded-lg p-2"
                        value={tempEpisode.title}
                        onChange={(e) =>
                          setTempEpisode({
                            ...tempEpisode,
                            title: e.target.value,
                          })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Episode #"
                        className="w-full border rounded-lg p-2"
                        value={tempEpisode.number}
                        onChange={(e) =>
                          setTempEpisode({
                            ...tempEpisode,
                            number: e.target.value,
                          })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Duration (45:30)"
                        className="w-full border rounded-lg p-2"
                        value={tempEpisode.duration}
                        onChange={(e) =>
                          setTempEpisode({
                            ...tempEpisode,
                            duration: e.target.value,
                          })
                        }
                      />
                      <input
                        type="file"
                        accept="audio/*"
                        className="w-full border rounded-lg p-2"
                        onChange={(e) =>
                          setTempEpisode({
                            ...tempEpisode,
                            audio: e.target.files[0],
                          })
                        }
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-purple-600 text-white rounded-lg"
                      >
                        Add Episode
                      </button>
                    </form>
                  </div>
                  <div className="lg:col-span-2">
                    <h4 className="font-bold mb-4">
                      Episodes ({episodes.length})
                    </h4>
                    <div className="bg-white border rounded-xl overflow-hidden">
                      {episodes.map((ep, i) => (
                        <div
                          key={ep.id}
                          className="flex justify-between p-3 border-b"
                        >
                          <div className="flex gap-3">
                            <span className="font-bold">
                              #{ep.number || i + 1}
                            </span>
                            <div>
                              <p className="font-bold">{ep.title}</p>
                              <p className="text-xs text-gray-500">
                                <Clock size={12} /> {ep.duration}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeEpisode(ep.id)}
                            className="text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {episodes.length === 0 && (
                        <div className="p-4 text-center text-gray-400">
                          No episodes added
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-bold mb-6">
                  Copyright & Distribution
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label>Copyright Holder *</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      value={formData.copyright_holder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          copyright_holder: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label>Publisher</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      value={formData.publisher}
                      onChange={(e) =>
                        setFormData({ ...formData, publisher: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="mt-8 p-4 bg-yellow-50 rounded-lg flex gap-3">
                  <AlertTriangle className="text-yellow-600" />
                  <p className="text-sm">
                    Ensure you have rights to publish "{formData.title}"
                  </p>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center py-10">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-2">Ready to Publish</h3>
                <p className="text-gray-500 mb-2">
                  Podcast: "{formData.title}"
                </p>
                <p className="text-gray-500 mb-6">
                  Host: {formData.host} | {episodes.length} Episodes
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <CheckCircle2 />
                  )}{" "}
                  Publish Podcast
                </button>
              </div>
            )}
          </div>

          <div className="border-t bg-slate-50 p-4 flex justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-2 border rounded-lg"
            >
              Previous
            </button>
            {step < 5 && (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
              >
                Next <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* List View - Same as Charts */}
      {step === 0 && (
        <div>
          {fetching ? (
            <div className="py-20 text-center">
              <Loader2
                className="animate-spin text-purple-600 mx-auto"
                size={40}
              />
            </div>
          ) : podcasts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border">
              <Mic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Podcasts Found</h3>
              <p className="text-gray-500">
                Create your first podcast by clicking the button above.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {podcasts.map((pod) => (
                <div
                  key={pod.id}
                  className="bg-white rounded-xl shadow-sm border p-4 flex gap-4 hover:shadow-md"
                >
                  <img
                    src={pod.image_url || "/api/placeholder/100"}
                    className="w-24 h-24 rounded-xl object-cover"
                    alt=""
                  />
                  <div className="flex-1">
                    <h3 className="font-bold line-clamp-1">{pod.title}</h3>
                    <p className="text-xs text-gray-500 mb-1">
                      {pod.host} • {pod.year}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {pod.type} • {pod.genre}
                    </p>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                      {pod.total_episodes || pod.podcast_episodes?.length || 0}{" "}
                      Episodes
                    </span>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentPodcast(pod);
                          setIsManageOpen(true);
                          fetchEpisodes();
                        }}
                        className="flex-1 py-1.5 bg-purple-50 text-purple-600 text-xs font-bold rounded-lg hover:bg-purple-600 hover:text-white flex items-center justify-center gap-1"
                      >
                        <ListMusic size={12} /> Episodes
                      </button>
                      <button
                        onClick={() => {
                          setEditingPodcast(pod);
                          setEditData(pod);
                          setIsEditOpen(true);
                        }}
                        className="p-1.5 bg-gray-100 rounded-lg"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left">Cover</th>
                    <th className="p-4 text-left">Title & Host</th>
                    <th className="p-4 text-left">Details</th>
                    <th className="p-4 text-left">Episodes</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {podcasts.map((pod) => (
                    <tr key={pod.id} className="border-t hover:bg-gray-50">
                      <td className="p-4">
                        <img
                          src={pod.image_url || "/api/placeholder/50"}
                          className="w-12 h-12 rounded object-cover"
                          alt=""
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold">{pod.title}</div>
                        <div className="text-sm text-gray-500">{pod.host}</div>
                      </td>
                      <td className="p-4">
                        <div>{pod.type}</div>
                        <div className="text-xs text-gray-500">
                          {pod.genre} • {pod.year}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                          {pod.total_episodes ||
                            pod.podcast_episodes?.length ||
                            0}{" "}
                          Episodes
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setCurrentPodcast(pod);
                            setIsManageOpen(true);
                          }}
                          className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manage Episodes Modal */}
      <AnimatePresence>
        {isManageOpen && currentPodcast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsManageOpen(false)}
            ></div>
            <motion.div className="bg-white rounded-2xl w-full max-w-4xl relative z-10 overflow-hidden max-h-[90vh]">
              <div className="bg-gray-50 border-b p-6 flex justify-between">
                <div>
                  <h3 className="text-xl font-bold">Manage Episodes</h3>
                  <p className="text-sm text-gray-500">
                    {currentPodcast.title}
                  </p>
                </div>
                <button onClick={() => setIsManageOpen(false)}>
                  <X />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-purple-50 p-6 rounded-xl">
                  <h4 className="font-bold text-purple-900 mb-4">
                    Add Episode
                  </h4>
                  <form onSubmit={addEpisodeToExisting}>
                    <SearchableEpisodeSelect
                      options={allEpisodes}
                      value={newEpisodeId}
                      onChange={setNewEpisodeId}
                      placeholder="Select episode..."
                    />
                    <button
                      type="submit"
                      className="w-full mt-3 py-2 bg-purple-600 text-white rounded-lg"
                    >
                      Add Episode
                    </button>
                  </form>
                </div>
                <div className="lg:col-span-2">
                  <h4 className="font-bold mb-4">Current Episodes</h4>
                  <div className="bg-white border rounded-xl overflow-auto max-h-96">
                    {currentPodcast.podcast_episodes?.map((ep, i) => (
                      <div
                        key={ep.id}
                        className="flex justify-between p-3 border-b"
                      >
                        <div>
                          <span className="font-bold">
                            #{ep.episode_number || i + 1}
                          </span>{" "}
                          {ep.episode_title}{" "}
                          {ep.duration && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({ep.duration})
                            </span>
                          )}
                        </div>
                        <button className="text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditOpen && editingPodcast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsEditOpen(false)}
            ></div>
            <motion.div className="bg-white rounded-2xl w-full max-w-4xl relative z-10 max-h-[90vh] overflow-auto">
              <div className="bg-gray-50 border-b p-6 flex justify-between">
                <div>
                  <h3 className="text-xl font-bold">Edit Podcast</h3>
                  <p className="text-sm text-gray-500">
                    {editingPodcast.title}
                  </p>
                </div>
                <button onClick={() => setIsEditOpen(false)}>
                  <X />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label>Title</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={editData.title || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label>Host</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={editData.host || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, host: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label>Year</label>
                      <input
                        type="number"
                        className="w-full border rounded-lg p-2"
                        value={editData.year || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, year: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label>Genre</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={editData.genre || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, genre: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label>Type</label>
                      <select
                        className="w-full border rounded-lg p-2"
                        value={editData.type || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, type: e.target.value })
                        }
                      >
                        {PODCAST_TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Language</label>
                      <select
                        className="w-full border rounded-lg p-2"
                        value={editData.language || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, language: e.target.value })
                        }
                      >
                        {LANGUAGES.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label>Description</label>
                      <textarea
                        rows="3"
                        className="w-full border rounded-lg p-2"
                        value={editData.description || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>Copyright Holder</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={editData.copyright_holder || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            copyright_holder: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>Publisher</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={editData.publisher || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            publisher: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label>Change Cover</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full border rounded-lg p-2"
                        onChange={(e) => setEditImageFile(e.target.files[0])}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditOpen(false)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <CheckCircle2 />
                      )}{" "}
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PodcastAdmin;
