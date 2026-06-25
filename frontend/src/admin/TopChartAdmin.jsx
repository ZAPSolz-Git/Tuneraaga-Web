import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Music,
  X,
  Upload,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Search,
  ListMusic,
  Edit,
  Grid3x3,
  List,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient"; // Adjust import path as needed
import Swal from "sweetalert2";

const BUCKET_NAME = "TuneRaaga";

const CHART_TYPES = [
  "Top 50",
  "Trending",
  "Most Searched",
  "Decade Hits",
  "Mood",
  "Weekly Top",
];
const LANGUAGES = [
  "Hindi",
  "English",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Bhojpuri",
  "International",
];

const TopChartAdmin = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    type: "Top 50",
    language: "Hindi",
    image: null,
    imagePreview: null,
  });

  const [allReleases, setAllReleases] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [charts, setCharts] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  const fetchCharts = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("charts")
        .select("*, chart_songs(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCharts(data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to load charts", "error");
    } finally {
      setFetching(false);
    }
  };

  const fetchReleases = async () => {
    try {
      const { data, error } = await supabase
        .from("releases")
        .select(
          "id, title, primary_artist, featuring_artists, album_name, cover_url, audio_url",
        )
        .eq("status", "Published");
      if (error) throw error;
      setAllReleases(data || []);
    } catch (err) {
      console.error("Error fetching releases:", err);
    }
  };

  useEffect(() => {
    fetchCharts();
    fetchReleases();
  }, []);

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

  const addSong = (song) => {
    if (selectedSongs.length >= 20) {
      Swal.fire(
        "Limit Reached",
        "You can only add up to 20 songs per chart.",
        "warning",
      );
      return;
    }
    if (!selectedSongs.find((s) => s.id === song.id)) {
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  const removeSong = (id) => {
    setSelectedSongs(selectedSongs.filter((s) => s.id !== id));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image || selectedSongs.length === 0) {
      return Swal.fire(
        "Error",
        "Please provide Title, Cover, and at least 1 song.",
        "error",
      );
    }
    setLoading(true);
    try {
      // 1. Upload Image
      const fileName = `topchartscover/${Date.now()}-${formData.image.name}`;
      const { data: imgData, error: imgError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, formData.image);
      if (imgError) throw imgError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imgData.path);

      // 2. Insert Chart
      const { data: newChart, error: chartError } = await supabase
        .from("charts")
        .insert({
          title: formData.title,
          type: formData.type,
          language: formData.language,
          image_url: publicUrl,
        })
        .select()
        .single();
      if (chartError) throw chartError;

      // 3. Insert Chart Songs
      const chartSongsPayload = selectedSongs.map((song) => ({
        chart_id: newChart.id,
        title: song.title,
        artist: song.primary_artist,
        featuring_artists: song.featuring_artists || null,
        album_name: song.album_name || null,
        cover_url: song.cover_url || null,
        audio_url: song.audio_url,
        release_id: song.id,
      }));

      const { error: songsError } = await supabase
        .from("chart_songs")
        .insert(chartSongsPayload);
      if (songsError) throw songsError;

      Swal.fire("Success", "Chart Created Successfully!", "success");
      resetForm();
      fetchCharts();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setFormData({
      title: "",
      type: "Top 50",
      language: "Hindi",
      image: null,
      imagePreview: null,
    });
    setSelectedSongs([]);
  };

  const filteredReleases = allReleases.filter(
    (rel) =>
      rel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.primary_artist.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Manage <span className="text-blue-600">Top Charts</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Create charts using your released songs.
          </p>
        </div>
        {step === 0 && (
          <button
            onClick={() => setStep(1)}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={18} /> Create New Chart
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[500px] flex flex-col mb-8"
          >
            {/* Steps Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex items-center justify-center gap-8">
              {[
                { id: 1, label: "Chart Details" },
                { id: 2, label: "Add Songs" },
                { id: 3, label: "Publish" },
              ].map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${step >= s.id ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 text-gray-400 bg-white"}`}
                  >
                    {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                  </div>
                  <span
                    className={`text-xs font-bold uppercase ${step >= s.id ? "text-blue-700" : "text-gray-400"}`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-grow p-6 md:p-8 bg-white overflow-y-auto">
              {/* Step 1: Details & Cover */}
              {step === 1 && (
                <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Chart Cover
                    </h3>
                    <div
                      onClick={() =>
                        document.getElementById("chartCoverInput").click()
                      }
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${formData.image ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400 bg-gray-50"}`}
                    >
                      <input
                        type="file"
                        id="chartCoverInput"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      {formData.imagePreview ? (
                        <img
                          src={formData.imagePreview}
                          alt="Preview"
                          className="w-40 h-40 object-cover rounded-lg shadow-md mx-auto"
                        />
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-900 font-medium text-sm">
                            Click to upload cover
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Min 300x300px recommended
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Chart Info
                    </h3>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Chart Title *
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="e.g. Top 50 Hits 2024"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white outline-none"
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value })
                          }
                        >
                          {CHART_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Language
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white outline-none"
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
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Select Songs */}
              {step === 2 && (
                <div className="max-w-5xl mx-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Select Released Songs
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${selectedSongs.length === 20 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {selectedSongs.length} / 20 Selected
                    </span>
                  </div>

                  <div className="relative mb-6">
                    <Search
                      className="absolute left-4 top-3 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search by song title or artist..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Search Results */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                      <div className="bg-slate-50 p-3 border-b font-bold text-sm text-gray-700 sticky top-0">
                        Available Songs
                      </div>
                      {filteredReleases.map((song) => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={
                                song.cover_url ||
                                "https://via.placeholder.com/40"
                              }
                              className="w-10 h-10 rounded-md object-cover"
                              alt=""
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {song.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {song.primary_artist}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => addSong(song)}
                            className="ml-2 p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Selected List */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                      <div className="bg-slate-50 p-3 border-b font-bold text-sm text-gray-700 sticky top-0">
                        Selected Tracks
                      </div>
                      {selectedSongs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                          No songs selected yet
                        </div>
                      ) : (
                        selectedSongs.map((song, idx) => (
                          <div
                            key={song.id}
                            className="flex items-center gap-3 p-3 border-b border-slate-100"
                          >
                            <span className="text-gray-400 font-bold text-xs w-4">
                              {idx + 1}
                            </span>
                            <img
                              src={
                                song.cover_url ||
                                "https://via.placeholder.com/40"
                              }
                              className="w-10 h-10 rounded-md object-cover"
                              alt=""
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {song.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {song.primary_artist}
                              </p>
                            </div>
                            <button
                              onClick={() => removeSong(song.id)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-full"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Publish */}
              {step === 3 && (
                <div className="max-w-2xl mx-auto text-center py-10">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Ready to Publish</h3>
                  <p className="text-slate-500 mb-2">
                    Chart: "<strong>{formData.title}</strong>"
                  </p>
                  <p className="text-slate-500 mb-8">
                    {selectedSongs.length} Songs Ready
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 flex items-center gap-2 mx-auto"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <CheckCircle2 />
                    )}
                    Publish Chart
                  </button>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-slate-200 bg-slate-50 p-4 flex justify-between">
              <button
                onClick={() => (step === 1 ? resetForm() : setStep(step - 1))}
                className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-white transition"
              >
                {step === 1 ? "Cancel" : "Previous"}
              </button>
              {step < 3 && (
                <button
                  onClick={() => {
                    if (step === 1 && (!formData.title || !formData.image))
                      return Swal.fire(
                        "Required",
                        "Title and Cover are required.",
                        "warning",
                      );
                    if (step === 2 && selectedSongs.length === 0)
                      return Swal.fire(
                        "Required",
                        "Please add at least one song.",
                        "warning",
                      );
                    setStep(step + 1);
                  }}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-2 hover:bg-blue-700"
                >
                  Next <ChevronRight size={18} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard List */}
      {step === 0 && (
        <div>
          {fetching ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : charts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <Music className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No Charts Found
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {charts.map((chart) => (
                <div
                  key={chart.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex gap-4 hover:shadow-md transition-all"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                    <img
                      src={chart.image_url || "https://via.placeholder.com/100"}
                      alt={chart.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center flex-grow min-w-0">
                    <h3 className="font-bold text-slate-900 line-clamp-1">
                      {chart.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-1">
                      {chart.type} • {chart.language}
                    </p>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold w-fit">
                      {chart.chart_songs?.length || 0} Tracks
                    </span>
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

export default TopChartAdmin;
