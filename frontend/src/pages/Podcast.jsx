/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, Mic } from "lucide-react";

// ─── Blue Gradient Palette ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

// Mock Data: Podcasts
const podcasts = [
  { id: 1, title: "The Ranveer Show", artist: "Ranveer Allahbadia", img: "https://picsum.photos/seed/ranveer/300/300" },
  { id: 2, title: "Figure It Out", artist: "Ranveer Allahbadia", img: "https://picsum.photos/seed/figureitout/300/300" },
  { id: 3, title: "Finshots Daily", artist: "Shashank Kumar", img: "https://picsum.photos/seed/finshots/300/300" },
  { id: 4, title: "The Podcast", artist: "Sushant Sinha", img: "https://picsum.photos/seed/thepodcast/300/300" },
  { id: 5, title: "Real Talk with Sanyam", artist: "Sanyam Dhingra", img: "https://picsum.photos/seed/realpill/300/300" },
  { id: 6, title: "Cognitive Revolution", artist: "Dr. K", img: "https://picsum.photos/seed/cognitive/300/300" },
  { id: 7, title: "BeerBiceps", artist: "Ranveer Arora", img: "https://picsum.photos/seed/beerbiceps/300/300" },
  { id: 8, title: "Tragedy & Triumph", artist: "Shwetabh Kumar", img: "https://picsum.photos/seed/tragedy/300/300" },
];

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
      active
        ? "text-white shadow-md" // Active state with white text
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200" // Inactive state
    }`}
    style={active ? { background: BLUE_GRADIENT } : {}}
  >
    {label}
  </button>
);

const Podcast = () => {
  const [activeFilter, setActiveFilter] = useState("Trending");

  return (
    // Main Background: White
    <div className="w-full min-h-screen text-slate-900 pt-6 pb-20 px-4 md:px-8 relative overflow-hidden bg-white">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2" style={{ color: TEXT_BLACK }}>
            <span style={{ color: BLUE_DARK }}>Podcasts</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Real conversations with real people.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {["Trending", "Business", "Technology", "Comedy", "Lifestyle"].map(
            (filter) => (
              <FilterPill
                key={filter}
                label={filter}
                active={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              />
            )
          )}
        </div>
      </div>

      {/* Podcasts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {podcasts.map((podcast, index) => (
          <motion.div
            key={podcast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group cursor-pointer"
          >
            {/* Card Container */}
            <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100 shadow-sm border border-slate-200 group-hover:border-blue-400 group-hover:shadow-xl transition-all duration-300">
              
              {/* Image */}
              <img
                src={podcast.img}
                alt={podcast.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl"
                  style={{ background: BLUE_GRADIENT }}
                >
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </motion.div>
              </div>

              {/* Corner Badge */}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200" style={{ color: BLUE_DARK }}>
                AUDIO
              </div>
            </div>

            {/* Text Info */}
            <div className="px-1">
              <h3 className="font-bold text-base truncate group-hover:text-blue-600 transition-colors" style={{ color: TEXT_BLACK }}>
                {podcast.title}
              </h3>
              <p className="text-slate-500 text-sm truncate mt-1 flex items-center gap-1">
                {podcast.artist}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform" style={{ background: BLUE_GRADIENT }}>
          <Mic className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Podcast;