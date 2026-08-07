import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Upload,
  Trash2,
  Music,
  Video,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
} from "lucide-react";

const BUCKET_NAME = "ads-media";

const AdsAdmin = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [playingPreviewId, setPlayingPreviewId] = useState(null);
  const fileInputRef = useRef(null);
  const previewAudioRef = useRef(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Fetch ads error:", error);
      setErrorMsg("Ads load nahi ho paye: " + error.message);
    } else {
      setAds(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleFileChange = (e) => {
    clearMessages();
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    const isAudio = f.type.startsWith("audio/");
    const isVideo = f.type.startsWith("video/");
    if (!isAudio && !isVideo) {
      setErrorMsg("Sirf audio ya video file allowed hai.");
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const resetForm = () => {
    setTitle("");
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!file) {
      setErrorMsg("Pehle koi audio ya video file select karo.");
      return;
    }
    setUploading(true);
    try {
      const mediaType = file.type.startsWith("video/") ? "video" : "audio";
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${mediaType}/${Date.now()}_${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error("Public URL nahi mil paya.");

      const { error: insertErr } = await supabase.from("ads").insert({
        title: title.trim() || file.name,
        audio_url: publicUrl,
        media_type: mediaType,
        active: true,
      });

      if (insertErr) throw insertErr;

      setSuccessMsg("Ad successfully upload ho gaya! ✅");
      resetForm();
      fetchAds();
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg("Upload fail ho gaya: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (ad) => {
    clearMessages();
    const { error } = await supabase
      .from("ads")
      .update({ active: !ad.active })
      .eq("id", ad.id);
    if (error) {
      setErrorMsg("Status update fail: " + error.message);
      return;
    }
    setAds((prev) =>
      prev.map((a) => (a.id === ad.id ? { ...a, active: !a.active } : a)),
    );
  };

  const deleteAd = async (ad) => {
    if (!window.confirm(`"${ad.title || "Ad"}" ko delete karna hai?`)) return;
    clearMessages();
    try {
      // storage se bhi file hata do (URL se path nikaalo)
      const urlParts = ad.audio_url.split(`${BUCKET_NAME}/`);
      const storagePath = urlParts[1];
      if (storagePath) {
        await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      }
      const { error } = await supabase.from("ads").delete().eq("id", ad.id);
      if (error) throw error;
      setAds((prev) => prev.filter((a) => a.id !== ad.id));
      setSuccessMsg("Ad delete ho gaya.");
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMsg("Delete fail: " + err.message);
    }
  };

  const togglePreview = (ad) => {
    if (playingPreviewId === ad.id) {
      previewAudioRef.current?.pause();
      setPlayingPreviewId(null);
    } else {
      setPlayingPreviewId(ad.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Ads Manager</h1>
        <p className="text-gray-400 text-sm mb-6">
          Yaha se upload ki gayi audio/video ad, non-paid users ke song play
          karte waqt automatically chalegi.
        </p>

        {/* Upload Form */}
        <form
          onSubmit={handleUpload}
          className="bg-slate-900 border border-white/10 rounded-2xl p-5 md:p-6 mb-8 space-y-4"
        >
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Ad Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Diwali Sale Promo"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Audio ya Video File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer cursor-pointer bg-slate-800 border border-white/10 rounded-lg"
            />
          </div>

          {previewUrl && file && (
            <div className="rounded-lg overflow-hidden border border-white/10 bg-slate-800 p-3">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                {file.type.startsWith("video/") ? (
                  <Video className="w-3.5 h-3.5" />
                ) : (
                  <Music className="w-3.5 h-3.5" />
                )}
                Preview ({file.type.startsWith("video/") ? "Video" : "Audio"})
              </p>
              {file.type.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full max-h-64 rounded"
                />
              ) : (
                <audio src={previewUrl} controls className="w-full" />
              )}
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload Ad
              </>
            )}
          </button>
        </form>

        {/* Ads List */}
        <h2 className="text-lg font-bold mb-3">Existing Ads ({ads.length})</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading ads...
          </div>
        ) : ads.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Abhi tak koi ad upload nahi hui hai.
          </p>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="flex items-center gap-4 bg-slate-900 border border-white/10 rounded-xl p-3.5"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {ad.media_type === "video" ? (
                    <Video className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Music className="w-5 h-5 text-blue-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {ad.title || "Untitled Ad"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {ad.media_type || "audio"} ·{" "}
                    {new Date(ad.created_at).toLocaleDateString("en-IN")}
                  </p>
                  {ad.media_type !== "video" && (
                    <audio
                      ref={playingPreviewId === ad.id ? previewAudioRef : null}
                      src={ad.audio_url}
                      onEnded={() => setPlayingPreviewId(null)}
                      className="hidden"
                    />
                  )}
                </div>

                {ad.media_type !== "video" && (
                  <button
                    onClick={() => togglePreview(ad)}
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Preview"
                  >
                    {playingPreviewId === ad.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => toggleActive(ad)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex-shrink-0 ${
                    ad.active
                      ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                      : "bg-gray-500/15 text-gray-400 hover:bg-gray-500/25"
                  }`}
                >
                  {ad.active ? "Active" : "Inactive"}
                </button>

                <button
                  onClick={() => deleteAd(ad)}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsAdmin;
