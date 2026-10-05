import React, { useState, useEffect, useCallback } from "react";
import { Search, Loader2, User, AlertCircle, Users } from "lucide-react";
import Swal from "sweetalert2";

import { supabase } from "../lib/supabaseClient";
import VerifiedBadge from "../components/VerifiedBadge";

const API = `${import.meta.env.VITE_API_URL}/api/external-artist`;

const authHeader = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("You are not logged in. Please log in again.");
  return { Authorization: `Bearer ${token}` };
};

const formatCount = (n) => {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
};

const AdminApiArtists = () => {
  const [verified, setVerified] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const verifiedIds = new Set(verified.map((v) => v.spotify_id));

  const loadVerified = useCallback(async () => {
    try {
      const res = await fetch(`${API}/verified`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load.");
      setVerified(json.artists || []);
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadVerified();
  }, [loadVerified]);

  const search = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed.");
      setResults(json.artists || []);
      if (!json.artists?.length) setSearchError("No artists found.");
    } catch (err) {
      setResults([]);
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const toggle = async (artist) => {
    const id = String(artist.id ?? artist.spotify_id);
    const isOn = verifiedIds.has(id);
    setBusyId(id);
    try {
      const headers = await authHeader();
      const res = isOn
        ? await fetch(`${API}/verified/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers,
          })
        : await fetch(`${API}/verified`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({
              spotify_id: id,
              name: artist.name,
              image: artist.image || null,
            }),
          });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Request failed.");
      await loadVerified();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const Row = ({ artist, id }) => {
    const on = verifiedIds.has(id);
    return (
      <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
          {artist.image ? (
            <img src={artist.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <User size={20} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
            <span className="truncate">{artist.name}</span>
            <VerifiedBadge show={on} size={16} />
          </p>
          <p className="text-xs text-slate-400 truncate flex items-center gap-2">
            <span>Spotify ID: {id}</span>
            {artist.followers > 0 && (
              <span className="flex items-center gap-1">
                <Users size={11} /> {formatCount(artist.followers)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => toggle(artist)}
          disabled={busyId === id}
          className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 disabled:opacity-40 ${
            on
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {busyId === id && <Loader2 size={13} className="animate-spin" />}
          {on ? "Remove tick" : "Give blue tick"}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          API Artists <span className="text-blue-600">Verification</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Give a blue tick to artists that come from Spotify. The tick is
          saved against the artist's Spotify ID, so it always shows for that
          exact artist.
        </p>
      </div>

      <form
        onSubmit={search}
        className="flex gap-3 mb-4 bg-white border border-slate-200 rounded-2xl p-3"
      >
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a Spotify artist by name…"
            className="w-full h-10 pl-10 pr-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="h-10 px-5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
        >
          {searching && <Loader2 size={14} className="animate-spin" />} Search
        </button>
      </form>

      {searchError && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <AlertCircle size={16} /> {searchError}
        </div>
      )}

      {results.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
            Search results
          </h3>
          <div className="space-y-2">
            {results.map((a) => (
              <Row key={a.id} artist={a} id={String(a.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
          Verified API artists ({verified.length})
        </h3>
        {loadingList ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : verified.length === 0 ? (
          <p className="text-sm text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center">
            No API artists have been verified yet.
          </p>
        ) : (
          <div className="space-y-2">
            {verified.map((v) => (
              <Row key={v.spotify_id} artist={v} id={v.spotify_id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminApiArtists;
