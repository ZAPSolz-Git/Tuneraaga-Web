import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Music2,
  RefreshCw,
  Search,
  Download,
  Calendar,
  User,
  UploadCloud,
} from "lucide-react";
import apiClient from "@/lib/ApiClient";

// ─── Blue Gradient Palette (matches the rest of the admin panel) ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const IncomingSongs = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [importingId, setImportingId] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);

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
    const pendingIds = submissions.filter((s) => !s.imported).map((s) => s.id);
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

  // Only show songs that are NOT yet published — once a submission is
  // imported/published, it disappears from this list immediately (no more
  // "Published" badge lingering here; published songs live on the main site).
  const filtered = submissions
    .filter((s) => !s.imported)
    .filter((s) => {
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
    <div className="p-4 md:p-8 bg-white min-h-full">
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Music2 size={24} className="text-blue-500" /> Incoming Songs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Movement Creations (Distribution) se approved submissions — yahan se
            TuneRaaga pe publish karo.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={syncAll}
            disabled={syncingAll || loading || pendingCount === 0}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: BLUE_GRADIENT }}
          >
            <UploadCloud
              size={15}
              className={syncingAll ? "animate-spin" : ""}
            />
            {syncingAll ? "Syncing..." : `Sync All Approved (${pendingCount})`}
          </button>
          <button
            onClick={fetchIncoming}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
          >
            <RefreshCw
              size={15}
              className={`text-blue-500 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
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
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-400" size={30} />
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

            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all overflow-hidden flex flex-col"
              >
                <div className="flex gap-3 p-4">
                  <img
                    src={
                      submission.cover_url || "https://via.placeholder.com/80"
                    }
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {submission.title || "Untitled"}
                    </h3>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <User size={11} className="text-blue-400" />
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
                        <Calendar size={10} className="text-blue-400" />
                        {new Date(submission.created_at).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto px-4 pb-4">
                  <button
                    onClick={() => importSubmission(submission)}
                    disabled={importingId === submission.id}
                    className="w-full flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm hover:opacity-90 disabled:opacity-60"
                    style={{ background: BLUE_GRADIENT }}
                  >
                    {importingId === submission.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    Publish to TuneRaaga
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IncomingSongs;
