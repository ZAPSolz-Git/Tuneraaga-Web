import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Music, Play, X, Upload, ArrowLeft, Trash2, 
  ChevronRight, CheckCircle2, Disc, Globe, Loader2, AlertTriangle, 
  ListMusic, Grid3x3, List, Image, Info, TrendingUp, Edit, ChevronDown, Search
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

// --- IMPORTS ---
import { genres } from '../lib/subgener'; 

// ─── CONFIGURATION ───
// --- ENV CONFIGURATION ---
// .env file se variables load kar rahe hain
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'TuneRaaga'; 

// ─── CONSTANTS ───
const LANGUAGES = [
  "For You", "Hindi", "Tamil", "Telugu", "English", "Punjabi", 
  "Marathi", "Gujarati", "Bengali", "Kannada", "Bhojpuri", 
  "Malayalam", "Sanskrit", "Haryanvi", "Rajasthani", "Odia", "Assamese"
];

const CHART_TYPES = ["Top 50", "Trending", "Most Searched", "Decade Hits", "Mood", "Weekly Top"];

// --- CUSTOM SEARCHABLE SELECT COMPONENT (Looks like a standard dropdown) ---
const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  // Find selected object to display text
  const selectedOption = options.find(opt => opt.id == value);
  const displayValue = selectedOption ? `${selectedOption.title} - ${selectedOption.primary_artist}` : "";

  // Filter options based on search
  const filteredOptions = options.filter(opt => 
    opt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    opt.primary_artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button (Looks exactly like a standard Select) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm flex justify-between items-center focus:ring-2 focus:ring-blue-500 outline-none hover:border-blue-400 transition-colors"
      >
        <span className="truncate text-gray-700">{displayValue || placeholder}</span>
        <ChevronDown size={16} className="text-gray-500 ml-2 shrink-0" />
      </button>

      {/* Dropdown List with Search Bar */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col max-h-60 overflow-hidden">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
              <input
                type="text"
                className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-blue-500"
                placeholder="Search songs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Scrollable List */}
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-slate-50 last:border-0 transition-colors"
                >
                  <div className="font-medium text-slate-800 truncate">{opt.title}</div>
                  <div className="text-xs text-slate-500 truncate">{opt.primary_artist}</div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">No matching songs found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───
const TopChartAdmin = () => {
  // --- WIZARD STATE ---
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    title: "",
    artist: "",      
    year: new Date().getFullYear(), 
    genre: "",       
    language: "Hindi",
    type: "Top 50",
    description: "",
    copyright_holder: "", 
    publisher: "",       
    image: null,
    imagePreview: null
  });

  // --- SONGS STATE ---
  const [songs, setSongs] = useState([]);
  const [tempSong, setTempSong] = useState({ releaseId: "" });

  // --- LIST STATE ---
  const [viewMode, setViewMode] = useState('grid'); 
  const [charts, setCharts] = useState([]);
  const [fetching, setFetching] = useState(true);

  // --- MANAGE SONGS MODAL STATE ---
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [activeChartForManage, setActiveChartForManage] = useState(null);
  const [newSongForManage, setNewSongForManage] = useState({ releaseId: "" });

  // --- EDIT DETAILS MODAL STATE ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [editData, setEditData] = useState({});
  const [editImageFile, setEditImageFile] = useState(null);

  // --- RELEASES STATE ---
  const [allReleases, setAllReleases] = useState([]);

  // --- EFFECTS ---
  const fetchCharts = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('charts')
        .select(`
          *,
          chart_songs (
            id,
            title,
            artist,
            audio_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharts(data || []);
    } catch (err) {
      console.error("Error fetching charts:", err);
      Swal.fire('Error', 'Failed to load data', 'error');
    } finally {
      setFetching(false);
    }
  };

  const fetchReleases = async () => {
    try {
      const { data, error } = await supabase
        .from('releases')
        .select('id, title, primary_artist, audio_url'); 
      if (error) throw error;
      setAllReleases(data || []);
    } catch (err) {
      console.error("Error fetching releases:", err);
    }
  };

  useEffect(() => { 
    fetchCharts(); 
    fetchReleases(); 
  }, []);

  // --- HANDLERS ---
  const nextStep = () => {
    if (step === 1 && !formData.image) return Swal.fire('Required', 'Please upload a cover.', 'warning');
    if (step === 2) {
      if (!formData.title) return Swal.fire('Required', 'Chart Title is required.', 'warning');
      if (!formData.artist) return Swal.fire('Required', 'Artist Name is required.', 'warning');
      if (!formData.genre) return Swal.fire('Required', 'Genre is required.', 'warning');
    }
    if (step === 3 && songs.length === 0) return Swal.fire('Required', 'Please add at least one song.', 'warning');
    if (step < 5) setStep(s => s + 1);
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

  const addTempSong = (e) => {
    e.preventDefault();
    const selectedRelease = allReleases.find(r => r.id == tempSong.releaseId);
    if (!selectedRelease) return Swal.fire('Required', 'Please select a song from the library.', 'warning');

    const newSong = {
      id: Date.now(), 
      title: selectedRelease.title,
      artist: selectedRelease.primary_artist,
      audioUrl: selectedRelease.audio_url 
    };
    
    setSongs([...songs, newSong]);
    setTempSong({ releaseId: "" }); 
  };

  const removeTempSong = (id) => {
    setSongs(songs.filter(s => s.id !== id));
  };

  const handleSubmit = async () => {
    if (!formData.copyright_holder) return Swal.fire('Required', 'Copyright Holder is required.', 'warning');
    setLoading(true);
    try {
      let finalImageUrl = "";
      if (formData.image instanceof File) {
        const fileName = `topchartscover/${Date.now()}-${formData.image.name}`;
        const { data: imgData, error: imgError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, formData.image);
        if (imgError) throw imgError;
        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imgData.path);
        finalImageUrl = publicUrl;
      }

      const { data: newChart, error: insertError } = await supabase
        .from('charts')
        .insert({
          title: formData.title,
          artist: formData.artist,          
          year: formData.year,              
          genre: formData.genre,            
          description: formData.description,
          language: formData.language,
          type: formData.type,
          copyright_holder: formData.copyright_holder, 
          publisher: formData.publisher,             
          image_url: finalImageUrl
        })
        .select()
        .single();

      if (insertError) throw insertError;
      const chartId = newChart.id;

      for (const song of songs) {
        await supabase.from('chart_songs').insert({
          chart_id: chartId,
          title: song.title,
          artist: song.artist,
          audio_url: song.audioUrl
        });
      }

      setStep(0);
      setFormData({
        title: "", artist: "", year: new Date().getFullYear(), genre: "", 
        description: "", copyright_holder: "", publisher: "", 
        language: "Hindi", type: "Top 50", image: null, imagePreview: null
      });
      setSongs([]);
      await fetchCharts();
      Swal.fire('Success', 'Chart Created Successfully!', 'success');
    } catch (err) {
      console.error("Error creating chart:", err);
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (chart) => {
    setEditingChart(chart);
    setEditData({ 
      title: chart.title || "",
      artist: chart.artist || "",
      year: chart.year || new Date().getFullYear(),
      genre: chart.genre || "",
      description: chart.description || "",
      language: chart.language || "",
      type: chart.type || "",
      copyright_holder: chart.copyright_holder || "",
      publisher: chart.publisher || ""
    }); 
    setEditImageFile(null);
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingChart(null);
    setEditImageFile(null);
  };

  const handleUpdateChart = async (e) => {
    e.preventDefault();
    if(!editingChart) return;
    
    setLoading(true);
    try {
      let imageUrlToUpdate = editingChart.image_url;

      if (editImageFile) {
        const fileName = `topchartscover/${Date.now()}-${editImageFile.name}`;
        const { data: imgData, error: imgError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, editImageFile);
        if (imgError) throw imgError;
        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imgData.path);
        imageUrlToUpdate = publicUrl;
      }

      const payload = {
        title: editData.title,
        artist: editData.artist,
        year: parseInt(editData.year), 
        genre: editData.genre,
        description: editData.description,
        language: editData.language,
        type: editData.type,
        copyright_holder: editData.copyright_holder,
        publisher: editData.publisher,
        image_url: imageUrlToUpdate
      };

      const { error } = await supabase
        .from('charts')
        .update(payload)
        .eq('id', editingChart.id);

      if (error) throw error;

      await fetchCharts();
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Chart details have been updated successfully.',
        confirmButtonColor: '#3085d6',
        timer: 1500,
        showConfirmButton: false
      });
      closeEditModal();
    } catch (err) {
      console.error("Error updating chart:", err);
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openManageModal = (chart) => {
    setActiveChartForManage(chart);
    setIsManageOpen(true);
    setNewSongForManage({ releaseId: "" });
  };

  const closeManageModal = () => {
    setIsManageOpen(false);
    setActiveChartForManage(null);
  };

  const handleAddSongToExisting = async (e) => {
    e.preventDefault();
    if (!newSongForManage.releaseId) return Swal.fire('Error', 'Please select a song', 'error');
    if (!activeChartForManage) return;

    const originalChart = { ...activeChartForManage };
    try {
      const selectedRelease = allReleases.find(r => r.id == newSongForManage.releaseId);
      if (!selectedRelease) throw new Error("Release not found");

      const { error: dbError } = await supabase.from('chart_songs').insert({
        chart_id: activeChartForManage.id,
        title: selectedRelease.title,
        artist: selectedRelease.primary_artist,
        audio_url: selectedRelease.audio_url 
      });
      
      if (dbError) throw dbError;

      const { data: updatedData } = await supabase
        .from('charts')
        .select('*, chart_songs(*)')
        .eq('id', activeChartForManage.id)
        .single();

      if (updatedData) {
        setActiveChartForManage(updatedData);
        setCharts(prev => prev.map(c => c.id === updatedData.id ? updatedData : c));
      }
      
      setNewSongForManage({ releaseId: "" }); 
      Swal.fire('Added', 'Song added successfully!', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.message, 'error');
      setActiveChartForManage(originalChart);
    }
  };

  const handleDeleteSongFromExisting = async (songId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      const originalChart = { ...activeChartForManage };
      try {
        const { error } = await supabase.from('chart_songs').delete().eq('id', songId);
        if (error) throw error;
        const { data: updatedData } = await supabase
          .from('charts')
          .select('*, chart_songs(*)')
          .eq('id', activeChartForManage.id)
          .single();
        if (updatedData) {
          setActiveChartForManage(updatedData);
          setCharts(prev => prev.map(c => c.id === updatedData.id ? updatedData : c));
        }
        Swal.fire('Deleted!', 'Song has been deleted.', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to delete song', 'error');
        setActiveChartForManage(originalChart);
      }
    }
  };

  const steps = [
    { id: 'upload', label: 'Cover', icon: Image },
    { id: 'info', label: 'Info', icon: Info },
    { id: 'tracks', label: 'Songs', icon: Music },
    { id: 'rights', label: 'Rights', icon: Globe },
    { id: 'finish', label: 'Finish', icon: CheckCircle2 },
  ];

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manage <span className="text-blue-600">Top Charts</span></h2>
          <p className="text-slate-500 text-sm">Create Top 50, Trending, and detailed charts.</p>
        </div>
        
        <div className="flex items-center gap-3">
            {step === 0 && (
                <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode==='grid'?'bg-blue-100 text-blue-700':'text-gray-400 hover:text-gray-600'}`}><Grid3x3 size={18} /></button>
                    <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode==='table'?'bg-blue-100 text-blue-700':'text-gray-400 hover:text-gray-600'}`}><List size={18} /></button>
                </div>
            )}

            <button 
                onClick={() => setStep(1)} 
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition flex items-center gap-2"
            >
                <Plus size={18} /> Create New Chart
            </button>
        </div>
      </div>

      {/* --- WIZARD --- */}
      {step > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[500px] flex flex-col mb-8">
           {/* Stepper UI */}
           <div className="bg-slate-50 border-b border-slate-200 px-8 py-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${step - 1 >= i ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 text-gray-400 bg-white"}`}>
                      {step - 1 > i ? <CheckCircle2 size={16} /> : <s.icon size={16} />}
                    </div>
                    <span className={`text-[10px] font-bold uppercase ${step - 1 >= i ? "text-blue-700" : "text-gray-400"}`}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`h-0.5 w-full mx-2 ${step - 1 > i ? "bg-blue-600" : "bg-gray-200"}`}></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-grow p-4 md:p-8 bg-white overflow-y-auto">
            {step === 1 && (
              <div className="max-w-3xl mx-auto text-center animate-in fade-in">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Cover</h3>
                <div onClick={() => document.getElementById('posterInput').click()} className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer relative group ${formData.image ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}>
                  <input type="file" id="posterInput" hidden accept="image/*" onChange={handleImageUpload} />
                  {!formData.image ? <><Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-900 font-medium">Click to upload cover</p></> : <div className="relative w-48 h-48 mx-auto"><img src={formData.image instanceof File ? URL.createObjectURL(formData.image) : formData.image} alt="Preview" className="w-full h-full object-cover rounded-lg shadow-md" /></div>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="max-w-4xl mx-auto animate-in fade-in">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Chart Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Chart Title *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" value={formData.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g. India Superhits Top 50" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Artist Name *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" value={formData.artist} onChange={e => updateField('artist', e.target.value)} placeholder="e.g. Various Artists" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Release Year *</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg px-4 py-2" value={formData.year} onChange={e => updateField('year', e.target.value)} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Genre *</label>
                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white" value={formData.genre} onChange={e => updateField('genre', e.target.value)}>
                      <option value="">Select Genre</option>
                      {genres && genres.length > 0 ? (
                        genres.map(g => <option key={g} value={g}>{g}</option>)
                      ) : (
                        <option value="Other">Other</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white" value={formData.type} onChange={e => updateField('type', e.target.value)}>{CHART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Language</label>
                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white" value={formData.language} onChange={e => updateField('language', e.target.value)}>{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea rows="3" className="w-full border border-gray-300 rounded-lg px-4 py-2 resize-none" value={formData.description} onChange={e => updateField('description', e.target.value)}></textarea>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-5xl mx-auto animate-in fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                    <h4 className="font-bold text-gray-900 mb-4"><Plus size={18} /> Add Song</h4>
                    <form onSubmit={addTempSong} className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Select Song</label>
                        
                        {/* UPDATED: Using Searchable Dropdown */}
                        <div className="mt-1">
                            <SearchableSelect 
                                options={allReleases}
                                value={tempSong.releaseId}
                                onChange={(id) => setTempSong({ ...tempSong, releaseId: id })}
                                placeholder="Select a song..."
                            />
                        </div>
                      </div>
                      
                      <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Add to List</button>
                    </form>
                  </div>
                  <div className="lg:col-span-2">
                    <h4 className="font-bold text-gray-900 mb-4">Songs ({songs.length})</h4>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      {songs.map((s, idx) => (
                        <div key={s.id} className="flex items-center justify-between p-4 border-b border-slate-100">
                          <div className="flex items-center gap-3"><span className="text-slate-400 font-bold">{idx+1}</span><div><p className="text-sm font-bold">{s.title}</p><p className="text-xs text-slate-500">{s.artist}</p></div></div>
                          <button onClick={() => removeTempSong(s.id)} className="text-red-500"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      {songs.length === 0 && <div className="p-4 text-center text-slate-400 text-sm">No songs added</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="max-w-4xl mx-auto animate-in fade-in">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Copyright & Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Copyright Holder *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none" value={formData.copyright_holder} onChange={e => updateField('copyright_holder', e.target.value)} placeholder="Label Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Publisher</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none" value={formData.publisher} onChange={e => updateField('publisher', e.target.value)} placeholder="Publisher Name" />
                  </div>
                </div>
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                  <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-yellow-800">Review Rights</h4>
                    <p className="text-xs text-yellow-700">Ensure you have the rights to publish "{formData.title}"</p>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
               <div className="max-w-2xl mx-auto text-center py-10">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} /></div>
                  <h3 className="text-2xl font-bold mb-2">Ready to Publish</h3>
                  <p className="text-slate-500 mb-2">Chart: "{formData.title}"</p>
                  <p className="text-slate-500 mb-6">Artist: {formData.artist} | Genre: {formData.genre} | {songs.length} Songs</p>
                  <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 flex items-center gap-2 mx-auto">{loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Publish Chart</button>
               </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-4 flex justify-between">
            <button onClick={prevStep} disabled={step === 1} className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold">Previous</button>
            {step < 5 ? <button onClick={nextStep} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-2">Next <ChevronRight size={18} /></button> : null}
          </div>
        </div>
      )}

      {/* --- DASHBOARD LIST --- */}
      {step === 0 && (
        <div>
          {fetching ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div> : (
            <>
              {/* GRID VIEW */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {charts.map((chart) => (
                    <div key={chart.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex gap-4 hover:shadow-md transition-all group">
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <img src={chart.image_url || "https://via.placeholder.com/100"} alt={chart.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col justify-center flex-grow">
                        <h3 className="font-bold text-slate-900 line-clamp-1">{chart.title}</h3>
                        <p className="text-xs text-slate-500 mb-1">{chart.artist} • {chart.year}</p>
                        <p className="text-xs text-slate-500 mb-2">{chart.type} • {chart.genre}</p>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold w-fit">{chart.chart_songs?.length || 0} Tracks</span>
                        
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => openManageModal(chart)} className="flex-1 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1">
                                <ListMusic size={12} /> Songs
                            </button>
                            <button onClick={() => openEditModal(chart)} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors" title="Edit Details">
                                <Edit size={14} />
                            </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TABLE VIEW */}
              {viewMode === 'table' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Cover</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Title & Artist</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tracks</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {charts.map((chart) => (
                          <tr key={chart.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <img className="h-16 w-16 rounded-lg object-cover shadow-sm" src={chart.image_url || "https://via.placeholder.com/100"} alt="" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-900">{chart.title}</div>
                              <div className="text-sm text-slate-500">{chart.artist}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-700">{chart.type}</div>
                              <div className="text-xs text-slate-500">{chart.genre} • {chart.year}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600">
                                {chart.chart_songs?.length || 0} Songs
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => openEditModal(chart)} className="p-2 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit Details">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => openManageModal(chart)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-colors text-xs font-bold flex items-center gap-1">
                                        <ListMusic size={14} /> Manage
                                    </button>
                                </div>
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
        </div>
      )}

      {/* --- MANAGE SONGS MODAL --- */}
      <AnimatePresence>
        {isManageOpen && activeChartForManage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeManageModal}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
                <div><h3 className="text-xl font-bold text-gray-900">Manage Songs</h3><p className="text-sm text-slate-500">{activeChartForManage.title}</p></div>
                <button onClick={closeManageModal}><X size={20} /></button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 h-fit">
                  <h4 className="font-bold text-blue-900 mb-4">Add Song</h4>
                  <form onSubmit={handleAddSongToExisting} className="space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-blue-800 uppercase">Select from Library</label>
                        
                        {/* UPDATED: Using Searchable Dropdown */}
                        <div className="mt-1">
                            <SearchableSelect 
                                options={allReleases}
                                value={newSongForManage.releaseId}
                                onChange={(id) => setNewSongForManage({ ...newSongForManage, releaseId: id })}
                                placeholder="Search songs..."
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Add Song</button>
                  </form>
                </div>

                <div className="lg:col-span-2">
                  <h4 className="font-bold text-gray-900 mb-4">Current Songs</h4>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {activeChartForManage.chart_songs?.map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between p-3 border-b border-slate-50">
                        <div className="flex items-center gap-3"><span className="text-slate-400 font-bold text-xs">{i+1}</span><p className="text-sm font-bold">{s.title}</p></div>
                        <button onClick={() => handleDeleteSongFromExisting(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT DETAILS MODAL --- */}
      <AnimatePresence>
        {isEditOpen && editingChart && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEditModal}></div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
                        <div><h3 className="text-xl font-bold text-gray-900">Edit Chart Details</h3><p className="text-sm text-slate-500">{editingChart.title}</p></div>
                        <button onClick={closeEditModal}><X size={20} /></button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-6">
                        <form onSubmit={handleUpdateChart} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Chart Title</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" value={editData.title || ''} onChange={e => setEditData({...editData, title: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Artist Name</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" value={editData.artist || ''} onChange={e => setEditData({...editData, artist: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Release Year</label>
                                    <input type="number" className="w-full border border-gray-300 rounded-lg px-4 py-2" value={editData.year || ''} onChange={e => setEditData({...editData, year: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Genre</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white" value={editData.genre || ''} onChange={e => setEditData({...editData, genre: e.target.value})}>
                                        <option value="">Select Genre</option>
                                        {genres && genres.length > 0 ? (genres.map(g => <option key={g} value={g}>{g}</option>)) : (<option value="Other">Other</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white" value={editData.type || ''} onChange={e => setEditData({...editData, type: e.target.value})}>{CHART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Language</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white" value={editData.language || ''} onChange={e => setEditData({...editData, language: e.target.value})}>{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                    <textarea rows="3" className="w-full border border-gray-300 rounded-lg px-4 py-2 resize-none" value={editData.description || ''} onChange={e => setEditData({...editData, description: e.target.value})}></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Copyright Holder</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" value={editData.copyright_holder || ''} onChange={e => setEditData({...editData, copyright_holder: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Publisher</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" value={editData.publisher || ''} onChange={e => setEditData({...editData, publisher: e.target.value})} />
                                </div>
                                
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Change Cover (Optional)</label>
                                    <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 bg-gray-50 relative">
                                        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0" onChange={e => setEditImageFile(e.target.files[0])} />
                                        {editImageFile ? <p className="text-blue-600 font-medium">{editImageFile.name}</p> : <p className="text-slate-500 text-sm">Click to change cover image</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={closeEditModal} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 flex items-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopChartAdmin;