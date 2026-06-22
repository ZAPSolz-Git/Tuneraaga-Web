import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Heart,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Shuffle,
  ArrowLeft,
  Clock,
  MoreHorizontal,
  Music2,
  Disc3,
  Users,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const formatDuration = (val) => {
  if (!val) return "0:00";
  if (typeof val === "string") return val;
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};
const formatCount = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
};
const parseArtists = (artistStr) => {
  if (!artistStr) return [];
  return artistStr
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
};

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
}) => {
  if (!song) return null;
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-5px_30px_rgba(0,0,0,0.3)] z-[100]"
    >
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 px-4 py-3 md:py-4 md:px-8">
        <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
          <div className="relative group w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10">
            <img
              src={song.albumArt || "https://via.placeholder.com/50"}
              alt="Art"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h4 className="font-bold text-white truncate text-base leading-tight">
              {song.title}
            </h4>
            <p className="text-xs text-gray-400 truncate mt-1">{song.artist}</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center w-full md:max-w-2xl">
          <div className="flex items-center gap-4 md:gap-6 mb-2">
            <button
              onClick={onPrev}
              className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => onPlayPause(song)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-all duration-300 bg-white text-slate-900"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 md:w-7 md:h-7 fill-slate-900" />
              ) : (
                <Play className="w-6 h-6 md:w-7 md:h-7 fill-slate-900 ml-1" />
              )}
            </button>
            <button
              onClick={onNext}
              className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleShuffle}
              className={`transition-all hover:scale-110 ${isShuffle ? "text-green-500" : "text-gray-400 hover:text-white"}`}
            >
              <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          <div className="w-full flex items-center gap-3 text-xs text-gray-400 font-medium px-0 md:px-8">
            <span className="w-10 text-right font-mono">
              {formatDuration(currentTime)}
            </span>
            <div className="flex-1 relative h-1.5 bg-gray-700 rounded-full cursor-pointer group">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
                style={{
                  width: duration ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  left: duration ? `${(currentTime / duration) * 100}%` : "0%",
                  marginLeft: "-6px",
                }}
              />
            </div>
            <span className="w-10 font-mono">{formatDuration(duration)}</span>
          </div>
        </div>
        <div className="hidden md:flex w-1/4 min-w-[160px] flex-col items-end gap-2">
          <div className="flex items-center gap-3 w-full justify-end">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3 w-full justify-end mt-1">
            <button
              onClick={() => toggleMute()}
              className="text-gray-400 hover:text-green-500 transition-colors hover:scale-110"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
            <div className="flex-1 relative h-1.5 bg-gray-700 rounded-full cursor-pointer w-24">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-green-500"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AlbumDetails = () => {
  const { albumName } = useParams();
  const navigate = useNavigate();
  const decodedAlbumName = decodeURIComponent(albumName || "");
  const [albumSongs, setAlbumSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedSongs, setLikedSongs] = useState(new Set());
  const [isAllLiked, setIsAllLiked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentList, setCurrentList] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchAlbumSongs = async () => {
      if (!decodedAlbumName) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("releases")
          .select("*")
          .eq("album_name", decodedAlbumName)
          .eq("status", "Published")
          .order("track_number", { ascending: true });
        if (error) throw error;
        setAlbumSongs(
          (data || []).map((song) => ({
            id: song.id,
            title: song.title,
            artist: song.primary_artist,
            featuringArtists: song.featuring_artists || "",
            img: song.cover_url || "https://via.placeholder.com/300",
            audioUrl: song.audio_url,
            language: song.language || "",
            genre: song.genre || "",
            albumName: song.album_name || "",
            albumCoverUrl: song.album_cover_url || song.cover_url || "",
            playCount: song.play_count || 0,
            trackNumber: song.track_number || 1,
            releaseDate: song.release_date,
            copyright_holder: song.copyright_holder,
            copyright_year: song.copyright_year,
          })),
        );
      } catch (error) {
        console.error("Error fetching album songs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbumSongs();
  }, [decodedAlbumName]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onPlayEvt = () => setPlaying(true);
    const onPauseEvt = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("play", onPlayEvt);
    audio.addEventListener("pause", onPauseEvt);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("play", onPlayEvt);
      audio.removeEventListener("pause", onPauseEvt);
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      if (!currentList.length || currentIndex === null) return;
      let nextIndex = isShuffle
        ? (() => {
            let n;
            do {
              n = Math.floor(Math.random() * currentList.length);
            } while (currentList.length > 1 && n === currentIndex);
            return n;
          })()
        : (currentIndex + 1) % currentList.length;
      const nextSong = currentList[nextIndex];
      setCurrentIndex(nextIndex);
      setCurrentSong(nextSong);
      audio.src = nextSong.audioUrl;
      audio.load();
      audio.play().catch(console.error);
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentList, currentIndex, isShuffle]);

  const playSong = (song) => {
    if (!song) return;
    const audio = audioRef.current;
    if (currentSong && currentSong.id !== song.id) {
      setCurrentSong(song);
      audio.src = song.audioUrl;
      audio.load();
    }
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(console.error);
  };
  const handlePlayPause = (song) => {
    if (currentSong?.id === song.id && playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else playSong(song);
  };
  const handleSongClick = (index, song, list) => {
    if (currentSong?.id === song.id) handlePlayPause(song);
    else {
      setCurrentList(list);
      setCurrentIndex(index);
      playSong(song);
    }
  };
  const handleNext = () => {
    if (!currentList.length || currentIndex === null) return;
    let next = isShuffle
      ? (() => {
          let n;
          do {
            n = Math.floor(Math.random() * currentList.length);
          } while (currentList.length > 1 && n === currentIndex);
          return n;
        })()
      : (currentIndex + 1) % currentList.length;
    setCurrentIndex(next);
    playSong(currentList[next]);
  };
  const handlePrev = () => {
    if (!currentList.length || currentIndex === null) return;
    const prev = (currentIndex - 1 + currentList.length) % currentList.length;
    setCurrentIndex(prev);
    playSong(currentList[prev]);
  };
  const handleSeek = (time) => {
    if (audioRef.current) {
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
  const toggleLikeSong = (songId) => {
    setLikedSongs((prev) => {
      const n = new Set(prev);
      n.has(songId) ? n.delete(songId) : n.add(songId);
      setIsAllLiked(n.size === albumSongs.length && albumSongs.length > 0);
      return n;
    });
  };
  const toggleLikeAll = () => {
    if (isAllLiked) {
      setLikedSongs(new Set());
      setIsAllLiked(false);
    } else {
      setLikedSongs(new Set(albumSongs.map((s) => s.id)));
      setIsAllLiked(true);
    }
  };

  const albumCover =
    albumSongs[0]?.albumCoverUrl ||
    albumSongs[0]?.img ||
    "https://via.placeholder.com/400";
  const albumTitle = decodedAlbumName || "Unknown Album";
  const totalPlays = albumSongs.reduce((sum, s) => sum + (s.playCount || 0), 0);
  const allArtists = [
    ...new Set(
      albumSongs.flatMap((s) =>
        parseArtists(s.featuringArtists).concat(s.artist),
      ),
    ),
  ];
  const totalDurationSec = albumSongs.length * 210;
  const uniqueLanguages = [
    ...new Set(albumSongs.map((s) => s.language).filter(Boolean)),
  ];
  const uniqueGenres = [
    ...new Set(albumSongs.map((s) => s.genre).filter(Boolean)),
  ];

  return (
    <div className="w-full min-h-screen text-slate-900 pt-6 pb-24 px-4 md:px-8 relative overflow-hidden bg-white">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
      >
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="font-medium text-sm">Back</span>
      </button>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : albumSongs.length === 0 ? (
        <div className="text-center py-20">
          <Music2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-400">No songs found</h2>
          <p className="text-slate-400 mt-2">
            No published songs found for &quot;{decodedAlbumName}&quot;
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8 md:mb-10">
            <div className="relative group flex-shrink-0 mx-auto md:mx-0">
              <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-xl overflow-hidden shadow-2xl border border-slate-200">
                <img
                  src={albumCover}
                  alt={albumTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center text-center md:text-left flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Disc3 size={14} className="text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  {uniqueGenres[0] || "Album"}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 text-slate-900">
                {albumTitle}
              </h1>
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-3">
                <Users size={14} className="text-slate-400" />
                {allArtists.map((artist, idx) => (
                  <span key={artist} className="flex items-center gap-1">
                    <Link
                      to={`/artist/${encodeURIComponent(artist)}`}
                      className="text-sm font-medium text-slate-600 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {artist}
                    </Link>
                    {idx < allArtists.length - 1 && (
                      <span className="text-slate-400 text-xs">,</span>
                    )}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start text-sm text-slate-500 mb-6">
                <span className="font-semibold text-slate-700">
                  {albumSongs.length} Songs
                </span>
                <span className="text-slate-300">|</span>
                <span>{formatCount(totalPlays)} Plays</span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {formatDuration(totalDurationSec)}
                </span>
                {uniqueLanguages.length > 0 && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span>{uniqueLanguages.join(", ")}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <button
                  onClick={() => handleSongClick(0, albumSongs[0], albumSongs)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-base flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
                >
                  <Play size={20} fill="white" /> Play All
                </button>
                <button
                  onClick={toggleLikeAll}
                  className={`p-3 rounded-full border-2 transition-all hover:scale-110 ${isAllLiked ? "text-red-500 border-red-500 bg-red-50" : "text-slate-400 border-slate-300 hover:border-red-400 hover:text-red-400"}`}
                >
                  <Heart
                    size={20}
                    fill={isAllLiked ? "currentColor" : "none"}
                  />
                </button>
                <button className="p-3 rounded-full border-2 border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-600 transition-all hover:scale-110">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              {albumSongs[0]?.releaseDate && (
                <p className="text-[11px] text-slate-400 mt-4">
                  Released: {new Date(albumSongs[0].releaseDate).getFullYear()}
                </p>
              )}
              {albumSongs[0]?.copyright_holder && (
                <p className="text-[11px] text-slate-400 mt-1">
                  © {albumSongs[0].copyright_year}{" "}
                  {albumSongs[0].copyright_holder}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">
                      #
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Song
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      Artists
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                      Language
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
                      <Clock size={14} className="inline" />
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
                      Like
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {albumSongs.map((song, index) => {
                    const isActive = currentSong?.id === song.id;
                    const isLiked = likedSongs.has(song.id);
                    const uniqueSongArtists = [
                      ...new Set([
                        song.artist,
                        ...parseArtists(song.featuringArtists),
                      ]),
                    ];
                    return (
                      <tr
                        key={song.id}
                        onClick={() => handleSongClick(index, song, albumSongs)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${isActive ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                          <div className="w-8 h-8 flex items-center justify-center">
                            {isActive && playing ? (
                              <div className="flex items-end gap-0.5 h-4">
                                <div
                                  className="w-1 bg-blue-600 rounded-full animate-bounce"
                                  style={{
                                    animationDelay: "0s",
                                    height: "40%",
                                  }}
                                />
                                <div
                                  className="w-1 bg-blue-600 rounded-full animate-bounce"
                                  style={{
                                    animationDelay: "0.15s",
                                    height: "100%",
                                  }}
                                />
                                <div
                                  className="w-1 bg-blue-600 rounded-full animate-bounce"
                                  style={{
                                    animationDelay: "0.3s",
                                    height: "60%",
                                  }}
                                />
                              </div>
                            ) : (
                              <span
                                className={`text-sm font-medium ${isActive ? "text-blue-600" : "text-slate-500"}`}
                              >
                                {song.trackNumber || index + 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={song.img}
                              alt={song.title}
                              className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div
                                className={`text-sm font-semibold truncate ${isActive ? "text-blue-600" : "text-slate-900"}`}
                              >
                                {song.title}
                              </div>
                              <div className="md:hidden text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1 flex-wrap">
                                {uniqueSongArtists.map((a, i) => (
                                  <span
                                    key={a}
                                    className="flex items-center gap-0.5"
                                  >
                                    <Link
                                      to={`/artist/${encodeURIComponent(a)}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="hover:text-blue-600 hover:underline"
                                    >
                                      {a}
                                    </Link>
                                    {i < uniqueSongArtists.length - 1 && (
                                      <span className="text-slate-300">,</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1 flex-wrap text-sm text-slate-600">
                            {uniqueSongArtists.map((a, i) => (
                              <span key={a} className="flex items-center gap-1">
                                <Link
                                  to={`/artist/${encodeURIComponent(a)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-blue-600 hover:underline transition-colors"
                                >
                                  {a}
                                </Link>
                                {i < uniqueSongArtists.length - 1 && (
                                  <span className="text-slate-300">,</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-3 hidden sm:table-cell">
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                            {song.language || "—"}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-3 text-right text-sm text-slate-500 font-mono">
                          3:30
                        </td>
                        <td className="px-4 md:px-6 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLikeSong(song.id);
                            }}
                            className={`transition-all hover:scale-125 ${isLiked ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
                          >
                            <Heart
                              size={16}
                              fill={isLiked ? "currentColor" : "none"}
                            />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-10 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={18} className="text-blue-600" /> All Artists in this
              Album
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allArtists.map((artist) => (
                <Link
                  key={artist}
                  to={`/artist/${encodeURIComponent(artist)}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                    {artist.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 truncate w-full text-center transition-colors">
                    {artist}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
      <AnimatePresence>
        {currentSong && (
          <StickyPlayer
            song={{
              ...currentSong,
              albumArt: currentSong.img || "https://via.placeholder.com/50",
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

export default AlbumDetails;
