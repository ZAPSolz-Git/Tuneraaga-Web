import React from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Shuffle,
  Film,
  Disc3,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { formatDuration, parseArtists } from "../hooks/useAudioPlayer";

const StickyPlayer = ({
  song,
  isPlaying,
  onPlayPause,
  onSeek,
  onPrev,
  onNext,
  currentTime,
  duration,
  volume,
  onVolumeChange,
  isMuted,
  toggleMute,
  isShuffle,
  onToggleShuffle,
  onClose,
  currentRadioStation,
  profileOpen,
  onToggleProfile,
}) => {
  if (!song) return null;

  const title = song.title || "Unknown";
  const artist = song.artist || song.primary_artist || "";
  const featuring = parseArtists(
    song.featuringArtists || song.featuring_artists,
  );
  const movieName = song.movieName || song.movie_name || "";
  const albumName = song.albumName || song.album_name || "";
  const coverImg =
    song.img ||
    song.albumArt ||
    song.cover_url ||
    "https://via.placeholder.com/50";

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", damping: 22 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-900/97 backdrop-blur-2xl border-t border-white/10 shadow-[0_-5px_30px_rgba(0,0,0,0.4)] z-[100]"
    >
      {/* Progress bar strip at top */}
      <div className="w-full h-1 bg-gray-800 cursor-pointer relative">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400"
          style={{
            width: duration ? `${(currentTime / duration) * 100}%` : "0%",
          }}
        />
      </div>

      <div className="max-w-screen-2xl mx-auto flex items-center px-4 py-3 md:py-3.5 md:px-8 gap-3 md:gap-6">
        {/* LEFT: Art + Song Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 md:w-13 md:h-13 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 shadow-md">
            <img
              src={coverImg}
              alt="Art"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <h4 className="font-bold text-white truncate text-sm leading-tight">
              {title}
            </h4>
            <p className="text-xs text-gray-400 truncate">{artist}</p>
            {featuring.length > 0 && (
              <p className="text-[10px] text-gray-500 truncate">
                ft. {featuring.join(", ")}
              </p>
            )}
            {movieName && (
              <p className="text-[10px] text-purple-400 truncate flex items-center gap-0.5">
                <Film size={8} /> {movieName}
              </p>
            )}
            {albumName && !movieName && (
              <p className="text-[10px] text-blue-400 truncate flex items-center gap-0.5">
                <Disc3 size={8} /> {albumName}
              </p>
            )}
          </div>
        </div>

        {/* CENTER: Controls */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <button
            onClick={onToggleShuffle}
            className={`transition-all hover:scale-110 ${isShuffle ? "text-emerald-400" : "text-gray-500 hover:text-white"}`}
            title="Shuffle"
          >
            <Shuffle className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={onPrev}
            className="text-gray-400 hover:text-white transition-colors hover:scale-110"
          >
            <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={onPlayPause}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center bg-white text-slate-900 shadow-lg hover:scale-110 transition-all duration-200"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5 fill-slate-900" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 fill-slate-900 ml-0.5" />
            )}
          </button>
          <button
            onClick={onNext}
            className="text-gray-400 hover:text-white transition-colors hover:scale-110"
          >
            <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Time - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-gray-500 font-mono flex-shrink-0">
          <span>{formatDuration(currentTime)}</span>
          <span>/</span>
          <span>{formatDuration(duration)}</span>
        </div>

        {/* RIGHT: Volume + Expand + Close */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Mute button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="hidden md:block text-gray-400 hover:text-emerald-400 transition-colors hover:scale-110"
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={16} />
            ) : (
              <Volume2 size={16} />
            )}
          </button>

          {/* Volume slider */}
          <div className="hidden md:block relative h-1.5 bg-gray-700 rounded-full cursor-pointer w-20">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                e.stopPropagation();
                onVolumeChange(parseFloat(e.target.value));
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-emerald-500"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            />
          </div>

          {/* EXPAND ARROW — right of volume, toggles profile panel */}
          {currentRadioStation && onToggleProfile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleProfile();
              }}
              title={
                profileOpen
                  ? "Close Profile"
                  : `View ${currentRadioStation.name}`
              }
              className={`flex flex-col items-center gap-0.5 transition-all hover:scale-110 group ${profileOpen ? "text-emerald-400" : "text-gray-400 hover:text-emerald-400"}`}
            >
              {profileOpen ? (
                <ChevronDown
                  size={20}
                  className="group-hover:translate-y-0.5 transition-transform"
                />
              ) : (
                <ChevronUp
                  size={20}
                  className="group-hover:-translate-y-0.5 transition-transform"
                />
              )}
              <span className="text-[8px] font-bold uppercase tracking-wide leading-none hidden md:block">
                {profileOpen ? "Close" : "Profile"}
              </span>
            </button>
          )}

          {/* Close player */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
            title="Close Player"
          >
            <X size={17} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default StickyPlayer;
