import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Radio as RadioIcon,
  X,
  Upload,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Search,
  Globe,
  Headphones,
  Music2,
  AlertCircle,
  Check,
  Filter,
  Link2,
  Pencil,
  Minus,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { apiRequest, uploadFileSecure } from "../lib/secureApi";
import Swal from "sweetalert2";

const DEFAULT_STREAM_URL = "https://stream.zeno.fm/0r0xa792kwzuv";

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
  "Malayalam",
  "Sanskrit",
  "Haryanvi",
  "Rajasthani",
  "Odia",
  "Assamese",
  "Urdu",
  "Arabic",
  "Spanish",
];

const GENRES = [
  "Bollywood",
  "Lo-Fi",
  "Classical",
  "Devotional",
  "Pop",
  "Rock",
  "Hip-Hop",
  "Jazz",
  "Electronic",
  "Ghazal",
  "Sufi",
  "Folk",
  "Retro",
  "Romantic",
  "Party",
];

const PAGE_SIZE = 30;

const RadioAdmin = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLang, setFilterLang] = useState("All");

  // Edit state
  const [editingStation, setEditingStation] = useState(null);
  const [existingSongIds, setExistingSongIds] = useState(new Set());

  // Station form
  const [formData, setFormData] = useState({
    name: "",
    language: "Hindi",
    genre: "Bollywood",
    description: "",
    stream_url: DEFAULT_STREAM_URL,
    image: null,
    imagePreview: null,
  });

  // Song selection
  const [allReleases, setAllReleases] = useState([]);
  const [selectedSongIds, setSelectedSongIds] = useState(new Set());
  const [songSearch, setSongSearch] = useState("");
  const [songLangFilter, setSongLangFilter] = useState("All");
  const [songGenreFilter, setSongGenreFilter] = useState("All");
  const [songFormatFilter, setSongFormatFilter] = useState("All");
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [songPage, setSongPage] = useState(0);
  const [hasMoreSongs, setHasMoreSongs] = useState(false);

  const [stations, setStations] = useState([]);

  const isEditMode = !!editingStation;

  // ═══════════════════════════════════════════════════════════
  // READS — still direct via supabase; RLS restricts to SELECT only
  // ═══════════════════════════════════════════════════════════
  const fetchPublishedReleases = useCallback(
    async (reset = true) => {
      setLoadingSongs(true);
      try {
        const page = reset ? 0 : songPage;
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error, count } = await supabase
          .from("releases")
          .select(
            "id, title, primary_artist, genre, language, format, cover_url, audio_url, album_name",
            { count: "exact" },
          )
          .eq("status", "Published")
          .not("audio_url", "is", null)
          .neq("audio_url", "")
          .order("created_at", { ascending: false })
          .range(from, to);
        if (error) throw error;
        if (reset) {
          setAllReleases(data || []);
        } else {
          setAllReleases((prev) => [...prev, ...(data || [])]);
        }
        setHasMoreSongs((count || 0) > to + 1);
        if (reset) setSongPage(0);
      } catch (err) {
        console.error("Error fetching releases:", err);
      } finally {
        setLoadingSongs(false);
      }
    },
    [songPage],
  );

  useEffect(() => {
    if (step === 2) fetchPublishedReleases(true);
  }, [step, fetchPublishedReleases]);

  const loadMoreSongs = () => setSongPage((p) => p + 1);
  useEffect(() => {
    if (songPage > 0 && step === 2) fetchPublishedReleases(false);
  }, [songPage, fetchPublishedReleases, step]);

  const fetchStations = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("radio_stations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setStations(data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to load radio stations", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // IMAGE SELECT (local preview only — actual upload happens on submit)
  // ═══════════════════════════════════════════════════════════
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  // ═══════════════════════════════════════════════════════════
  // SECURE DELETE — backend API (cascade handles radio_songs)
  // ═══════════════════════════════════════════════════════════
  const handleDeleteStation = async (id, name) => {
    const result = await Swal.fire({
      title: "Delete Radio Station?",
      html: `Delete <strong>"${name}"</strong>?<br><span class="text-xs text-slate-400">All song mappings will be removed automatically.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    try {
      await apiRequest(`/radio/${id}`, { method: "DELETE" });
      Swal.fire("Deleted!", `"${name}" has been deleted.`, "success");
      fetchStations();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // ═══════════════════════════════════════════════════════════
  // START EDIT — reads song mappings directly (read-only op)
  // ═══════════════════════════════════════════════════════════
  const startEdit = async (station) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      language: station.language || "Hindi",
      genre: station.genre || "Bollywood",
      description: station.description || "",
      stream_url: station.stream_url || DEFAULT_STREAM_URL,
      image: null,
      imagePreview: station.image_url || null,
    });
    try {
      const { data: mappings } = await supabase
        .from("radio_songs")
        .select("song_id")
        .eq("radio_id", station.id);
      const ids = new Set(
        (mappings || []).map((m) => m.song_id).filter(Boolean),
      );
      setExistingSongIds(ids);
      setSelectedSongIds(ids);
    } catch (err) {
      setExistingSongIds(new Set());
      setSelectedSongIds(new Set());
    }
    setStep(1);
  };

  // ═══════════════════════════════════════════════════════════
  // SONG SELECTION
  // ═══════════════════════════════════════════════════════════
  const toggleSong = (id) => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 200) {
          Swal.fire("Limit", "Maximum 200 songs per station.", "warning");
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const selectAllVisible = (ids) => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (next.size < 200) next.add(id);
      });
      return next;
    });
  };

  const deselectAllVisible = (ids) => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // FILTERED SONGS
  // ═══════════════════════════════════════════════════════════
  const filteredSongs = allReleases.filter((song) => {
    const q = songSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      song.title.toLowerCase().includes(q) ||
      (song.primary_artist || "").toLowerCase().includes(q) ||
      (song.album_name || "").toLowerCase().includes(q);
    const matchLang =
      songLangFilter === "All" || song.language === songLangFilter;
    const matchGenre =
      songGenreFilter === "All" || song.genre === songGenreFilter;
    const matchFormat =
      songFormatFilter === "All" || song.format === songFormatFilter;
    return matchSearch && matchLang && matchGenre && matchFormat;
  });

  const filteredSongIds = filteredSongs.map((s) => s.id);
  const songLanguages = [
    "All",
    ...Array.from(
      new Set(allReleases.map((s) => s.language).filter(Boolean)),
    ).sort(),
  ];
  const songGenres = [
    "All",
    ...Array.from(
      new Set(allReleases.map((s) => s.genre).filter(Boolean)),
    ).sort(),
  ];
  const songFormats = [
    "All",
    ...Array.from(
      new Set(allReleases.map((s) => s.format).filter(Boolean)),
    ).sort(),
  ];

  // ═══════════════════════════════════════════════════════════
  // SECURE SUBMIT — CREATE or UPDATE, both via backend API
  // ═══════════════════════════════════════════════════════════
  const handleSubmit = async () => {
    if (!formData.name) {
      return Swal.fire("Error", "Station name is required.", "error");
    }
    if (!isEditMode && !formData.image) {
      return Swal.fire("Error", "Cover image is required.", "error");
    }
    if (selectedSongIds.size === 0) {
      return Swal.fire("Error", "Please select at least 1 song.", "error");
    }

    setLoading(true);
    try {
      let imgUrl = editingStation?.image_url || null;

      // Upload new image if selected — via secure backend
      if (formData.image) {
        imgUrl = await uploadFileSecure(formData.image, "radiocover");
      }

      if (isEditMode) {
        // ══════════════════════════════════════════
        // EDIT MODE — single backend API call
        // ══════════════════════════════════════════
        const toRemove = [...existingSongIds].filter(
          (id) => !selectedSongIds.has(id),
        );
        const toAdd = [...selectedSongIds].filter(
          (id) => !existingSongIds.has(id),
        );

        await apiRequest(`/radio/${editingStation.id}`, {
          method: "PUT",
          body: {
            name: formData.name,
            description: formData.description || null,
            language: formData.language,
            genre: formData.genre,
            image_url: imgUrl,
            stream_url: formData.stream_url || DEFAULT_STREAM_URL,
            removeSongs: toRemove,
            addSongs: toAdd,
          },
        });

        const changes = [];
        if (toAdd.length > 0) changes.push(`+${toAdd.length} songs`);
        if (toRemove.length > 0) changes.push(`-${toRemove.length} songs`);
        if (formData.image) changes.push("Image updated");
        if (formData.name !== editingStation.name) changes.push("Name updated");

        Swal.fire(
          "Updated!",
          `"${formData.name}" updated.${changes.length > 0 ? `<br><span class="text-xs text-slate-400">${changes.join(" · ")}</span>` : ""}`,
          "success",
        );
      } else {
        // ══════════════════════════════════════════
        // CREATE MODE — single backend API call
        // ══════════════════════════════════════════
        await apiRequest("/radio", {
          method: "POST",
          body: {
            name: formData.name,
            description: formData.description || null,
            language: formData.language,
            genre: formData.genre,
            image_url: imgUrl,
            stream_url: formData.stream_url || DEFAULT_STREAM_URL,
            songIds: Array.from(selectedSongIds),
          },
        });

        Swal.fire(
          "Success!",
          `"${formData.name}" created with ${selectedSongIds.size} songs!`,
          "success",
        );
      }

      resetForm();
      fetchStations();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setEditingStation(null);
    setExistingSongIds(new Set());
    setFormData({
      name: "",
      language: "Hindi",
      genre: "Bollywood",
      description: "",
      stream_url: DEFAULT_STREAM_URL,
      image: null,
      imagePreview: null,
    });
    setSelectedSongIds(new Set());
    setAllReleases([]);
    setSongSearch("");
    setSongLangFilter("All");
    setSongGenreFilter("All");
    setSongFormatFilter("All");
    setSongPage(0);
    setHasMoreSongs(false);
  };

  // Filter stations list
  const filteredStations = stations.filter((s) => {
    const matchSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.genre || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchLang = filterLang === "All" || s.language === filterLang;
    return matchSearch && matchLang;
  });

  const availableLanguages = [
    "All",
    ...Array.from(new Set(stations.map((s) => s.language).filter(Boolean))),
  ];
  const formatCount = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const songsToAdd = [...selectedSongIds].filter(
    (id) => !existingSongIds.has(id),
  );
  const songsToRemove = [...existingSongIds].filter(
    (id) => !selectedSongIds.has(id),
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Manage <span className="text-emerald-600">Radio Stations</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Create, edit, and manage radio stations.
          </p>
        </div>
        {step === 0 && (
          <button
            onClick={() => setStep(1)}
            className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-bold shadow hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <Plus size={18} /> Create New Station
          </button>
        )}
      </div>

      {/* ═══ CREATE / EDIT FORM ═══ */}
      <AnimatePresence mode="wait">
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8"
          >
            {/* Mode Badge */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <div>
                {isEditMode ? (
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5">
                    <Pencil size={12} /> Editing Station
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                    <Plus size={12} /> New Station
                  </span>
                )}
              </div>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper */}
            <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex items-center justify-center gap-6 md:gap-10">
              {[
                { id: 1, label: "Station Details" },
                { id: 2, label: "Select Songs" },
                { id: 3, label: isEditMode ? "Update" : "Publish" },
              ].map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all text-sm font-bold ${
                      step >= s.id
                        ? isEditMode
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-300 text-gray-400 bg-white"
                    }`}
                  >
                    {step > s.id ? <CheckCircle2 size={15} /> : s.id}
                  </div>
                  <span
                    className={`text-xs font-bold uppercase hidden sm:inline ${
                      step >= s.id
                        ? isEditMode
                          ? "text-blue-700"
                          : "text-emerald-700"
                        : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-5 md:p-8 bg-white min-h-[500px]">
              {/* ─── STEP 1 ─── */}
              {step === 1 && (
                <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Station Cover
                      {isEditMode && (
                        <span className="text-xs font-normal text-slate-400 ml-2">
                          (keep current if empty)
                        </span>
                      )}
                    </h3>
                    <div
                      onClick={() =>
                        document.getElementById("radioCoverInput").click()
                      }
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                        formData.image
                          ? "border-green-400 bg-green-50"
                          : formData.imagePreview
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-300 hover:border-emerald-400 bg-gray-50"
                      }`}
                    >
                      <input
                        type="file"
                        id="radioCoverInput"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      {formData.imagePreview ? (
                        <div className="relative">
                          <img
                            src={formData.imagePreview}
                            alt="Preview"
                            className="w-48 h-48 object-cover rounded-2xl shadow-md mx-auto"
                          />
                          {isEditMode && !formData.image && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                              Current — Click to Change
                            </div>
                          )}
                          {formData.image && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                              New Image
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-900 font-medium text-sm">
                            Click to upload cover
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Square image recommended
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Station Info
                    </h3>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Station Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Radio Mirchi Hindi"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Language
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white outline-none"
                          value={formData.language}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              language: e.target.value,
                            })
                          }
                        >
                          {LANGUAGES.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Genre
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white outline-none"
                          value={formData.genre}
                          onChange={(e) =>
                            setFormData({ ...formData, genre: e.target.value })
                          }
                        >
                          {GENRES.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Link2 size={13} className="text-slate-400" /> Stream
                          URL{" "}
                          <span className="font-normal text-slate-400 text-xs ml-1">
                            (optional)
                          </span>
                        </span>
                      </label>
                      <input
                        type="url"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none text-sm"
                        value={formData.stream_url}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stream_url: e.target.value,
                          })
                        }
                        placeholder="https://stream.zeno.fm/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none resize-none text-sm"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Brief description..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 2 ─── */}
              {step === 2 && (
                <div className="max-w-6xl mx-auto">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {isEditMode ? "Manage Songs for" : "Select Songs for"} "
                        {formData.name}"
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {isEditMode
                          ? `${existingSongIds.size} currently mapped. Add or remove as needed.`
                          : "Pick songs from your published releases"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold ${selectedSongIds.size > 0 ? (isEditMode ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700") : "bg-slate-100 text-slate-500"}`}
                      >
                        {selectedSongIds.size} Selected
                      </span>
                      {selectedSongIds.size > 0 && (
                        <button
                          onClick={() => setSelectedSongIds(new Set())}
                          className="text-xs text-red-500 hover:text-red-700 font-bold underline"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditMode && (
                    <div className="flex items-center gap-4 mb-4">
                      {songsToAdd.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                          <Plus size={12} /> {songsToAdd.length} New
                        </div>
                      )}
                      {songsToRemove.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full">
                          <Minus size={12} /> {songsToRemove.length} Removed
                        </div>
                      )}
                      {songsToAdd.length === 0 &&
                        songsToRemove.length === 0 && (
                          <div className="text-xs text-slate-400">
                            No changes
                          </div>
                        )}
                    </div>
                  )}

                  {/* Search + Filters */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        value={songSearch}
                        onChange={(e) => setSongSearch(e.target.value)}
                        placeholder="Search by song title, artist, or album..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {songSearch && (
                        <button
                          onClick={() => setSongSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Filter size={14} className="text-slate-400" />
                      <select
                        value={songLangFilter}
                        onChange={(e) => setSongLangFilter(e.target.value)}
                        className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
                      >
                        {songLanguages.map((l) => (
                          <option key={l} value={l}>
                            {l === "All" ? "All Languages" : l}
                          </option>
                        ))}
                      </select>
                      <select
                        value={songGenreFilter}
                        onChange={(e) => setSongGenreFilter(e.target.value)}
                        className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
                      >
                        {songGenres.map((g) => (
                          <option key={g} value={g}>
                            {g === "All" ? "All Genres" : g}
                          </option>
                        ))}
                      </select>
                      <select
                        value={songFormatFilter}
                        onChange={(e) => setSongFormatFilter(e.target.value)}
                        className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
                      >
                        {songFormats.map((f) => (
                          <option key={f} value={f}>
                            {f === "All" ? "All Formats" : f}
                          </option>
                        ))}
                      </select>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => selectAllVisible(filteredSongIds)}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 underline"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => deselectAllVisible(filteredSongIds)}
                          className="text-[11px] font-bold text-red-500 hover:text-red-700 underline"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Song List */}
                  {loadingSongs && allReleases.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                      <Loader2
                        className="animate-spin text-emerald-600 mb-3"
                        size={36}
                      />
                      <p className="text-sm text-slate-500">
                        Loading releases...
                      </p>
                    </div>
                  ) : filteredSongs.length === 0 ? (
                    <div className="py-16 text-center">
                      <Music2 className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm font-medium">
                        No songs found
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden md:grid grid-cols-[40px_1fr_140px_100px_80px_50px] gap-2 px-4 py-2.5 bg-slate-100 rounded-t-xl border border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <div></div>
                        <div>Song / Album</div>
                        <div>Artist</div>
                        <div>Language</div>
                        <div>Format</div>
                        <div></div>
                      </div>
                      <div
                        className="border border-t-0 border-slate-200 rounded-b-xl overflow-hidden max-h-[420px] overflow-y-auto"
                        style={{ scrollbarWidth: "thin" }}
                      >
                        {filteredSongs.map((song) => {
                          const isSelected = selectedSongIds.has(song.id);
                          const wasExisting = existingSongIds.has(song.id);
                          const isNew = isSelected && !wasExisting;
                          const wasRemoved = !isSelected && wasExisting;
                          return (
                            <div
                              key={song.id}
                              onClick={() => toggleSong(song.id)}
                              className={`grid grid-cols-[40px_1fr_140px_100px_80px_50px] gap-2 items-center px-4 py-2.5 border-b border-slate-100 cursor-pointer transition-all text-sm ${
                                isNew
                                  ? "bg-green-50 border-l-[3px] border-l-green-500"
                                  : wasRemoved
                                    ? "bg-red-50 border-l-[3px] border-l-red-400 opacity-60"
                                    : isSelected
                                      ? "bg-emerald-50 border-l-[3px] border-l-emerald-500"
                                      : "hover:bg-slate-50 border-l-[3px] border-l-transparent"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                                  isSelected
                                    ? isNew
                                      ? "bg-green-500 border-green-500"
                                      : "bg-emerald-500 border-emerald-500"
                                    : "border-slate-300"
                                } text-white`}
                              >
                                {isSelected && (
                                  <Check size={13} strokeWidth={3} />
                                )}
                              </div>
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={
                                    song.cover_url ||
                                    "https://via.placeholder.com/40"
                                  }
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://via.placeholder.com/40";
                                  }}
                                />
                                <div className="min-w-0">
                                  <p
                                    className={`font-semibold truncate text-sm ${isSelected ? (isNew ? "text-green-700" : "text-emerald-700") : "text-slate-900"}`}
                                  >
                                    {song.title}
                                    {isNew && (
                                      <span className="ml-1.5 text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-bold">
                                        NEW
                                      </span>
                                    )}
                                    {wasRemoved && (
                                      <span className="ml-1.5 text-[10px] bg-red-200 text-red-700 px-1.5 py-0.5 rounded font-bold line-through">
                                        REMOVE
                                      </span>
                                    )}
                                  </p>
                                  {song.album_name && (
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {song.album_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 truncate">
                                {song.primary_artist || "—"}
                              </p>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold w-fit">
                                {song.language || "—"}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-fit ${song.format === "Album" ? "bg-blue-50 text-blue-600" : song.format === "Single" ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-500"}`}
                              >
                                {song.format || "—"}
                              </span>
                              <div className="flex justify-center">
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    background: isSelected
                                      ? "#10b981"
                                      : "#cbd5e1",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {hasMoreSongs && (
                        <div className="text-center mt-4">
                          <button
                            onClick={loadMoreSongs}
                            disabled={loadingSongs}
                            className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-50 transition flex items-center gap-2 mx-auto disabled:opacity-50"
                          >
                            {loadingSongs ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Plus size={16} />
                            )}{" "}
                            Load More
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {selectedSongIds.size === 0 &&
                    !loadingSongs &&
                    allReleases.length > 0 && (
                      <div className="flex items-center gap-2 mt-4 text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                        <AlertCircle size={16} className="flex-shrink-0" />{" "}
                        Select at least 1 song.
                      </div>
                    )}
                </div>
              )}

              {/* ─── STEP 3 ─── */}
              {step === 3 && (
                <div className="max-w-2xl mx-auto text-center py-8">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isEditMode ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}
                  >
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {isEditMode ? "Ready to Update" : "Ready to Publish"}
                  </h3>

                  <div className="bg-slate-50 rounded-xl p-5 mb-4 inline-flex items-center gap-4 border border-slate-200">
                    {formData.imagePreview && (
                      <img
                        src={formData.imagePreview}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                      />
                    )}
                    <div className="text-left">
                      <p className="font-bold text-slate-900">
                        {formData.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formData.language} · {formData.genre}
                      </p>
                    </div>
                  </div>

                  {isEditMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
                      <p className="text-xs font-bold text-blue-800 mb-2">
                        Changes
                      </p>
                      <div className="space-y-1">
                        {formData.name !== editingStation.name && (
                          <p className="text-xs text-blue-700 flex items-center gap-1">
                            <ArrowRight size={11} /> Name changed
                          </p>
                        )}
                        {formData.image && (
                          <p className="text-xs text-blue-700 flex items-center gap-1">
                            <ArrowRight size={11} /> Image changed
                          </p>
                        )}
                        {songsToAdd.length > 0 && (
                          <p className="text-xs text-green-700 flex items-center gap-1">
                            <Plus size={11} /> +{songsToAdd.length} songs added
                          </p>
                        )}
                        {songsToRemove.length > 0 && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <Minus size={11} /> -{songsToRemove.length} songs
                            removed
                          </p>
                        )}
                        {formData.name === editingStation.name &&
                          !formData.image &&
                          songsToAdd.length === 0 &&
                          songsToRemove.length === 0 && (
                            <p className="text-xs text-slate-400">No changes</p>
                          )}
                      </div>
                    </div>
                  )}

                  <div
                    className={`${isEditMode ? "bg-blue-50 border-blue-200" : "bg-emerald-50 border-emerald-200"} border rounded-xl p-4 mb-8 text-left`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Music2
                        size={16}
                        className={
                          isEditMode ? "text-blue-600" : "text-emerald-600"
                        }
                      />
                      <span
                        className={`font-bold text-sm ${isEditMode ? "text-blue-800" : "text-emerald-800"}`}
                      >
                        {selectedSongIds.size} Songs
                      </span>
                    </div>
                    <div
                      className="max-h-[160px] overflow-y-auto space-y-1"
                      style={{ scrollbarWidth: "thin" }}
                    >
                      {allReleases
                        .filter((s) => selectedSongIds.has(s.id))
                        .map((song, idx) => {
                          const isNew =
                            isEditMode && !existingSongIds.has(song.id);
                          return (
                            <div
                              key={song.id}
                              className={`flex items-center gap-3 rounded-lg px-3 py-1.5 border ${isNew ? "bg-green-50 border-green-200" : "bg-white border-slate-100"}`}
                            >
                              <span
                                className={`text-[10px] font-bold w-5 text-center ${isNew ? "text-green-600" : "text-emerald-600"}`}
                              >
                                {idx + 1}
                              </span>
                              <img
                                src={
                                  song.cover_url ||
                                  "https://via.placeholder.com/32"
                                }
                                alt=""
                                className="w-7 h-7 rounded object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/32";
                                }}
                              />
                              <p className="text-xs font-semibold text-slate-800 truncate flex-1">
                                {song.title}
                              </p>
                              {isNew && (
                                <span className="text-[9px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-bold">
                                  NEW
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`px-8 py-3 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50 ${isEditMode ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <CheckCircle2 />
                    )}
                    {isEditMode
                      ? `Update Station (${selectedSongIds.size} songs)`
                      : `Publish with ${selectedSongIds.size} Songs`}
                  </button>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="border-t border-slate-200 bg-slate-50 p-4 flex justify-between">
              <button
                onClick={resetForm}
                className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-white transition flex items-center gap-2"
              >
                <ChevronLeft size={18} /> Cancel
              </button>
              {step < 3 && (
                <button
                  onClick={() => {
                    if (step === 1 && !formData.name)
                      return Swal.fire(
                        "Required",
                        "Station name is required.",
                        "warning",
                      );
                    if (step === 1 && !isEditMode && !formData.image)
                      return Swal.fire(
                        "Required",
                        "Cover image is required.",
                        "warning",
                      );
                    if (step === 2 && selectedSongIds.size === 0)
                      return Swal.fire(
                        "Required",
                        "Select at least 1 song.",
                        "warning",
                      );
                    setStep(step + 1);
                  }}
                  className={`px-6 py-2 rounded-lg text-white font-bold flex items-center gap-2 ${isEditMode ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  Next <ChevronRight size={18} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ STATIONS LIST ═══ */}
      {step === 0 && (
        <div>
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stations..."
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {availableLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setFilterLang(lang)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterLang === lang ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-400"}`}
                >
                  {lang === "All" ? (
                    <span className="flex items-center gap-1">
                      <Globe size={12} /> All
                    </span>
                  ) : (
                    lang
                  )}
                </button>
              ))}
            </div>
          </div>

          {fetching ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <RadioIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No Radio Stations Found
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStations.map((station) => (
                <div
                  key={station.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all relative group"
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(station)}
                      className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-all"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteStation(station.id, station.name)
                      }
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    <img
                      src={
                        station.image_url ||
                        "https://via.placeholder.com/400x200"
                      }
                      alt={station.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x200";
                      }}
                    />
                    {station.is_live && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-emerald-500 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase">
                          Live
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 pr-16">
                      {station.name}
                    </h3>
                    {station.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                        {station.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {station.language || "N/A"}
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                        {station.genre || "N/A"}
                      </span>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Headphones size={9} />{" "}
                        {formatCount(station.total_listeners || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RadioAdmin;
