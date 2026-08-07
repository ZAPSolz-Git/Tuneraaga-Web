import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Music2,
  RefreshCw,
  Search,
  CheckCircle2,
  Download,
  Calendar,
  User,
  UploadCloud,
  Eye,
  X,
  Play,
  Pause,
  Disc3,
  Tag,
  Languages,
  Globe2,
} from "lucide-react";
import apiClient from "@/lib/ApiClient";

const IncomingSongs = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [importingId, setImportingId] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);

  // ---- details modal ----
  const [activeSubmission, setActiveSubmission] = useState(null);

  // ---- audio playback (single shared <audio> element) ----
  const audioRef = useRef(null);
  const [playingUrl, setPlayingUrl] = useState(null);
  const [audioLoadingUrl, setAudioLoadingUrl] = useState(null);

  const fetchIncoming = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get("/api/incoming-songs");
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error("IncomingSongs fetch error:", err);
      setError(
        err?.response?.data?.error ||
          "Incoming songs load nahi hue. Server route/logs check karo.",
      );
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncoming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // stop playback whenever the modal closes
  useEffect(() => {
    if (!activeSubmission) {
      stopAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubmission]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // ---- single submission publish ----
  const importSubmission = async (submission) => {
    setImportingId(submission.id);
    try {
      await apiClient.post("/api/incoming-songs/sync", {
        submissionIds: [submission.id],
      });
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id ? { ...s, imported: true } : s,
        ),
      );
    } catch (err) {
      console.error("import error:", err);
      alert("Import fail hua: " + (err?.response?.data?.error || err.message));
    } finally {
      setImportingId(null);
    }
  };

  // ---- bulk publish all pending approved submissions ----
  const syncAll = async () => {
    const pendingIds = submissions
      .filter((s) => !s.imported)
      .map((s) => s.id);
    if (!pendingIds.length) return;

    setSyncingAll(true);
    try {
      await apiClient.post("/api/incoming-songs/sync", {
        submissionIds: pendingIds,
      });
      setSubmissions((prev) =>
        prev.map((s) =>
          pendingIds.includes(s.id) ? { ...s, imported: true } : s,
        ),
      );
    } catch (err) {
      console.error("bulk sync error:", err);
      alert(
        "Bulk sync fail hua: " + (err?.response?.data?.error || err.message),
      );
    } finally {
      setSyncingAll(false);
    }
  };

  // ---- audio playback helpers ----
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingUrl(null);
    setAudioLoadingUrl(null);
  };

  const togglePlay = (url) => {
    if (!url || !audioRef.current) return;

    // same track already playing -> pause it
    if (playingUrl === url) {
      audioRef.current.pause();
      setPlayingUrl(null);
      return;
    }

    // switching tracks (or starting fresh)
    setAudioLoadingUrl(url);
    audioRef.current.src = url;
    audioRef.current
      .play()
      .then(() => {
        setPlayingUrl(url);
        setAudioLoadingUrl(null);
      })
      .catch((err) => {
        console.error("audio play error:", err);
        setAudioLoadingUrl(null);
        alert("Audio play nahi ho paaya — file URL check karo.");
      });
  };

  const filtered = submissions.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (s.title || "").toLowerCase().includes(q) ||
      (s.primary_artist || "").toLowerCase().includes(q) ||
      (s.users?.full_name || "").toLowerCase().includes(q) ||
      (s.users?.label_name || "").toLowerCase().includes(q)
    );
  });

  const pendingCount = submissions.filter((s) => !s.imported).length;

  return (
    <div className="p-4 md:p-8">
      {/* shared audio element — src swapped by togglePlay() */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingUrl(null)}
        className="hidden"
      />

      {/* header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Music2 size={24} className="text-emerald-500" /> Incoming Songs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Movement Creations (Distribution) se approved submissions — yahan
            se TuneRaaga pe publish karo.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={syncAll}
            disabled={syncingAll || loading || pendingCount === 0}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {syncingAll ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <UploadCloud size={15} />
            )}
            {syncingAll ? "Syncing..." : `Sync All Approved (${pendingCount})`}
          </button>
          <button
            onClick={fetchIncoming}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* search */}
      <div className="relative mb-5 max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, artist, label..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-slate-400" size={30} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm flex flex-col items-center gap-2">
          <Music2 size={30} className="text-slate-300" />
          Koi approved submission nahi mila.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((submission, i) => {
            const trackCount = Array.isArray(submission.tracks)
              ? submission.tracks.length
              : 0;
            const isImporting = importingId === submission.id;

            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="flex gap-3 p-4">
                  <img
                    src={submission.cover_url || "https://via.placeholder.com/80"}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {submission.title || "Untitled"}
                    </h3>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <User size={11} />
                      {submission.primary_artist || "Unknown artist"}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {submission.users?.label_name ||
                        submission.users?.full_name ||
                        "—"}
                      {trackCount > 1 ? ` · ${trackCount} tracks` : ""}
                    </p>
                    {submission.created_at && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar size={10} />
                        {new Date(submission.created_at).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => setActiveSubmission(submission)}
                    className="flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-lg transition-colors"
                  >
                    <Eye size={14} /> Details
                  </button>

                  {submission.imported ? (
                    <div className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold py-2.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 size={14} /> Published on TuneRaaga
                    </div>
                  ) : (
                    <button
                      onClick={() => importSubmission(submission)}
                      disabled={isImporting}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          Publish to TuneRaaga
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ---- Details modal ---- */}
      <AnimatePresence>
        {activeSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveSubmission(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
            >
              {/* modal header */}
              <div className="flex items-start gap-3 p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                <img
                  src={
                    activeSubmission.cover_url ||
                    "https://via.placeholder.com/80"
                  }
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-extrabold text-slate-900 text-base truncate">
                    {activeSubmission.title || "Untitled"}
                  </h2>
                  <p className="text-xs text-slate-500 truncate">
                    {activeSubmission.primary_artist || "Unknown artist"}
                    {activeSubmission.featuring_artists
                      ? ` ft. ${activeSubmission.featuring_artists}`
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSubmission(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* metadata grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {activeSubmission.genre && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Disc3 size={13} className="text-slate-400" />
                      {activeSubmission.genre}
                      {activeSubmission.subgenre
                        ? ` · ${activeSubmission.subgenre}`
                        : ""}
                    </div>
                  )}
                  {activeSubmission.language && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Languages size={13} className="text-slate-400" />
                      {activeSubmission.language}
                    </div>
                  )}
                  {activeSubmission.release_type && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Tag size={13} className="text-slate-400" />
                      {activeSubmission.release_type}
                    </div>
                  )}
                  {Array.isArray(activeSubmission.distribution_platforms) &&
                    activeSubmission.distribution_platforms.length > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
                        <Globe2 size={13} className="text-slate-400" />
                        {activeSubmission.distribution_platforms.join(", ")}
                      </div>
                    )}
                </div>

                {/* main submission-level audio, if present */}
                {activeSubmission.audio_url && (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <button
                      onClick={() => togglePlay(activeSubmission.audio_url)}
                      className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                    >
                      {audioLoadingUrl === activeSubmission.audio_url ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : playingUrl === activeSubmission.audio_url ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} className="ml-0.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">
                        Main audio
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Submission-level file
                      </p>
                    </div>
                  </div>
                )}

                {/* tracks */}
                {Array.isArray(activeSubmission.tracks) &&
                  activeSubmission.tracks.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                        Tracks ({activeSubmission.tracks.length})
                      </p>
                      <div className="space-y-2">
                        {[...activeSubmission.tracks]
                          .sort(
                            (a, b) =>
                              new Date(a.created_at) - new Date(b.created_at),
                          )
                          .map((track, idx) => {
                            const url = track.audio_file_url;
                            const isPlaying = url && playingUrl === url;
                            const isLoadingTrack = url && audioLoadingUrl === url;

                            return (
                              <div
                                key={track.id}
                                className="flex items-center gap-3 border border-slate-100 rounded-xl p-3"
                              >
                                <button
                                  onClick={() => togglePlay(url)}
                                  disabled={!url}
                                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                                >
                                  {isLoadingTrack ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : isPlaying ? (
                                    <Pause size={16} />
                                  ) : (
                                    <Play size={16} className="ml-0.5" />
                                  )}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-800 truncate">
                                    {idx + 1}. {track.title || "Untitled track"}
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {track.primaryArtist || "—"}
                                    {track.duration
                                      ? ` · ${Math.round(track.duration)}s`
                                      : ""}
                                    {!url ? " · no audio file" : ""}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                {activeSubmission.lyrics && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Lyrics
                    </p>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {activeSubmission.lyrics}
                    </p>
                  </div>
                )}
              </div>

              {/* modal footer action */}
              <div className="p-5 pt-0">
                {activeSubmission.imported ? (
                  <div className="flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold py-2.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 size={14} /> Published on TuneRaaga
                  </div>
                ) : (
                  <button
                    onClick={() => importSubmission(activeSubmission)}
                    disabled={importingId === activeSubmission.id}
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                  >
                    {importingId === activeSubmission.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Publish to TuneRaaga
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IncomingSongs;