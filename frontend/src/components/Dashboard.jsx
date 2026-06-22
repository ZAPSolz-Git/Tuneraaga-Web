/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Volume2, VolumeX, Info, Loader2, Pause } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

// ─── CONFIGURATION ───
const supabaseUrl = "https://suaguciltgydkoyjmbmx.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1YWd1Y2lsdGd5ZGtveWptYm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjM3MTQsImV4cCI6MjA4ODc5OTcxNH0.ypgJm4BnNxalLsACpEtBF9T8uP5OwNSw4nwjiN-3rE8";
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Blue Gradient Palette ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const heroContent = {
  id: "hero-mock",
  title: "The Tune Raaga",
  description:
    "A breathtaking journey through uncharted territories. Experience the visuals like never before in 4K HDR.",
  logo: "/tuneraaga4.png",
  image:
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop",
  rating: "U/A 13+",
  year: "2024",
  audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
};

const Dashboard = () => {
  const [isMuted, setIsMuted] = useState(true);
  const { searchQuery } = useOutletContext();

  // --- STATES FOR ALL SECTIONS ---
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [latestReleases, setLatestReleases] = useState([]);
  const [top10India, setTop10India] = useState([]);

  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingTop10, setLoadingTop10] = useState(true);

  // ─── AUDIO STATE ───
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);

  // Audio Setup
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Mute Sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Fetch All Data
  useEffect(() => {
    fetchTrending();
    fetchLatestReleases();
    fetchTop10India();
  }, []);

  // Helper function to format items with unique IDs
  const formatItems = (data, prefix) => {
    return (data || [])
      .map((item, index) => {
        if (!item.releases) return null;
        return {
          uniqueKey: `${prefix}-${item.releases.id}-${index}`,
          id: item.releases.id,
          title: item.releases.title,
          image: item.releases.cover_url,
          type: item.releases.primary_artist,
          audio_url: item.releases.audio_url,
        };
      })
      .filter(Boolean);
  };

  // 1. Fetch Trending
  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const { data, error } = await supabase
        .from("trending_songs")
        .select(`*, releases (id, title, primary_artist, cover_url, audio_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTrendingSongs(formatItems(data, "trending"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrending(false);
    }
  };

  // 2. Fetch Latest Releases
  const fetchLatestReleases = async () => {
    setLoadingLatest(true);
    try {
      const { data, error } = await supabase
        .from("latest_releases")
        .select(`*, releases (id, title, primary_artist, cover_url, audio_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLatestReleases(formatItems(data, "latest"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLatest(false);
    }
  };

  // 3. Fetch Top 10 India
  const fetchTop10India = async () => {
    setLoadingTop10(true);
    try {
      const { data, error } = await supabase
        .from("top10_india")
        .select(`*, releases (id, title, primary_artist, cover_url, audio_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTop10India(formatItems(data, "top10"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTop10(false);
    }
  };

  // ─── AUDIO CONTROLLER ───
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((e) => console.log("Auto-play prevented:", e));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const handlePlaySong = (song) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong && currentSong.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      audio.src = song.audio_url;
      audio.load();
      if (isMuted) {
        setIsMuted(false);
        audio.muted = false;
      }
      setIsPlaying(true);
    }
  };

  // Combine data for Rows
  const allRows = [
    {
      title: "Trending Now",
      items: trendingSongs,
      isLoading: loadingTrending,
      rowKey: "trending-row",
    },
    {
      title: "Latest Top 10 Releases",
      items: latestReleases,
      isLoading: loadingLatest,
      rowKey: "latest-row",
    },
    {
      title: "Top 10 in India",
      items: top10India,
      isLoading: loadingTop10,
      rowKey: "top10-row",
    },
  ];

  return (
    <div className="relative bg-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-[85vh] w-full">
        <div className="absolute inset-0">
          <img
            src={heroContent.image}
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="absolute bottom-[28%] left-4 right-4 md:left-16 md:right-auto max-w-xl z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span
              className="px-2 py-1 text-xs font-semibold border border-white/30 rounded bg-black/30 backdrop-blur-sm"
              style={{ color: "#fff" }}
            >
              {heroContent.rating}
            </span>

            {/* ✅ FIXED LOGO: Removed scale(1.1) and 90vw to prevent horizontal scrolling on mobile */}
            <div className="mt-6 md:mt-12 mb-2 w-full max-w-[320px] md:max-w-[400px]">
              <img
                src={heroContent.logo}
                alt={heroContent.title}
                className="w-full h-auto object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] md:translate-y-8"
              />
            </div>

            <p className="text-sm text-gray-200 mt-3 mb-4 font-medium">
              {heroContent.year}
            </p>
            <p className="text-base md:text-lg text-gray-100 mb-8 leading-relaxed hidden md:block">
              {heroContent.description}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handlePlaySong(heroContent)}
                className="flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-md font-semibold text-white shadow-lg transition-all hover:opacity-90 text-sm md:text-base"
                style={{ background: BLUE_GRADIENT }}
              >
                {currentSong?.id === heroContent.id && isPlaying ? (
                  <Pause className="w-4 h-4 md:w-5 md:h-5 fill-white" />
                ) : (
                  <Play className="w-4 h-4 md:w-5 md:h-5 fill-white" />
                )}
                {currentSong?.id === heroContent.id && isPlaying
                  ? "Pause"
                  : "Play"}
              </button>

              <button className="flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-md font-semibold bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all shadow-sm text-sm md:text-base">
                <Info className="w-4 h-4 md:w-5 md:h-5" /> More Info
              </button>
            </div>
          </motion.div>
        </div>

        <button
          onClick={() => {
            setIsMuted(!isMuted);
            if (audioRef.current) audioRef.current.muted = !isMuted;
          }}
          className="absolute right-4 md:right-10 bottom-[20%] border border-white/30 rounded-full p-2 bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors shadow-sm"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Content Rows */}
      <div className="relative z-10 -mt-32 pb-20 space-y-8">
        {allRows.map((row) => {
          if (row.isLoading) {
            return (
              <div
                key={row.rowKey}
                className="relative group/row px-4 md:px-16"
              >
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  {row.title}
                </h3>
                <div className="flex gap-3 overflow-hidden h-32 items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={30} />
                </div>
              </div>
            );
          }

          const filteredItems = row.items.filter((item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()),
          );
          if (searchQuery && filteredItems.length === 0) return null;

          return (
            <ContentRow
              key={row.rowKey}
              title={row.title}
              items={searchQuery ? filteredItems : row.items}
              searchQuery={searchQuery}
              onPlaySong={handlePlaySong}
              currentSong={currentSong}
              isPlaying={isPlaying}
            />
          );
        })}
      </div>
    </div>
  );
};

const ContentRow = ({
  title,
  items,
  searchQuery,
  onPlaySong,
  currentSong,
  isPlaying,
}) => {
  const rowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    if (!rowRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - rowRef.current.offsetLeft);
    setScrollLeft(rowRef.current.scrollLeft);
    rowRef.current.style.cursor = "grabbing";
  };

  const handleMouseLeave = () => {
    if (!rowRef.current) return;
    setIsDragging(false);
    rowRef.current.style.cursor = "grab";
  };

  const handleMouseUp = () => {
    if (!rowRef.current) return;
    setIsDragging(false);
    rowRef.current.style.cursor = "grab";
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    if (!rowRef.current) return;
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    rowRef.current.scrollLeft = scrollLeft - walk;
  };

  if (items.length === 0) return null;

  return (
    <div className="relative group/row px-4 md:px-16">
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <div
        ref={rowRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-6 -mb-6 cursor-grab select-none scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <ContentCard
            key={item.uniqueKey}
            item={item}
            onPlaySong={onPlaySong}
            currentSong={currentSong}
            isPlaying={isPlaying}
          />
        ))}
      </div>
    </div>
  );
};

const ContentCard = ({ item, onPlaySong, currentSong, isPlaying }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isThisSongPlaying = currentSong?.id === item.id && isPlaying;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="relative flex-shrink-0 w-[160px] md:w-[240px] cursor-pointer group/card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video rounded-md overflow-hidden border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
          draggable="false"
        />

        {/* Dark Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 right-0 p-3 z-10 flex flex-col items-center justify-end h-full"
            >
              {/* Play Button - Centered */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlaySong(item);
                }}
                className="mb-3 w-12 h-12 rounded-full flex items-center justify-center transition-transform transform hover:scale-110 shadow-lg text-white bg-blue-600 hover:bg-blue-500"
                style={{ background: BLUE_GRADIENT }}
              >
                {isThisSongPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current" />
                )}
              </button>

              {/* Song Name */}
              <p className="font-bold text-base text-white text-center truncate w-full">
                {item.title}
              </p>

              {/* Artist Name */}
              <p className="text-sm text-gray-300 text-center truncate w-full">
                {item.type}
              </p>

              {/* Now Playing Indicator */}
              {isThisSongPlaying && (
                <p className="text-xs text-blue-400 font-bold mt-1 animate-pulse">
                  Now Playing...
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Dashboard;
