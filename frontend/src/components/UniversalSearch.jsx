import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useOutletContext } from "react-router-dom";
import { Play, Pause, Music, Users, ListMusic, User, Search as SearchIcon } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// ─── CONFIGURATION ───
const supabaseUrl = 'https://suaguciltgydkoyjmbmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1YWd1Y2lsdGd5ZGtveWptYm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjM3MTQsImV4cCI6MjA4ODc5OTcxNH0.ypgJm4BnNxalLsACpEtBF9T8uP5OwNSw4nwjiN-3rE8';
const supabase = createClient(supabaseUrl, supabaseKey);
const ARTIST_API_URL = "http://localhost:5000/api/artists";

// ─── COLORS ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const UniversalSearch = () => {
  // Search query jo Layout se aayega
  const { searchQuery } = useOutletContext();
  
  const [results, setResults] = useState({
    songs: [],
    playlists: [],
    artists: []
  });
  const [loading, setLoading] = useState(false);

  // Audio Player Ref
  const [playingId, setPlayingId] = useState(null);
  const audioRef = React.useRef(null);

  // ─── FETCH LOGIC ───
  useEffect(() => {
    const fetchGlobalResults = async () => {
      if (!searchQuery || searchQuery.trim() === "") {
        setResults({ songs: [], playlists: [], artists: [] });
        return;
      }

      setLoading(true);
      const query = searchQuery.toLowerCase();

      try {
        // 1. Fetch Songs (Releases) from Supabase
        const { data: songsData } = await supabase
          .from('releases')
          .select('*')
          .or(`title.ilike.%${query}%,primary_artist.ilike.%${query}%`)
          .limit(5);

        // 2. Fetch Playlists from Supabase
        const { data: playlistsData } = await supabase
          .from('playlists')
          .select('*')
          .ilike('title', `%${query}%`)
          .limit(5);

        // 3. Fetch Artists from Local API
        const artistRes = await fetch(ARTIST_API_URL);
        const allArtists = await artistRes.json();
        const filteredArtists = allArtists.filter(artist => 
          artist.name.toLowerCase().includes(query) || 
          artist.genre.toLowerCase().includes(query)
        ).slice(0, 5);

        setResults({
          songs: songsData || [],
          playlists: playlistsData || [],
          artists: filteredArtists || []
        });

      } catch (error) {
        console.error("Search Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalResults();
  }, [searchQuery]);

  // ─── AUDIO HANDLER ───
  const handlePlay = (url, id) => {
    const audio = audioRef.current;
    if (playingId === id && audio) {
      if (audio.paused) audio.play();
      else audio.pause();
    } else {
      if (audio) { audio.pause(); audio.currentTime = 0; }
      const newAudio = new Audio(url);
      newAudio.play().catch(e => console.error(e));
      audioRef.current = newAudio;
      setPlayingId(id);
      newAudio.onended = () => setPlayingId(null);
    }
  };

  // ─── COMPONENTS ───
  const SectionHeader = ({ title, icon: Icon, count }) => (
    <div className="flex items-center gap-2 mb-4 mt-8">
      <div className="p-2 rounded-full" style={{ background: BLUE_GRADIENT }}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h2 className="text-xl font-bold" style={{ color: TEXT_BLACK }}>{title}</h2>
      <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-bold">{count}</span>
    </div>
  );

  const SongCard = ({ song }) => (
    <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <img src={song.cover_url} alt={song.title} className="w-12 h-12 rounded-lg object-cover" />
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-900 truncate">{song.title}</h4>
        <p className="text-xs text-slate-500 truncate">{song.primary_artist}</p>
      </div>
      <button 
        onClick={() => handlePlay(song.audio_url, song.id)}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white shadow-md"
        style={{ background: playingId === song.id ? BLUE_GRADIENT : '#e2e8f0' }}
      >
        {playingId === song.id && !audioRef.current?.paused ? <Pause size={14} className="text-white" /> : <Play size={14} className={playingId === song.id ? "text-white" : "text-blue-600"} />}
      </button>
    </div>
  );

  const PlaylistCard = ({ playlist }) => (
    <Link to={`/top-playlist`} onClick={() => window.scrollTo(0,0)} className="block group">
      <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <img src={playlist.image_url} alt={playlist.title} className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform" />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 truncate group-hover:text-blue-600">{playlist.title}</h4>
          <p className="text-xs text-slate-500">{playlist.genre} • {playlist.year}</p>
        </div>
        <ListMusic className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
      </div>
    </Link>
  );

  const ArtistCard = ({ artist }) => (
    <Link to={`/topartist`} onClick={() => window.scrollTo(0,0)} className="block group">
      <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <img src={artist.image} alt={artist.name} className="w-12 h-12 rounded-full object-cover group-hover:scale-105 transition-transform" />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 truncate group-hover:text-blue-600 flex items-center gap-1">
            {artist.name}
          </h4>
          <p className="text-xs text-slate-500">{artist.genre}</p>
        </div>
        <User className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
      </div>
    </Link>
  );

  // ─── RENDER ───
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasResults = results.songs.length > 0 || results.playlists.length > 0 || results.artists.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Search Results for "{searchQuery}"</h1>
      </div>

      {!hasResults && (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
          <SearchIcon className="w-16 h-16 mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">No results found across Songs, Playlists, or Artists.</p>
        </div>
      )}

      {/* SECTION: SONGS */}
      {results.songs.length > 0 && (
        <div>
          <SectionHeader title="Songs" icon={Music} count={results.songs.length} />
          <div className="grid grid-cols-1 gap-3">
            {results.songs.map((song) => <SongCard key={song.id} song={song} />)}
          </div>
        </div>
      )}

      {/* SECTION: PLAYLISTS */}
      {results.playlists.length > 0 && (
        <div>
          <SectionHeader title="Playlists" icon={ListMusic} count={results.playlists.length} />
          <div className="grid grid-cols-1 gap-3">
            {results.playlists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} />)}
          </div>
        </div>
      )}

      {/* SECTION: ARTISTS */}
      {results.artists.length > 0 && (
        <div>
          <SectionHeader title="Artists" icon={Users} count={results.artists.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.artists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalSearch;