import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Music, Play, X, Upload, ArrowLeft, Trash2, Edit, 
  ChevronRight, CheckCircle2, Disc, Globe, Loader2, AlertTriangle, 
  ListMusic, Grid3x3, List, Search
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// ─── CONFIGURATION ───
// --- ENV CONFIGURATION ---
// .env file se variables load kar rahe hain
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'TuneRaaga'; 

// ─── Blue Gradient Palette ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

// Local Genres (in case import fails)
const genres = [
  "Bollywood", "Pop", "Rock", "Hip-Hop", "Classical", "Devotional", 
  "Indie Pop", "Ghazal", "Folk", "Electronic", "R&B", "Jazz"
];

// Updated Language List
const LANGUAGES = [
  "For You", "Hindi", "Tamil", "Telugu", "English", "Punjabi", 
  "Marathi", "Gujarati", "Bengali", "Kannada", "Bhojpuri", 
  "Malayalam", "Sanskrit", "Haryanvi", "Rajasthani", "Odia", "Assamese"
];

const TopPlaylistAdmin = () => {
  // --- WIZARD STATE ---
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    title: "",
    artist: "", 
    year: new Date().getFullYear(),
    genre: "",
    language: "", 
    description: "",
    copyrightHolder: "",
    publisher: "",
    image: null,
    imagePreview: null
  });

  // --- RELEASES & SONGS SELECTION STATE ---
  const [allReleases, setAllReleases] = useState([]); // All songs from DB
  const [selectedReleaseIds, setSelectedReleaseIds] = useState([]); // IDs selected for current playlist
  const [releaseSearchQuery, setReleaseSearchQuery] = useState(""); // Search term for releases

  // --- LIST STATE ---
  const [view, setView] = useState('list'); 
  const [viewMode, setViewMode] = useState('grid'); 
  const [playlists, setPlaylists] = useState([]);
  const [fetching, setFetching] = useState(true);

  // --- MANAGE SONGS MODAL STATE ---
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [activePlaylistForManage, setActivePlaylistForManage] = useState(null);
  const [manageSearchQuery, setManageSearchQuery] = useState("");

  // --- EFFECTS ---

  const fetchPlaylists = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_songs (
            id,
            title,
            artist,
            audio_url,
            release_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (err) {
      console.error("Error fetching playlists:", err);
      // alert("Failed to load data");
    } finally {
      setFetching(false);
    }
  };

  const fetchAllReleases = async () => {
    try {
      const { data, error } = await supabase
        .from('releases')
        .select('id, title, primary_artist, cover_url, audio_url')
        .eq('status', 'Published') 
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAllReleases(data || []);
    } catch (err) {
      console.error("Error fetching releases:", err);
    }
  };

  useEffect(() => { 
    fetchPlaylists(); 
    fetchAllReleases();
  }, []);

  // --- HANDLERS ---

  const nextStep = () => {
    if (step === 0 && !formData.image) return alert("Please upload a poster.");
    if (step === 1) {
      if (!formData.title) return alert("Movie Title is required.");
      if (!formData.genre) return alert("Genre is required.");
    }
    if (step === 2 && selectedReleaseIds.length === 0) return alert("Please select at least one song from your library.");
    if (step < 3) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => Math.max(0, s - 1));

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      updateField('image', file);
      updateField('imagePreview', preview);
    }
  };

  const toggleReleaseSelection = (releaseId) => {
    if (selectedReleaseIds.includes(releaseId)) {
      setSelectedReleaseIds(prev => prev.filter(id => id !== releaseId));
    } else {
      setSelectedReleaseIds(prev => [...prev, releaseId]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.copyrightHolder) return alert("Copyright Holder is required.");
    setLoading(true);
    try {
      let finalImageUrl = "";
      if (formData.image instanceof File) {
        const fileName = `topplaylistcover/${Date.now()}-${formData.image.name}`;
        const { data: imgData, error: imgError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, formData.image);
        if (imgError) throw imgError;
        
        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imgData.path);
        finalImageUrl = publicUrl;
      } else {
        finalImageUrl = formData.imagePreview || "";
      }

      const { data: newPlaylist, error: insertError } = await supabase
        .from('playlists')
        .insert({
          title: formData.title,
          artist: formData.artist,
          year: formData.year,
          genre: formData.genre,
          language: formData.language,
          description: formData.description,
          copyright_holder: formData.copyrightHolder,
          publisher: formData.publisher,
          image_url: finalImageUrl
        })
        .select()
        .single();

      if (insertError) throw insertError;
      const playlistId = newPlaylist.id;

      for (const releaseId of selectedReleaseIds) {
        const releaseData = allReleases.find(r => r.id === releaseId);
        if (releaseData) {
          await supabase.from('playlist_songs').insert({
            playlist_id: playlistId,
            release_id: releaseId,
            title: releaseData.title,
            artist: releaseData.primary_artist,
            audio_url: releaseData.audio_url
          });
        }
      }

      setStep(0);
      setFormData({
        title: "", artist: "", year: new Date().getFullYear(), genre: "", language: "", 
        description: "", copyrightHolder: "", publisher: "", image: null, imagePreview: null
      });
      setSelectedReleaseIds([]);
      setReleaseSearchQuery("");
      setView('list');
      await fetchPlaylists();
      alert("Playlist Created Successfully!");
    } catch (err) {
      console.error("Error creating playlist:", err);
      alert("Error creating playlist: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const openManageModal = (playlist) => {
    setActivePlaylistForManage(playlist);
    setIsManageOpen(true);
    setManageSearchQuery("");
  };

  const closeManageModal = () => {
    setIsManageOpen(false);
    setActivePlaylistForManage(null);
  };

  const handleAddReleaseToExisting = async (releaseId) => {
    if (!activePlaylistForManage) return;
    const alreadyExists = activePlaylistForManage.playlist_songs?.some(s => s.release_id === releaseId);
    if (alreadyExists) {
      alert("This song is already in the playlist.");
      return;
    }
    const originalPlaylist = { ...activePlaylistForManage };
    try {
      const releaseData = allReleases.find(r => r.id === releaseId);
      if (!releaseData) return;

      const { error: dbError } = await supabase.from('playlist_songs').insert({
        playlist_id: activePlaylistForManage.id,
        release_id: releaseId,
        title: releaseData.title,
        artist: releaseData.primary_artist,
        audio_url: releaseData.audio_url
      });
      if (dbError) throw dbError;

      const { data: updatedListData } = await supabase
        .from('playlists')
        .select('*, playlist_songs(*)')
        .eq('id', activePlaylistForManage.id)
        .single();

      if (updatedListData) {
        setActivePlaylistForManage(updatedListData);
        setPlaylists(prev => prev.map(p => p.id === updatedListData.id ? updatedListData : p));
      }
    } catch (err) {
      console.error(err);
      alert("Error adding song: " + err.message);
      setActivePlaylistForManage(originalPlaylist);
    }
  };

  const handleDeleteSongFromExisting = async (songId) => {
    if(!confirm("Delete this song from playlist?")) return;
    const originalPlaylist = { ...activePlaylistForManage };
    try {
      const { error } = await supabase.from('playlist_songs').delete().eq('id', songId);
      if (error) throw error;

      const { data: updatedListData } = await supabase
        .from('playlists')
        .select('*, playlist_songs(*)')
        .eq('id', activePlaylistForManage.id)
        .single();

      if (updatedListData) {
        setActivePlaylistForManage(updatedListData);
        setPlaylists(prev => prev.map(p => p.id === updatedListData.id ? updatedListData : p));
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting song: " + err.message);
      setActivePlaylistForManage(originalPlaylist);
    }
  };

  const getFilteredReleases = (query) => {
    if (!query) return allReleases;
    const lowerQ = query.toLowerCase();
    return allReleases.filter(r => 
      r.title.toLowerCase().includes(lowerQ) || 
      (r.primary_artist && r.primary_artist.toLowerCase().includes(lowerQ))
    );
  };

  const steps = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'info', label: 'Info', icon: Disc },
    { id: 'tracks', label: 'Songs', icon: Music },
    { id: 'rights', label: 'Rights', icon: Globe },
  ];

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: TEXT_BLACK }}>
            Manage <span style={{ color: BLUE_DARK }}>Playlists</span>
          </h2>
          <p className="text-slate-500 text-sm">
            {view === 'wizard' ? 'Create a new playlist using your release library.' : 'View and manage movie playlists.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {view === 'list' && (
            <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode==='grid'?'bg-blue-100 text-blue-700':'text-gray-400 hover:text-gray-600'}`}><Grid3x3 size={18} /></button>
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode==='table'?'bg-blue-100 text-blue-700':'text-gray-400 hover:text-gray-600'}`}><List size={18} /></button>
            </div>
          )}
          {view === 'wizard' && (
            <button onClick={() => setView('list')} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-all">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* --- VIEW 1: WIZARD FORM --- */}
      {view === 'wizard' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${step >= i ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 text-gray-400 bg-white"}`}>
                      {step > i ? <CheckCircle2 size={16} /> : <s.icon size={16} />}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase ${step >= i ? "text-blue-700" : "text-gray-400"}`}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`h-0.5 w-full mx-2 ${step > i ? "bg-blue-600" : "bg-gray-200"}`}></div>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-grow p-4 md:p-8 bg-white overflow-y-auto">
            {step === 0 && (
              <div className="max-w-3xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Movie Poster</h3>
                <p className="text-gray-500 text-sm mb-6">This image will represent your playlist.</p>
                <div 
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer relative group ${formData.image ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`} 
                  onClick={() => document.getElementById('posterInput').click()}
                >
                  <input type="file" id="posterInput" hidden accept="image/*" onChange={handleImageUpload} />
                  {!formData.image ? (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-900 font-medium">Click to upload poster</p>
                    </>
                  ) : (
                    <div className="relative w-48 h-64 mx-auto">
                      <img src={formData.image instanceof File ? URL.createObjectURL(formData.image) : formData.image} alt="Preview" className="w-full h-full object-cover rounded-lg shadow-md" />
                    </div>
                  )}
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Movie Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Movie Title *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none" value={formData.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g. Saaya" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Artist Name *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none" value={formData.artist} onChange={e => updateField('artist', e.target.value)} placeholder="e.g. Arijit Singh" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Release Year *</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none" value={formData.year} onChange={e => updateField('year', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Genre *</label>
                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none bg-white" value={formData.genre} onChange={e => updateField('genre', e.target.value)}>
                      <option value="">Select Genre</option>
                      {genres && genres.length > 0 ? (
                        genres.map(g => <option key={g} value={g}>{g}</option>)
                      ) : (
                        <option value="Other">Other</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Language *</label>
                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none bg-white" value={formData.language} onChange={e => updateField('language', e.target.value)}>
                      <option value="">Select Language</option>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea rows="3" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none resize-none" value={formData.description} onChange={e => updateField('description', e.target.value)} placeholder="Movie description..."></textarea>
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col h-full">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                      <span>Selected Songs ({selectedReleaseIds.length})</span>
                    </h4>
                    <div className="flex-grow overflow-y-auto space-y-2">
                      {selectedReleaseIds.length === 0 ? (
                        <div className="text-center text-slate-400 py-10">No songs selected yet.</div>
                      ) : (
                        selectedReleaseIds.map((id, idx) => {
                          const song = allReleases.find(r => r.id === id);
                          if (!song) return null;
                          return (
                            <div key={id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-slate-400 font-bold w-4 shrink-0">{idx + 1}</span>
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Music size={14} /></div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-900 truncate">{song.title}</p>
                                  <p className="text-xs text-slate-500 truncate">{song.primary_artist}</p>
                                </div>
                              </div>
                              <button onClick={() => toggleReleaseSelection(id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full shrink-0"><Trash2 size={16} /></button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col h-full">
                    <h4 className="font-bold text-gray-900 mb-4">Add from Library</h4>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search by title or artist..." 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 outline-none"
                        value={releaseSearchQuery}
                        onChange={(e) => setReleaseSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                      {getFilteredReleases(releaseSearchQuery).length === 0 && (
                        <div className="text-center text-slate-400 py-10 text-sm">No releases found.</div>
                      )}
                      {getFilteredReleases(releaseSearchQuery).map(release => {
                        const isSelected = selectedReleaseIds.includes(release.id);
                        return (
                          <div 
                            key={release.id} 
                            onClick={() => toggleReleaseSelection(release.id)}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <img src={release.cover_url || "https://via.placeholder.com/40"} className="w-10 h-10 rounded object-cover" alt="" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{release.title}</p>
                                <p className="text-xs text-slate-500 truncate">{release.primary_artist}</p>
                              </div>
                            </div>
                            <button className={`p-1.5 rounded-full ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {isSelected ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Copyright & Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Copyright Holder *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none" value={formData.copyrightHolder} onChange={e => updateField('copyrightHolder', e.target.value)} placeholder="Label Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Publisher</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none" value={formData.publisher} onChange={e => updateField('publisher', e.target.value)} placeholder="Publisher Name" />
                  </div>
                </div>
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                  <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-yellow-800">Ready to Publish?</h4>
                    <p className="text-xs text-yellow-700">This will create the playlist "{formData.title}" with {selectedReleaseIds.length} songs linked from your Release Library.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-4 md:px-8 flex justify-between items-center">
            <button onClick={prevStep} disabled={step === 0} className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-white disabled:opacity-50 transition">Previous</button>
            {step < 3 ? (
              <button onClick={nextStep} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition flex items-center gap-2">Next <ChevronRight size={18} /></button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold shadow hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Create Playlist</button>
            )}
          </div>
        </div>
      )}

      {/* --- VIEW 2: LIST VIEW (DASHBOARD) --- */}
      {view === 'list' && (
        <>
          {fetching ? (
            <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
          ) : (
            <>
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
                  {playlists.map((playlist) => (
                    <div key={playlist.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group relative flex flex-col">
                      <div className="aspect-video relative bg-slate-100">
                        <img src={playlist.image_url || "https://via.placeholder.com/300x200?text=No+Image"} alt={playlist.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex-grow">
                          <h3 className="font-bold text-slate-900 truncate">{playlist.title}</h3>
                          <div className="flex justify-between items-center mt-1 mb-3">
                            <p className="text-xs text-slate-500">{playlist.genre} • {playlist.year}</p>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{playlist.playlist_songs?.length || 0} Tracks</span>
                          </div>
                        </div>
                        <button onClick={() => openManageModal(playlist)} className="w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-2 mt-auto"><ListMusic size={14} /> Manage Songs</button>
                      </div>
                    </div>
                  ))}
                  {playlists.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-400 flex flex-col items-center">
                      <Music size={48} className="mb-4 text-slate-300" />
                      <p className="text-lg">No playlists found. Click "Create New" to start.</p>
                    </div>
                  )}
                </div>
              )}
              {viewMode === 'table' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Cover</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Title & Artist</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Genre / Year</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tracks</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {playlists.map((playlist) => (
                          <tr key={playlist.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap"><img className="h-16 w-16 rounded-lg object-cover shadow-sm" src={playlist.image_url || "https://via.placeholder.com/100"} alt="" /></td>
                            <td className="px-6 py-4"><div className="text-sm font-bold text-slate-900">{playlist.title}</div><div className="text-sm text-slate-500">{playlist.artist}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-700">{playlist.genre}</div><div className="text-xs text-slate-500">{playlist.year}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600">{playlist.playlist_songs?.length || 0} Songs</span></td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => openManageModal(playlist)} className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold flex items-center justify-end gap-2 ml-auto"><ListMusic size={14} /> Manage</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {playlists.length === 0 && <div className="p-10 text-center text-slate-400">No playlists found.</div>}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
      {view === 'list' && (
        <button onClick={() => setView('wizard')} className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform" style={{ background: BLUE_GRADIENT }} title="Create New Playlist"><Plus size={28} /></button>
      )}
      <AnimatePresence>
        {isManageOpen && activePlaylistForManage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeManageModal}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center shrink-0">
                <div><h3 className="text-xl font-bold text-gray-900">Manage Songs</h3><p className="text-sm text-slate-500">For: <span className="font-semibold text-blue-600">{activePlaylistForManage.title}</span></p></div>
                <button onClick={closeManageModal} className="p-2 hover:bg-white rounded-full transition"><X size={20} className="text-slate-500" /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 h-fit flex flex-col">
                    <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Plus size={18} /> Add from Library</h4>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-2.5 text-blue-400" size={16} />
                      <input type="text" placeholder="Search releases..." className="w-full pl-9 pr-4 py-2 border border-blue-200 bg-white rounded-lg text-sm focus:border-blue-500 outline-none" value={manageSearchQuery} onChange={(e) => setManageSearchQuery(e.target.value)} />
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-2 max-h-[400px]">
                      {getFilteredReleases(manageSearchQuery).length === 0 && <div className="text-center text-blue-300 py-8 text-sm">No releases found.</div>}
                      {getFilteredReleases(manageSearchQuery).map(release => {
                        const isAdded = activePlaylistForManage.playlist_songs?.some(s => s.release_id === release.id);
                        return (
                          <div key={release.id} className={`flex items-center justify-between p-3 bg-white border rounded-lg ${isAdded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'}`}>
                            <div className="flex items-center gap-3 overflow-hidden"><img src={release.cover_url || "https://via.placeholder.com/40"} className="w-10 h-10 rounded object-cover" alt="" /><div className="min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{release.title}</p><p className="text-xs text-slate-500 truncate">{release.primary_artist}</p></div></div>
                            <button disabled={isAdded} onClick={() => handleAddReleaseToExisting(release.id)} className={`p-1.5 rounded-full ${isAdded ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{isAdded ? <CheckCircle2 size={16} /> : <Plus size={16} />}</button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col h-full">
                    <h4 className="font-bold text-gray-900 mb-4">Current Tracklist ({activePlaylistForManage.playlist_songs?.length || 0})</h4>
                    <div className="flex-grow overflow-y-auto">
                      {!activePlaylistForManage.playlist_songs || activePlaylistForManage.playlist_songs.length === 0 ? (
                        <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 h-full flex items-center justify-center">This playlist is empty. Add songs from your library on the left.</div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                          {activePlaylistForManage.playlist_songs.map((song, idx) => (
                            <div key={song.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3 overflow-hidden"><span className="text-slate-400 font-bold w-4 shrink-0">{idx + 1}</span><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><Play size={12} fill="white" /></div><div className="min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{song.title}</p><p className="text-xs text-slate-500 truncate">{song.artist}</p></div></div>
                              <button onClick={() => handleDeleteSongFromExisting(song.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition shrink-0" title="Remove Song"><Trash2 size={16} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopPlaylistAdmin;