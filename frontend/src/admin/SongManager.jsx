import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  Upload,
  Play,
  Pause,
  Search,
  X,
  Music,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Disc,
  ChevronDown,
  Zap,
  Globe,
  Copyright,
  Grid3x3,
  List,
  FileText,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────
// ⚙️ CONFIGURATION
// --- ENV CONFIGURATION ---
// .env file se variables load kar rahe hain
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = "TuneRaaga";

// ─────────────────────────────────────────────────────────────
// 📚 DATA: GENRES & LANGUAGES
// ─────────────────────────────────────────────────────────────
import { genres } from "../lib/subgener";
const LANGUAGES = [
  "For You",
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
];

// ─────────────────────────────────────────────────────────────
// 🛠️ UI COMPONENTS
// ─────────────────────────────────────────────────────────────
const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-violet-600 text-white hover:bg-violet-700 shadow-sm",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes = {
    default: "h-10 py-2 px-6 text-sm",
    sm: "h-9 px-3 text-xs",
    icon: "h-9 w-9",
  };
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
        {label}
      </label>
    )}
    <input
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
        }
        props.onKeyDown?.(e);
      }}
    />
  </div>
);

const Checkbox = ({ checked, onCheckedChange, className = "", label }) => (
  <label
    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
    />
    {label && (
      <span className="text-sm font-medium text-gray-700">{label}</span>
    )}
  </label>
);

const CustomSelect = ({ value, onValueChange, placeholder, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1">
            {React.Children.map(children, (child) =>
              React.cloneElement(child, {
                onClick: (e) => {
                  e.stopPropagation();
                  onValueChange(child.props.value);
                  setOpen(false);
                },
                active: value === child.props.value,
              }),
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SelectItem = ({ children, value, onClick, active }) => (
  <div
    onClick={onClick}
    className={`relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 ${active ? "bg-gray-100 font-semibold text-violet-600" : "text-gray-700"}`}
  >
    {active && (
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-violet-600">
        <CheckCircle2 size={14} />
      </span>
    )}
    {children}
  </div>
);

const MOCK_PLATFORMS = [
  { id: "spotify", name: "Spotify Music" },
  { id: "apple", name: "Apple Music" },
  { id: "napster", name: "Napster" },
  { id: "youtube", name: "YouTube Music" },
  { id: "amazon", name: "Amazon Music" },
  { id: "tidal", name: "Tidal" },
  { id: "deezer", name: "Deezer" },
];

// ─────────────────────────────────────────────────────────────
// 🎵 AUDIO RELEASE FORM
// ─────────────────────────────────────────────────────────────

const initialAudioState = {
  title: "",
  primaryArtist: "",
  featuringArtists: "",
  releaseDate: "",
  genre: "",
  subGenre: "",
  format: "",
  language: "",
  copyrightHolder: "",
  copyrightYear: "",
  publisher: "",
  platforms: [],
  exclusivePlatform: "",
  exclusiveDate: "",
  preOrderDate: "",
  coverUrl: null,
  audioUrl: null,
  mainLyrics: "",
};

const AudioReleaseForm = ({
  onClose,
  onSuccess,
  existingRelease,
  notify,
  availableArtists,
}) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newCoverFile, setNewCoverFile] = useState(null);
  const [newAudioFile, setNewAudioFile] = useState(null);

  const [formData, setFormData] = useState(initialAudioState);

  useEffect(() => {
    if (existingRelease) {
      setFormData({
        ...initialAudioState,
        title: existingRelease.title || "",
        primaryArtist: existingRelease.primary_artist || "",
        featuringArtists: existingRelease.featuring_artists || "",
        releaseDate: existingRelease.release_date || "",
        genre: existingRelease.genre || "",
        language: existingRelease.language || "",
        format: existingRelease.format || "",
        copyrightHolder: existingRelease.copyright_holder || "",
        copyrightYear:
          existingRelease.copyright_year || new Date().getFullYear(),
        publisher: existingRelease.publisher || "",
        platforms: existingRelease.platforms || [],
        mainLyrics: existingRelease.lyrics || "",
        coverUrl: existingRelease.cover_url || null,
        audioUrl: existingRelease.audio_url || null,
      });
      setNewCoverFile(null);
      setNewAudioFile(null);
    } else {
      setFormData(initialAudioState);
      setNewCoverFile(null);
      setNewAudioFile(null);
    }
  }, [existingRelease, availableArtists]);

  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCoverFile(file);
      const preview = URL.createObjectURL(file);
      updateField("coverUrl", preview);
    }
  };

  const handleAudioSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAudioFile(file);
    }
  };

  const togglePlatform = (name) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(name)
        ? prev.platforms.filter((p) => p !== name)
        : [...prev.platforms, name],
    }));
  };

  const steps = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "info", label: "Main Info", icon: Disc },
    { id: "tracks", label: "Audio/Lyrics", icon: Music },
    { id: "rights", label: "Rights", icon: Globe },
  ];

  const nextStep = () => {
    if (step === 0 && !formData.coverUrl && !existingRelease)
      return notify("Please upload cover art", "error");

    if (step === 1) {
      if (!formData.title) return notify("Title is required", "error");
      if (!formData.primaryArtist)
        return notify("Primary Artist is required", "error");
      if (!formData.releaseDate)
        return notify("Please select a Release Date", "error");
      if (!formData.genre) return notify("Genre is required", "error");
      if (!formData.language) return notify("Language is required", "error");
    }

    if (step === 2 && !formData.audioUrl && !newAudioFile && !existingRelease)
      return notify("Please upload audio file", "error");

    if (step < 3) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  // --- SUBMIT LOGIC ---
  const handleSubmit = async () => {
    if (step < 3) return;
    setLoading(true);
    try {
      let finalCoverUrl = formData.coverUrl;
      let finalAudioUrl = formData.audioUrl;

      if (newCoverFile) {
        setUploading(true);
        try {
          const fileName = `covers/${Date.now()}-${newCoverFile.name}`;
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, newCoverFile);
          if (error) throw error;
          const {
            data: { publicUrl },
          } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
          finalCoverUrl = publicUrl;
        } catch (err) {
          console.error(err);
          notify("Cover upload failed", "error");
          return;
        } finally {
          setUploading(false);
        }
      }

      if (newAudioFile) {
        setUploading(true);
        try {
          const fileName = `audio/${Date.now()}-${newAudioFile.name}`;
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, newAudioFile);
          if (error) throw error;
          const {
            data: { publicUrl },
          } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
          finalAudioUrl = publicUrl;
        } catch (err) {
          console.error(err);
          notify("Audio upload failed", "error");
          return;
        } finally {
          setUploading(false);
        }
      }

      const payload = {
        title: formData.title,
        primary_artist: formData.primaryArtist,
        featuring_artists: formData.featuringArtists,
        release_date: formData.releaseDate,
        genre: formData.genre,
        language: formData.language,
        format: formData.format,
        copyright_holder: formData.copyrightHolder,
        copyright_year: formData.copyrightYear,
        publisher: formData.publisher,
        platforms: formData.platforms,
        cover_url: finalCoverUrl,
        audio_url: finalAudioUrl,
        lyrics: formData.mainLyrics,
        status: "Published",
      };

      let error;
      if (existingRelease && existingRelease.id) {
        const { error: updateError } = await supabase
          .from("releases")
          .update(payload)
          .eq("id", existingRelease.id)
          .select();
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("releases")
          .insert([payload])
          .select();
        error = insertError;
      }

      if (error) throw error;
      notify(
        `Release ${existingRelease ? "Updated" : "Submitted"} Successfully!`,
        "success",
      );
      onSuccess();
    } catch (error) {
      console.error("Error submitting release:", error);
      notify("Failed to submit release", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="flex flex-col h-full bg-white"
      onSubmit={(e) => e.preventDefault()}
    >
      {/* Stepper */}
      <div className="border-b border-gray-200 px-8 py-4 bg-white">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 w-full">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${step >= i ? "border-violet-600 bg-violet-600 text-white" : "border-gray-300 text-gray-400 bg-white"}`}
                >
                  {step > i ? <CheckCircle2 size={16} /> : <s.icon size={16} />}
                </div>
                <span
                  className={`text-[10px] font-bold tracking-wider uppercase ${step >= i ? "text-violet-700" : "text-gray-400"}`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-full mx-2 ${step > i ? "bg-violet-600" : "bg-gray-200"}`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 md:p-8 bg-gray-50">
        {/* STEP 1: Upload */}
        {step === 0 && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {existingRelease
                  ? "Edit Release Art"
                  : "Upload Your Audio Release"}
              </h2>
              <p className="text-gray-500 mt-2">
                {existingRelease
                  ? "Update cover art (optional)."
                  : "Start by uploading your cover art."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
                  Cover Art
                </h3>
                {uploading ? (
                  <Loader2 className="animate-spin text-violet-600" />
                ) : (
                  formData.coverUrl && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={14} /> Ready
                    </span>
                  )
                )}
              </div>
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer relative group ${formData.coverUrl ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-violet-400 bg-gray-50 hover:bg-violet-50"}`}
                onClick={() =>
                  !uploading && document.getElementById("coverInput").click()
                }
              >
                <input
                  type="file"
                  id="coverInput"
                  hidden
                  accept="image/*"
                  onChange={handleCoverSelect}
                  disabled={uploading}
                />

                {!formData.coverUrl ? (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium text-lg">
                      Drop your cover art here
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Drag & drop or click to browse
                    </p>
                  </>
                ) : (
                  <div className="relative">
                    <img
                      src={formData.coverUrl}
                      alt="Cover Preview"
                      className="max-h-64 mx-auto rounded shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-medium">
                        Click to Change
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Info */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Basic Release Info
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <Input
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Release Title"
                />

                {/* UPDATED: Primary Artist Dropdown to match Artist Profile Exactly */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                    Primary Artist *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.primaryArtist}
                      onChange={(e) =>
                        updateField("primaryArtist", e.target.value)
                      }
                      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 appearance-none"
                    >
                      <option value="">Select Artist from List</option>
                      {availableArtists &&
                        availableArtists.map((artist) => (
                          <option key={artist.name} value={artist.name}>
                            {artist.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-3 text-gray-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                    Language *
                  </label>
                  <CustomSelect
                    value={formData.language}
                    onValueChange={(v) => updateField("language", v)}
                    placeholder="Select language"
                  >
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </CustomSelect>
                </div>

                <Input
                  label="Featuring Artists"
                  value={formData.featuringArtists}
                  onChange={(e) =>
                    updateField("featuringArtists", e.target.value)
                  }
                  placeholder="Comma separated"
                />
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                    Release Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => updateField("releaseDate", e.target.value)}
                    className="pl-3"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                    Genre *
                  </label>
                  <CustomSelect
                    value={formData.genre}
                    onValueChange={(v) => updateField("genre", v)}
                    placeholder="Select genre"
                  >
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                    Format *
                  </label>
                  <CustomSelect
                    value={formData.format}
                    onValueChange={(v) => updateField("format", v)}
                    placeholder="Select format"
                  >
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="ep">EP</SelectItem>
                    <SelectItem value="album">Album</SelectItem>
                  </CustomSelect>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Audio/Lyrics */}
        {step === 2 && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Upload Audio & Lyrics
              </h2>
              <p className="text-gray-500 mt-2">
                {existingRelease
                  ? "Update audio file (optional)."
                  : "Please provide the audio file and lyrics."}
              </p>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Audio File *
                  </label>
                  {uploading ? (
                    <Loader2 className="animate-spin text-violet-600" />
                  ) : (
                    (formData.audioUrl || newAudioFile) && (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle2 size={14} />{" "}
                        {newAudioFile ? newAudioFile.name : "Current File"}
                      </span>
                    )
                  )}
                </div>
                <div
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer relative ${formData.audioUrl || newAudioFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-violet-400 bg-gray-50 hover:bg-violet-50"}`}
                  onClick={() =>
                    !uploading && document.getElementById("audioInput").click()
                  }
                >
                  <input
                    type="file"
                    id="audioInput"
                    hidden
                    accept="audio/*"
                    onChange={handleAudioSelect}
                    disabled={uploading}
                  />
                  {!(formData.audioUrl || newAudioFile) ? (
                    <>
                      <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Music className="w-8 h-8 text-violet-600" />
                      </div>
                      <p className="text-gray-900 font-medium text-lg">
                        Upload Audio File
                      </p>
                      <p className="text-sm text-gray-500 mt-2">MP3, WAV</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Play className="w-12 h-12 text-green-600 mb-2" />
                      <p className="text-green-700 font-medium">
                        {newAudioFile
                          ? "New Audio Selected"
                          : "Current Audio Ready"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                  Lyrics / Paragraph
                </label>
                <textarea
                  value={formData.mainLyrics}
                  onChange={(e) => updateField("mainLyrics", e.target.value)}
                  placeholder="Paste your lyrics here..."
                  rows={10}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Rights */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Copyright & Distribution
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Copyright Holder *"
                  value={formData.copyrightHolder}
                  onChange={(e) =>
                    updateField("copyrightHolder", e.target.value)
                  }
                  placeholder="Label Name"
                />
                <Input
                  label="Copyright Year *"
                  value={formData.copyrightYear}
                  onChange={(e) => updateField("copyrightYear", e.target.value)}
                  placeholder="2024"
                />
                <Input
                  label="Publisher"
                  value={formData.publisher}
                  onChange={(e) => updateField("publisher", e.target.value)}
                  placeholder="Publisher Name"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                  Distribution Platforms *
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MOCK_PLATFORMS.map((platform) => (
                    <Checkbox
                      key={platform.id}
                      label={platform.name}
                      checked={formData.platforms.includes(platform.name)}
                      onCheckedChange={() => togglePlatform(platform.name)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER BUTTONS */}
      <div className="border-t border-gray-200 bg-white p-4 md:px-8 flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={step === 0}
          className="px-8"
        >
          Previous
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={nextStep} className="px-8">
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : (
              <Copyright className="mr-2" size={18} />
            )}
            {existingRelease ? "Update Release" : "Submit Release"}
          </Button>
        )}
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────
// 🎵 SONG MANAGER MAIN WRAPPER
// ─────────────────────────────────────────────────────────────

const SongManager = () => {
  const [songs, setSongs] = useState([]);
  const [availableArtists, setAvailableArtists] = useState([]); // NEW STATE
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [viewMode, setViewMode] = useState("grid");
  const navigate = useNavigate();

  const [editingSong, setEditingSong] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const audioRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("releases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedSongs = data.map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.primary_artist,
        image: song.cover_url || "https://via.placeholder.com/300",
        genre: song.genre,
        status: song.status || "Draft",
        audioUrl: song.audio_url,
      }));

      setSongs(formattedSongs);
    } catch (error) {
      console.error("Error fetching songs:", error);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch Artists for the Dropdown
  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("name")
        .eq("status", "Verified") // Only show verified artists to link songs to
        .order("name", { ascending: true });
      if (error) throw error;
      setAvailableArtists(data || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
    }
  };

  useEffect(() => {
    fetchSongs();
    fetchArtists();
  }, []);

  const handlePlay = (url, id) => {
    const audio = audioRef.current;
    if (playingId === id && audio) {
      if (audio.paused) audio.play();
      else audio.pause();
    } else {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      const newAudio = new Audio(url);
      newAudio.play().catch((e) => console.error("Playback error:", e));
      audioRef.current = newAudio;
      setPlayingId(id);
      newAudio.onended = () => setPlayingId(null);
    }
  };

  const openAddForm = () => {
    setEditingSong(null);
    setView("form");
  };
  const openEditForm = (song) => {
    setEditingSong(song);
    setView("form");
  };
  const closeForm = () => {
    setView("list");
    setEditingSong(null);
    fetchSongs();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this release?"))
      return;
    try {
      const { error } = await supabase.from("releases").delete().eq("id", id);
      if (error) throw error;
      showToast("Deleted successfully");
      fetchSongs();
    } catch (error) {
      showToast("Failed to delete", "error");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl z-[100] text-white font-medium flex items-center gap-3 ${toast.type === "error" ? "bg-red-600" : "bg-gray-800"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}{" "}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view === "form" && (
              <button
                onClick={closeForm}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            {/* ADDED SONG COUNT BADGE HERE */}
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {view === "form" ? (
                editingSong ? (
                  "Edit Release"
                ) : (
                  "Add New Audio Release"
                )
              ) : (
                <>
                  Audio Manager
                  <span className="ml-2 bg-violet-100 text-violet-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {songs.length}
                  </span>
                </>
              )}
            </h1>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        {view === "list" && (
          <div className="flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  placeholder="Search releases..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-violet-500 text-sm bg-white"
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex bg-white rounded-lg border border-gray-300 p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <Grid3x3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-md transition-all ${viewMode === "table" ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <List size={18} />
                  </button>
                </div>
                <button
                  onClick={openAddForm}
                  className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 flex items-center gap-2 shadow-sm"
                >
                  <Plus size={18} /> New Release
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex-grow flex items-center justify-center">
                <Loader2 className="animate-spin text-violet-600" size={40} />
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto">
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                    {songs.map((song) => (
                      <div
                        key={song.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group flex flex-col"
                      >
                        <div className="aspect-square relative bg-gray-100">
                          <img
                            src={song.image}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <button
                              onClick={() => handlePlay(song.audioUrl, song.id)}
                              className="p-3 rounded-full bg-white text-violet-600 hover:scale-110 transition-transform shadow-lg"
                            >
                              {playingId === song.id &&
                              !audioRef.current?.paused ? (
                                <Pause className="w-5 h-5 fill-current" />
                              ) : (
                                <Play className="fill-current w-5 h-5 ml-0.5" />
                              )}
                            </button>
                          </div>
                          <span
                            className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md ${song.status === "Published" ? "bg-green-500" : "bg-yellow-500"}`}
                          >
                            {song.status}
                          </span>
                        </div>
                        <div className="p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 truncate mb-1">
                              {song.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {song.artist}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditForm(song)}
                              className="text-xs font-medium text-violet-600 hover:text-violet-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(song.id)}
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === "table" && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Release
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Artist
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Genre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {songs.map((song) => (
                            <tr
                              key={song.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <img
                                      className="h-10 w-10 rounded-lg object-cover"
                                      src={song.image}
                                      alt=""
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="text-sm font-medium text-gray-900">
                                      {song.title}
                                    </div>
                                    <button
                                      onClick={() =>
                                        handlePlay(song.audioUrl, song.id)
                                      }
                                      className="mt-1 text-xs text-violet-600 hover:text-violet-900 flex items-center gap-1"
                                    >
                                      {playingId === song.id &&
                                      !audioRef.current?.paused ? (
                                        <Pause size={14} />
                                      ) : (
                                        <Play size={14} />
                                      )}{" "}
                                      {playingId === song.id &&
                                      !audioRef.current?.paused
                                        ? "Pause"
                                        : "Play"}
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {song.artist}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-violet-100 text-violet-800">
                                  {song.genre}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${song.status === "Published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                                >
                                  {song.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => openEditForm(song)}
                                  className="text-violet-600 hover:text-violet-900 mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(song.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === "form" && (
          <div className="flex-grow h-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
            <AudioReleaseForm
              onClose={closeForm}
              onSuccess={closeForm}
              existingRelease={editingSong}
              notify={showToast}
              availableArtists={availableArtists}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default SongManager;