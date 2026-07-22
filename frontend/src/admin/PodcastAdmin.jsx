import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Mic2,
  Play,
  X,
  Upload,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Search,
  Grid3x3,
  List,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

import Swal from "sweetalert2";
import { apiRequest, uploadFileSecure } from "../lib/secureApi";

const PODCAST_TYPES = [
  "Interview",
  "Storytelling",
  "Educational",
  "Tech",
  "Business",
  "Comedy",
  "News",
];

const PodcastAdmin = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    host: "",
    type: "Interview",
    image: null,
    imagePreview: null,
  });

  const [episodes, setEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState({
    title: "",
    episode_number: "",
    audio_url: "",
  });
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [podcasts, setPodcasts] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  // ── READ: still direct via supabase — RLS only allows SELECT ──────
  const fetchPodcasts = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*, podcast_episodes(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPodcasts(data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to load podcasts", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPodcasts();
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

  // ── SECURE: audio upload goes through the backend ──────────────────
  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const publicUrl = await uploadFileSecure(file, "podcast-audio");
      setCurrentEpisode((prev) => ({ ...prev, audio_url: publicUrl }));
    } catch (err) {
      Swal.fire("Upload Failed", err.message, "error");
    } finally {
      setUploadingAudio(false);
    }
  };

  // ── SECURE DELETE via backend ───────────────────────────────────────
  const handleDeletePodcast = async (id, title) => {
    const result = await Swal.fire({
      title: "Delete Podcast?",
      text: `Are you sure you want to delete "${title}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await apiRequest(`/podcasts/${id}`, { method: "DELETE" });
      Swal.fire("Deleted!", `"${title}" has been deleted.`, "success");
      fetchPodcasts();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const addEpisode = () => {
    if (
      !currentEpisode.title ||
      !currentEpisode.audio_url ||
      !currentEpisode.episode_number
    ) {
      return Swal.fire(
        "Required",
        "Episode Title, Number, and Audio are required.",
        "warning",
      );
    }
    if (episodes.length >= 20) {
      return Swal.fire(
        "Limit Reached",
        "You can add up to 20 episodes per podcast.",
        "warning",
      );
    }
    setEpisodes([...episodes, { ...currentEpisode, id: Date.now() }]);
    setCurrentEpisode({ title: "", episode_number: "", audio_url: "" });
  };

  const removeEpisode = (id) => {
    setEpisodes(episodes.filter((ep) => ep.id !== id));
  };

  // ── SECURE SUBMIT: upload cover + create podcast, both via backend ──
  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.host ||
      !formData.image ||
      episodes.length === 0
    ) {
      return Swal.fire(
        "Error",
        "Please provide all details and at least 1 episode.",
        "error",
      );
    }
    setLoading(true);
    try {
      const imgUrl = await uploadFileSecure(formData.image, "podcastcover");

      await apiRequest("/podcasts", {
        method: "POST",
        body: {
          title: formData.title,
          host: formData.host,
          type: formData.type,
          image_url: imgUrl,
          episodes: episodes.map((ep) => ({
            title: ep.title,
            episode_number: ep.episode_number,
            audio_url: ep.audio_url,
          })),
        },
      });

      Swal.fire("Success", "Podcast Created Successfully!", "success");
      resetForm();
      fetchPodcasts();
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
      host: "",
      type: "Interview",
      image: null,
      imagePreview: null,
    });
    setEpisodes([]);
    setCurrentEpisode({ title: "", episode_number: "", audio_url: "" });
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Manage <span className="text-purple-600">Podcasts</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Create and upload new podcast shows.
          </p>
        </div>
        {step === 0 && (
          <button
            onClick={() => setStep(1)}
            className="px-6 py-2 rounded-lg bg-purple-600 text-white font-bold shadow hover:bg-purple-700 transition flex items-center gap-2"
          >
            <Plus size={18} /> Create New Podcast
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
            <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex items-center justify-center gap-8">
              {[
                { id: 1, label: "Podcast Details" },
                { id: 2, label: "Add Episodes" },
                { id: 3, label: "Publish" },
              ].map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${step >= s.id ? "border-purple-600 bg-purple-600 text-white" : "border-gray-300 text-gray-400 bg-white"}`}
                  >
                    {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                  </div>
                  <span
                    className={`text-xs font-bold uppercase ${step >= s.id ? "text-purple-700" : "text-gray-400"}`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-grow p-6 md:p-8 bg-white overflow-y-auto">
              {step === 1 && (
                <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Podcast Cover
                    </h3>
                    <div
                      onClick={() =>
                        document.getElementById("podCoverInput").click()
                      }
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${formData.image ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-purple-400 bg-gray-50"}`}
                    >
                      <input
                        type="file"
                        id="podCoverInput"
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
                      Podcast Info
                    </h3>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Podcast Title *
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="e.g. The Tech Talk Show"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Interviewer Name *
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                        value={formData.host}
                        onChange={(e) =>
                          setFormData({ ...formData, host: e.target.value })
                        }
                        placeholder="e.g. Ranveer Allahbadia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white outline-none"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                      >
                        {PODCAST_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="max-w-5xl mx-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Add Episodes
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${episodes.length === 20 ? "bg-red-100 text-red-600" : "bg-purple-100 text-purple-600"}`}
                    >
                      {episodes.length} / 20 Added
                    </span>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                      <h4 className="font-bold text-gray-900 mb-4">
                        Upload New Episode
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Ep #
                            </label>
                            <input
                              type="number"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                              value={currentEpisode.episode_number}
                              onChange={(e) =>
                                setCurrentEpisode({
                                  ...currentEpisode,
                                  episode_number: e.target.value,
                                })
                              }
                              placeholder="1"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Episode Title *
                            </label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                              value={currentEpisode.title}
                              onChange={(e) =>
                                setCurrentEpisode({
                                  ...currentEpisode,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Intro & Guest Welcome"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Audio File *
                          </label>
                          <label
                            className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer ${currentEpisode.audio_url ? "border-green-400 bg-green-50 text-green-600" : "border-gray-300 hover:border-purple-400 text-gray-500"}`}
                          >
                            {uploadingAudio ? (
                              <Loader2 className="animate-spin" />
                            ) : currentEpisode.audio_url ? (
                              <CheckCircle2 />
                            ) : (
                              <Upload size={18} />
                            )}
                            <span className="text-sm font-medium">
                              {uploadingAudio
                                ? "Uploading..."
                                : currentEpisode.audio_url
                                  ? "Audio Uploaded"
                                  : "Click to upload audio"}
                            </span>
                            <input
                              type="file"
                              hidden
                              accept="audio/*"
                              onChange={handleAudioUpload}
                              disabled={uploadingAudio}
                            />
                          </label>
                        </div>

                        <button
                          onClick={addEpisode}
                          className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 flex items-center justify-center gap-2"
                        >
                          <Plus size={16} /> Add to Episode List
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                      <div className="bg-slate-50 p-3 border-b font-bold text-sm text-gray-700 sticky top-0">
                        Current Episodes
                      </div>
                      {episodes.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                          No episodes added yet
                        </div>
                      ) : (
                        episodes.map((ep) => (
                          <div
                            key={ep.id}
                            className="flex items-center gap-3 p-3 border-b border-slate-100"
                          >
                            <span className="text-purple-600 font-bold text-xs w-6">
                              {ep.episode_number}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {ep.title}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                Audio ready to publish
                              </p>
                            </div>
                            <button
                              onClick={() => removeEpisode(ep.id)}
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

              {step === 3 && (
                <div className="max-w-2xl mx-auto text-center py-10">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Ready to Publish</h3>
                  <p className="text-slate-500 mb-2">
                    Podcast: "<strong>{formData.title}</strong>"
                  </p>
                  <p className="text-slate-500 mb-1">
                    Interviewer: <strong>{formData.host}</strong>
                  </p>
                  <p className="text-slate-500 mb-8">
                    {episodes.length} Episodes Ready
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
                    Publish Podcast
                  </button>
                </div>
              )}
            </div>

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
                    if (
                      step === 1 &&
                      (!formData.title || !formData.host || !formData.image)
                    )
                      return Swal.fire(
                        "Required",
                        "Title, Interviewer Name, and Cover are required.",
                        "warning",
                      );
                    if (step === 2 && episodes.length === 0)
                      return Swal.fire(
                        "Required",
                        "Please add at least one episode.",
                        "warning",
                      );
                    setStep(step + 1);
                  }}
                  className="px-6 py-2 rounded-lg bg-purple-600 text-white font-bold flex items-center gap-2 hover:bg-purple-700"
                >
                  Next <ChevronRight size={18} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 0 && (
        <div>
          {fetching ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-purple-600" size={40} />
            </div>
          ) : podcasts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <Mic2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No Podcasts Found
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {podcasts.map((pod) => (
                <div
                  key={pod.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex gap-4 hover:shadow-md transition-all relative"
                >
                  <button
                    onClick={() => handleDeletePodcast(pod.id, pod.title)}
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all z-10"
                    title="Delete Podcast"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                    <img
                      src={pod.image_url || "https://via.placeholder.com/100"}
                      alt={pod.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center flex-grow min-w-0 pr-8">
                    <h3 className="font-bold text-slate-900 line-clamp-1">
                      {pod.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-1">
                      Interviewer: {pod.host}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold w-fit">
                        {pod.podcast_episodes?.length || 0} Episodes
                      </span>
                      <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold w-fit">
                        {pod.total_listens || 0} Listens
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

export default PodcastAdmin;
