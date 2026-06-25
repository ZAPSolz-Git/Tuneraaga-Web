import { useState, useEffect, useRef, useCallback } from "react";

export const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  if (typeof val === "string") return val;
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const parseArtists = (val) => {
  if (Array.isArray(val))
    return val.map((s) => String(s).trim()).filter(Boolean);
  if (
    val == null ||
    val === "" ||
    typeof val === "number" ||
    typeof val === "boolean"
  )
    return [];
  const str = String(val).trim();
  if (str === "") return [];
  return str
    .split(",")
    .map((a) => a.trim())
    .filter((s) => s.length > 0);
};

export const useAudioPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentList, setCurrentList] = useState([]);
  const [trackDurations, setTrackDurations] = useState({});

  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const isShuffleRef = useRef(false);
  const trackDurationsRef = useRef({});

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);
  useEffect(() => {
    currentListRef.current = currentList;
  }, [currentList]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  const fetchDurations = useCallback((tracks) => {
    tracks.forEach((track) => {
      const audioUrl = track.audioUrl || track.audio_url;
      if (trackDurationsRef.current[track.id] || !audioUrl) return;
      try {
        const tempAudio = new Audio();
        tempAudio.preload = "metadata";
        tempAudio.src = audioUrl;
        const onMeta = () => {
          if (
            tempAudio.duration &&
            isFinite(tempAudio.duration) &&
            tempAudio.duration > 0
          ) {
            trackDurationsRef.current[track.id] = tempAudio.duration;
            setTrackDurations((prev) => ({
              ...prev,
              [track.id]: tempAudio.duration,
            }));
          }
          cleanup();
        };
        const onErr = () => cleanup();
        const cleanup = () => {
          tempAudio.removeEventListener("loadedmetadata", onMeta);
          tempAudio.removeEventListener("error", onErr);
          tempAudio.removeAttribute("src");
          tempAudio.load();
        };
        tempAudio.addEventListener("loadedmetadata", onMeta);
        tempAudio.addEventListener("error", onErr);
      } catch (e) {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
        if (currentSongRef.current?.id) {
          setTrackDurations((prev) => ({
            ...prev,
            [currentSongRef.current.id]: audio.duration,
          }));
        }
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => handleNext();
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
      audio.removeAttribute("src");
      audio.load();
    };
  }, [handleNext]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const playSong = useCallback((song) => {
    const audioUrl = song.audioUrl || song.audio_url;
    if (!song || !audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;
    const isNewSong = currentSongRef.current?.id !== song.id;
    if (isNewSong) {
      setCurrentSong(song);
      currentSongRef.current = song;
      setDuration(0);
      setCurrentTime(0);
      audio.src = audioUrl;
      audio.load();
    }
    let hasStarted = false;
    const tryPlay = () => {
      if (hasStarted) return;
      const promise = audio.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            hasStarted = true;
            setPlaying(true);
          })
          .catch((err) => {
            if (err.name !== "AbortError") console.error("Play error:", err);
          });
      }
    };
    if (audio.readyState >= 2) tryPlay();
    else {
      const onCanPlay = () => {
        audio.removeEventListener("canplay", onCanPlay);
        clearTimeout(fallbackTimer);
        tryPlay();
      };
      audio.addEventListener("canplay", onCanPlay, { once: true });
      const fallbackTimer = setTimeout(() => {
        audio.removeEventListener("canplay", onCanPlay);
        tryPlay();
      }, 3000);
    }
  }, []);

  // ✅ FIXED — function declarations are hoisted above all const/let
  function handleNext() {
    if (!currentSong || !playlist || playlist.length === 0) return;
    const idx = playlist.findIndex((s) => s.id === currentSong.id);
    const nextIdx = (idx + 1) % playlist.length;
    handleSongClick(nextIdx, playlist[nextIdx], playlist);
  }

  function handlePrev() {
    if (!currentSong || !playlist || playlist.length === 0) return;
    const idx = playlist.findIndex((s) => s.id === currentSong.id);
    const prevIdx = (idx - 1 + playlist.length) % playlist.length;
    handleSongClick(prevIdx, playlist[prevIdx], playlist);
  }

  const handlePrev = useCallback(() => {
    if (currentListRef.current.length === 0 || currentIndexRef.current === null)
      return;
    const prevIndex =
      (currentIndexRef.current - 1 + currentListRef.current.length) %
      currentListRef.current.length;
    setCurrentIndex(prevIndex);
    currentIndexRef.current = prevIndex;
    playSong(currentListRef.current[prevIndex]);
  }, [playSong]);

  const handlePlayPause = useCallback(
    (song) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (
        currentSongRef.current &&
        currentSongRef.current.id === song.id &&
        !audio.paused
      ) {
        audio.pause();
        setPlaying(false);
      } else {
        playSong(song);
      }
    },
    [playSong],
  );

  const handleSongClick = useCallback(
    (index, song, list) => {
      if (currentSongRef.current?.id === song.id) {
        handlePlayPause(song);
      } else {
        setCurrentList(list);
        currentListRef.current = list;
        setCurrentIndex(index);
        currentIndexRef.current = index;
        playSong(song);
      }
    },
    [handlePlayPause, playSong],
  );

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleClosePlayer = () => {
    setPlaying(false);
    setCurrentSong(null);
    currentSongRef.current = null;
    setCurrentIndex(null);
    currentIndexRef.current = null;
    setCurrentList([]);
    currentListRef.current = [];
    setDuration(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const handleVolumeChange = (v) => {
    setVolume(v);
    setIsMuted(v === 0);
  };
  const onToggleShuffle = () => setIsShuffle(!isShuffle);

  return {
    playing,
    currentSong,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    currentList,
    trackDurations,
    fetchDurations,
    playSong,
    handleNext,
    handlePrev,
    handlePlayPause,
    handleSongClick,
    handleSeek,
    handleClosePlayer,
    toggleMute,
    handleVolumeChange,
    onToggleShuffle,
  };
};
