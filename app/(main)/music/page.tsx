"use client";

import React, { useState, useRef, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import IosShareIcon from "@mui/icons-material/IosShare";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  src: string;
  coverGradient: string;
  isSaved: boolean;
}

const SAMPLE_TRACKS: Track[] = [
  {
    id: "1",
    title: "Like That",
    artist: "Mzade",
    duration: "6:12", // SoundHelix-Song-1 is long, but we'll show fake duration or calculate real
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverGradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    isSaved: false,
  },
  {
    id: "2",
    title: "Обнял поцеловал",
    artist: "ForceTx",
    duration: "7:05",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverGradient: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    isSaved: true,
  },
  {
    id: "3",
    title: "Ailem İçin",
    artist: "MIDWAVES",
    duration: "5:44",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverGradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    isSaved: true,
  },
  {
    id: "4",
    title: "Ride It Slowed",
    artist: "Aziza Qobilova",
    duration: "5:02",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    coverGradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
    isSaved: false,
  },
];

export default function MusicPlayerPage() {
  const [activeTab, setActiveTab] = useState<"popular" | "saved">("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [trackToShare, setTrackToShare] = useState<Track | null>(null);
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter tracks
  const displayedTracks = SAMPLE_TRACKS.filter((track) => {
    const matchesTab = activeTab === "popular" || (activeTab === "saved" && track.isSaved);
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Handle Play/Pause
  const togglePlayPause = () => {
    if (!currentTrack && displayedTracks.length > 0) {
      handlePlayTrack(displayedTracks[0]);
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      // audio element src changes will auto-play due to useEffect
    }
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIndex = SAMPLE_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % SAMPLE_TRACKS.length;
    handlePlayTrack(SAMPLE_TRACKS[nextIndex]);
  };

  const playPrev = () => {
    if (!currentTrack) return;
    const currentIndex = SAMPLE_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + SAMPLE_TRACKS.length) % SAMPLE_TRACKS.length;
    handlePlayTrack(SAMPLE_TRACKS[prevIndex]);
  };

  // Audio Effects
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Share
  const openShareModal = (track: Track) => {
    setTrackToShare(track);
    setShareModalOpen(true);
    setCopied(false);
  };

  const copyLink = () => {
    if (trackToShare) {
      const link = `${window.location.origin}/music?track=${trackToShare.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-black max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext}
      />

      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <div className="relative flex items-center mb-6">
          <SearchIcon className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск музыки"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 outline-none font-medium text-sm transition-all focus:bg-gray-200"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("popular")}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === "popular" ? "text-black" : "text-gray-400"
            }`}
          >
            Popular
            {activeTab === "popular" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === "saved" ? "text-black" : "text-gray-400"
            }`}
          >
            Saved
            {activeTab === "saved" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 no-scrollbar">
        {displayedTracks.map((track) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <div
              key={track.id}
              className={`flex items-center py-3 group cursor-pointer transition-colors ${
                isCurrent ? "opacity-100" : "opacity-90 hover:opacity-100"
              }`}
            >
              {/* Thumbnail / Play Button */}
              <div
                className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden mr-4 shadow-sm"
                style={{ background: track.coverGradient }}
                onClick={() => handlePlayTrack(track)}
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                {isCurrent && isPlaying ? (
                  <PauseIcon className="text-white relative z-10" />
                ) : (
                  <PlayArrowIcon className="text-white relative z-10" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0" onClick={() => handlePlayTrack(track)}>
                <h4 className={`font-semibold text-[15px] truncate ${isCurrent ? "text-blue-600" : "text-black"}`}>
                  {track.title}
                </h4>
                <p className="text-gray-500 text-[13px] truncate">{track.artist}</p>
                <p className="text-gray-400 text-xs mt-0.5">{track.duration}</p>
              </div>

              {/* Share Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openShareModal(track);
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100 ml-2"
              >
                <IosShareIcon fontSize="small" />
              </button>
            </div>
          );
        })}
        {displayedTracks.length === 0 && (
          <div className="text-center text-gray-500 mt-10 text-sm">
            No tracks found.
          </div>
        )}
      </div>

      {/* Bottom Player */}
      <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 pb-6 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
        {currentTrack ? (
          <>
            {/* Progress Bar */}
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-[10px] font-medium text-gray-500 w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <span className="text-[10px] font-medium text-gray-500 w-8">
                {formatTime(duration)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center w-1/3 min-w-0 pr-2">
                <div
                  className="w-10 h-10 rounded-md flex-shrink-0 shadow-sm mr-3"
                  style={{ background: currentTrack.coverGradient }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{currentTrack.title}</p>
                  <p className="text-xs text-gray-500 truncate">{currentTrack.artist}</p>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4 w-1/3">
                <button onClick={playPrev} className="text-black hover:text-gray-600 transition-colors">
                  <SkipPreviousIcon />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  {isPlaying ? <PauseIcon fontSize="medium" /> : <PlayArrowIcon fontSize="medium" />}
                </button>
                <button onClick={playNext} className="text-black hover:text-gray-600 transition-colors">
                  <SkipNextIcon />
                </button>
              </div>
              
              <div className="w-1/3 flex justify-end">
                <button
                  onClick={() => openShareModal(currentTrack)}
                  className="p-2 text-gray-600 hover:text-black transition-colors"
                >
                  <IosShareIcon fontSize="small" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-sm font-medium text-gray-500 py-3">
            Select a track to play
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareModalOpen && trackToShare && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10 shadow-2xl transform transition-transform animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Share Track</h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-1 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
            
            <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-xl">
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 shadow-sm mr-4"
                style={{ background: trackToShare.coverGradient }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{trackToShare.title}</p>
                <p className="text-xs text-gray-500 truncate">{trackToShare.artist}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center py-3.5 bg-gray-100 hover:bg-gray-200 text-black font-semibold rounded-xl text-sm transition-colors"
              >
                {copied ? <CheckIcon className="mr-2" fontSize="small" /> : <ContentCopyIcon className="mr-2" fontSize="small" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles for hiding scrollbar and animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />
    </div>
  );
}
