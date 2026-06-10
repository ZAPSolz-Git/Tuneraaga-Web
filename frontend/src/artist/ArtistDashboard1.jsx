import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { 
  User, Mail, Phone, Globe, Link as LinkIcon, 
  Music4, Edit, CheckCircle2, Loader2 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const ArtistDashboard = () => {
  const [artistData, setArtistData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const artistId = localStorage.getItem("artistId");
      if (!artistId) return;

      try {
        // FETCH FROM SUPABASE 'artists' TABLE
        const { data, error } = await supabase
          .from('artists') // CHANGED: 'users' to 'artists'
          .select('*')
          .eq('id', artistId)
          .single(); 

        if (error) throw error;

        // Mapping: Database columns (snake_case) to State variables (camelCase)
        const mappedData = {
          id: data.id,
          name: data.name,
          genre: data.genre,
          image: data.image,
          bio: data.bio,
          email: data.email,
          phone: data.phone,
          spotifyUrl: data.spotify_url || data.spotifyUrl,
          instagramUrl: data.instagram_url || data.instagramUrl,
          status: data.status,
          verified: data.verified
        };

        setArtistData(mappedData);
      } catch (error) {
        console.error("Error fetching artist profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10 mb-4" />
        <p className="text-slate-500">Loading profile from Supabase...</p>
      </div>
    );
  }

  if (!artistData) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        Profile not found.
      </div>
    );
  }

  // UI RETURN
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 text-sm">Supabase Linked Profile</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm text-slate-700">
          <Edit size={16} /> Edit Profile
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 md:h-48 w-full bg-gradient-to-r from-blue-100 to-indigo-100" />
        <div className="px-6 md:px-10 pb-8 relative">
          <div className="absolute -top-16 md:-top-20 left-6 md:left-10 p-1 bg-white rounded-2xl shadow-md">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden bg-slate-100 relative">
              {artistData.image ? (
                <img src={artistData.image} alt={artistData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                  <User size={64} />
                </div>
              )}
              {artistData.verified && (
                <div className="absolute bottom-2 right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-sm border-2 border-white">
                  <CheckCircle2 size={20} fill="currentColor" />
                </div>
              )}
            </div>
          </div>
          <div className="pt-16 md:pt-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-bold text-slate-900">{artistData.name}</h2>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <Music4 size={18} className="text-blue-500" />
                {artistData.genre}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" /> About
          </h3>
          <p className="text-slate-600 leading-relaxed">{artistData.bio || "No bio."}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" /> Contact
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><Mail size={16} /></div>
              <div><p className="text-xs text-slate-400 uppercase font-bold">Email</p><p className="text-slate-700 font-medium">{artistData.email}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><Phone size={16} /></div>
              <div><p className="text-xs text-slate-400 uppercase font-bold">Phone</p><p className="text-slate-700 font-medium">{artistData.phone || "-"}</p></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ArtistDashboard;