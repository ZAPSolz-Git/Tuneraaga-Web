import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Play,
  Pause,
  Heart,
  Clock,
  Music,
  Loader2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Trash2,
  Trash,
} from "lucide-react";
import Auth from "../components/Auth";

const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export default function LikedSongs() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [likedSongsData, setLikedSongsData] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentList, setCurrentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    currentListRef.current = currentList;
  }, [currentList]);

  // Check auth and fetch data
  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        userRef.current = session.user;
        await fetchUserRole(session.user.id);
        await fetchLikes(session.user.id);
      } else {
        setLoading(false);
      }
    };
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        userRef.current = session.user;
        await fetchUserRole(session.user.id);
        await fetchLikes(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        userRef.current = null;
        setUserRole(null);
        setLikedSongsData([]);
        setLikedIds(new Set());
        handleClosePlayer();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user role from users table
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setUserRole(data.role);
      } else if (error?.code === "PGRST116") {
        // User not in users table, create entry
        await supabase
          .from("users")
          .insert({ id: userId, email: userRef.current?.email, role: "user" });
        setUserRole("user");
      }
    } catch (err) {
      console.error("Fetch role error:", err);
      setUserRole("user");
    }
  };

  const fetchLikes = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("likes")
      .select("id, created_at, releases(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLikedSongsData(data.filter((h) => h.releases !== null));
      setLikedIds(new Set(data.map((h) => h.releases.id)));
    }
    setLoading(false);
  };

  const saveToHistory = async (releaseId) => {
    const currentUser = userRef.current;
    if (!currentUser || !releaseId) return;
    try {
      await supabase
        .from("history")
        .delete()
        .match({ user_id: currentUser.id, release_id: releaseId });
      await supabase
        .from("history")
        .insert({ user_id: currentUser.id, release_id: releaseId });
    } catch (error) {
      console.error("History save error:", error);
    }
  };

  const toggleLikeSong = async (releaseId) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (currentSong?.id === releaseId) {
      handleClosePlayer();
    }

    setLikedIds((prev) => {
      const n = new Set(prev);
      n.delete(releaseId);
      return n;
    });
    setLikedSongsData((prev) =>
      prev.filter((s) => s.releases.id !== releaseId),
    );
    await supabase
      .from("likes")
      .delete()
      .match({ user_id: user.id, release_id: releaseId });
  };

  const clearAllLikes = async () => {
    if (!user) return;
    setClearingAll(true);
    handleClosePlayer();

    await supabase.from("likes").delete().eq("user_id", user.id);

    setLikedSongsData([]);
    setLikedIds(new Set());
    setClearingAll(false);
  };

  const playSong = useCallback(
    (song, list, index) => {
      if (!song || !song.audio_url) return;
      const audio = audioRef.current;
      const formattedSong = {
        ...song,
        audioUrl: song.audio_url,
        img: song.cover_url,
        artist: song.primary_artist,
      };

      setCurrentSong(formattedSong);
      setCurrentList(list);
      currentListRef.current = list;
      setCurrentIndex(index);
      currentIndexRef.current = index;
      setDuration(0);
      setCurrentTime(0);

      audio.src = song.audio_url;
      audio.load();
      audio
        .play()
        .then(() => setPlaying(true))
        .catch((err) => {
          if (err.name !== "AbortError" && err.name !== "NotAllowedError")
            console.error(err);
        });

      if (song.id) saveToHistory(song.id);
    },
    [user],
  );

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      const nextIndex =
        (currentIndexRef.current + 1) % currentListRef.current.length;
      if (currentListRef.current[nextIndex])
        playSong(
          currentListRef.current[nextIndex],
          currentListRef.current,
          nextIndex,
        );
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
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

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
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
    currentIndexRef.current = null;
    setCurrentList([]);
    currentListRef.current = [];
    setDuration(0);
    setCurrentTime(0);
  };

  const mappedLikes = likedSongsData.map((h) => h.releases);

  // Show login required if not authenticated
  if (!user && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Music size={48} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-slate-900">
          Login Required
        </h2>
        <p className="text-slate-500 mb-6 text-center">
          Please login to see your liked songs.
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
    <div className="w-full min-h-screen text-slate-900 pb-32 bg-gradient-to-br from-slate-50 via-red-50/40 to-slate-50 relative">
      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}

      <div className="relative px-4 md:px-8 pt-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-1">
              <span className="text-red-600">Liked</span> Songs
            </h1>
            <p className="text-slate-500 text-sm">
              Songs you love
              {mappedLikes.length > 0 && (
                <span className="text-slate-400 ml-1">
                  · {mappedLikes.length} song
                  {mappedLikes.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {mappedLikes.length > 0 && (
              <button
                onClick={clearAllLikes}
                disabled={clearingAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearingAll ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash size={16} />
                )}
                {clearingAll ? "Clearing..." : "Clear All"}
              </button>
            )}

            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <span className="text-xs text-slate-500 hidden sm:inline max-w-[140px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-red-600" size={40} />
          </div>
        ) : mappedLikes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <Music size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Liked Songs</h3>
            <p className="text-slate-500">
              Hit the heart icon on any song to save it here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-12">
                      #
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                      Song
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase w-20">
                      <Clock size={14} className="inline" />
                    </th>
                    <th className="px-4 md:px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-12"></th>
                    <th className="px-4 md:px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-12"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {mappedLikes.map((song, index) => {
                    const isActive = currentSong?.id === song.id;
                    return (
                      <tr
                        key={song.id}
                        onClick={() => playSong(song, mappedLikes, index)}
                        className={`hover:bg-slate-50 cursor-pointer group transition-colors ${
                          isActive ? "bg-red-50" : ""
                        }`}
                      >
                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                          <div className="w-8 h-8 flex items-center justify-center">
                            {isActive && playing ? (
                              <Pause
                                size={16}
                                className="text-red-600 fill-red-600"
                              />
                            ) : (
                              <>
                                <Play
                                  size={16}
                                  className="text-red-600 hidden group-hover:block fill-red-600"
                                />
                                <span
                                  className={`text-sm font-medium group-hover:hidden ${
                                    isActive ? "text-red-600" : "text-slate-500"
                                  }`}
                                >
                                  {index + 1}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                song.cover_url ||
                                "https://via.placeholder.com/40"
                              }
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/40";
                              }}
                            />
                            <div className="min-w-0">
                              <div
                                className={`text-sm font-semibold truncate ${
                                  isActive ? "text-red-600" : "text-slate-900"
                                }`}
                              >
                                {song.title}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {song.primary_artist}
                                {song.featuring_artists && (
                                  <span className="text-teal-500">
                                    {" "}
                                    ft. {song.featuring_artists}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-3 text-right text-sm text-slate-500 font-mono">
                          —
                        </td>
                        <td className="px-4 md:px-6 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLikeSong(song.id);
                            }}
                            className="transition-all hover:scale-110 text-red-500 hover:text-red-700"
                            title="Unlike"
                          >
                            <Heart size={16} fill="currentColor" />
                          </button>
                        </td>
                        <td className="px-4 md:px-6 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLikeSong(song.id);
                            }}
                            className="text-slate-300 hover:text-red-500 transition-all hover:scale-110 hover:bg-red-50 p-1 rounded-lg"
                            title="Remove from Liked Songs"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Player */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[100]">
          <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 md:py-4 md:px-8">
            <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
              <div className="relative group w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
                <img
                  src={currentSong.img || "https://via.placeholder.com/50"}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
                    if (
                      !currentListRef.current.length ||
                      currentIndexRef.current === null
                    )
                      return;
                    const i =
                      (currentIndexRef.current -
                        1 +
                        currentListRef.current.length) %
                      currentListRef.current.length;
                    playSong(
                      currentListRef.current[i],
                      currentListRef.current,
                      i,
                    );
                  }}
                  className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 bg-white text-slate-900"
                >
                  {playing ? (
                    <Pause size={24} className="fill-slate-900" />
                  ) : (
                    <Play size={24} className="fill-slate-900 ml-1" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (
                      !currentListRef.current.length ||
                      currentIndexRef.current === null
                    )
                      return;
                    const i =
                      (currentIndexRef.current + 1) %
                      currentListRef.current.length;
                    playSong(
                      currentListRef.current[i],
                      currentListRef.current,
                      i,
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
                <div
                  className="flex-1 relative h-1.5 bg-gray-700 rounded-full cursor-pointer group"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    handleSeek(percentage * duration);
                  }}
                >
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-500 to-pink-500"
                    style={{
                      width: `${(currentTime / duration) * 100 || 0}%`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      left: `${(currentTime / duration) * 100 || 0}%`,
                      marginLeft: "-6px",
                    }}
                  />
                </div>
                <span className="w-10 font-mono">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>

            <div className="flex md:hidden items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <button
                onClick={handleClosePlayer}
                className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300 p-1.5 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="hidden md:flex w-1/4 min-w-[160px] flex-col items-end gap-2">
              <div className="flex items-center gap-3 w-full justify-end">
                <button
                  onClick={handleClosePlayer}
                  className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-center gap-3 w-full justify-end mt-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-gray-400 hover:text-red-400 transition-colors hover:scale-110"
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
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      setIsMuted(v === 0);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-red-500"
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
