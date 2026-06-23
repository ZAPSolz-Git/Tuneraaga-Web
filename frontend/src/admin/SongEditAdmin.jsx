import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  Music,
  Image,
  Film,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Disc3,
  FileText,
  Upload,
  Check,
  User,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { genres, getSubgenres } from "../lib/subgener";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
const STATUS_OPTIONS = ["Published", "Draft", "Unlisted"];

const getMimeType = (ext) => {
  const map = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    flac: "audio/flac",
    aac: "audio/aac",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    opus: "audio/opus",
  };
  return map[ext?.toLowerCase()] || "audio/mpeg";
};

// ─── ROBUST: CONVERT ANY FORMAT → ARRAY ───
// Handles: null, undefined, "", " ", "A, B", ["A","B"], already array
const strToArray = (val) => {
  // Already an array — return a clean copy
  if (Array.isArray(val)) {
    return val.map((s) => String(s).trim()).filter(Boolean);
  }
  // null, undefined, number, boolean, empty
  if (
    val == null ||
    val === "" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    return [];
  }
  // Force to string, trim, split by comma, clean each item
  const str = String(val).trim();
  if (str === "") return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

// ─── ROBUST: CONVERT ARRAY → DB STRING ───
const arrayToStr = (arr) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
  const cleaned = arr.map((s) => String(s).trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  return cleaned.join(", ");
};

const StatusBadge = ({ status }) => {
  const map = {
    Published: "bg-green-100 text-green-700 border-green-200",
    Draft: "bg-slate-100 text-slate-600 border-slate-200",
    Unlisted: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[status] || map.Draft}`}
    >
      {status || "Draft"}
    </span>
  );
};

// ─── INLINE IMAGE UPLOAD ───
const InlineImageUpload = ({ value, onChange, label }) => {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(value || "");

  useEffect(() => setPreview(value || ""), [value]);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const path = `covers/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("music-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from("music-assets").getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("Public URL nahi mila");
      onChange(data.publicUrl);
      setPreview(data.publicUrl);
    } catch (e) {
      setError("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div
          onClick={() => !uploading && ref.current?.click()}
          className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 cursor-pointer hover:border-teal-400 transition-colors flex-shrink-0 bg-slate-50"
        >
          {preview ? (
            <img
              src={preview}
              className="w-full h-full object-cover"
              alt=""
              onError={() => setPreview("")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image size={20} className="text-slate-300" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={value || ""}
            onChange={(e) => {
              onChange(e.target.value);
              setPreview(e.target.value);
              setError("");
            }}
            placeholder="Paste image URL or click thumbnail to upload"
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            {uploading
              ? "Uploading… please wait"
              : "Click thumbnail to upload · or paste URL"}
          </p>
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 mt-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// ─── INLINE AUDIO UPLOAD ───
const InlineAudioUpload = ({ value, onChange }) => {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setFileName(file.name);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const mimeType = getMimeType(ext);
      const path = `audio/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("music-assets")
        .upload(path, file, {
          upsert: true,
          contentType: mimeType,
          cacheControl: "3600",
        });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage
        .from("music-assets")
        .getPublicUrl(uploadData?.path || path);
      if (!data?.publicUrl) throw new Error("Public URL nahi mila");
      onChange(data.publicUrl);
      setFileName("✓ " + file.name);
    } catch (e) {
      setError(e.message);
      setFileName("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        Audio File
      </label>
      <div className="flex items-center gap-2 mb-2">
        <input
          value={value || ""}
          onChange={(e) => {
            onChange(e.target.value);
            setError("");
          }}
          placeholder="Audio URL paste karo ya upload karo"
          className="flex-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => !uploading && ref.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 px-3 py-2 bg-teal-500 text-white text-xs font-bold rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {uploading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Upload size={13} />
          )}
          {uploading ? "..." : "Upload"}
        </button>
        <input
          ref={ref}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
      {fileName && !uploading && (
        <p className="text-[10px] text-teal-600 mb-1">{fileName}</p>
      )}
      {error && (
        <div className="flex items-start gap-2 mt-1 text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>{error} — Supabase storage bucket check karo</span>
        </div>
      )}
      {value && !uploading && (
        <audio
          controls
          src={value}
          key={value}
          className="w-full rounded-lg mt-2"
          style={{ height: 36 }}
        />
      )}
    </div>
  );
};

// ─── EDIT TAG INPUT ───
const EditTagInput = ({ label, tags, onAdd, onRemove, placeholder }) => {
  const [val, setVal] = useState("");

  const add = () => {
    const v = val.trim();
    if (!v) return;
    if (tags.includes(v)) {
      setVal("");
      return;
    }
    onAdd(v);
    setVal("");
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <div className="flex gap-1 mb-1.5">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder || "Type aur Enter dabao"}
          className="flex-1 p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="bg-teal-500 text-white px-2 rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      {/* ── TAGS: Show count even if 0 so user knows field is loaded ── */}
      {tags.length === 0 ? (
        <p className="text-[10px] text-slate-300 italic">No items added yet</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 bg-teal-100 text-teal-700 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              >
                {t}
                <button
                  type="button"
                  onClick={() => onRemove(t)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Saved: {tags.join(", ")}
          </p>
        </>
      )}
    </div>
  );
};

// ─── EDIT MODAL ───
const EditModal = ({ song, onClose, onSaved }) => {
  // ── DEBUG: Log raw values to verify data from DB ──
  console.log("EDIT MODAL — raw song data:", {
    id: song.id,
    featuring_artists_raw: song.featuring_artists,
    featuring_artists_type: typeof song.featuring_artists,
    actor_names_raw: song.actor_names,
    actor_names_type: typeof song.actor_names,
    movie_name_raw: song.movie_name,
    album_name_raw: song.album_name,
  });

  const [form, setForm] = useState({
    title: song.title || "",
    primary_artist: song.primary_artist || "",
    featuring_artists: strToArray(song.featuring_artists),
    actor_names: strToArray(song.actor_names),
    movie_name: song.movie_name || "",
    album_name: song.album_name || "",
    album_cover_url: song.album_cover_url || "",
    genre: song.genre || "",
    subgenre: song.subgenre || "",
    language: song.language || "",
    status: song.status || "Published",
    track_number: song.track_number || 1,
    cover_url: song.cover_url || "",
    audio_url: song.audio_url || "",
    lyrics: song.lyrics || "",
    copyright_holder: song.copyright_holder || "",
    copyright_year: song.copyright_year || String(new Date().getFullYear()),
    publisher: song.publisher || "",
    format: song.format || "Single",
  });

  // ── DEBUG: Log parsed values ──
  console.log("EDIT MODAL — parsed arrays:", {
    featuring_artists: form.featuring_artists,
    actor_names: form.actor_names,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const currentSubgenres = getSubgenres(form.genre);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        title: form.title,
        primary_artist: form.primary_artist,
        featuring_artists: arrayToStr(form.featuring_artists),
        actor_names: arrayToStr(form.actor_names),
        movie_name: form.movie_name || null,
        album_name: form.album_name || null,
        album_cover_url: form.album_cover_url || null,
        genre: form.genre || null,
        subgenre: form.subgenre || null,
        language: form.language || null,
        status: form.status,
        track_number: Number(form.track_number) || 1,
        cover_url: form.cover_url || null,
        audio_url: form.audio_url || null,
        lyrics: form.lyrics || null,
        copyright_holder: form.copyright_holder || null,
        copyright_year: form.copyright_year || null,
        publisher: form.publisher || null,
        format: form.format || null,
      };

      console.log(
        "EDIT MODAL — saving payload featuring_artists:",
        payload.featuring_artists,
      );
      console.log(
        "EDIT MODAL — saving payload actor_names:",
        payload.actor_names,
      );

      const { data, error } = await supabase
        .from("releases")
        .update(payload)
        .eq("id", song.id)
        .select();

      if (error) throw error;
      setSaved(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 800);
    } catch (e) {
      console.error("Save error:", e);
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "basic", label: "Details", icon: <FileText size={13} /> },
    { key: "audio", label: "Audio", icon: <Music size={13} /> },
    { key: "rights", label: "Rights", icon: <Check size={13} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {form.cover_url && (
              <img
                src={form.cover_url}
                className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                alt=""
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm truncate flex items-center gap-2">
                <Edit3 size={14} className="text-teal-500 flex-shrink-0" /> Edit
                Release
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {song.title} · {song.primary_artist}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0 px-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${activeTab === t.key ? "border-teal-500 text-teal-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* ── TAB: BASIC ── */}
              {activeTab === "basic" && (
                <>
                  <InlineImageUpload
                    label="Cover Image"
                    value={form.cover_url}
                    onChange={(v) => set("cover_url", v)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Song Title *
                      </label>
                      <input
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Format
                      </label>
                      <select
                        value={form.format}
                        onChange={(e) => set("format", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
                      >
                        <option value="Single">Single</option>
                        <option value="Album">Album</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Primary Artist *
                      </label>
                      <div className="relative">
                        <User
                          size={14}
                          className="absolute left-3 top-3 text-slate-400"
                        />
                        <input
                          value={form.primary_artist}
                          onChange={(e) =>
                            set("primary_artist", e.target.value)
                          }
                          className="w-full pl-8 p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Track #
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.track_number}
                        onChange={(e) =>
                          set("track_number", parseInt(e.target.value) || 1)
                        }
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* ── FEATURING ARTISTS ── */}
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                    <EditTagInput
                      label="Featuring Artists"
                      tags={form.featuring_artists}
                      onAdd={(v) =>
                        set("featuring_artists", [...form.featuring_artists, v])
                      }
                      onRemove={(v) =>
                        set(
                          "featuring_artists",
                          form.featuring_artists.filter((a) => a !== v),
                        )
                      }
                      placeholder="Artist naam type karo, Enter dabao"
                    />
                  </div>

                  {/* ── ACTOR / CAST NAMES ── */}
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                    <EditTagInput
                      label="Actor / Cast Names (optional)"
                      tags={form.actor_names}
                      onAdd={(v) =>
                        set("actor_names", [...form.actor_names, v])
                      }
                      onRemove={(v) =>
                        set(
                          "actor_names",
                          form.actor_names.filter((a) => a !== v),
                        )
                      }
                      placeholder="Actor naam type karo, Enter dabao"
                    />
                  </div>

                  {/* ── MOVIE NAME ── */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-1.5">
                        <Film size={12} className="text-slate-400" /> Movie /
                        Film Name
                        <span className="font-normal normal-case text-slate-400 ml-1">
                          (optional)
                        </span>
                      </span>
                    </label>
                    <div className="relative">
                      <Film
                        size={14}
                        className="absolute left-3 top-3 text-slate-400"
                      />
                      <input
                        value={form.movie_name}
                        onChange={(e) => set("movie_name", e.target.value)}
                        placeholder="e.g. Pushpa 2, Animal, Jawan"
                        className="w-full pl-8 p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Language & Genre */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Language
                      </label>
                      <select
                        value={form.language}
                        onChange={(e) => set("language", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
                      >
                        <option value="">Select Language</option>
                        {LANGUAGES.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Genre
                      </label>
                      <select
                        value={form.genre}
                        onChange={(e) => {
                          set("genre", e.target.value);
                          set("subgenre", "");
                        }}
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
                      >
                        <option value="">Select Genre</option>
                        {genres.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {form.genre && currentSubgenres.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Sub-genre
                      </label>
                      <select
                        value={form.subgenre}
                        onChange={(e) => set("subgenre", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
                      >
                        <option value="">Select Sub-genre (optional)</option>
                        {currentSubgenres.map((sg) => (
                          <option key={sg.value} value={sg.value}>
                            {sg.text}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <div className="flex gap-2">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => set("status", s)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                            form.status === s
                              ? s === "Published"
                                ? "bg-green-500 text-white border-green-500"
                                : s === "Draft"
                                  ? "bg-slate-500 text-white border-slate-500"
                                  : "bg-amber-500 text-white border-amber-500"
                              : "bg-white text-slate-500 border-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Album Info */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Disc3 size={13} className="text-teal-500" /> Album Info
                    </h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Album Name
                      </label>
                      <input
                        value={form.album_name}
                        onChange={(e) => set("album_name", e.target.value)}
                        placeholder="e.g. Cocktail 2"
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      />
                    </div>
                    <InlineImageUpload
                      label="Album Cover"
                      value={form.album_cover_url}
                      onChange={(v) => set("album_cover_url", v)}
                    />
                  </div>
                </>
              )}

              {/* ── TAB: AUDIO ── */}
              {activeTab === "audio" && (
                <>
                  <InlineAudioUpload
                    value={form.audio_url}
                    onChange={(v) => set("audio_url", v)}
                  />
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Lyrics{" "}
                      <span className="font-normal normal-case text-slate-400">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={form.lyrics}
                      onChange={(e) => set("lyrics", e.target.value)}
                      rows={12}
                      placeholder="[Verse 1]\nLyrics yahan...\n\n[Chorus]\n..."
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs font-mono resize-y leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {form.lyrics.length} characters
                    </p>
                  </div>
                </>
              )}

              {/* ── TAB: RIGHTS ── */}
              {activeTab === "rights" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Copyright Holder
                    </label>
                    <input
                      value={form.copyright_holder}
                      onChange={(e) => set("copyright_holder", e.target.value)}
                      placeholder="e.g. Universal Music India Pvt. Ltd."
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Copyright Year
                      </label>
                      <select
                        value={form.copyright_year}
                        onChange={(e) => set("copyright_year", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
                      >
                        {Array.from(
                          { length: 10 },
                          (_, i) => new Date().getFullYear() - i,
                        ).map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Publisher
                      </label>
                      <input
                        value={form.publisher}
                        onChange={(e) => set("publisher", e.target.value)}
                        placeholder="e.g. T-Series"
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                    <p>
                      <strong>ID:</strong> {song.id}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(song.created_at).toLocaleString("en-IN")}
                    </p>
                    <p>
                      <strong>Release Date:</strong> {song.release_date || "—"}
                    </p>
                    {form.featuring_artists.length > 0 && (
                      <p>
                        <strong>Featuring:</strong>{" "}
                        {form.featuring_artists.join(", ")}
                      </p>
                    )}
                    {form.actor_names.length > 0 && (
                      <p>
                        <strong>Cast:</strong> {form.actor_names.join(", ")}
                      </p>
                    )}
                    {form.movie_name && (
                      <p>
                        <strong>Movie:</strong> {form.movie_name}
                      </p>
                    )}
                    {form.album_name && (
                      <p>
                        <strong>Album:</strong> {form.album_name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          {saveError && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Save failed</p>
                <p>{saveError}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved || !form.title || !form.primary_artist}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white transition-all ${saved ? "bg-green-500" : "bg-teal-500 hover:bg-teal-600 disabled:opacity-40"}`}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 size={16} /> Saved!
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── DELETE CONFIRM ───
const DeleteConfirm = ({ song, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("releases")
        .delete()
        .eq("id", song.id);
      if (error) throw error;
      onDeleted();
      onClose();
    } catch (e) {
      alert("Delete failed: " + e.message);
      setDeleting(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
          Delete Release?
        </h3>
        <p className="text-sm text-slate-500 text-center mb-1">
          <strong className="text-slate-700">"{song.title}"</strong>
        </p>
        <p className="text-xs text-slate-400 text-center mb-6">
          by {song.primary_artist} — Yeh action undo nahi ho sakta.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── MAIN COMPONENT ───
const SongEditAdmin = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingSong, setEditingSong] = useState(null);
  const [deletingSong, setDeletingSong] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("releases")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // ── DEBUG: Log first song's featuring_artists and actor_names ──
      if (data && data.length > 0) {
        console.log(
          "FETCHED SONGS — sample featuring_artists:",
          data[0].featuring_artists,
          "type:",
          typeof data[0].featuring_artists,
        );
        console.log(
          "FETCHED SONGS — sample actor_names:",
          data[0].actor_names,
          "type:",
          typeof data[0].actor_names,
        );
      }
      setSongs(data || []);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const filtered = songs.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      [
        s.title,
        s.primary_artist,
        s.featuring_artists,
        s.album_name,
        s.genre,
        s.language,
        s.lyrics,
        s.actor_names,
        s.movie_name,
      ].some((f) => f?.toLowerCase().includes(q));
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest")
      return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === "oldest")
      return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
    if (sortBy === "artist")
      return (a.primary_artist || "").localeCompare(b.primary_artist || "");
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const publishedCount = songs.filter((s) => s.status === "Published").length;
  const draftCount = songs.filter((s) => s.status === "Draft").length;
  const unlistedCount = songs.filter((s) => s.status === "Unlisted").length;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Music size={22} className="text-teal-500" /> All Releases
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {songs.length} total · {publishedCount} published · {draftCount}{" "}
                draft · {unlistedCount} unlisted
              </p>
            </div>
            <button
              onClick={fetchSongs}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by title, artist, album, movie, actors, lyrics…"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {["All", "Published", "Draft", "Unlisted"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${statusFilter === s ? "bg-teal-500 text-white border-teal-500 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-teal-300"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A–Z</option>
              <option value="artist">Artist A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={36} className="animate-spin text-teal-500" />
            <p className="text-sm text-slate-500">Loading all releases…</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-24">
            <Music size={48} className="text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400">No songs found</h3>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery
                ? `"${searchQuery}" se koi song nahi mila`
                : "Koi releases nahi hain abhi"}
            </p>
          </div>
        ) : (
          <>
            {searchQuery && (
              <p className="text-xs text-slate-500 mb-4">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "
                <strong>{searchQuery}</strong>"
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginated.map((song) => {
                const featuringList = strToArray(song.featuring_artists);
                const actorList = strToArray(song.actor_names);

                return (
                  <motion.div
                    key={song.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={song.cover_url || ""}
                          alt={song.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-100 bg-slate-100"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        {song.format === "Album" && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Disc3 size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 text-sm truncate leading-tight">
                              {song.title}
                            </h3>
                            <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                              {song.primary_artist}
                            </p>

                            {featuringList.length > 0 && (
                              <p className="text-[10px] text-teal-600 truncate mt-0.5 flex items-center gap-1">
                                <span className="font-semibold">ft.</span>{" "}
                                {featuringList.join(", ")}
                              </p>
                            )}

                            {song.movie_name && (
                              <p className="text-[10px] text-purple-500 truncate flex items-center gap-1 mt-0.5">
                                <Film size={9} /> {song.movie_name}
                              </p>
                            )}

                            {actorList.length > 0 && (
                              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                <User size={9} /> {actorList.join(", ")}
                              </p>
                            )}

                            {song.album_name && (
                              <p className="text-[10px] text-blue-500 truncate flex items-center gap-1 mt-0.5">
                                <Disc3 size={9} /> {song.album_name}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={song.status} />
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {song.genre && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                              {song.genre}
                            </span>
                          )}
                          {song.language && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                              {song.language}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={`text-[10px] font-medium flex items-center gap-1 ${song.audio_url ? "text-green-600" : "text-red-400"}`}
                          >
                            <Music size={10} />{" "}
                            {song.audio_url ? "Audio ✓" : "No Audio"}
                          </span>
                          {song.lyrics && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <FileText size={10} /> Lyrics
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex border-t border-slate-100">
                      <button
                        onClick={() => setEditingSong(song)}
                        className="flex-1 py-2.5 text-xs font-semibold text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <div className="w-px bg-slate-100" />
                      <button
                        onClick={() => setDeletingSong(song)}
                        className="flex-1 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${page === p ? "bg-teal-500 text-white shadow-sm" : "border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {editingSong && (
          <EditModal
            key={editingSong.id}
            song={editingSong}
            onClose={() => setEditingSong(null)}
            onSaved={fetchSongs}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deletingSong && (
          <DeleteConfirm
            key={deletingSong.id}
            song={deletingSong}
            onClose={() => setDeletingSong(null)}
            onDeleted={fetchSongs}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SongEditAdmin;
