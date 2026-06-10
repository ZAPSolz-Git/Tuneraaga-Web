import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, ArrowLeft, Loader2, Search, Shuffle, Music, MoreHorizontal, Grid3x3, 
  List, ChevronRight, X, SkipBack, SkipForward, Volume2, VolumeX, Clock, 
  ChevronLeft, CheckCircle2, User, Mail, Phone, Users, Plus, ListMusic, 
  Calendar, Heart, Instagram, Globe, Mic, FileText, Award, Baby, Briefcase, 
  UserPlus, Upload, Camera, Link as LinkIcon, Languages, PlayCircle 
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { Link, useLocation } from 'react-router-dom'; 

// ─── IMPORTS ───
import { genres } from '../lib/subgener'; 

// ─── MANUAL LANGUAGE LIST ───
const LANGUAGES = [
  "For You", "Hindi", "Tamil", "Telugu", "English", "Punjabi", 
  "Marathi", "Gujarati", "Bengali", "Kannada", "Bhojpuri", 
  "Malayalam", "Sanskrit", "Haryanvi", "Rajasthani", "Odia", "Assamese"
];

// ─── CONFIGURATION ───
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'TuneRaaga';

// ─── UTILITIES ───
const formatDuration = (val) => {
  if (!val) return "0:00";
  if (typeof val === 'string') return val;
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const formatFollowers = (val) => {
  if (!val) return "0";
  // Remove commas so "895,000,000" becomes 895000000
  const num = parseFloat(val.toString().replace(/,/g, ''));
  
  if (isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// ─── SUB-COMPONENT: BECOME ARTIST MODAL ───
const BecomeArtistModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '', 
    genre: genres[0] || 'Pop',
    language: LANGUAGES[0] || 'Hindi', 
    bio: '', 
    email: '', 
    image: null,
    born_date: '',
    early_life: '', 
    career: '',    
    recognition_awards: '',
    phone: '',
    profile_url: '',
    id_document_url: ''
  });

  useEffect(() => {
    if (isOpen) setFormData({ 
      name: '', 
      genre: genres[0] || 'Pop',
      language: LANGUAGES[0] || 'Hindi', 
      bio: '', 
      email: '', 
      image: null,
      born_date: '',
      early_life: '',
      career: '',
      recognition_awards: '',
      phone: '',
      profile_url: '',
      id_document_url: ''
    });
  }, [isOpen]);

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) setFormData({ ...formData, image: e.target.files[0] });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose}
          ></motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white shrink-0 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight">Become an Artist</h2>
                <p className="text-blue-100 text-sm mt-1">Join the TuneRaaga community today.</p>
              </div>
              <button onClick={onClose} className="relative z-10 hover:bg-white/20 p-2 rounded-full transition-all"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer">
                  <div className="w-32 h-32 rounded-full border-4 border-dashed border-blue-200 bg-blue-50 flex items-center justify-center overflow-hidden hover:border-blue-500 hover:bg-blue-100 transition-all duration-300 shadow-inner">
                    {formData.image ? (
                      typeof formData.image === 'string' ? <img src={formData.image} alt="Profile" className="w-full h-full object-cover" /> : <img src={URL.createObjectURL(formData.image)} alt="Profile" className="w-full h-full object-cover" />
                    ) : <Camera className="text-blue-400 w-10 h-10 transition-transform group-hover:scale-110" />}
                  </div>
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
                  <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg border-4 border-white"><Upload size={14} /></div>
                </div>
                <p className="text-sm text-gray-500 mt-3 font-medium">Upload Profile Picture</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="col-span-2 md:col-span-1 space-y-2">
                   <label className="block text-sm font-bold text-gray-700">Artist Name *</label>
                   <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Stage Name" />
                 </div>
                 <div className="col-span-2 md:col-span-1 space-y-2">
                   <label className="block text-sm font-bold text-gray-700">Genre *</label>
                   <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none" value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})}>
                     {genres.map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                 </div>
                 <div className="col-span-2 md:col-span-1 space-y-2">
                   <label className="block text-sm font-bold text-gray-700 flex items-center gap-2"><Languages size={16}/> Language *</label>
                   <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none" value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})}>
                     {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                   </select>
                 </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Biography Details</h3>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2"><Calendar size={16}/> Born</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. March 1, 1994" value={formData.born_date} onChange={(e) => setFormData({...formData, born_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText size={16}/> Introduction</label>
                  <textarea rows="2" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none transition-all" placeholder="Write a brief introduction..." value={formData.early_life} onChange={(e) => setFormData({...formData, early_life: e.target.value})}></textarea>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2"><Briefcase size={16}/> Early Career</label>
                  <textarea rows="2" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none transition-all" placeholder="Early musical journey..." value={formData.career} onChange={(e) => setFormData({...formData, career: e.target.value})}></textarea>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2"><Award size={16}/> Recognition & Awards</label>
                  <textarea rows="2" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none transition-all" placeholder="Awards and achievements..." value={formData.recognition_awards} onChange={(e) => setFormData({...formData, recognition_awards: e.target.value})}></textarea>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Contact & Verification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2"><Mail size={16}/> Email</label>
                    <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="contact@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2"><Phone size={16}/> Phone</label>
                    <input type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1234567890" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2"><Globe size={16}/> Profile URL</label>
                    <input type="url" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" value={formData.profile_url} onChange={(e) => setFormData({...formData, profile_url: e.target.value})} placeholder="https://yourwebsite.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2"><LinkIcon size={16}/> ID Proof URL</label>
                    <input type="url" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" value={formData.id_document_url} onChange={(e) => setFormData({...formData, id_document_url: e.target.value})} placeholder="Link to document image" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                 <label className="block text-sm font-bold text-gray-700">Short Bio (Summary)</label>
                 <textarea rows="2" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none transition-all" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} placeholder="Brief introduction..."></textarea>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm flex justify-end gap-4 shrink-0">
              <button onClick={onClose} className="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-200 font-semibold transition-all hover:scale-[1.02]">Cancel</button>
              <button onClick={() => onSubmit(formData)} disabled={isLoading} className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50">{isLoading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />} Submit Request</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── SUB-COMPONENT: BIOGRAPHY SECTION ───
const BiographySection = ({ artist }) => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-1.5 w-12 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Biography</h2>
      </div>
      
      {artist.born_date && (
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-start gap-6 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 shrink-0 shadow-sm"><Calendar size={28} /></div>
          <div><h4 className="text-xl font-bold text-slate-900 mb-2">Born</h4><p className="text-slate-600 leading-relaxed text-lg">{artist.born_date}</p></div>
        </motion.div>
      )}
      
      {artist.early_life && (
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-start gap-6 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="p-4 rounded-2xl bg-purple-50 text-purple-600 shrink-0 shadow-sm"><FileText size={28} /></div>
          <div><h4 className="text-xl font-bold text-slate-900 mb-2">Introduction</h4><p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">{artist.early_life}</p></div>
        </motion.div>
      )}
      
      {artist.career && (
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-start gap-6 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="p-4 rounded-2xl bg-orange-50 text-orange-600 shrink-0 shadow-sm"><Briefcase size={28} /></div>
          <div><h4 className="text-xl font-bold text-slate-900 mb-2">Early Career</h4><p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">{artist.career}</p></div>
        </motion.div>
      )}
      
      {artist.recognition_awards && (
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-start gap-6 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="p-4 rounded-2xl bg-yellow-50 text-yellow-600 shrink-0 shadow-sm"><Award size={28} /></div>
          <div><h4 className="text-xl font-bold text-slate-900 mb-2">Recognition And Awards</h4><p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">{artist.recognition_awards}</p></div>
        </motion.div>
      )}

      {!artist.born_date && !artist.early_life && !artist.career && !artist.recognition_awards && (
        <div className="text-center py-16 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
          <FileText className="mx-auto mb-4 text-slate-300" size={48} />
          <p className="text-lg font-medium">No biography details available for this artist yet.</p>
        </div>
      )}
    </div>
  );
};

// ─── SUB-COMPONENT: STICKY PLAYER ───
const StickyPlayer = ({ song, isPlaying, onPlayPause, onSeek, onPrev, onNext, currentTime, duration, volume, onVolumeChange, isMuted, toggleMute, isShuffle, onToggleShuffle, onClose }) => {
  if (!song) return null;

  // Simply stop propagation, no preventDefault to avoid passive listener errors
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
            {/* Top Row: Close Button */}
            <div className="flex items-center gap-3 w-full justify-end">
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
                  title="Close Player"
                >
                  <X size={20} />
                </button>
            </div>

            {/* Bottom Row: Volume Controls */}
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
const TopArtist = () => {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [activeArtist, setActiveArtist] = useState(null); 
  const [artistList, setArtistList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false); 
  const location = useLocation(); 

  // ─── FETCH ARTISTS ───
  useEffect(() => {
    const fetchArtistsData = async () => {
      setLoading(true);
      try {
        const { data: artists, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .eq('status', 'Verified') 
          .order('created_at', { ascending: false });
          
        if (artistError) throw artistError;
        
        const { data: releases, error: releaseError } = await supabase.from('releases').select('*').eq('status', 'Published');
        if (releaseError) throw releaseError;
        
        const artistsWithSongs = artists.map(artist => {
          const artistSongs = releases.filter(r => r.primary_artist === artist.name);
          return { ...artist, songs: artistSongs.map(song => ({ id: song.id, title: song.title, artist: song.primary_artist, album: song.album_title || "Single", albumArt: song.cover_url, audioUrl: song.audio_url, duration: song.duration || "0:00", releaseDate: song.created_at })) };
        });
        setArtistList(artistsWithSongs);
      } catch (err) { console.error("Error fetching artists:", err); } finally { setLoading(false); }
    };
    fetchArtistsData();
  }, []);

  // ─── AUDIO PLAYER LOGIC (FIXED: RESTART & VOLUME) ───
  
  // 1. Initialize Audio Object ONCE
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

  // 2. Volume Controls (Don't recreate audio)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // 3. Auto-play next song logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (!activeArtist || !activeArtist.songs || !currentSong) return; 
      const songs = activeArtist.songs;
      let nextIndex;

      if (isShuffle) {
        const currentIndex = songs.findIndex(s => s.id === currentSong.id);
        do {
          nextIndex = Math.floor(Math.random() * songs.length);
        } while (songs.length > 1 && nextIndex === currentIndex);
      } else {
        nextIndex = (songs.findIndex(s => s.id === currentSong.id) + 1) % songs.length; 
      }
      playSong(songs[nextIndex]); 
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [activeArtist, currentSong, isShuffle]); 

  // ─── KEY FIX: playSong Logic ───
  // Ab agar same song play ho raha hai to hum src change nahi karenge,
  // taaki song reset na ho (jisse suru se shuru na ho).
  const playSong = (song) => { 
    if(!song) return; 
    const audio = audioRef.current; 
    
    // Agar song change hua hai, tabhi src set karo
    if (currentSong?.id !== song.id) { 
      setCurrentSong(song); 
      audio.src = song.audioUrl; 
      audio.load(); 
    }
    
    audio.play().then(() => setPlaying(true)).catch(e => console.error(e)); 
  };
  
  const handleNext = () => { 
    if (!activeArtist || !activeArtist.songs || !currentSong) return; 
    const songs = activeArtist.songs;
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
    if (!activeArtist || !activeArtist.songs || !currentSong) return; 
    const songs = activeArtist.songs; 
    const prevIndex = (songs.findIndex(s => s.id === currentSong.id) - 1 + songs.length) % songs.length; 
    playSong(songs[prevIndex]); 
  };

  const handlePlayPause = (song) => { 
    const audio = audioRef.current; 
    // Agar same song play ho raha hai, to Pause karo
    if (currentSong && currentSong.id === song.id && playing) { 
      audio.pause(); 
      setPlaying(false); 
    } else { 
      // Naya song hai ya resume karna hai
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

  const openArtist = (artist) => { setActiveArtist(artist); setActiveTab('overview'); setPlaying(false); setCurrentSong(null); window.scrollTo(0,0); };
  const closeArtist = () => { setActiveArtist(null); setPlaying(false); if (audioRef.current) audioRef.current.pause(); };

  const handleArtistRequest = async (formData) => {
    setRequestLoading(true);
    try {
      let imageUrl = "https://via.placeholder.com/150";
      if (formData.image instanceof File) {
        const fileName = `artist_requests/${Date.now()}_${formData.image.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, formData.image);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path);
        imageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('artists').insert([{
        name: formData.name,
        genre: formData.genre,
        language: formData.language, 
        bio: formData.bio,
        email: formData.email,
        image: imageUrl,
        status: 'Pending', 
        verified: false,
        followers: "0",
        born_date: formData.born_date,
        early_life: formData.early_life, 
        career: formData.career,       
        recognition_awards: formData.recognition_awards,
        phone: formData.phone,
        profile_url: formData.profile_url,
        id_document_url: formData.id_document_url
      }]);

      if (error) throw error;
      alert("Request sent successfully! The admin will review your profile.");
      setIsRequestModalOpen(false);
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Error: " + error.message);
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/30 flex flex-col font-sans">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm transition-all duration-300">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 flex items-center justify-between h-20">
          <button onClick={activeArtist ? closeArtist : null} className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
            <ChevronLeft className="w-7 h-7" />
          </button>
          
          <div className="flex items-center flex-grow justify-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">TR</div>
            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">TuneRaaga</span>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-gray-200 w-fit hidden md:flex shadow-inner">
                <Link to="/topartist" className="px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 bg-white text-blue-600 shadow-sm hover:shadow-md">
                  <Users size={16} /> Top Artists
                </Link>
                <Link to="/new-releases" className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${location.pathname === '/new-releases' ? 'bg-white text-blue-600 shadow-sm hover:shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}>
                  <Music size={16} /> New Releases
                </Link>
                <Link to="/top-playlist" className="px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-white/50">
                  <ListMusic size={16} /> Playlists
                </Link>
              </div>
             <button onClick={() => setIsRequestModalOpen(true)} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5">
                <UserPlus size={16} /> Become an Artist
             </button>
          </div>
        </div>
      </nav>
      
      <div className="flex-grow overflow-y-auto pb-32">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-96 space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="text-slate-500 font-medium animate-pulse">Loading Artists...</p>
          </div>
        ) : !activeArtist ? (
          <div className="px-4 md:px-8 py-10 max-w-screen-2xl mx-auto">
            <div className="flex items-center justify-between mb-12">
               <div>
                 <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">Top Artists</h2>
                 <p className="text-slate-500 text-lg">Discover the best voices on TuneRaaga</p>
               </div>
               <button onClick={() => setIsRequestModalOpen(true)} className="md:hidden flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30">
                 <UserPlus size={18} /> Join Now
               </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
              {artistList.map((artist, index) => (
                <motion.div 
                  key={artist.id} 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5, delay: index * 0.05 }} 
                  className="group cursor-pointer" 
                  onClick={() => openArtist(artist)}
                >
                  <div className="relative aspect-square rounded-3xl overflow-hidden mb-4 bg-gray-200 shadow-lg border border-white/20 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:-translate-y-2">
                     <img src={artist.image || "https://via.placeholder.com/300"} alt={artist.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                     
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75">
                           <ChevronRight className="w-8 h-8 fill-white ml-1" />
                        </div>
                     </div>

                     {artist.verified && (
                       <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1.5 shadow-sm z-10">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-600" size={12} />
                          <span className="text-[10px] font-bold text-slate-700 tracking-wide uppercase">Verified</span>
                       </div>
                     )}
                  </div>
                  <div className="px-1 text-center">
                    <h3 className="font-bold text-slate-900 truncate text-lg group-hover:text-blue-600 transition-colors">{artist.name}</h3>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{artist.genre}</p>
                    <p className="text-xs text-gray-400 font-medium mt-1 flex items-center justify-center gap-1">
                      <Users size={12} /> {formatFollowers(artist.followers)} Listeners
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full min-h-screen bg-gradient-to-b from-white to-slate-50">
            <div className="bg-white border-b border-slate-100 pb-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white opacity-60 pointer-events-none"></div>
              
              <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-12 flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ type: "spring", duration: 0.8 }}
                  className="relative shrink-0 group"
                >
                  <div className="w-56 h-56 md:w-72 md:h-72 rounded-full p-2 bg-gradient-to-tr from-green-400 via-blue-500 to-purple-600 shadow-[0_0_50px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_70px_rgba(59,130,246,0.5)] transition-shadow duration-500">
                    <img src={activeArtist.image || "https://via.placeholder.com/300"} alt={activeArtist.name} className="w-full h-full rounded-full object-cover border-4 border-white" />
                  </div>
                  <button className="absolute bottom-6 right-6 bg-slate-900/90 text-white p-3.5 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 hover:bg-slate-800 transition-all">
                    <Mic size={20} />
                  </button>
                </motion.div>
                
                <div className="flex-1 text-center md:text-left pb-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3 justify-center md:justify-start">
                    {activeArtist.verified && <CheckCircle2 className="text-blue-600 w-6 h-6 fill-blue-600 drop-shadow-sm" />}
                    <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">Official Artist</span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-4 leading-none">{activeArtist.name}</h1>
                  <p className="text-slate-500 text-xl mb-8 flex items-center justify-center md:justify-start gap-2 font-bold">
                    <Users className="w-5 h-5" /> {formatFollowers(activeArtist.followers)} Monthly Listeners
                  </p>
                  <div className="flex items-center gap-6 justify-center md:justify-start">
                     <button onClick={() => activeArtist.songs?.[0] && handlePlayPause(activeArtist.songs[0])} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_15px_40px_rgba(34,197,94,0.6)] hover:scale-105 transition-all duration-300">
                        {playing && currentSong?.id === activeArtist.songs[0]?.id ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-1" />}
                     </button>
                     <button className={`w-14 h-14 rounded-full border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:scale-105 transition-all flex items-center justify-center ${isShuffle ? 'bg-green-50 border-green-500 text-green-600' : ''}`} onClick={() => setIsShuffle(!isShuffle)}><Shuffle size={24} /></button>
                     <button className="w-14 h-14 rounded-full border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:scale-105 transition-all flex items-center justify-center"><MoreHorizontal size={24} /></button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="max-w-screen-2xl mx-auto px-4 md:px-8 mt-10">
               <div className="flex items-center gap-8 border-b border-gray-200 mb-10 overflow-x-auto">
                 {['Overview', 'Songs', 'Biography'].map(t => (
                   <button 
                     key={t} 
                     onClick={() => setActiveTab(t.toLowerCase())} 
                     className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === t.toLowerCase() ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {t}
                     {activeTab === t.toLowerCase() && (
                       <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                     )}
                   </button>
                 ))}
               </div>
               
               {activeTab === 'overview' && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                   <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center gap-4 hover:shadow-lg transition-shadow">
                      <div className="p-4 bg-pink-50 text-pink-500 rounded-2xl"><Users size={24} /></div>
                      <div><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Monthly Listeners</div><div className="text-3xl font-black text-slate-900">{formatFollowers(activeArtist.followers)}</div></div>
                   </div>
                   <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center gap-4 hover:shadow-lg transition-shadow">
                      <div className="p-4 bg-purple-50 text-purple-500 rounded-2xl"><Music size={24} /></div>
                      <div><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Songs</div><div className="text-3xl font-black text-slate-900">{activeArtist.songs?.length || 0}</div></div>
                   </div>
                 </motion.div>
               )}
               
               {activeTab === 'songs' && (
                 <div className="space-y-3 mb-10">
                   {activeArtist.songs && activeArtist.songs.length > 0 ? activeArtist.songs.map((song, i) => (
                     <motion.div 
                       key={song.id} 
                       initial={{ opacity: 0, x: -10 }} 
                       animate={{ opacity: 1, x: 0 }} 
                       transition={{ delay: i * 0.05 }}
                       onClick={() => handlePlayPause(song)} 
                       className={`flex items-center p-4 rounded-2xl transition-all cursor-pointer group border ${
                         currentSong?.id === song.id 
                           ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                           : 'bg-white border-transparent hover:border-gray-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:translate-x-1'
                       }`}
                     >
                       <span className="w-8 text-slate-400 font-bold text-center text-lg">{i + 1}</span>
                       <img src={song.albumArt} className="w-14 h-14 rounded-xl object-cover mr-5 shadow-sm" alt="" />
                       <div className="flex-1 min-w-0">
                          <h4 className={`font-bold truncate text-lg ${currentSong?.id === song.id ? 'text-blue-600' : 'text-slate-900'}`}>{song.title}</h4>
                          <p className="text-sm text-slate-500 truncate">{song.album}</p>
                       </div>
                       <span className="text-xs text-slate-400 mr-6 font-mono">{song.duration}</span>
                       <div className="w-10 h-10 flex items-center justify-center">
                          <div className={currentSong?.id === song.id && playing ? 'block text-blue-500' : 'hidden'}>
                             <div className="flex items-end gap-0.5 h-4">
                                <div className="w-1 bg-blue-500 animate-[bounce_1s_infinite] h-full"></div>
                                <div className="w-1 bg-blue-500 animate-[bounce_1.2s_infinite] h-2/3"></div>
                                <div className="w-1 bg-blue-500 animate-[bounce_0.8s_infinite] h-full"></div>
                             </div>
                          </div>
                          <button className="text-slate-300 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
                             <Play size={24} className={currentSong?.id === song.id && playing ? 'hidden' : 'block'} />
                             <Pause size={24} className={currentSong?.id === song.id && playing ? 'block text-blue-500' : 'hidden'} />
                          </button>
                       </div>
                     </motion.div>
                   )) : <p className="text-slate-400 text-center py-10">No songs found.</p>}
                 </div>
               )}
               {activeTab === 'biography' && <BiographySection artist={activeArtist} />}
            </div>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {activeArtist && currentSong && (
          <StickyPlayer 
            song={currentSong} 
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

      <BecomeArtistModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} onSubmit={handleArtistRequest} isLoading={requestLoading} />
    </div>
  );
};

export default TopArtist;