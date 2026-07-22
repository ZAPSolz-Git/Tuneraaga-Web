import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image,
  Music,
  FileText,
  Shield,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  X,
  User,
  Disc3,
  Film,
  AlertCircle,
  Loader2,
  Upload,
  CheckCircle2,
  Minus,
  Music2,
  Trash2,
} from "lucide-react";
// ✅ FIX: use the ONE shared Supabase client used everywhere else in the
// app instead of creating a brand new createClient() instance here.
// Having two separate GoTrueClient instances in the same browser tab
// caused this file's client to not see the already-logged-in session,
// so getSession() returned null and every upload/release request was
// sent with no Authorization header at all → 401 "Authorization token
// is missing".
import { supabase } from "../lib/supabaseClient";
import { genres, getSubgenres } from "../lib/subgener";

const API_BASE = "http://localhost:5000/api/content"; // SECURE BACKEND API

const uploadAssetToBackend = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await supabase.auth.getSession();
  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    throw new Error(
      "You are not logged in (no active session). Please log in again and retry.",
    );
  }

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || result.message || "Upload failed.");
  }

  // Backend's uploadAsset responds with { success, publicUrl, path }
  if (!result.publicUrl) {
    console.error("Unexpected upload response shape:", result);
    throw new Error(
      "Upload succeeded but the server didn't return a publicUrl.",
    );
  }

  return result.publicUrl;
};

// ✅ Shared helper for authenticated JSON calls to the backend
const authedFetch = async (path, { method = "GET", body } = {}) => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    throw new Error(
      "You are not logged in (no active session). Please log in again and retry.",
    );
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let result = null;
  try {
    result = await response.json();
  } catch (e) {
    /* no JSON body */
  }

  if (!response.ok) {
    throw new Error(
      result?.error || result?.message || `Request failed (${response.status})`,
    );
  }

  return result;
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
  "Garhwali",
  "Himachali",
];
const CURRENT_YEAR = new Date().getFullYear();

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════

const ImageUpload = ({
  label,
  value,
  onChange,
  onError,
  required,
  size = "3000×3000",
}) => {
  const ref = useRef();
  const [preview, setPreview] = useState(value || null);
  const [uploading, setUploading] = useState(false);
  const [sizeError, setSizeError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setSizeError("");
    const result = await new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.naturalWidth < 3000 || img.naturalHeight < 3000) {
          resolve({
            valid: false,
            msg: `Min 3000×3000px required. Your image: ${img.naturalWidth}×${img.naturalHeight}px.`,
          });
        } else {
          resolve({ valid: true });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ valid: false, msg: "Cannot read image file." });
      };
      img.src = url;
    });
    if (!result.valid) {
      setSizeError(result.msg);
      if (onError) onError(result.msg);
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    try {
      const publicUrl = await uploadAssetToBackend(file);
      onChange(publicUrl);
    } catch (e) {
      console.error("Cover upload failed:", e.message);
      if (onError) onError(`Upload failed: ${e.message}`);
      setSizeError(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label} {required && <span className="text-red-400">*</span>}
        <span className="font-normal text-slate-400 ml-1 normal-case">
          ({size} minimum required)
        </span>
      </label>
      <div
        onClick={() => ref.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 ${sizeError ? "border-red-400 bg-red-50" : preview && !sizeError ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-teal-50"}`}
        style={{ aspectRatio: "1", maxWidth: 220 }}
      >
        {preview && !sizeError ? (
          <>
            <img
              src={preview}
              className="w-full h-full object-cover"
              alt="cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white text-center">
                <Image size={24} className="mx-auto mb-1" />
                <p className="text-xs font-semibold">Change</p>
              </div>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${sizeError ? "bg-red-100" : "bg-teal-100"}`}
            >
              <Image
                size={26}
                className={sizeError ? "text-red-400" : "text-teal-500"}
              />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              Drop image here
            </p>
            <p className="text-xs text-slate-400 mt-1">or click to browse</p>
            <p className="text-[10px] text-slate-400 mt-2">JPG, PNG, WebP</p>
          </div>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
      {sizeError && (
        <div className="flex items-start gap-2 mt-2 text-red-500 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{sizeError}</span>
        </div>
      )}
    </div>
  );
};

const AudioUpload = ({ label, value, onChange, required, compact = false }) => {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState(value ? "Audio uploaded ✓" : "");
  const [uploadDone, setUploadDone] = useState(!!value);

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError("");
    setUploadDone(false);
    if (file.size > 200 * 1024 * 1024) {
      setUploadError(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum 200MB.`,
      );
      return;
    }
    setFileName(file.name);
    setUploading(true);
    try {
      const publicUrl = await uploadAssetToBackend(file);
      onChange(publicUrl);
      setUploadDone(true);
      setFileName(`✓ ${file.name}`);
    } catch (e) {
      console.error("Audio upload error:", e);
      setUploadError(e.message);
      setUploadDone(false);
      setFileName("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div
        onClick={() => !uploading && ref.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-${compact ? "lg" : "xl"} ${compact ? "p-3" : "p-5"} flex items-center gap-4 transition-all ${uploading ? "border-teal-300 bg-teal-50 cursor-wait" : uploadDone && !uploadError ? "border-teal-400 bg-teal-50" : uploadError ? "border-orange-300 bg-orange-50" : "border-slate-200 hover:border-teal-300 hover:bg-teal-50"}`}
      >
        {uploading ? (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-100">
            <Loader2 className="animate-spin text-teal-500" size={24} />
          </div>
        ) : uploadDone && !uploadError ? (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-100">
            <CheckCircle2 size={24} className="text-teal-500" />
          </div>
        ) : (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${uploadError ? "bg-orange-100" : "bg-slate-100"}`}
          >
            <Music
              size={22}
              className={uploadError ? "text-orange-400" : "text-slate-400"}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-700 truncate">
            {uploading ? "Uploading…" : fileName || "Click to upload audio"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {uploading
              ? "Do not close this tab"
              : "MP3, WAV, FLAC, AAC · Max 200MB"}
          </p>
        </div>
        {uploadDone && !uploading && (
          <span className="text-xs text-teal-600 font-semibold flex-shrink-0 underline">
            Change
          </span>
        )}
        <input
          ref={ref}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a,.opus"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
      {uploading && (
        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full animate-pulse w-full" />
        </div>
      )}
      {uploadError && (
        <div className="flex items-start gap-2 mt-2 text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs leading-relaxed">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Upload Failed</p>
            <p>{uploadError}</p>
          </div>
        </div>
      )}
      {value && !uploading && !uploadError && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-1 font-medium">Preview:</p>
          <audio
            controls
            className="w-full rounded-lg"
            style={{ height: 40 }}
            src={value}
            key={value}
          />
        </div>
      )}
    </div>
  );
};

const TagInput = ({ label, tags, onAdd, onRemove, placeholder, hint }) => {
  const [inputVal, setInputVal] = useState("");
  const add = () => {
    const v = inputVal.trim();
    if (v && !tags.includes(v)) {
      onAdd(v);
      setInputVal("");
    }
  };
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        {label}
        {hint && (
          <span className="font-normal text-slate-400 ml-1 normal-case">
            {hint}
          </span>
        )}
      </label>
      <div className="flex gap-2 mb-2">
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="bg-teal-500 text-white px-3 rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1.5 bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full"
          >
            {t}
            <button
              onClick={() => onRemove(t)}
              className="hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      {tags.length > 0 && (
        <p className="text-[10px] text-slate-400 mt-1">
          Added: {tags.join(", ")}
        </p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════
// SINGLE SONG RELEASE FORM
// ═══════════════════════════════════════════

const SingleReleaseForm = () => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coverSizeError, setCoverSizeError] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    primary_artist: "",
    featuring_artists: [],
    language: "",
    genre: "",
    subgenre: "",
    actor_names: [],
    movie_name: "",
    track_number: 1,
  });
  const [audioUrl, setAudioUrl] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [copyright, setCopyright] = useState({
    holder: "",
    year: String(CURRENT_YEAR),
    publisher: "",
  });

  const currentSubgenres = getSubgenres(formData.genre);
  const setField = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  const canProceed = () => {
    if (step === 1) return !!coverUrl && !coverSizeError;
    if (step === 2)
      return !!(
        formData.title &&
        formData.primary_artist &&
        formData.language &&
        formData.genre
      );
    if (step === 3) return !!audioUrl;
    if (step === 4) return !!(copyright.holder && copyright.year);
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        primary_artist: formData.primary_artist,
        featuring_artists:
          formData.featuring_artists.length > 0
            ? formData.featuring_artists.join(", ")
            : null,
        genre: formData.genre,
        subgenre: formData.subgenre || null,
        language: formData.language,
        format: "Single",
        cover_url: coverUrl,
        audio_url: audioUrl,
        lyrics: lyrics || null,
        copyright_holder: copyright.holder,
        copyright_year: copyright.year,
        publisher: copyright.publisher || null,
        status: "Published",
        track_number: formData.track_number,
        actor_names:
          formData.actor_names.length > 0
            ? formData.actor_names.join(", ")
            : null,
        movie_name: formData.movie_name || null,
        album_name: null,
        album_cover_url: null,
        release_date: new Date().toISOString().split("T")[0],
        play_count: 0,
        listeners_count: 0,
      };

      await authedFetch("/releases", { method: "POST", body: payload });
      setSubmitted(true);
    } catch (e) {
      alert("Release failed: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setSubmitted(false);
    setStep(1);
    setCoverUrl("");
    setCoverSizeError("");
    setFormData({
      title: "",
      primary_artist: "",
      featuring_artists: [],
      language: "",
      genre: "",
      subgenre: "",
      actor_names: [],
      movie_name: "",
      track_number: 1,
    });
    setAudioUrl("");
    setLyrics("");
    setCopyright({ holder: "", year: String(CURRENT_YEAR), publisher: "" });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-teal-500/30">
            <Check size={44} className="text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
            Single Released Successfully! 🎉
          </h2>
          <p className="text-slate-500 mb-2">
            <strong>{formData.title}</strong> by{" "}
            <strong>{formData.primary_artist}</strong>
            {formData.featuring_artists.length > 0 && (
              <span> ft. {formData.featuring_artists.join(", ")}</span>
            )}
          </p>
          {formData.actor_names.length > 0 && (
            <p className="text-slate-400 text-sm mb-2">
              Cast: {formData.actor_names.join(", ")}
            </p>
          )}
          {formData.movie_name && (
            <p className="text-purple-500 text-sm mb-2 flex items-center justify-center gap-1">
              <Film size={14} /> {formData.movie_name}
            </p>
          )}
          <button
            onClick={resetAll}
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-8 py-3 rounded-full transition-colors shadow-lg mt-4"
          >
            Release Another Single
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider uppercase">
            <Upload size={13} /> Single Release
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Upload Single Song
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Complete all 4 steps to publish your single.
          </p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="p-6 md:p-8"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Cover Art
                    </h2>
                    <p className="text-sm text-slate-500">
                      Upload a square image — minimum 3000×3000px required.
                    </p>
                  </div>
                  <div className="flex flex-col items-center py-4">
                    <ImageUpload
                      label="Cover Image"
                      value={coverUrl}
                      required
                      size="3000×3000"
                      onChange={(url) => {
                        setCoverUrl(url);
                        setCoverSizeError("");
                      }}
                      onError={(msg) => {
                        setCoverSizeError(msg);
                        setCoverUrl("");
                      }}
                    />
                  </div>
                  {!coverUrl && !coverSizeError && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      Cover art is required.
                    </div>
                  )}
                </div>
              )}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Song Details
                    </h2>
                    <p className="text-sm text-slate-500">
                      Tell us about your song.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Song Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={formData.title}
                      onChange={(e) => setField("title", e.target.value)}
                      placeholder="e.g. Tum Hi Ho"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Primary Artist <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User
                          size={15}
                          className="absolute left-3 top-3 text-slate-400"
                        />
                        <input
                          value={formData.primary_artist}
                          onChange={(e) =>
                            setField("primary_artist", e.target.value)
                          }
                          placeholder="Type artist name"
                          className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
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
                        value={formData.track_number}
                        onChange={(e) =>
                          setField(
                            "track_number",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                  <TagInput
                    label="Featuring Artists"
                    hint="(type name + Enter to add)"
                    tags={formData.featuring_artists}
                    onAdd={(v) =>
                      setField("featuring_artists", [
                        ...formData.featuring_artists,
                        v,
                      ])
                    }
                    onRemove={(v) =>
                      setField(
                        "featuring_artists",
                        formData.featuring_artists.filter((a) => a !== v),
                      )
                    }
                    placeholder="Type artist name and press Enter"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Language <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => setField("language", e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
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
                        Genre <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.genre}
                        onChange={(e) => {
                          setField("genre", e.target.value);
                          setField("subgenre", "");
                        }}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
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
                  {formData.genre && currentSubgenres.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Sub-genre
                      </label>
                      <select
                        value={formData.subgenre}
                        onChange={(e) => setField("subgenre", e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
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
                  <TagInput
                    label="Actor / Cast Names"
                    hint="(for film songs — optional)"
                    tags={formData.actor_names}
                    onAdd={(v) =>
                      setField("actor_names", [...formData.actor_names, v])
                    }
                    onRemove={(v) =>
                      setField(
                        "actor_names",
                        formData.actor_names.filter((a) => a !== v),
                      )
                    }
                    placeholder="Type actor name and press Enter"
                  />
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-1.5">
                        <Film size={13} className="text-slate-400" />
                        Movie / Film Name
                        <span className="font-normal text-slate-400 normal-case ml-1">
                          (optional — for film songs)
                        </span>
                      </span>
                    </label>
                    <div className="relative">
                      <Film
                        size={15}
                        className="absolute left-3 top-3 text-slate-400"
                      />
                      <input
                        value={formData.movie_name}
                        onChange={(e) => setField("movie_name", e.target.value)}
                        placeholder="e.g. Pushpa 2, Animal, Jawan"
                        className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Agar yeh kisi movie ka song hai toh movie ka naam likhein
                    </p>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Audio & Lyrics
                    </h2>
                    <p className="text-sm text-slate-500">
                      Upload your audio file and optionally add lyrics.
                    </p>
                  </div>
                  <AudioUpload
                    label="Audio File"
                    value={audioUrl}
                    onChange={setAudioUrl}
                    required
                  />
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-2">
                        <FileText size={13} />
                        Lyrics
                        <span className="font-normal normal-case text-slate-400">
                          (optional)
                        </span>
                      </span>
                    </label>
                    <textarea
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      rows={10}
                      placeholder="[Verse 1]\nYour lyrics here...\n\n[Chorus]\n..."
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-mono resize-y leading-relaxed"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {lyrics.length} characters
                    </p>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Copyright & Publishing
                    </h2>
                    <p className="text-sm text-slate-500">
                      Protect your music with the right rights information.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3">
                      {coverUrl && (
                        <img
                          src={coverUrl}
                          className="w-14 h-14 rounded-xl object-cover border-2 border-white/30 flex-shrink-0"
                          alt=""
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-lg leading-tight truncate">
                          {formData.title || "Untitled"}
                        </p>
                        <p className="text-teal-100 text-sm truncate">
                          {formData.primary_artist || "Unknown Artist"}
                        </p>
                        {formData.featuring_artists.length > 0 && (
                          <p className="text-teal-200 text-xs truncate mt-0.5">
                            ft. {formData.featuring_artists.join(", ")}
                          </p>
                        )}
                        {formData.actor_names.length > 0 && (
                          <p className="text-teal-200 text-xs truncate mt-0.5">
                            Cast: {formData.actor_names.join(", ")}
                          </p>
                        )}
                        {formData.movie_name && (
                          <p className="text-teal-200 text-xs truncate flex items-center gap-1 mt-0.5">
                            <Film size={10} /> {formData.movie_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Single
                          </span>
                          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {formData.genre}
                          </span>
                          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {formData.language}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Copyright Holder <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={copyright.holder}
                        onChange={(e) =>
                          setCopyright((p) => ({
                            ...p,
                            holder: e.target.value,
                          }))
                        }
                        placeholder="e.g. Universal Music India Pvt. Ltd."
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Copyright Year <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={copyright.year}
                          onChange={(e) =>
                            setCopyright((p) => ({
                              ...p,
                              year: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
                        >
                          {Array.from(
                            { length: 10 },
                            (_, i) => CURRENT_YEAR - i,
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
                          value={copyright.publisher}
                          onChange={(e) =>
                            setCopyright((p) => ({
                              ...p,
                              publisher: e.target.value,
                            }))
                          }
                          placeholder="e.g. T-Series"
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                      <Shield size={14} className="inline mr-1 text-teal-500" />
                      By submitting, you confirm you own or have licensed all
                      rights to this content.
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} /> Back
            </button>
            <span className="text-xs text-slate-400 font-medium">
              Step {step} of 4
            </span>
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-white font-semibold text-sm hover:bg-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-lg shadow-teal-500/20"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-lg shadow-teal-500/20"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Publishing…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Publish Release
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// ALBUM RELEASE FORM — ONE-BY-ONE TRACK SYSTEM
// ═══════════════════════════════════════════

const AlbumReleaseForm = () => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coverSizeError, setCoverSizeError] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [albumName, setAlbumName] = useState("");

  const [savedTracks, setSavedTracks] = useState([]);
  const [savingTrack, setSavingTrack] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [trackError, setTrackError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const [currentTrack, setCurrentTrack] = useState({
    title: "",
    primary_artist: "",
    featuring_artists: [],
    language: "",
    genre: "",
    subgenre: "",
    actor_names: [],
    movie_name: "",
    track_number: 1,
    audio_url: "",
  });

  const [lyrics, setLyrics] = useState("");
  const [copyright, setCopyright] = useState({
    holder: "",
    year: String(CURRENT_YEAR),
    publisher: "",
  });

  const currentSubgenres = getSubgenres(currentTrack.genre);

  const setTrackField = (k, v) => {
    setCurrentTrack((p) => ({ ...p, [k]: v }));
    setJustSaved(false);
  };

  const isCurrentTrackValid = () => {
    return !!(
      currentTrack.title.trim() &&
      currentTrack.primary_artist.trim() &&
      currentTrack.language &&
      currentTrack.genre &&
      currentTrack.audio_url
    );
  };

  const buildNextTrack = (justSavedTrack, newCount) => ({
    title: "",
    primary_artist: "",
    featuring_artists: [],
    language: justSavedTrack.language || "",
    genre: justSavedTrack.genre || "",
    subgenre: "",
    actor_names: [],
    movie_name: justSavedTrack.movie_name || "",
    track_number: newCount + 1,
    audio_url: "",
  });

  // ✅ SECURE — track saved as "Draft" via the same secure /releases
  // endpoint used by the single-release form (was previously a direct
  // supabase.from("releases").insert(...) with the anonymous key).
  const handleSaveTrack = async () => {
    if (!isCurrentTrackValid()) {
      setTrackError(
        "Please fill all required fields and upload audio before saving.",
      );
      return;
    }
    setTrackError("");
    setSavingTrack(true);
    try {
      const payload = {
        title: currentTrack.title,
        primary_artist: currentTrack.primary_artist,
        featuring_artists:
          currentTrack.featuring_artists.length > 0
            ? currentTrack.featuring_artists.join(", ")
            : null,
        genre: currentTrack.genre,
        subgenre: currentTrack.subgenre || null,
        language: currentTrack.language,
        format: "Album",
        cover_url: coverUrl,
        audio_url: currentTrack.audio_url,
        lyrics: null,
        copyright_holder: null,
        copyright_year: null,
        publisher: null,
        status: "Draft",
        track_number: currentTrack.track_number,
        actor_names:
          currentTrack.actor_names.length > 0
            ? currentTrack.actor_names.join(", ")
            : null,
        movie_name: currentTrack.movie_name || null,
        album_name: albumName,
        album_cover_url: coverUrl,
        release_date: new Date().toISOString().split("T")[0],
        play_count: 0,
        listeners_count: 0,
      };

      const result = await authedFetch("/releases", {
        method: "POST",
        body: payload,
      });

      const newId = result?.release?.id;
      if (!newId) {
        throw new Error(
          "Track was sent to the server but no id was returned — cannot track it in this session.",
        );
      }

      const savedWithId = { ...payload, id: newId };
      const newCount = savedTracks.length + 1;

      setSavedTracks((prev) => [...prev, savedWithId]);
      setCurrentTrack(buildNextTrack(savedWithId, newCount));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (e) {
      setTrackError("Track save failed: " + e.message);
    } finally {
      setSavingTrack(false);
    }
  };

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  ✅ SECURE DELETE — Backend API ke through, not direct DB  ║
  // ╚══════════════════════════════════════════════════════════════╝
  const handleDeleteTrack = async (id) => {
    setDeletingId(id);
    try {
      await authedFetch(`/releases/${id}`, { method: "DELETE" });

      setSavedTracks((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        return filtered.map((t, i) => ({ ...t, track_number: i + 1 }));
      });
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ SECURE — bulk-publish now goes through the backend's
  // PUT /releases/publish endpoint (was previously a direct
  // supabase.from("releases").update(...).in("id", ids) using the
  // anonymous key).
  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const ids = savedTracks.map((t) => t.id);

      await authedFetch("/releases/publish", {
        method: "PUT",
        body: {
          ids,
          lyrics: lyrics || null,
          copyright_holder: copyright.holder,
          copyright_year: copyright.year,
          publisher: copyright.publisher || null,
        },
      });

      setSubmitted(true);
    } catch (e) {
      alert("Publish failed: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!coverUrl && !coverSizeError && !!albumName.trim();
    if (step === 2) return savedTracks.length >= 2;
    if (step === 3) return true;
    if (step === 4) return !!(copyright.holder && copyright.year);
    return true;
  };

  const resetAll = () => {
    setSubmitted(false);
    setStep(1);
    setCoverUrl("");
    setCoverSizeError("");
    setAlbumName("");
    setSavedTracks([]);
    setTrackError("");
    setJustSaved(false);
    setCurrentTrack({
      title: "",
      primary_artist: "",
      featuring_artists: [],
      language: "",
      genre: "",
      subgenre: "",
      actor_names: [],
      movie_name: "",
      track_number: 1,
      audio_url: "",
    });
    setLyrics("");
    setCopyright({ holder: "", year: String(CURRENT_YEAR), publisher: "" });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30">
            <Disc3 size={44} className="text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
            Album Released Successfully! 🎉
          </h2>
          <p className="text-slate-500 mb-2">
            <strong>{albumName}</strong> — {savedTracks.length} tracks published
          </p>
          <p className="text-slate-400 text-sm mb-4">
            All tracks are now live with the same cover image and album name.
          </p>
          <button
            onClick={resetAll}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full transition-colors shadow-lg mt-4"
          >
            Release Another Album
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider uppercase">
            <Disc3 size={13} /> Album Release
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Upload Album
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Add album info, then save tracks one by one. Each track saves
            instantly to server.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="p-6 md:p-8"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Cover Art & Album Info
                    </h2>
                    <p className="text-sm text-slate-500">
                      This cover will be used for ALL tracks in the album.
                    </p>
                  </div>
                  <div className="flex flex-col items-center py-4">
                    <ImageUpload
                      label="Album Cover (for all tracks)"
                      value={coverUrl}
                      required
                      size="3000×3000"
                      onChange={(url) => {
                        setCoverUrl(url);
                        setCoverSizeError("");
                      }}
                      onError={(msg) => {
                        setCoverSizeError(msg);
                        setCoverUrl("");
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Album Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={albumName}
                      onChange={(e) => setAlbumName(e.target.value)}
                      placeholder="e.g. Cocktail 2, Pushpa 3"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                  {(!coverUrl || !albumName.trim()) && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      Cover image and album name are required. Minimum 2 tracks
                      needed to proceed.
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-1">
                        Add Tracks
                      </h2>
                      <p className="text-sm text-slate-500">
                        Save each track individually. Minimum 2 required.
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${savedTracks.length >= 2 ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}
                    >
                      {savedTracks.length} / ∞ Saved
                    </span>
                  </div>

                  {trackError && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      {trackError}
                    </div>
                  )}

                  {justSaved && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                      <CheckCircle2 size={16} className="flex-shrink-0" />
                      Track saved successfully! Add the next one.
                    </div>
                  )}

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Current Track Form */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm">
                        Track #{currentTrack.track_number}
                      </h4>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          value={currentTrack.title}
                          onChange={(e) =>
                            setTrackField("title", e.target.value)
                          }
                          placeholder="Song title"
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Artist <span className="text-red-400">*</span>
                          </label>
                          <input
                            value={currentTrack.primary_artist}
                            onChange={(e) =>
                              setTrackField("primary_artist", e.target.value)
                            }
                            placeholder="Artist name"
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Language <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={currentTrack.language}
                            onChange={(e) =>
                              setTrackField("language", e.target.value)
                            }
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                          >
                            <option value="">Select</option>
                            {LANGUAGES.map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Genre <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={currentTrack.genre}
                            onChange={(e) => {
                              setTrackField("genre", e.target.value);
                              setTrackField("subgenre", "");
                            }}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                          >
                            <option value="">Select</option>
                            {genres.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Movie
                          </label>
                          <input
                            value={currentTrack.movie_name}
                            onChange={(e) =>
                              setTrackField("movie_name", e.target.value)
                            }
                            placeholder="Optional"
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                          />
                        </div>
                      </div>
                      <AudioUpload
                        label="Audio File"
                        value={currentTrack.audio_url}
                        onChange={(url) => setTrackField("audio_url", url)}
                        required
                        compact
                      />
                      <button
                        onClick={handleSaveTrack}
                        disabled={savingTrack || !isCurrentTrackValid()}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                      >
                        {savingTrack ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />{" "}
                            Saving…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} /> Save Track
                          </>
                        )}
                      </button>
                    </div>

                    {/* Saved Tracks List */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[520px] overflow-y-auto">
                      <div className="bg-slate-50 px-4 py-3 border-b font-bold text-sm text-slate-700 sticky top-0 z-10 flex items-center gap-2">
                        <Music2 size={14} className="text-blue-500" />
                        Saved Tracks ({savedTracks.length})
                      </div>
                      {savedTracks.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                          No tracks saved yet. Add your first track.
                        </div>
                      ) : (
                        savedTracks.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <span className="text-blue-600 font-bold text-xs w-6 text-center">
                              {track.track_number}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate text-slate-900">
                                {track.title}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {track.primary_artist} · {track.genre} ·{" "}
                                {track.language}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteTrack(track.id)}
                              disabled={deletingId === track.id}
                              className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all flex-shrink-0 disabled:opacity-50"
                              title="Delete this track"
                            >
                              {deletingId === track.id ? (
                                <Loader2
                                  size={15}
                                  className="animate-spin text-red-400"
                                />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Album Lyrics
                    </h2>
                    <p className="text-sm text-slate-500">
                      These lyrics will be applied to ALL tracks in this album.
                      Leave empty if not needed.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                    <Disc3 size={20} className="text-blue-500" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {albumName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {savedTracks.length} tracks · Lyrics will be shared
                      </p>
                    </div>
                  </div>
                  <textarea
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    rows={14}
                    placeholder="[Verse 1]\nYour lyrics here...\n\n[Chorus]\n..."
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono resize-y leading-relaxed"
                  />
                  <p className="text-xs text-slate-400">
                    {lyrics.length} characters
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Copyright & Publishing
                    </h2>
                    <p className="text-sm text-slate-500">
                      This info applies to all {savedTracks.length} tracks.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-4">
                      {coverUrl && (
                        <img
                          src={coverUrl}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-white/30 flex-shrink-0"
                          alt=""
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-lg leading-tight truncate">
                          {albumName}
                        </p>
                        <p className="text-blue-200 text-sm">
                          {savedTracks.length} tracks · Album
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {savedTracks.slice(0, 5).map((t) => (
                            <span
                              key={t.id}
                              className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[120px]"
                            >
                              {t.title}
                            </span>
                          ))}
                          {savedTracks.length > 5 && (
                            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              +{savedTracks.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Copyright Holder <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={copyright.holder}
                        onChange={(e) =>
                          setCopyright((p) => ({
                            ...p,
                            holder: e.target.value,
                          }))
                        }
                        placeholder="e.g. Universal Music India Pvt. Ltd."
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Copyright Year <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={copyright.year}
                          onChange={(e) =>
                            setCopyright((p) => ({
                              ...p,
                              year: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                        >
                          {Array.from(
                            { length: 10 },
                            (_, i) => CURRENT_YEAR - i,
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
                          value={copyright.publisher}
                          onChange={(e) =>
                            setCopyright((p) => ({
                              ...p,
                              publisher: e.target.value,
                            }))
                          }
                          placeholder="e.g. T-Series"
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                      <Shield size={14} className="inline mr-1 text-blue-500" />
                      By publishing, you confirm you own or have licensed all
                      rights to all {savedTracks.length} tracks in this album.
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} /> Back
            </button>
            <span className="text-xs text-slate-400 font-medium">
              Step {step} of 4
            </span>
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={!canProceed() || submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Publishing…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Publish Album (
                    {savedTracks.length} tracks)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT — TAB SWITCHER
// ═══════════════════════════════════════════

const AdminNewRelease = () => {
  const [mode, setMode] = useState("single");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-center gap-4">
          <button
            onClick={() => setMode("single")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mode === "single"
                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Music2 size={16} /> Single
          </button>
          <button
            onClick={() => setMode("album")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mode === "album"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Disc3 size={16} /> Album
          </button>
        </div>
      </div>

      {/* Render Form */}
      {mode === "single" ? <SingleReleaseForm /> : <AlbumReleaseForm />}
    </div>
  );
};

export default AdminNewRelease;
