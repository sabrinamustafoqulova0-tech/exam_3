"use client";

import React, { useEffect, useRef, useState } from "react";

interface EmojiGameProps {
  emoji: string;
  onClose: () => void;
  myAvatarUrl?: string | null;
  otherAvatarUrl?: string | null;
}

export default function EmojiGame({ emoji, onClose, myAvatarUrl, otherAvatarUrl }: EmojiGameProps) {
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const paddleRef = useRef<HTMLDivElement>(null);

  const requestRef = useRef<number | undefined>(undefined);
  const gameState = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    rotationSpeed: 0,
    paddleX: 0,
    score: 0,
    speedMultiplier: 1,
    isGameOver: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem("emoji_game_best");
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    setScore(0);
    setGameOver(false);
    setIsNewRecord(false);
    
    gameState.current = {
      x: rect.width / 2,
      y: rect.height / 3,
      vx: (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 2), // Random initial X speed
      vy: 2, // Initial Y speed
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 10,
      paddleX: rect.width / 2,
      score: 0,
      speedMultiplier: 1,
      isGameOver: false,
    };

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    const state = gameState.current;
    if (state.isGameOver) return;
    
    if (!containerRef.current || !emojiRef.current || !paddleRef.current) {
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const PADDLE_WIDTH = 120;
    const PADDLE_HEIGHT = 20;
    const EMOJI_SIZE = 64; 
    const PADDLE_Y = rect.height - 100;

    // Apply gravity
    state.vy += 0.3 * state.speedMultiplier;

    // Move
    state.x += state.vx * state.speedMultiplier;
    state.y += state.vy * state.speedMultiplier;
    state.rotation += state.rotationSpeed;

    // Wall collisions
    if (state.x - EMOJI_SIZE / 2 < 0) {
      state.x = EMOJI_SIZE / 2;
      state.vx *= -1;
      state.rotationSpeed = -state.rotationSpeed * 0.8 + (Math.random() - 0.5) * 5;
    } else if (state.x + EMOJI_SIZE / 2 > rect.width) {
      state.x = rect.width - EMOJI_SIZE / 2;
      state.vx *= -1;
      state.rotationSpeed = -state.rotationSpeed * 0.8 + (Math.random() - 0.5) * 5;
    }

    if (state.y - EMOJI_SIZE / 2 < 0) {
      state.y = EMOJI_SIZE / 2;
      state.vy *= -1;
      state.rotationSpeed = state.vx * 1.5;
    }

    // Paddle collision
    const emojiRadius = EMOJI_SIZE / 2;
    const paddleLeft = state.paddleX - PADDLE_WIDTH / 2;
    const paddleRight = state.paddleX + PADDLE_WIDTH / 2;
    const paddleTop = PADDLE_Y;
    const paddleBottom = PADDLE_Y + PADDLE_HEIGHT;

    // Check if falling down and hitting paddle
    if (state.vy > 0 && 
        state.y + emojiRadius >= paddleTop && 
        state.y - emojiRadius <= paddleBottom &&
        state.x >= paddleLeft - emojiRadius && 
        state.x <= paddleRight + emojiRadius) {
      
      // Bounce
      state.vy = -16; 
      
      // Angle based on where it hit the paddle
      const hitOffset = (state.x - state.paddleX) / (PADDLE_WIDTH / 2);
      state.vx = hitOffset * 15; 
      state.rotationSpeed = state.vx * 2;
      
      state.score += 1;
      state.speedMultiplier += 0.05; 
      
      setScore(state.score);
    }

    // Game Over check
    if (state.y - emojiRadius > rect.height) {
      state.isGameOver = true;
      setGameOver(true);
      setBestScore(prev => {
        if (state.score > prev && state.score > 0) {
          setIsNewRecord(true);
        }
        const best = Math.max(prev, state.score);
        localStorage.setItem("emoji_game_best", best.toString());
        return best;
      });
      return;
    }

    // Update DOM elements directly
    emojiRef.current.style.transform = `translate(${state.x}px, ${state.y}px) translate(-50%, -50%) rotate(${state.rotation}deg)`;
    paddleRef.current.style.transform = `translate(${state.paddleX}px, ${PADDLE_Y}px) translate(-50%, 0)`;

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    startGame();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || gameState.current.isGameOver) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    const PADDLE_WIDTH = 120;
    
    // Clamp
    if (x < PADDLE_WIDTH / 2) x = PADDLE_WIDTH / 2;
    if (x > rect.width - PADDLE_WIDTH / 2) x = rect.width - PADDLE_WIDTH / 2;
    
    gameState.current.paddleX = x;
    if (paddleRef.current) {
        paddleRef.current.style.transform = `translate(${x}px, ${rect.height - 100}px) translate(-50%, 0)`;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#fffbe6",
        zIndex: 99999,
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <div style={{ position: "absolute", top: 40, left: 20, right: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button 
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, zIndex: 10 }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#8e8e8e", fontVariantNumeric: "tabular-nums" }}>
            {score.toString().padStart(3, '0')}
          </span>
          
          <div style={{ display: "flex", alignItems: "center" }}>
            {myAvatarUrl ? (
              <img src={myAvatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff", zIndex: 2, background: "#fff" }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#ccc", border: "2px solid #fff", zIndex: 2 }} />
            )}
            {otherAvatarUrl ? (
              <img src={otherAvatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff", marginLeft: -16, zIndex: 1, background: "#fff" }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#999", border: "2px solid #fff", marginLeft: -16, zIndex: 1 }} />
            )}
          </div>

          <span style={{ fontSize: 24, fontWeight: 700, color: "#8e8e8e", fontVariantNumeric: "tabular-nums" }}>
            {bestScore.toString().padStart(3, '0')}
          </span>
        </div>

        <div style={{ width: 44 }}></div>
      </div>

      {gameOver && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          zIndex: 10,
        }}>
          {isNewRecord && (
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ff3366", background: "#fff", padding: "8px 16px", borderRadius: 20, boxShadow: "0 4px 12px rgba(255,51,102,0.3)", transform: "rotate(-5deg)", marginBottom: -10 }}>
              Новый рекорд! 🏆
            </div>
          )}
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: "#000" }}>Game Over</h2>
          <button 
            onClick={startGame}
            style={{
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: 24,
              padding: "12px 32px",
              fontSize: 18,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Play Again
          </button>
        </div>
      )}

      <div 
        ref={paddleRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 120,
          height: 20,
          background: "#000",
          borderRadius: 10,
          willChange: "transform",
        }}
      />

      <div 
        ref={emojiRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: 64,
          lineHeight: 1,
          willChange: "transform",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {emoji}
      </div>
    </div>
  );
}
