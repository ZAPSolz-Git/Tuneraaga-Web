import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, Pause, Users, Music, ChevronDown, Grid3x3, List, SkipBack, SkipForward, Volume2, VolumeX, X, Shuffle } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// ─── CONFIGURATION ───
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── UTILITIES ───
const formatDuration = (val) => {
  if (!val) return "0:00";
  if (typeof val === 'string') return val;
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

// ─── SUB-COMPONENT: STICKY PLAYER (EXACT COPY FROM TOP ARTIST) ───
const StickyPlayer = ({ song, isPlaying, onPlayPause, onSeek, onPrev, onNext, currentTime, duration, volume, onVolumeChange, isMuted, toggleMute, isShuffle, onToggleShuffle, onClose }) => {
  if (!song) return null;

  const handleVolumeInteraction = (e) => {
    e.stopPropagation();
  };

  return (
    <motion.div 
      initial={{ y: 100 }} 
      animate={{ y: 0 }} 
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-5px_30px_rgba(0,0,0,0.3)] z-[100]"
    >
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 px-4 py-3 md:py-4 md:px-8">
        
        {/* LEFT: Song Info */}
        <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
          <div className="relative group w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10">
            <img src={song.albumArt || "https://via.placeholder.com/50"} alt="Art" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h4 className="font-bold text-white truncate text-base leading-tight">{song.title}</h4>
            <p className="text-xs text-gray-400 truncate mt-1">{song.artist}</p>
          </div>
        </div>
        
        {/* CENTER: Controls */}
        <div className="flex-1 flex flex-col items-center justify-center w-full md:max-w-2xl">
          <div className="flex items-center gap-4 md:gap-6 mb-2">
             <button onClick={onPrev} className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"><SkipBack className="w-5 h-5" /></button>
             <button onClick={() => onPlayPause(song)} className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 bg-white text-slate-900">
              {isPlaying ? <Pause className="w-6 h-6 md:w-7 md:h-7 fill-slate-900" /> : <Play className="w-6 h-6 md:w-7 md:h-7 fill-slate-900 ml-1" />}
             </button>
             <button onClick={onNext} className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"><SkipForward className="w-5 h-5" /></button>
             
             <button 
                onClick={onToggleShuffle} 
                className={`transition-all hover:scale-110 ${isShuffle ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
                title="Shuffle"
             >
               <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
             </button>
          </div>
          <div className="w-full flex items-center gap-3 text-xs text-gray-400 font-medium px-0 md:px-8">
            <span className="w-10 text-right font-mono">{formatDuration(currentTime)}</span>
            <div className="flex-1 relative h-1.5 bg-gray-700 rounded-full cursor-pointer group">
              <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => onSeek(parseFloat(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
              <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%', marginLeft: '-6px' }}></div>
            </div>
            <span className="w-10 font-mono">{formatDuration(duration)}</span>
          </div>
        </div>
        
        {/* RIGHT: Volume & Close */}
        <div className="hidden md:flex w-1/4 min-w-[160px] flex-col items-end gap-2">
            <div className="flex items-center gap-3 w-full justify-end">
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
                  title="Close Player"
                >
                  <X size={20} />
                </button>
            </div>

            <div 
                className="flex items-center gap-3 w-full justify-end mt-1" 
            >
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleMute(); }} 
                    className="text-gray-400 hover:text-green-500 transition-colors hover:scale-110"
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div className="flex-1 relative h-1.5 bg-gray-700 rounded-full cursor-pointer w-24">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={isMuted ? 0 : volume} 
                    onChange={(e) => { e.stopPropagation(); onVolumeChange(parseFloat(e.target.value)); }}
                    onClick={handleVolumeInteraction}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="absolute top-0 left-0 h-full rounded-full bg-green-500" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── STYLES ───
const TEXT_BLACK = "#0f172a";
const BLUE_DARK = "#2563eb"; 

// ─── DATA: LANGUAGE & GENRE FILTERS ───
const LANGUAGE_FILTERS = ["For You", "Hindi", "Tamil", "Telugu", "English", "Punjabi", "Marathi", "Gujarati", "Bengali", "Kannada", "Bhojpuri", "Malayalam", "Sanskrit", "Haryanvi", "Rajasthani", "Odia", "Assamese"];

const GENRE_OPTIONS = [
  "All Genres", "Pop", "Hip Hop/Rap", "Rock", "Indian", "Arabic", "Latin", 
  "Dance", "R&B/Soul", "Country", "Classical", "Jazz", "Alternative", 
  "Blues", "Electronic", "Folk", "Metal", "Reggae", "World Music"
];

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 select-none ${
      active
        ? "bg-blue-600 text-white shadow-md"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
    }`}
  >
    {label}
  </button>
);

const GenreDropdown = ({ value, onChange, options }) => {
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
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
      >
        <span>{value}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 w-48 max-h-64 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
          {options.map((opt) => (
            <div 
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 ${value === opt ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-700'}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───
const NewRelease = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeLanguage, setActiveLanguage] = useState("For You");
  const [activeGenre, setActiveGenre] = useState("All Genres");
  const [viewMode, setViewMode] = useState('grid');
  
  // --- PLAYER STATES (MATCHING TOP ARTIST) ---
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentList, setCurrentList] = useState([]); // Keep track of the playing list
  
  const audioRef = useRef(null);

  // Fetch Data
  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('releases')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formattedSongs = data.map(song => ({
          id: song.id,
          title: song.title,
          artist: song.primary_artist,
          img: song.cover_url || "https://via.placeholder.com/300",
          audioUrl: song.audio_url,
          language: song.language || "",
          genre: song.genre || ""
        }));
        
        setSongs(formattedSongs);
      } catch (error) {
        console.error("Error fetching songs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  // Filter Logic
  const filteredSongs = songs.filter((song) => {
    const songLang = (song.language || "").toLowerCase().trim();
    const activeLang = activeLanguage.toLowerCase().trim();
    const matchesLanguage = activeLang === "for you" || songLang === activeLang;
    
    const songGen = (song.genre || "").toLowerCase().trim();
    const activeGen = activeGenre.toLowerCase().trim();
    const matchesGenre = activeGen === "all genres" || songGen === activeGen;

    return matchesLanguage && matchesGenre;
  });

  // --- AUDIO SYSTEM SETUP (MATCHING TOP ARTIST LOGIC) ---
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Volume Controls
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Auto-play next song logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentList, currentIndex, isShuffle]); 

  // ─── KEY FIX: playSong Logic (Resume Logic) ───
  const playSong = (song) => { 
    if(!song) return; 
    const audio = audioRef.current; 
    
    // FIX: Don't reload src if it's the same song (prevents restart)
    if (currentSong?.id !== song.id) { 
      setCurrentSong(song); 
      audio.src = song.audioUrl; 
      audio.load(); 
    }
    
    audio.play().then(() => setPlaying(true)).catch(e => console.error(e)); 
  };
  
  const handleNext = () => { 
    if (currentList.length === 0 || currentIndex === null) return; 
    let nextIndex;
    
    if (isShuffle) {
      do { nextIndex = Math.floor(Math.random() * currentList.length); } while (currentList.length > 1 && nextIndex === currentIndex);
    } else {
      nextIndex = (currentIndex + 1) % currentList.length; 
    }
    
    const nextSong = currentList[nextIndex];
    setCurrentIndex(nextIndex);
    playSong(nextSong);
  };
  
  const handlePrev = () => { 
    if (currentList.length === 0 || currentIndex === null) return; 
    const prevIndex = (currentIndex - 1 + currentList.length) % currentList.length; 
    
    const prevSong = currentList[prevIndex];
    setCurrentIndex(prevIndex);
    playSong(prevSong);
  };

  const handlePlayPause = (song) => { 
    const audio = audioRef.current; 
    if (currentSong && currentSong.id === song.id && playing) { 
      audio.pause(); 
      setPlaying(false); 
    } else { 
      playSong(song); 
    } 
  };

  const handleSongClick = (index, song, list) => {
    // If clicking the same song, just toggle
    if (currentSong?.id === song.id) {
      handlePlayPause(song);
    } else {
      // New song
      setCurrentList(list); // Set the context (current list)
      setCurrentIndex(index);
      playSong(song);
    }
  };

  const handleSeek = (time) => { 
    if(audioRef.current) { 
      audioRef.current.currentTime = time; 
      setCurrentTime(time); 
    } 
  };
  
  const handleClosePlayer = () => {
    setPlaying(false);
    setCurrentSong(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const handleVolumeChange = (v) => {
    setVolume(v);
    setIsMuted(v === 0);
  };

  return (
    <div className="w-full min-h-screen text-slate-900 pt-6 pb-20 px-4 md:px-8 relative overflow-hidden bg-white">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2" style={{ color: TEXT_BLACK }}>
              New <span style={{ color: BLUE_DARK }}>Releases</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Fresh tracks and trending hits just for you.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
            <Link to="/topartist" className="px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-white/50">
              <Users size={16} /> Top Artists
            </Link>
            <button className="px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 cursor-pointer bg-white text-blue-600 shadow-sm">
              <Music size={16} /> New Releases
            </button>
            <Link to="/top-playlist" className="px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-white/50">
              <Music size={16} /> Top Playlists
            </Link>
          </div>
          
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center overflow-hidden">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm flex-shrink-0">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}><Grid3x3 size={16} /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}><List size={16} /></button>
          </div>

          <div className="flex flex-nowrap gap-3 overflow-x-auto items-center w-full md:w-auto md:max-w-[600px] pb-3 md:pb-0 scroll-smooth">
            {LANGUAGE_FILTERS.map((filter) => (
              <FilterPill key={filter} label={filter} active={activeLanguage === filter} onClick={() => setActiveLanguage(filter)} />
            ))}
          </div>

          <div className="flex-shrink-0">
            <GenreDropdown value={activeGenre} onChange={setActiveGenre} options={GENRE_OPTIONS} />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {filteredSongs.length === 0 ? (
             <div className="text-center py-20 text-gray-400">No songs found.</div>
          ) : (
            <div className="flex flex-col h-full">
                {/* GRID VIEW */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-10">
                    {filteredSongs.map((song, index) => {
                        const isActive = currentSong?.id === song.id;
                        return (
                            <motion.div key={song.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }} className="group cursor-pointer">
                            <div className={`relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100 shadow-sm border ${isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 group-hover:border-blue-400'} group-hover:shadow-xl transition-all duration-300`}>
                                <img src={song.img} alt={song.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleSongClick(index, song, filteredSongs)} className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                    {isActive && playing ? <Pause size={20} className="text-white" /> : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
                                    </motion.div>
                                </div>
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 text-blue-600">NEW</div>
                            </div>
                            <div className="px-1">
                                <h3 className={`font-bold text-base truncate transition-colors ${isActive ? 'text-blue-600' : 'group-hover:text-blue-600 text-slate-900'}`}>{song.title}</h3>
                                <p className="text-slate-500 text-sm truncate mt-1 flex items-center gap-1">{song.artist}</p>
                                <div className="flex gap-2 mt-1">
                                <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{song.genre || 'Unknown'}</span>
                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{song.language || 'Unknown'}</span>
                                </div>
                            </div>
                            </motion.div>
                        );
                    })}
                  </div>
                )}

                {/* TABLE VIEW */}
                {viewMode === 'table' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Cover</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Release Info</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Genre</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Language</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {filteredSongs.map((song, index) => {
                              const isActive = currentSong?.id === song.id;
                              return (
                                <tr key={song.id} onClick={() => handleSongClick(index, song, filteredSongs)} className={`hover:bg-slate-50 transition-colors cursor-pointer ${isActive ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <img className="h-12 w-12 rounded-lg object-cover shadow-sm" src={song.img} alt="" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-slate-900'}`}>{song.title}</div>
                                    <div className="text-sm text-slate-500">{song.artist}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{song.genre || 'Unknown'}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600">{song.language || 'Unknown'}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors">
                                    {isActive && playing ? <Pause size={14}/> : <Play size={14}/>} <span>{isActive && playing ? 'Pause' : 'Play'}</span>
                                    </button>
                                </td>
                                </tr>
                              );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          )}
        </>
      )}

      {/* --- STICKY PLAYER (EXACT TOP ARTIST PLAYER) --- */}
      <AnimatePresence>
        {currentSong && (
          <StickyPlayer 
            song={{
                ...currentSong,
                // Mapping song image to albumArt
                albumArt: currentSong.img || "https://via.placeholder.com/50" 
            }} 
            isPlaying={playing} 
            onPlayPause={handlePlayPause} 
            onSeek={handleSeek} 
            onNext={handleNext} 
            onPrev={handlePrev} 
            currentTime={currentTime} 
            duration={duration} 
            volume={volume} 
            onVolumeChange={handleVolumeChange} 
            isMuted={isMuted} 
            toggleMute={toggleMute}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            onClose={handleClosePlayer} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewRelease;