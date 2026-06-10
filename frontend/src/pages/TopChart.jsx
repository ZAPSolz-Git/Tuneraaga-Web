import React, { useState, useEffect, useRef } from "react"; 
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, ArrowLeft, Loader2, Search, Shuffle, Music, 
  Grid3x3, List, ChevronRight, X, SkipBack, SkipForward, Volume2, VolumeX 
} from "lucide-react"; 
import { createClient } from '@supabase/supabase-js';

// ─── CONFIGURATION ───
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── CONSTANTS ───
const LANGUAGES = ["All", "Hindi", "English", "Punjabi", "Tamil", "Telugu", "Bhojpuri", "International"];

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

// ─── MAIN COMPONENT ───
const TopChart = () => {
  const [charts, setCharts] = useState([]);
  const [activeChart, setActiveChart] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [isSurpriseMe, setIsSurpriseMe] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState('grid'); 

  // --- PLAYER STATES (MATCHING TOP ARTIST) ---
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false); 
  const audioRef = useRef(null);

  // --- FETCH DATA (ORIGINAL USER QUERY) ---
  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('charts')
          .select(`*, chart_songs ( id, title, artist, audio_url )`)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setCharts(data || []);
      } catch (err) {
        console.error("Error fetching charts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, []);

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
  }, [activeChart, currentSong, isShuffle]); 

  // ─── KEY FIX: playSong Logic (Resume Logic) ───
  const playSong = (song) => { 
    if(!song) return; 
    const audio = audioRef.current; 
    
    // FIX: Don't reload src if it's the same song (prevents restart)
    if (currentSong?.id !== song.id) { 
      setCurrentSong(song); 
      audio.src = song.audio_url; 
      audio.load(); 
    }
    
    audio.play().then(() => setPlaying(true)).catch(e => console.error(e)); 
  };
  
  const handleNext = () => { 
    if (!activeChart || !currentSong) return; 
    const songs = activeChart.chart_songs;
    if(!songs || songs.length === 0) return;

    let nextIndex;
    if (isShuffle) {
      const currentIndex = songs.findIndex(s => s.id === currentSong.id);
      do { nextIndex = Math.floor(Math.random() * songs.length); } while (songs.length > 1 && nextIndex === currentIndex);
    } else {
      nextIndex = (songs.findIndex(s => s.id === currentSong.id) + 1) % songs.length; 
    }
    playSong(songs[nextIndex]); 
  };
  
  const handlePrev = () => { 
    if (!activeChart || !currentSong) return; 
    const songs = activeChart.chart_songs;
    if(!songs || songs.length === 0) return;
    const prevIndex = (songs.findIndex(s => s.id === currentSong.id) - 1 + songs.length) % songs.length; 
    playSong(songs[prevIndex]); 
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

  // Chart specific helpers
  const handleChartClick = (chart) => {
    setActiveChart(chart);
    if (chart.chart_songs && chart.chart_songs.length > 0) {
      playSong(chart.chart_songs[0]);
    }
  };

  const handleBack = () => {
    setActiveChart(null);
    // Music chalte rahne do back karne par (TopArtist style)
  };

  // --- FILTER & SEARCH LOGIC ---
  const filteredCharts = charts.filter((chart) => {
    const langMatch = activeFilter === "All" || (chart.language || "").toLowerCase() === activeFilter.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    if (q === "") return langMatch;
    
    const titleMatch = (chart.title || "").toLowerCase().includes(q);
    const artistMatch = (chart.artist || "").toLowerCase().includes(q);
    const searchMatch = titleMatch || artistMatch;

    return langMatch && searchMatch;
  });
  
  const displayCharts = isSurpriseMe 
    ? [...filteredCharts].sort(() => Math.random() - 0.5) 
    : filteredCharts;

  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      
      {/* --- LIST VIEW (GRID/TABLE) --- */}
      {!activeChart && (
        <>
          {/* Header (EXACT USER DESIGN) */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="w-full md:w-auto">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Top Music <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">Charts</span>
              </h1>
              <p className="text-slate-500 text-sm mt-1">Curated hits from around the world.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500">
                  <Search className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title or artist..." 
                  className="w-full pl-10 pr-10 py-3 rounded-full border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}><Grid3x3 size={18} /></button>
                  <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}><List size={18} /></button>
                </div>

                <button 
                  onClick={() => setIsSurpriseMe(!isSurpriseMe)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-0.5 ${isSurpriseMe ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'}`}
                >
                  <Shuffle size={18} /> {isSurpriseMe ? "Shuffled!" : "Surprise Me"}
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {LANGUAGES.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                    setActiveFilter(filter);
                    setSearchQuery(""); 
                }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                  activeFilter === filter
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
          ) : (
            <>
              {displayCharts.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                  <h3 className="text-lg font-bold text-slate-900">No charts found</h3>
                  <p className="text-slate-500 max-w-md mx-auto mt-2">
                    Try adjusting your search or language filter.
                  </p>
                </div>
              )}

              {/* GRID VIEW */}
              {viewMode === 'grid' && displayCharts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in">
                  {displayCharts.map((chart, index) => (
                    <motion.div 
                      key={chart.id} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.4, delay: index * 0.05 }} 
                      onClick={() => handleChartClick(chart)} 
                      className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-200"
                    >
                      <img 
                        src={chart.image_url || "https://via.placeholder.com/400x200"} 
                        alt={chart.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"></div>
                      <div className="absolute bottom-0 left-0 w-full p-5 text-white z-10">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">{chart.type}</p>
                            <h3 className="text-xl font-bold leading-tight mb-1 group-hover:text-blue-300 transition-colors line-clamp-2">
                              {chart.title}
                            </h3>
                            <p className="text-xs text-slate-300 flex items-center gap-1">
                              <Music size={10} /> {chart.chart_songs?.length || 0} Songs
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-white bg-gradient-to-r from-blue-600 to-blue-800">
                              <Play size={16} fill="white" className="ml-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* TABLE VIEW */}
              {viewMode === 'table' && displayCharts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Cover</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tracks</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {displayCharts.map((chart) => (
                          <tr key={chart.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleChartClick(chart)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <img className="h-16 w-16 rounded-lg object-cover shadow-sm" src={chart.image_url || "https://via.placeholder.com/100"} alt="" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-900">{chart.title}</div>
                              <div className="text-sm text-slate-500">{chart.artist || 'Various Artists'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-700">{chart.type}</div>
                              <div className="text-xs text-slate-500">{chart.year || ''} • {chart.language}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {chart.chart_songs?.length || 0} Songs
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold flex items-center justify-end gap-2 ml-auto">
                                View <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* --- DETAIL VIEW (SONG LIST) --- */}
      <AnimatePresence>
        {activeChart && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-6 mb-8">
              <button onClick={handleBack} className="p-2 rounded-full hover:bg-slate-200 border border-slate-200 transition-colors text-slate-600">
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-2 uppercase tracking-wide">
                  {activeChart.type}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">{activeChart.title}</h1>
                <p className="text-slate-500">{activeChart.description}</p>
              </div>
              <div className="hidden md:block w-32 h-32 rounded-2xl overflow-hidden shadow-lg border border-slate-200 shrink-0">
                <img src={activeChart.image_url} className="w-full h-full object-cover" alt="Cover" />
              </div>
            </div>

            {/* Song List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              {!activeChart.chart_songs || activeChart.chart_songs.length === 0 ? (
                <div className="p-10 text-center text-slate-400">No songs in this chart yet.</div>
              ) : (
                activeChart.chart_songs.map((song, index) => {
                  const isActive = currentSong?.id === song.id;
                  return (
                    <div 
                        key={song.id} 
                        onClick={() => handlePlayPause(song)} 
                        className={`flex items-center justify-between p-4 border-b border-slate-50 transition-colors group cursor-pointer last:border-0 ${isActive ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-slate-300 font-bold w-6 text-center text-sm">{index + 1}</span>
                        
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-sm" style={{ background: isActive && playing ? `linear-gradient(to right, #2563eb, #1d4ed8)` : '#e2e8f0' }}>
                          {isActive && playing ? (
                            <Pause size={14} />
                          ) : (
                            <Play size={14} className={isActive ? "text-white" : "text-blue-600"} />
                          )}
                        </button>
                        
                        <div className="flex flex-col">
                          <h4 className={`font-bold text-sm ${isActive ? "text-blue-600" : "text-slate-800"}`}>{song.title}</h4>
                          <p className="text-xs text-slate-500">{song.artist}</p>
                        </div>
                      </div>
                      {isActive && playing && (
                        <div className="flex items-center gap-1">
                           <div className="w-1 h-3 bg-blue-500 animate-[bounce_1s_infinite]"></div>
                           <div className="w-1 h-5 bg-blue-500 animate-[bounce_1.2s_infinite]"></div>
                           <div className="w-1 h-4 bg-blue-500 animate-[bounce_0.8s_infinite]"></div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- MODERN STICKY MUSIC PLAYER (EXACT TOP ARTIST PLAYER) --- */}
      <AnimatePresence>
        {currentSong && (
          <StickyPlayer 
            song={{
                ...currentSong,
                // Mapping chart image to albumArt since songs might not have individual covers
                albumArt: activeChart?.image_url || "https://via.placeholder.com/50" 
            }} 
            isPlaying={playing} 
            onPlayPause={handlePlayPause} 
            onSeek={handleSeek} 
            onNext={handleNext} 
            onPrev={handlePrev} 
            currentTime={currentTime} 
            duration={duration} 
            volume={volume} 
            onVolumeChange={(v) => setVolume(v)} 
            isMuted={isMuted} 
            toggleMute={() => setIsMuted(!isMuted)}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            onClose={handleClosePlayer} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopChart;