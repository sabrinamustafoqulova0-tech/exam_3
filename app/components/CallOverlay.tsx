"use client";

import React, { useEffect, useRef, useState } from "react";

interface CallOverlayProps {
  isVideoCall: boolean;
  myAvatarUrl?: string | null;
  myName: string;
  otherAvatarUrl?: string | null;
  otherName: string;
  onEndCall: (durationSecs: number) => void;
}

// Instagram-style melodic ringtone using Web Audio API
function playRingtone(audioCtxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Notes for Instagram-like ascending arpeggio: C5 E5 G5 C6
    const notes = [523.25, 659.25, 783.99, 1046.5];

    const playChime = (startTime: number) => {
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = startTime + i * 0.12;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    };

    // Play the chime 3 times with ~1.5s gap
    const now = ctx.currentTime;
    playChime(now);
    playChime(now + 1.6);
    playChime(now + 3.2);
  } catch (e) {
    // Web Audio not available
  }
}

export default function CallOverlay({ isVideoCall, myAvatarUrl, myName, otherAvatarUrl, otherName, onEndCall }: CallOverlayProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isRinging, setIsRinging] = useState(true); // first 5 seconds = ringing
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef(Date.now());

  // Start ringtone for first 5 seconds
  useEffect(() => {
    playRingtone(audioCtxRef);
    const ringTimer = setTimeout(() => {
      setIsRinging(false);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    }, 5000);
    return () => clearTimeout(ringTimer);
  }, []);

  // Start counting after ringing stops
  useEffect(() => {
    if (isRinging) return;
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRinging]);

  useEffect(() => {
    const startMedia = async () => {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({
          video: isVideoCall ? { width: 1280, height: 720, facingMode: "user" } : false,
          audio: true,
        });
        streamRef.current = ms;
        setStream(ms);
      } catch (err) {
        console.error("Failed to get media devices", err);
        setHasError(true);
      }
    };
    startMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [isVideoCall]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream && isVideoCall) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, isVideoCall]);

  const handleEndCall = () => {
    const elapsedSecs = Math.floor((Date.now() - startTimeRef.current) / 1000);
    onEndCall(elapsedSecs);
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream && isVideoCall) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "#000",
      zIndex: 100000,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      
      {/* Top Left: my info */}
      <div style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 12, zIndex: 10 }}>
        {myAvatarUrl ? (
          <img src={myAvatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#efefef", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
              <rect width="24" height="24" fill="#efefef"/>
              <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="#dbdbdb"/>
              <path d="M12 13C8.68629 13 6 15.6863 6 19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19C18 15.6863 15.3137 13 12 13Z" fill="#dbdbdb"/>
            </svg>
          </div>
        )}
        <span style={{ fontSize: 16, fontWeight: 600 }}>{myName}</span>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          backgroundColor: "#333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          marginBottom: 20
        }}>
          {otherAvatarUrl ? (
            <img src={otherAvatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
              <rect width="24" height="24" fill="#efefef"/>
              <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="#dbdbdb"/>
              <path d="M12 13C8.68629 13 6 15.6863 6 19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19C18 15.6863 15.3137 13 12 13Z" fill="#dbdbdb"/>
            </svg>
          )}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 8px 0" }}>{otherName}</h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0 }}>
          {hasError
            ? "Ошибка доступа к камере/микрофону"
            : isRinging
              ? "Звонок..."
              : formatDuration(duration)}
        </p>

        {/* Local Video PiP — bigger */}
        {isVideoCall && !hasError && (
          <div style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            width: 260,
            height: 340,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: "#222",
            opacity: isVideoOff ? 0 : 1,
            transition: "opacity 0.3s",
            pointerEvents: isVideoOff ? "none" : "auto",
            zIndex: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)"
          }}>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted 
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }} 
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40, zIndex: 10 }}>
        
        {/* Screen Share (Dummy) */}
        <button 
          style={{
            width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
            backgroundColor: "#262626", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </button>

        {/* Video Toggle */}
        <button 
          onClick={toggleVideo}
          style={{
            width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
            backgroundColor: isVideoOff ? "#fff" : "#262626",
            color: isVideoOff ? "#000" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s"
          }}
        >
          {isVideoOff ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          )}
        </button>

        {/* Mic Toggle */}
        <button 
          onClick={toggleMute}
          style={{
            width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
            backgroundColor: isMuted ? "#fff" : "#262626",
            color: isMuted ? "#000" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s"
          }}
        >
          {isMuted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          )}
        </button>

        {/* End Call */}
        <button 
          onClick={handleEndCall}
          style={{
            width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
            backgroundColor: "#ff3040", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s"
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(135deg)" }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </button>
      </div>

    </div>
  );
}
