import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Music2,
  RefreshCw,
  Search,
  CheckCircle2,
  Download,
  Calendar,
  User,
} from "lucide-react";
import { distributionClient } from "../lib/distributionClient";
import { supabase } from "../lib/supabaseClient";

// ⚠️ CONFIRM: distribution project mein released songs kis TABLE mein hain
// aur uske column names kya hain. Neeche apne hisaab se adjust karo.
const DIST_TABLE = "releases"; // e.g. "releases" / "distribution_releases"
const DIST_STATUS_FILTER = { column: "status", value: "Released" }; // sirf released dikhao

const IncomingSongs = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [importingId, setImportingId] = useState(null);
  const [importedIds, setImportedIds] = useState(new Set());

  const fetchIncoming = async () => {
    setLoading(true);
    setError("");
    try {
      let q = distributionClient
        .from(DIST_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (DIST_STATUS_FILTER) {
        q = q.eq(DIST_STATUS_FILTER.column, DIST_STATUS_FILTER.value);
      }

      const { data, error } = await q;
      if (error) {
        console.error("IncomingSongs fetch error:", error);
        setError(
          "Distribution se songs load nahi hue. Table naam / .env keys / RLS check karo.",
        );
        setSongs([]);
      } else {
        setSongs(data || []);
      }

      // pehle se streaming mein import ho chuke songs ka pata lagao
      // (agar streaming.releases mein distribution_id column ho)
      try {
        const { data: existing } = await supabase
          .from("releases")
          .select("distribution_id");
        setImportedIds(
          new Set(
            (existing || []).map((r) => r.distribution_id).filter(Boolean),
          ),
        );
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncoming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Distribution song ko streaming platform mein import/publish karo
  const importSong = async (song) => {
    setImportingId(song.id);
    try {
      // ⚠️ column mapping: distribution ke fields -> streaming.releases ke fields.
      // Apne streaming releases table ke hisaab se adjust karo.
      const payload = {
        distribution_id: song.id, // dedupe ke liye
        title: song.title,
        primary_artist: song.primary_artist || song.artist,
        featuring_artists: song.featuring_artists || null,
        album_name: song.album_name || null,
        cover_url: song.cover_url || song.artwork_url || null,
        audio_url: song.audio_url || song.song_url || null,
        language: song.language || null,
        genre: song.genre || null,
        status: "Published", // streaming pe live
      };

      const { error } = await supabase.from("releases").insert([payload]);
      if (error) {
        console.error("import error:", error);
        alert("Import fail hua: " + error.message);
      } else {
        setImportedIds((prev) => new Set(prev).add(song.id));
      }
    } finally {
      setImportingId(null);
    }
  };

  const filtered = songs.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (s.title || "").toLowerCase().includes(q) ||
      (s.primary_artist || s.artist || "").toLowerCase().includes(q) ||
      (s.album_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 md:p-8">
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Music2 size={24} className="text-emerald-500" /> Incoming Songs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Movement Creations (Distribution) se released songs — yahan se
            streaming platform pe publish karo.
          </p>
        </div>
        <button
          onClick={fetchIncoming}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 self-start"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
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
          placeholder="Search title, artist, album..."
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
          Koi incoming song nahi mila.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((song, i) => {
            const imported = importedIds.has(song.id);
            return (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="flex gap-3 p-4">
                  <img
                    src={
                      song.cover_url ||
                      song.artwork_url ||
                      "https://via.placeholder.com/80"
                    }
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {song.title || "Untitled"}
                    </h3>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <User size={11} />
                      {song.primary_artist || song.artist || "Unknown artist"}
                    </p>
                    {song.album_name && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {song.album_name}
                      </p>
                    )}
                    {song.created_at && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar size={10} />
                        {new Date(song.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto px-4 pb-4">
                  {imported ? (
                    <div className="flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold py-2.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 size={14} /> Published on Streaming
                    </div>
                  ) : (
                    <button
                      onClick={() => importSong(song)}
                      disabled={importingId === song.id}
                      className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      {importingId === song.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Publish to Streaming
                    </button>
                  )}
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
