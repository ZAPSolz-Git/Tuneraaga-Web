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
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Disc3,
  FileText,
  Upload,
  Check,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const GENRES = [
  "Pop",
  "Hip Hop/Rap",
  "Rock",
  "Indian",
  "Arabic",
  "Latin",
  "Dance",
  "R&B/Soul",
  "Country",
  "Classical",
  "Jazz",
  "Alternative",
  "Blues",
  "Electronic",
  "Folk",
  "Metal",
  "Reggae",
  "Romance",
  "Devotional",
  "Sufi",
  "World Music",
];
const SUBGENRES = {
  Pop: ["Dance Pop", "Electropop", "Indie Pop", "Teen Pop", "Synth Pop"],
  "Hip Hop/Rap": [
    "Trap",
    "Drill",
    "Conscious Rap",
    "Boom Bap",
    "Lo-Fi Hip Hop",
  ],
  Rock: ["Hard Rock", "Soft Rock", "Punk Rock", "Indie Rock", "Classic Rock"],
  Indian: [
    "Bollywood",
    "Kollywood",
    "Tollywood",
    "Bhangra",
    "Devotional",
    "Classical",
  ],
  Electronic: ["House", "Techno", "Dubstep", "Ambient", "Drum & Bass"],
  "R&B/Soul": ["Neo Soul", "Contemporary R&B", "Gospel", "Funk"],
  Classical: ["Hindustani", "Carnatic", "Western Classical", "Fusion"],
  Folk: ["Indian Folk", "Country Folk", "Acoustic"],
};
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

// ─── INLINE IMAGE UPLOAD (FIXED — no blob fallback) ───
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

// ─── INLINE AUDIO UPLOAD (FIXED — no blob fallback) ───
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

// ─── FIXED SmallTagInput ───
// Problem: tags string properly split nahi ho rahi thi
// Fix: trim + filter properly kiya, empty string handle kiya
const SmallTagInput = ({ label, tags, onChange, placeholder }) => {
  const [val, setVal] = useState("");

  // tags ek string hai — "Arijit, Shreya" — array mein convert karo
  const tagList = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const add = () => {
    const v = val.trim();
    if (!v) return;
    if (tagList.includes(v)) {
      setVal("");
      return;
    }
    const newTags = [...tagList, v].join(", ");
    onChange(newTags);
    setVal("");
  };

  const remove = (tag) => {
    const newTags = tagList.filter((t) => t !== tag).join(", ");
    onChange(newTags);
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
      <div className="flex flex-wrap gap-1">
        {tagList.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 bg-teal-100 text-teal-700 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="hover:text-red-500 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      {/* Debug: currently saved value */}
      {tagList.length > 0 && (
        <p className="text-[10px] text-slate-400 mt-1">
          Saved: {tagList.join(", ")}
        </p>
      )}
    </div>
  );
};

// ─── EDIT MODAL (FIXED) ───
const EditModal = ({ song, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: song.title || "",
    primary_artist: song.primary_artist || "",
    featuring_artists: song.featuring_artists || "", // string as-is
    actor_names: song.actor_names || "",
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ─── FIXED handleSave ───
  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        title: form.title,
        primary_artist: form.primary_artist,
        featuring_artists: form.featuring_artists || null,
        actor_names: form.actor_names || null,
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

      console.log("Saving payload:", payload); // debug

      const { data, error } = await supabase
        .from("releases")
        .update(payload)
        .eq("id", song.id)
        .select(); // .select() lagao — confirm karo update hua

      console.log("Save result:", data, error); // debug

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
                <Edit3 size={14} className="text-teal-500 flex-shrink-0" />
                Edit Release
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
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === t.key
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
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
                      <input
                        value={form.primary_artist}
                        onChange={(e) => set("primary_artist", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      />
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

                  {/* ─── FIXED: Featuring Artists ─── */}
                  <SmallTagInput
                    label="Featuring Artists"
                    tags={form.featuring_artists}
                    onChange={(v) => set("featuring_artists", v)}
                    placeholder="Artist naam type karo, Enter dabao"
                  />

                  {/* ─── FIXED: Actor Names ─── */}
                  <SmallTagInput
                    label="Actor / Cast Names (optional)"
                    tags={form.actor_names}
                    onChange={(v) => set("actor_names", v)}
                    placeholder="Actor naam type karo, Enter dabao"
                  />

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
                        {GENRES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {form.genre && SUBGENRES[form.genre] && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Sub-genre
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {SUBGENRES[form.genre].map((sg) => (
                          <button
                            key={sg}
                            type="button"
                            onClick={() =>
                              set("subgenre", form.subgenre === sg ? "" : sg)
                            }
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all ${
                              form.subgenre === sg
                                ? "bg-teal-500 text-white border-teal-500"
                                : "bg-white text-slate-600 border-slate-300 hover:border-teal-400"
                            }`}
                          >
                            {sg}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Disc3 size={13} className="text-teal-500" /> Album /
                      Movie Info
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
                      placeholder={
                        "[Verse 1]\nLyrics yahan...\n\n[Chorus]\n..."
                      }
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
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500">
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
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white transition-all ${
                saved
                  ? "bg-green-500"
                  : "bg-teal-500 hover:bg-teal-600 disabled:opacity-40"
              }`}
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
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
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
                placeholder="Search by title, artist, album, lyrics, actors…"
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
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    statusFilter === s
                      ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:border-teal-300"
                  }`}
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
              {paginated.map((song) => (
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
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate leading-tight">
                            {song.title}
                          </h3>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {song.primary_artist}
                          </p>
                          {/* FIXED: featuring_artists properly display */}
                          {song.featuring_artists && (
                            <p className="text-[10px] text-slate-400 truncate">
                              ft. {song.featuring_artists}
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
                        {song.album_name && (
                          <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-medium truncate max-w-[100px]">
                            {song.album_name}
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
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {new Date(song.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 pb-4">
                    <button
                      onClick={() => setEditingSong(song)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors border border-teal-100"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingSong(song)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors border border-red-100"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-slate-300">…</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                          page === p
                            ? "bg-teal-500 text-white"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {editingSong && (
          <EditModal
            song={editingSong}
            onClose={() => setEditingSong(null)}
            onSaved={fetchSongs}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingSong && (
          <DeleteConfirm
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
