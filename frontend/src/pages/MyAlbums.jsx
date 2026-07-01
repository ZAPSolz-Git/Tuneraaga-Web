import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Play,
  Pause,
  Clock,
  Music,
  Loader2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Trash2,
  Disc3,
  Users,
  Star,
  Heart,
} from "lucide-react";
import Auth from "../components/Auth";

const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export default function MyAlbums() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedAlbums, setSavedAlbums] = useState([]);
  const [removingId, setRemovingId] = useState(null);

  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentList, setCurrentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const userRef = useRef(null);
  const currentIndexRef = useRef(null);
  const currentListRef = useRef([]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    currentListRef.current = currentList;
  }, [currentList]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        userRef.current = session.user;
        await fetchSavedAlbums(session.user.id);
      } else {
        setLoading(false);
      }
    };
    init();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        userRef.current = session.user;
        await fetchSavedAlbums(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        userRef.current = null;
        setSavedAlbums([]);
        handleClosePlayer();
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchSavedAlbums = async (uid) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_albums")
        .select("id, album_name, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (error) {
        setSavedAlbums([]);
        setLoading(false);
        return;
      }
      if (!data || data.length === 0) {
        setSavedAlbums([]);
        setLoading(false);
        return;
      }

      const albumDetails = await Promise.all(
        data.map(async (entry) => {
          const { data: releases } = await supabase
            .from("releases")
            .select(
              "cover_url, primary_artist, title, audio_url, duration, id, featuring_artists",
            )
            .eq("album_name", entry.album_name)
            .eq("status", "Published")
            .limit(20);
          const firstRelease = releases?.[0] || null;
          return {
            ...entry,
            cover_url: firstRelease?.cover_url || null,
            primary_artist: firstRelease?.primary_artist || "Unknown",
            song_count: releases?.length || 0,
            songs: releases || [],
          };
        }),
      );
      setSavedAlbums(albumDetails);
    } catch (err) {
      setSavedAlbums([]);
    }
    setLoading(false);
  };

  const removeAlbum = async (albumId) => {
    if (!user || !albumId) return;
    setRemovingId(albumId);
    const { error } = await supabase
      .from("saved_albums")
      .delete()
      .eq("id", albumId);
    if (!error) setSavedAlbums((p) => p.filter((a) => a.id !== albumId));
    setRemovingId(null);
  };

  const clearAllAlbums = async () => {
    if (!user) return;
    handleClosePlayer();
    const { error } = await supabase
      .from("saved_albums")
      .delete()
      .eq("user_id", user.id);
    if (!error) setSavedAlbums([]);
  };

  const saveToHistory = async (releaseId) => {
    const u = userRef.current;
    if (!u || !releaseId) return;
    const { data: existing } = await supabase
      .from("history")
      .select("id")
      .eq("user_id", u.id)
      .eq("release_id", releaseId)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("history")
        .update({ played_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("history")
        .insert({ user_id: u.id, release_id: releaseId });
    }
  };

  const playSong = useCallback((song, list, index) => {
    if (!song || !song.audio_url) return;
    const audio = audioRef.current;
    const fmt = {
      ...song,
      audioUrl: song.audio_url,
      img: song.cover_url,
      artist: song.primary_artist,
    };
    setCurrentSong(fmt);
    setCurrentList(list);
    setCurrentIndex(index);
    setDuration(0);
    setCurrentTime(0);
    audio.src = song.audio_url;
    audio.load();
    audio
      .play()
      .then(() => setPlaying(true))
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });
    saveToHistory(song.id);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTU = () => setCurrentTime(audio.currentTime);
    const onLM = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onPl = () => setPlaying(true);
    const onPa = () => setPlaying(false);
    const onEn = () => {
      const ni = (currentIndexRef.current + 1) % currentListRef.current.length;
      if (currentListRef.current[ni])
        playSong(currentListRef.current[ni], currentListRef.current, ni);
    };
    audio.addEventListener("timeupdate", onTU);
    audio.addEventListener("loadedmetadata", onLM);
    audio.addEventListener("play", onPl);
    audio.addEventListener("pause", onPa);
    audio.addEventListener("ended", onEn);
    return () => {
      audio.pause();
      [onTU, onLM, onPl, onPa, onEn].forEach((fn, i) =>
        audio.removeEventListener(
          ["timeupdate", "loadedmetadata", "play", "pause", "ended"][i],
          fn,
        ),
      );
    };
  }, [playSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
  };
  const handleSeek = (t) => {
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };
  const handleClosePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    setCurrentSong(null);
    setPlaying(false);
    setCurrentIndex(null);
    setCurrentList([]);
    setDuration(0);
    setCurrentTime(0);
  };
  const toggleMute = () => setIsMuted(!isMuted);
  const handleVolumeChange = (v) => {
    setVolume(v);
    setIsMuted(v === 0);
  };
  const playAlbum = (album) => {
    if (!album.songs || album.songs.length === 0) return;
    const first = album.songs[0];
    if (first.audio_url) playSong(first, album.songs, 0);
  };

  const TabBar = () => (
    <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 overflow-x-auto">
      <Link
        to="/history"
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all text-white/70 hover:text-white hover:bg-white/10 whitespace-nowrap"
      >
        <Clock size={14} className="inline mr-1.5" />
        History
      </Link>
      <Link
        to="/liked"
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all text-white/70 hover:text-white hover:bg-white/10 whitespace-nowrap"
      >
        <Heart size={14} className="inline mr-1.5" />
        Liked Songs
      </Link>
      <Link
        to="/my-albums"
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-white text-purple-700 shadow-sm whitespace-nowrap"
      >
        <Disc3 size={14} className="inline mr-1.5" />
        Albums
      </Link>
      <Link
        to="/my-podcasts"
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all text-white/70 hover:text-white hover:bg-white/10 whitespace-nowrap"
      >
        <Music size={14} className="inline mr-1.5" />
        Podcasts
      </Link>
      <Link
        to="/my-artists"
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all text-white/70 hover:text-white hover:bg-white/10 whitespace-nowrap"
      >
        <Users size={14} className="inline mr-1.5" />
        Artists
      </Link>
    </div>
  );

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Disc3 size={48} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Login Required</h2>
        <p className="text-slate-500 mb-6">
          Please login to view your saved albums.
        </p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700"
        >
          Login / Sign Up
        </button>
        {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-slate-900 pb-32 relative">
      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}
      <div className="bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 text-white px-4 md:px-8 pt-8 pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm border-2 border-white/30">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {user?.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                </div>
                <span className="text-[11px] text-white/60 truncate block max-w-[180px]">
                  {user?.email}
                </span>
              </div>
            </div>
            <button className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all">
              ⭐ GO PRO
            </button>
          </div>
          <TabBar />
        </div>
      </div>

      <div className="px-4 md:px-8 pt-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <Disc3 size={22} className="text-purple-500" /> Albums
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {savedAlbums.length} album{savedAlbums.length !== 1 ? "s" : ""}
            </p>
          </div>
          {savedAlbums.length > 0 && (
            <button
              onClick={clearAllAlbums}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-purple-600" size={40} />
          </div>
        ) : savedAlbums.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <Disc3 size={36} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              Save your favorites
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8">
              Tap any ❤ or … button to build your music library.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => navigate("/top-chart")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 shadow-md"
              >
                <Play size={16} fill="currentColor" /> Play Weekly Top Songs
              </button>
              <button
                onClick={() => navigate("/new-release")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-700 font-semibold text-sm border border-slate-200 hover:bg-slate-50 shadow-sm"
              >
                <Star size={16} /> Browse New Releases
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {savedAlbums.map((album) => (
              <div
                key={album.id}
                className={`group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden ${removingId === album.id ? "opacity-40 pointer-events-none" : ""}`}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={album.cover_url || "https://via.placeholder.com/200"}
                    alt={album.album_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/200";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playAlbum(album);
                      }}
                      className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-purple-700 hover:scale-110"
                    >
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAlbum(album.id);
                    }}
                    disabled={removingId === album.id}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div
                  className="p-3 cursor-pointer"
                  onClick={() =>
                    navigate(`/album/${encodeURIComponent(album.album_name)}`)
                  }
                >
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {album.album_name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {album.primary_artist}
                  </p>
                  <p className="text-[11px] text-purple-500 mt-1">
                    {album.song_count} song{album.song_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[100]">
          <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 md:py-4 md:px-8">
            <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
                <img
                  src={currentSong.img || "https://via.placeholder.com/50"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col overflow-hidden">
                <h4 className="font-bold text-white truncate text-base leading-tight">
                  {currentSong.title}
                </h4>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {currentSong.artist}
                </p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center w-full md:max-w-2xl">
              <div className="flex items-center gap-4 md:gap-6 mb-2">
                <button
                  onClick={() => {
                    if (!currentList.length || currentIndex === null) return;
                    playSong(
                      currentList[
                        (currentIndex - 1 + currentList.length) %
                          currentList.length
                      ],
                      currentList,
                      (currentIndex - 1 + currentList.length) %
                        currentList.length,
                    );
                  }}
                  className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-all duration-300 bg-white text-slate-900"
                >
                  {playing ? (
                    <Pause size={24} className="fill-slate-900" />
                  ) : (
                    <Play size={24} className="fill-slate-900 ml-1" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (!currentList.length || currentIndex === null) return;
                    playSong(
                      currentList[(currentIndex + 1) % currentList.length],
                      currentList,
                      (currentIndex + 1) % currentList.length,
                    );
                  }}
                  className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
                >
                  <SkipForward size={20} />
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
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{
                      width: duration
                        ? `${(currentTime / duration) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
                <span className="w-10 font-mono">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>
            <div className="hidden md:flex w-1/4 min-w-[160px] flex-col items-end gap-2">
              <button
                onClick={handleClosePlayer}
                className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 w-full justify-end mt-1">
                <button
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-green-500 hover:scale-110"
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
                    onChange={(e) =>
                      handleVolumeChange(parseFloat(e.target.value))
                    }
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
        </div>
      )}
    </div>
  );
}
