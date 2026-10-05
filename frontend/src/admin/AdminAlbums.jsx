import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  Loader2,
  Disc3,
  X,
  Edit3,
  EyeOff,
  Eye,
  Plus,
  Music2,
  AlertCircle,
  CheckCircle2,
  Save,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Swal from "sweetalert2";

import { supabase } from "../lib/supabaseClient";
import { genres } from "../lib/subgener";
import { validateCoverFile, validateAudioFile } from "../lib/mediaValidation";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/content`;
const MAX_ALBUM_TRACKS = 10;

const LANGUAGES = [
  "Hindi", "Tamil", "Telugu", "English", "Punjabi", "Marathi", "Gujarati",
  "Bengali", "Kannada", "Bhojpuri", "Malayalam", "Sanskrit", "Haryanvi",
  "Rajasthani", "Odia", "Assamese", "Urdu", "Arabic", "Spanish", "Garhwali",
  "Himachali",
];

// ─── API helpers (authenticated) ───
const getToken = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("You are not logged in. Please log in again.");
  return token;
};

const api = async (path, { method = "GET", body } = {}) => {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    /* no body */
  }
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json;
};

// Uploads through the validated release uploader (JPG poster / WAV audio).
const uploadValidated = async (file, kind) => {
  const token = await getToken();
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Upload failed.");
  if (!json.publicUrl) throw new Error("Server did not return a file URL.");
  return json.publicUrl;
};

const albumIdsQuery = (a) => `ids=${(a.track_ids || []).join(",")}`;

const statusStyle = (s) =>
  s === "Published"
    ? "bg-green-100 text-green-700"
    : s === "Draft"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-600";

const inputCls =
  "w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm";
const labelCls =
  "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

// ═══════════════════════════════════════════
// ALBUM EDITOR MODAL
// ═══════════════════════════════════════════
const AlbumEditor = ({ album, onClose, onChanged }) => {
  const coverRef = useRef();
  const [details, setDetails] = useState({
    album_name: album.album_name,
    album_cover_url: album.album_cover_url || "",
    release_date: album.release_date || "",
    copyright_holder: album.copyright_holder || "",
    copyright_year: album.copyright_year || "",
    publisher: album.publisher || "",
    lyrics: album.lyrics || "",
  });
  const [tracks, setTracks] = useState(album.tracks || []);
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [newTrack, setNewTrack] = useState(null);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2500);
  };

  const handleCover = async (file) => {
    if (!file) return;
    setError("");
    const problem = await validateCoverFile(file);
    if (problem) return setError(problem);
    setUploadingCover(true);
    try {
      const url = await uploadValidated(file, "release_cover");
      setDetails((d) => ({ ...d, album_cover_url: url }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const saveDetails = async () => {
    setError("");
    if (!details.album_name.trim()) return setError("Album name is required.");
    setSavingDetails(true);
    try {
      await api("/albums", {
        method: "PUT",
        body: {
          ids: tracks.map((t) => t.id),
          updates: {
            album_name: details.album_name,
            // only sent when the poster was actually replaced
            album_cover_url:
              details.album_cover_url &&
              details.album_cover_url !== (album.album_cover_url || "")
                ? details.album_cover_url
                : undefined,
            release_date: details.release_date,
            copyright_holder: details.copyright_holder,
            copyright_year: details.copyright_year,
            publisher: details.publisher,
            lyrics: details.lyrics,
          },
        },
      });
      flash("Album details saved.");
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingDetails(false);
    }
  };

  const patchTrackLocal = (id, k, v) =>
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, [k]: v } : t)));

  const saveTrack = async (t) => {
    setError("");
    setBusyId(t.id);
    try {
      await api(`/albums/tracks/${t.id}`, {
        method: "PUT",
        body: {
          title: t.title,
          primary_artist: t.primary_artist,
          language: t.language,
          genre: t.genre,
          track_number: Number(t.track_number) || null,
          status: t.status,
        },
      });
      flash(`"${t.title}" saved.`);
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const replaceAudio = async (t, file) => {
    if (!file) return;
    setError("");
    const problem = await validateAudioFile(file);
    if (problem) return setError(problem);
    setBusyId(t.id);
    try {
      const url = await uploadValidated(file, "release_audio");
      await api(`/albums/tracks/${t.id}`, {
        method: "PUT",
        body: { audio_url: url },
      });
      patchTrackLocal(t.id, "audio_url", url);
      flash(`Audio replaced for "${t.title}".`);
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteTrack = async (t) => {
    const r = await Swal.fire({
      title: "Delete track?",
      text: `"${t.title}" will be permanently removed from this album.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete track",
    });
    if (!r.isConfirmed) return;
    setBusyId(t.id);
    try {
      await api(`/albums/tracks/${t.id}`, { method: "DELETE" });
      setTracks((prev) => prev.filter((x) => x.id !== t.id));
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const addTrack = async () => {
    setError("");
    const n = newTrack;
    if (!n.title.trim() || !n.primary_artist.trim() || !n.language || !n.genre || !n.audio_url) {
      return setError("Title, artist, language, genre and a WAV audio file are required.");
    }
    if (!(details.album_cover_url || "").includes("/validated/")) {
      return setError(
        "To add a track, first replace this album's poster with a JPG (min 3000 × 3000 px) and save the album details.",
      );
    }
    setBusyId("new");
    try {
      const nextNo = Math.max(0, ...tracks.map((t) => Number(t.track_number) || 0)) + 1;
      const res = await api("/releases", {
        method: "POST",
        body: {
          title: n.title,
          primary_artist: n.primary_artist,
          genre: n.genre,
          language: n.language,
          format: "Album",
          cover_url: details.album_cover_url,
          audio_url: n.audio_url,
          lyrics: details.lyrics || null,
          copyright_holder: details.copyright_holder || null,
          copyright_year: details.copyright_year || null,
          publisher: details.publisher || null,
          status: album.status === "Published" ? "Published" : "Draft",
          track_number: nextNo,
          album_name: details.album_name.trim(),
          album_cover_url: details.album_cover_url,
          release_date: details.release_date || new Date().toISOString().split("T")[0],
          play_count: 0,
          listeners_count: 0,
        },
      });
      setTracks((prev) => [...prev, res.release]);
      setNewTrack(null);
      flash("Track added.");
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const uploadNewTrackAudio = async (file) => {
    if (!file) return;
    setError("");
    const problem = await validateAudioFile(file);
    if (problem) return setError(problem);
    setNewTrack((n) => ({ ...n, uploading: true }));
    try {
      const url = await uploadValidated(file, "release_audio");
      setNewTrack((n) => ({ ...n, audio_url: url, audio_name: file.name }));
    } catch (e) {
      setError(e.message);
    } finally {
      setNewTrack((n) => ({ ...n, uploading: false }));
    }
  };

  const sortedTracks = [...tracks].sort(
    (a, b) => (a.track_number || 0) - (b.track_number || 0),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Disc3 size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Manage Album
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {album.album_name} · {tracks.length}{" "}
                {tracks.length === 1 ? "track" : "tracks"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
              <CheckCircle2 size={16} className="flex-shrink-0" /> {notice}
            </div>
          )}

          {/* ── Album details ── */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5">
              Album details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-[176px_1fr] gap-6">
              {/* Poster */}
              <div>
                <div
                  onClick={() => !uploadingCover && coverRef.current?.click()}
                  className="relative group w-44 h-44 mx-auto md:mx-0 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 cursor-pointer hover:border-blue-400 bg-slate-50"
                >
                  {details.album_cover_url ? (
                    <img
                      src={details.album_cover_url}
                      alt="cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={36} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    {uploadingCover ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Change poster"
                    )}
                  </div>
                  <input
                    ref={coverRef}
                    type="file"
                    accept=".jpg,.jpeg,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      handleCover(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 text-center md:text-left">
                  JPG only · min 3000 × 3000 px
                </p>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 content-start">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Album name</label>
                  <input
                    className={inputCls}
                    value={details.album_name}
                    onChange={(e) =>
                      setDetails({ ...details, album_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Release date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={details.release_date}
                    onChange={(e) =>
                      setDetails({ ...details, release_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Publisher</label>
                  <input
                    className={inputCls}
                    value={details.publisher}
                    onChange={(e) =>
                      setDetails({ ...details, publisher: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Copyright holder</label>
                  <input
                    className={inputCls}
                    value={details.copyright_holder}
                    onChange={(e) =>
                      setDetails({
                        ...details,
                        copyright_holder: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Copyright year</label>
                  <input
                    className={inputCls}
                    value={details.copyright_year}
                    onChange={(e) =>
                      setDetails({ ...details, copyright_year: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Album lyrics (applies to all tracks)
                  </label>
                  <textarea
                    rows={3}
                    className={`${inputCls} resize-none`}
                    value={details.lyrics}
                    onChange={(e) =>
                      setDetails({ ...details, lyrics: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-5 pt-5 border-t border-slate-100">
              <button
                onClick={saveDetails}
                disabled={savingDetails || uploadingCover}
                className="h-10 px-5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
              >
                {savingDetails ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save album details
              </button>
            </div>
          </section>

          {/* ── Tracks ── */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Music2 size={16} className="text-blue-500" />
                Tracks
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs normal-case tracking-normal">
                  {tracks.length} / {MAX_ALBUM_TRACKS}
                </span>
              </h4>
              <button
                onClick={() =>
                  setNewTrack({
                    title: "",
                    primary_artist: album.primary_artist || "",
                    language: "",
                    genre: "",
                    audio_url: "",
                    audio_name: "",
                    uploading: false,
                  })
                }
                disabled={tracks.length >= MAX_ALBUM_TRACKS || !!newTrack}
                className="h-9 px-4 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-40 flex items-center gap-1.5"
              >
                <Plus size={14} />
                {tracks.length >= MAX_ALBUM_TRACKS
                  ? "Track limit reached (10)"
                  : "Add track"}
              </button>
            </div>

            {newTrack && (
              <div className="border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-xl p-4 mb-4 space-y-4">
                <p className="text-sm font-semibold text-blue-700">New track</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Title *</label>
                    <input
                      className={inputCls}
                      value={newTrack.title}
                      onChange={(e) =>
                        setNewTrack({ ...newTrack, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Artist *</label>
                    <input
                      className={inputCls}
                      value={newTrack.primary_artist}
                      onChange={(e) =>
                        setNewTrack({
                          ...newTrack,
                          primary_artist: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Language *</label>
                    <select
                      className={inputCls}
                      value={newTrack.language}
                      onChange={(e) =>
                        setNewTrack({ ...newTrack, language: e.target.value })
                      }
                    >
                      <option value="">Select</option>
                      {LANGUAGES.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Genre *</label>
                    <select
                      className={inputCls}
                      value={newTrack.genre}
                      onChange={(e) =>
                        setNewTrack({ ...newTrack, genre: e.target.value })
                      }
                    >
                      <option value="">Select</option>
                      {genres.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-3 text-sm cursor-pointer text-slate-600">
                  <span className="h-9 px-3 bg-white border border-slate-300 rounded-lg font-semibold flex items-center gap-1.5 flex-shrink-0">
                    {newTrack.uploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {newTrack.audio_name ? "Change WAV" : "Upload WAV"}
                  </span>
                  <span className="truncate">
                    {newTrack.audio_name || "WAV only · Max 200MB"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".wav,audio/wav,audio/x-wav,audio/wave"
                    onChange={(e) => {
                      uploadNewTrackAudio(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setNewTrack(null)}
                    className="h-9 px-4 text-sm font-semibold rounded-lg text-slate-600 hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTrack}
                    disabled={busyId === "new" || newTrack.uploading}
                    className="h-9 px-4 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
                  >
                    {busyId === "new" && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Save track
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {sortedTracks.map((t) => (
                <div
                  key={t.id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/50"
                >
                  <div className="grid grid-cols-12 gap-x-4 gap-y-3">
                    <div className="col-span-4 sm:col-span-2 lg:col-span-1">
                      <label className={labelCls}>No.</label>
                      <input
                        type="number"
                        min="1"
                        className={inputCls}
                        value={t.track_number || ""}
                        onChange={(e) =>
                          patchTrackLocal(t.id, "track_number", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-8 sm:col-span-10 lg:col-span-6">
                      <label className={labelCls}>Title</label>
                      <input
                        className={inputCls}
                        value={t.title || ""}
                        onChange={(e) =>
                          patchTrackLocal(t.id, "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-12 lg:col-span-5">
                      <label className={labelCls}>Artist</label>
                      <input
                        className={inputCls}
                        value={t.primary_artist || ""}
                        onChange={(e) =>
                          patchTrackLocal(t.id, "primary_artist", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-4">
                      <label className={labelCls}>Language</label>
                      <select
                        className={inputCls}
                        value={t.language || ""}
                        onChange={(e) =>
                          patchTrackLocal(t.id, "language", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        {LANGUAGES.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-12 sm:col-span-4">
                      <label className={labelCls}>Genre</label>
                      <select
                        className={inputCls}
                        value={t.genre || ""}
                        onChange={(e) =>
                          patchTrackLocal(t.id, "genre", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        {genres.map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-12 sm:col-span-4">
                      <label className={labelCls}>Status</label>
                      <select
                        className={inputCls}
                        value={t.status || "Draft"}
                        onChange={(e) =>
                          patchTrackLocal(t.id, "status", e.target.value)
                        }
                      >
                        <option>Published</option>
                        <option>Draft</option>
                      </select>
                    </div>
                  </div>
                  {t.audio_url && (
                    <audio
                      controls
                      src={t.audio_url}
                      key={t.audio_url}
                      className="w-full mt-4"
                      style={{ height: 36 }}
                    />
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200">
                    <label className="h-9 px-3 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 flex items-center gap-1.5">
                      <Upload size={13} /> Replace audio (WAV)
                      <input
                        type="file"
                        className="hidden"
                        accept=".wav,audio/wav,audio/x-wav,audio/wave"
                        onChange={(e) => {
                          replaceAudio(t, e.target.files[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      {busyId === t.id && (
                        <Loader2
                          size={16}
                          className="animate-spin text-blue-500"
                        />
                      )}
                      <button
                        onClick={() => deleteTrack(t)}
                        disabled={busyId === t.id}
                        className="h-9 px-3 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                      <button
                        onClick={() => saveTrack(t)}
                        disabled={busyId === t.id}
                        className="h-9 px-3 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Save size={13} /> Save track
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {tracks.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">
                  This album has no tracks. Deleting the album will remove it
                  from the list.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 bg-white border-t border-slate-200">
          <button
            onClick={onClose}
            className="h-9 px-5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════
const AdminAlbums = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editing, setEditing] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  const fetchAlbums = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api("/albums");
      setAlbums(res.albums || []);
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const keyOf = (a) => (a.track_ids || []).join(",");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return albums.filter((a) => {
      const matchQ =
        !q ||
        a.album_name.toLowerCase().includes(q) ||
        (a.primary_artist || "").toLowerCase().includes(q);
      const matchS = statusFilter === "All" || a.status === statusFilter;
      return matchQ && matchS;
    });
  }, [albums, search, statusFilter]);

  const toggleStatus = async (a) => {
    const next = a.status === "Published" ? "Draft" : "Published";
    const r = await Swal.fire({
      title: next === "Draft" ? "Remove album from the site?" : "Publish album?",
      text:
        next === "Draft"
          ? `"${a.album_name}" will be hidden from listeners. You can publish it again any time.`
          : `"${a.album_name}" will become visible to listeners.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: next === "Draft" ? "Remove from site" : "Publish",
    });
    if (!r.isConfirmed) return;
    setBusyKey(keyOf(a));
    try {
      await api("/albums", {
        method: "PUT",
        body: { ids: a.track_ids, updates: { status: next } },
      });
      await fetchAlbums(true);
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setBusyKey(null);
    }
  };

  const deleteAlbum = async (a) => {
    const r = await Swal.fire({
      title: "Delete album permanently?",
      html: `<p><strong>${a.album_name.replace(/</g, "&lt;")}</strong> and all ${a.track_count} of its tracks will be deleted.</p><p style="color:#ef4444;font-size:12px;margin-top:8px">This cannot be undone.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete album",
    });
    if (!r.isConfirmed) return;
    setBusyKey(keyOf(a));
    try {
      await api(`/albums?${albumIdsQuery(a)}`, { method: "DELETE" });
      Swal.fire("Deleted", `"${a.album_name}" has been deleted.`, "success");
      await fetchAlbums(true);
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setBusyKey(null);
    }
  };

  const publishedCount = albums.filter((a) => a.status === "Published").length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Albums <span className="text-blue-600">Management</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            View, edit, remove or delete released albums and manage their
            tracks.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
            {albums.length} {albums.length === 1 ? "album" : "albums"}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700">
            {publishedCount} published
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white border border-slate-200 rounded-2xl p-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by album or artist…"
            className="w-full h-10 pl-10 pr-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white sm:w-44"
        >
          {["All", "Published", "Draft", "Mixed"].map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
          <Disc3 size={40} className="mx-auto mb-3" />
          No albums found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((a) => {
              const busy = busyKey === keyOf(a);
              return (
                <motion.div
                  key={keyOf(a)}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4 p-4 flex-1">
                    <div className="w-28 h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {a.album_cover_url ? (
                        <img
                          src={a.album_cover_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Disc3 size={32} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="font-bold text-slate-900 leading-snug line-clamp-2"
                          title={a.album_name}
                        >
                          {a.album_name}
                        </h3>
                        <span
                          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle(a.status)}`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate mt-0.5">
                        {a.primary_artist || "—"}
                      </p>
                      <div className="mt-auto pt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <Music2 size={12} />
                        {a.track_count}{" "}
                        {a.track_count === 1 ? "track" : "tracks"}
                        {a.release_date ? ` · ${a.release_date}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50">
                    <button
                      onClick={() => setEditing(a)}
                      disabled={busy}
                      className="h-9 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <Edit3 size={13} /> Manage
                    </button>
                    <button
                      onClick={() => toggleStatus(a)}
                      disabled={busy}
                      className="h-9 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      {a.status === "Published" ? (
                        <>
                          <EyeOff size={13} /> Remove
                        </>
                      ) : (
                        <>
                          <Eye size={13} /> Publish
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteAlbum(a)}
                      disabled={busy}
                      className="h-9 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      {busy ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}{" "}
                      Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {editing && (
        <AlbumEditor
          key={keyOf(editing)}
          album={editing}
          onClose={() => setEditing(null)}
          onChanged={() => fetchAlbums(true)}
        />
      )}
    </div>
  );
};

export default AdminAlbums;
