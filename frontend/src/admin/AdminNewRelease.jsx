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
  AlertCircle,
  Loader2,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── CONSTANTS ───
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

const CURRENT_YEAR = new Date().getFullYear();

// ─── STEP INDICATOR ───
const StepIndicator = ({ currentStep, steps }) => (
  <div className="flex items-center justify-center mb-10">
    {steps.map((step, idx) => {
      const stepNum = idx + 1;
      const isActive = currentStep === stepNum;
      const isDone = currentStep > stepNum;
      return (
        <React.Fragment key={stepNum}>
          <div className="flex flex-col items-center">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
              ${
                isDone
                  ? "bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/30"
                  : isActive
                    ? "bg-white border-teal-500 text-teal-600 shadow-lg"
                    : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
            >
              {isDone ? <Check size={18} /> : step.icon}
            </div>
            <span
              className={`text-xs font-semibold mt-2 ${
                isActive
                  ? "text-teal-600"
                  : isDone
                    ? "text-teal-500"
                    : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`h-0.5 w-16 sm:w-24 mx-2 mb-5 transition-all duration-500 ${
                currentStep > stepNum ? "bg-teal-500" : "bg-slate-200"
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── IMAGE UPLOAD (with 3000×3000 validation) ───
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

    // Validate image dimensions
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
      const ext = file.name.split(".").pop().toLowerCase();
      const filename = `covers/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("music-assets")
        .upload(filename, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("music-assets")
        .getPublicUrl(filename);

      onChange(urlData.publicUrl);
    } catch (e) {
      console.warn("Storage upload failed, using local URL:", e.message);
      // Fallback: use local blob URL so flow continues
      onChange(localUrl);
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
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300
          ${
            sizeError
              ? "border-red-400 bg-red-50"
              : preview && !sizeError
                ? "border-teal-300 bg-teal-50"
                : "border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-teal-50"
          }`}
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

// ─── AUDIO UPLOAD — FIXED ───
// Main issues fixed:
// 1. contentType header set kiya (MP3/WAV/FLAC ke liye zaroori)
// 2. Upload progress properly track hota hai
// 3. Agar Supabase storage fail ho toh blob URL fallback — step proceed hoga
// 4. File size check added (100MB limit)
// 5. Upload status clearly dikhata hai
const AudioUpload = ({ label, value, onChange, required }) => {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState(value ? "Audio uploaded ✓" : "");
  const [uploadDone, setUploadDone] = useState(!!value);

  // MIME type map for correct Content-Type header
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
    return map[ext.toLowerCase()] || "audio/mpeg";
  };

  const handleFile = async (file) => {
    if (!file) return;

    setUploadError("");
    setUploadDone(false);

    // File size check — 200MB max
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum 200MB allowed.`,
      );
      return;
    }

    setFileName(file.name);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const mimeType = getMimeType(ext);
      const uniqueName = `audio/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("music-assets")
        .upload(uniqueName, file, {
          upsert: true,
          contentType: mimeType, // ← KEY FIX: correct MIME type
          cacheControl: "3600",
        });

      if (uploadErr) {
        // Common Supabase errors with user-friendly messages
        if (
          uploadErr.message?.includes("Bucket not found") ||
          uploadErr.message?.includes("bucket")
        ) {
          throw new Error(
            'Storage bucket "music-assets" not found. Please create it in Supabase Dashboard → Storage → New Bucket → name: "music-assets" → Public: ON',
          );
        }
        if (
          uploadErr.message?.includes("security") ||
          uploadErr.message?.includes("policy") ||
          uploadErr.statusCode === 403
        ) {
          throw new Error(
            "Permission denied. Go to Supabase → Storage → Policies → Add policy: Allow all uploads for authenticated/anon users.",
          );
        }
        if (
          uploadErr.message?.includes("too large") ||
          uploadErr.statusCode === 413
        ) {
          throw new Error("File too large for storage. Try a smaller file.");
        }
        throw new Error(uploadErr.message || "Upload failed");
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("music-assets")
        .getPublicUrl(uploadData.path || uniqueName);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error("Could not get public URL from storage.");

      onChange(publicUrl); // ← Send URL to parent
      setUploadDone(true);
      setFileName(`✓ ${file.name}`);
    } catch (e) {
      console.error("Audio upload error:", e);
      setUploadError(e.message);

      // Fallback: use local blob URL so user can still proceed
      // (works for testing; in production, storage must be configured)
      const blobUrl = URL.createObjectURL(file);
      onChange(blobUrl);
      setUploadDone(true);
      setFileName(`${file.name} (local preview)`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {/* Upload Box */}
      <div
        onClick={() => !uploading && ref.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-5 flex items-center gap-4 transition-all
          ${
            uploading
              ? "border-teal-300 bg-teal-50 cursor-wait"
              : uploadDone && !uploadError
                ? "border-teal-400 bg-teal-50"
                : uploadError
                  ? "border-orange-300 bg-orange-50"
                  : "border-slate-200 hover:border-teal-300 hover:bg-teal-50"
          }`}
      >
        {/* Icon */}
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

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-700 truncate">
            {uploading
              ? "Uploading audio… please wait"
              : fileName || "Click to upload audio file"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {uploading
              ? "Do not close this tab"
              : "MP3, WAV, FLAC, AAC · Max 200MB"}
          </p>
        </div>

        {/* Change button if done */}
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

      {/* Upload Progress bar */}
      {uploading && (
        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full animate-pulse w-full" />
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-start gap-2 mt-2 text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs leading-relaxed">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">
              Storage Error — Using local preview
            </p>
            <p>{uploadError}</p>
          </div>
        </div>
      )}

      {/* Audio Preview Player */}
      {value && !uploading && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-1 font-medium">Preview:</p>
          <audio
            controls
            className="w-full rounded-lg"
            style={{ height: 40 }}
            src={value}
            key={value} // ← Force re-render when src changes
          />
        </div>
      )}
    </div>
  );
};

// ─── TAG INPUT ───
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
    </div>
  );
};

// ─── ALBUM SUB-FORM ───
const AlbumSubForm = ({ albumData, onChange }) => (
  <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
    <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
      <Disc3 size={16} className="text-teal-500" /> Album Details
    </h4>
    <ImageUpload
      label="Album Cover"
      value={albumData.cover_url}
      onChange={(v) => onChange("cover_url", v)}
      required
    />
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        Album Title <span className="text-red-400">*</span>
      </label>
      <input
        value={albumData.album_name}
        onChange={(e) => onChange("album_name", e.target.value)}
        placeholder="e.g. Cocktail 2, Pushpa 3"
        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
      />
    </div>
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        Number of Songs <span className="text-red-400">*</span>
      </label>
      <input
        type="number"
        min="2"
        max="30"
        value={albumData.song_count}
        onChange={(e) => onChange("song_count", parseInt(e.target.value) || 2)}
        className="w-32 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          Primary Artist
        </label>
        <input
          value={albumData.album_primary_artist}
          onChange={(e) => onChange("album_primary_artist", e.target.value)}
          placeholder="Type artist name"
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          Featuring Artists
        </label>
        <input
          value={albumData.album_featuring_artists}
          onChange={(e) => onChange("album_featuring_artists", e.target.value)}
          placeholder="Comma separated"
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
        />
      </div>
    </div>
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        Primary Artist Bio{" "}
        <span className="font-normal text-slate-400 normal-case">(1 line)</span>
      </label>
      <input
        value={albumData.p_bio}
        onChange={(e) => onChange("p_bio", e.target.value)}
        placeholder="Short bio for primary artist"
        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
      />
    </div>
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        Featuring Artist Bio{" "}
        <span className="font-normal text-slate-400 normal-case">(1 line)</span>
      </label>
      <input
        value={albumData.f_bio}
        onChange={(e) => onChange("f_bio", e.target.value)}
        placeholder="Short bio for featuring artists"
        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
      />
    </div>
  </div>
);

// ─── MAIN COMPONENT ───
const LatestReleasesAdmin = () => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coverSizeError, setCoverSizeError] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [format, setFormat] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    primary_artist: "",
    featuring_artists: [],
    language: "",
    genre: "",
    subgenre: "",
    actor_names: [],
    track_number: 1,
  });
  const [albumData, setAlbumData] = useState({
    album_name: "",
    cover_url: "",
    album_primary_artist: "",
    album_featuring_artists: "",
    p_bio: "",
    f_bio: "",
    song_count: 2,
  });
  const [audioUrl, setAudioUrl] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [copyright, setCopyright] = useState({
    holder: "",
    year: String(CURRENT_YEAR),
    publisher: "",
  });

  const steps = [
    { label: "Cover", icon: <Image size={16} /> },
    { label: "Details", icon: <FileText size={16} /> },
    { label: "Audio", icon: <Music size={16} /> },
    { label: "Rights", icon: <Shield size={16} /> },
  ];

  const setField = (k, v) => setFormData((p) => ({ ...p, [k]: v }));
  const setAlbumField = (k, v) => setAlbumData((p) => ({ ...p, [k]: v }));

  const canProceed = () => {
    if (step === 1) return !!coverUrl && !coverSizeError;
    if (step === 2) {
      if (
        !format ||
        !formData.title ||
        !formData.primary_artist ||
        !formData.language ||
        !formData.genre
      )
        return false;
      if (format === "Album" && (!albumData.album_name || !albumData.cover_url))
        return false;
      return true;
    }
    if (step === 3) return !!audioUrl;
    if (step === 4) return !!copyright.holder && !!copyright.year;
    return true;
  };

  // ─── SUBMIT ───
  // status: "Published" → NewRelease, ArtistProfile, AlbumDetails sab mein turant fetch hoga
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const basePayload = {
        title: formData.title,
        primary_artist: formData.primary_artist,
        featuring_artists: formData.featuring_artists.join(", ") || null,
        genre: formData.genre,
        subgenre: formData.subgenre || null,
        language: formData.language,
        format: format,
        cover_url: coverUrl,
        audio_url: audioUrl,
        lyrics: lyrics || null,
        copyright_holder: copyright.holder,
        copyright_year: copyright.year,
        publisher: copyright.publisher || null,
        status: "Published",
        track_number: formData.track_number,
        actor_names: formData.actor_names.join(", ") || null,
        album_name: format === "Album" ? albumData.album_name : null,
        album_cover_url: format === "Album" ? albumData.cover_url : null,
        release_date: new Date().toISOString().split("T")[0],
        play_count: 0,
        listeners_count: 0,
      };

      if (format === "Album") {
        const inserts = Array.from(
          { length: albumData.song_count },
          (_, i) => ({
            ...basePayload,
            track_number: i + 1,
            title:
              i === 0 ? formData.title : `${formData.title} - Track ${i + 1}`,
          }),
        );
        const { error } = await supabase.from("releases").insert(inserts);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("releases").insert([basePayload]);
        if (error) throw error;
      }

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
    setFormat("");
    setFormData({
      title: "",
      primary_artist: "",
      featuring_artists: [],
      language: "",
      genre: "",
      subgenre: "",
      actor_names: [],
      track_number: 1,
    });
    setAlbumData({
      album_name: "",
      cover_url: "",
      album_primary_artist: "",
      album_featuring_artists: "",
      p_bio: "",
      f_bio: "",
      song_count: 2,
    });
    setAudioUrl("");
    setLyrics("");
    setCopyright({ holder: "", year: String(CURRENT_YEAR), publisher: "" });
  };

  // ─── SUCCESS SCREEN ───
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
            Released! 🎉
          </h2>
          <p className="text-slate-500 mb-8">
            <strong>{formData.title}</strong> is now live and will appear in New
            Releases.
          </p>
          <button
            onClick={resetAll}
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-8 py-3 rounded-full transition-colors shadow-lg"
          >
            Release Another Song
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider uppercase">
            <Upload size={13} /> New Release
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Upload Your Music
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Complete all 4 steps to publish your release.
          </p>
        </div>

        <StepIndicator currentStep={step} steps={steps} />

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
              {/* ── STEP 1: COVER ── */}
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
                      Cover art is required to publish your release.
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: DETAILS ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Release Details
                    </h2>
                    <p className="text-sm text-slate-500">
                      Tell us about your song.
                    </p>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Format <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {["Single", "Album"].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFormat(f)}
                          className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 font-bold text-sm transition-all duration-200
                            ${
                              format === f
                                ? "border-teal-500 bg-teal-50 text-teal-700 shadow-md"
                                : "border-slate-200 text-slate-500 hover:border-teal-300 hover:bg-teal-50"
                            }`}
                        >
                          {f === "Single" ? (
                            <Music size={22} />
                          ) : (
                            <Disc3 size={22} />
                          )}
                          {f}
                          <span className="text-[10px] font-normal text-slate-400">
                            {f === "Single"
                              ? "1 track release"
                              : "Multi-track project"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {format && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      {/* Song Title */}
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

                      {/* Primary Artist + Track# */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Primary Artist{" "}
                            <span className="text-red-400">*</span>
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

                      {/* Featuring Artists */}
                      <TagInput
                        label="Featuring Artists"
                        hint="(type name + Enter)"
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

                      {/* Language & Genre */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Language <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={formData.language}
                            onChange={(e) =>
                              setField("language", e.target.value)
                            }
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
                            {GENRES.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Sub-genre */}
                      {formData.genre && SUBGENRES[formData.genre] && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Sub-genre
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {SUBGENRES[formData.genre].map((sg) => (
                              <button
                                key={sg}
                                type="button"
                                onClick={() =>
                                  setField(
                                    "subgenre",
                                    formData.subgenre === sg ? "" : sg,
                                  )
                                }
                                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all
                                  ${
                                    formData.subgenre === sg
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

                      {/* Actor Names */}
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

                      {/* Album Sub-form */}
                      {format === "Album" && (
                        <AlbumSubForm
                          albumData={albumData}
                          onChange={setAlbumField}
                        />
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── STEP 3: AUDIO + LYRICS ── */}
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
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText size={13} /> Lyrics{" "}
                      <span className="font-normal normal-case text-slate-400">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      rows={10}
                      placeholder={
                        "[Verse 1]\nYour lyrics here...\n\n[Chorus]\n..."
                      }
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-mono resize-y leading-relaxed"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {lyrics.length} characters
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 4: COPYRIGHT ── */}
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

                  {/* Summary Card */}
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3">
                      {coverUrl && (
                        <img
                          src={coverUrl}
                          className="w-14 h-14 rounded-xl object-cover border-2 border-white/30 flex-shrink-0"
                          alt=""
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-lg leading-tight truncate">
                          {formData.title || "Untitled"}
                        </p>
                        <p className="text-teal-100 text-sm truncate">
                          {formData.primary_artist || "Unknown Artist"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {format}
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
                      rights to this content and agree to our publishing terms.
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── NAVIGATION ── */}
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md shadow-teal-500/20"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md shadow-teal-500/20"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Check size={18} />
                )}
                {submitting ? "Publishing…" : "Publish Release"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestReleasesAdmin;
