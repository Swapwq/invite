"use client";

import React, { useState, useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  type: "heart" | "circle" | "sparkle";
  rotation: number;
  rotationSpeed: number;
}

interface InvitationModalProps {
  id?: string;
  targetName?: string;
  customTitle?: string;
  customDescription?: string;
  customActivities?: string[];
  allowDateSelection?: boolean;
  allowTimeSelection?: boolean;
}

export default function InvitationModal({
  id = "default",
  targetName = "Дарина",
  customTitle,
  customDescription,
  customActivities = ["Посидим во дворе", "Прогулка по соборной", "Прогулка по намыву", "Поедем на шаурму"],
  allowDateSelection = true,
  allowTimeSelection = true,
}: InvitationModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Decline button interaction state
  const [declinePosition, setDeclinePosition] = useState({ x: 0, y: 0 });
  const [declineAttempts, setDeclineAttempts] = useState(0);
  const [showDeclineHint, setShowDeclineHint] = useState("");
  
  // Date preferences state
  const [selectedActivity, setSelectedActivity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  
  // Audio state
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Canvas for celebration animations
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ref to prevent hover/touch trigger loop during transitions
  const lastEscapeTime = useRef(0);

  // Initialize selected activity
  useEffect(() => {
    if (customActivities && customActivities.length > 0) {
      setSelectedActivity(customActivities[0]);
    }
  }, [customActivities]);

  // Escaping Decline Button Logic
  const handleDeclineInteract = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    // Prevent hover trigger loop (cooldown of 500ms)
    const now = Date.now();
    if (now - lastEscapeTime.current < 500) {
      return;
    }
    lastEscapeTime.current = now;
    
    // Increment attempts and set funny hints
    const nextAttempts = declineAttempts + 1;
    setDeclineAttempts(nextAttempts);

    const hints = [
      "Ой, промахнулась? )",
      "Ты точно уверена? )",
      "Хм, кнопочка сломалась, кажется!",
      "Даже не думай! )",
      "Кнопка 'Принять' правее",
      "Ну всё, я обижусь...",
      "Силы притяжения тянут к согласию!",
      "Кнопка 'Отказаться' временно недоступна",
    ];
    
    setShowDeclineHint(hints[Math.min(nextAttempts - 1, hints.length - 1)]);

    // Generate random position within boundaries relative to its base position
    const range = 140 + Math.min(nextAttempts * 10, 80);
    const randomX = (Math.random() - 0.5) * range * 2;
    const randomY = (Math.random() - 0.5) * range * 2;

    setDeclinePosition({ x: randomX, y: randomY });
  };

  // Start background music (local file music.mp3 with version query to prevent cache)
  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/norm.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.25;
    }

    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        console.log("Audio play blocked by browser. Will try again upon click.");
      });
      setMusicPlaying(true);
    }
  };

  const handleAccept = () => {
    setAccepted(true);
    // Play audio automatically if not playing
    if (!musicPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setMusicPlaying(true);
    } else if (!audioRef.current) {
      audioRef.current = new Audio("/music.mp3?v=2");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.2;
      audioRef.current.play().catch(() => {});
      setMusicPlaying(true);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await fetch(`/api/invitations/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activity: selectedActivity,
            date,
            time,
            message,
          }),
        });
      } catch (err) {
        console.error("Error submitting acceptance form:", err);
      }
    
    setSubmitted(true);
  };

  // Helper to dynamically get the best matching icon for custom activities
  const getIconForActivity = (label: string) => {
    const lowercase = label.toLowerCase();
    if (lowercase.includes("кофе") || lowercase.includes("чай") || lowercase.includes("кафе") || lowercase.includes("десерт") || lowercase.includes("сладкое")) {
      return (
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 8H21a2 2 0 012 2v3a2 2 0 01-2 2h-2.5M3 8h15.5a.5.5 0 01.5.5v10a3 3 0 01-3 3H6a3 3 0 01-3-3V8.5a.5.5 0 01.5-.5zM6 3v2M10 3v2M14 3v2" />
        </svg>
      );
    }
    if (lowercase.includes("ужин") || lowercase.includes("ресторан") || lowercase.includes("еда") || lowercase.includes("вино") || lowercase.includes("кушать") || lowercase.includes("пицца") || lowercase.includes("суши")) {
      return (
        <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.21 0 4-1.79 4-4V3H8v5c0 2.21 1.79 4 4 4zM12 12v9M8 21h8M5 3v5c0 1.5 1 2.5 2 3M19 3v5c0 1.5-1 2.5-2 3" />
        </svg>
      );
    }
    if (lowercase.includes("прогулка") || lowercase.includes("гулять") || lowercase.includes("луна") || lowercase.includes("парк") || lowercase.includes("звезд") || lowercase.includes("пешком")) {
      return (
        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    }
    if (lowercase.includes("сюрприз") || lowercase.includes("подарок") || lowercase.includes("вечер") || lowercase.includes("кино") || lowercase.includes("квест") || lowercase.includes("игра")) {
      return (
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm-9 4h18M4 10h16v11H4V10z" />
        </svg>
      );
    }
    // Default fallback: heart icon
    return (
      <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  };

  // Particle explosion logic using HTML5 Canvas (confetti cannons on left & right sides)
  useEffect(() => {
    if (!accepted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // Set canvas sizes
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const colors = [
      "#ff4b72", // Deep Pink
      "#ff8a9e", // Soft Pink
      "#ffb3c1", // Pastel Pink
      "#ffd3e8", // Pale Pink
      "#ffffff", // White
      "#fbcfe8", // Pink 200
      "#fda4af", // Rose 300
    ];

    // Helper to draw a heart shape
    const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y + size / 4);
      ctx.quadraticCurveTo(x, y, x + size / 2, y);
      ctx.quadraticCurveTo(x + size, y, x + size, y + size / 3);
      ctx.quadraticCurveTo(x + size, y + (size * 2) / 3, x + size / 2, y + size);
      ctx.quadraticCurveTo(x, y + (size * 2) / 3, x, y + size / 3);
      ctx.quadraticCurveTo(x, y, x, y + size / 4);
      ctx.closePath();
      ctx.fill();
    };

    // Spawn particle at left or right side with diagonal velocity
    const spawnParticle = (initial = false): Particle => {
      const typeRand = Math.random();
      const type = typeRand < 0.4 ? "heart" : typeRand < 0.8 ? "circle" : "sparkle";
      
      const side = Math.random() < 0.5 ? "left" : "right";
      
      let x = 0;
      let y = canvas.height * 0.85; // spawn slightly above bottom edge
      let speedX = 0;
      let speedY = 0;
      
      if (side === "left") {
        x = -20;
        speedX = Math.random() * 9 + 4; // shoot rightwards
        speedY = -(Math.random() * 11 + 7); // shoot upwards
      } else {
        x = canvas.width + 20;
        speedX = -(Math.random() * 9 + 4); // shoot leftwards
        speedY = -(Math.random() * 11 + 7); // shoot upwards
      }
      
      return {
        x: initial ? Math.random() * canvas.width : x,
        y: initial ? Math.random() * canvas.height * 0.7 : y,
        size: Math.random() * 14 + 7,
        speedX: initial ? (Math.random() - 0.5) * 4 : speedX,
        speedY: initial ? -(Math.random() * 5 + 2) : speedY,
        opacity: Math.random() * 0.7 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
      };
    };

    // Initial particles
    for (let i = 0; i < 70; i++) {
      particles.push(spawnParticle(true));
    }

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles from the sides occasionally
      if (particles.length < 130 && Math.random() < 0.5) {
        particles.push(spawnParticle());
      }

      particles.forEach((p, index) => {
        // Physics: apply gravity and slight air resistance
        p.speedY += 0.12; // gravity pulls down
        p.speedX *= 0.992; // air resistance slows down horizontally
        
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.0025; // fade out

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.type === "heart") {
          drawHeart(ctx, -p.size / 2, -p.size / 2, p.size);
        } else if (p.type === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sparkle star
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            ctx.lineTo(0, -p.size / 2);
            ctx.lineTo(p.size / 6, -p.size / 6);
            ctx.rotate(Math.PI / 2);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Respawn if out of bounds or faded
        if (p.y > canvas.height + 30 || p.opacity <= 0 || p.x < -30 || p.x > canvas.width + 30) {
          particles[index] = spawnParticle();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [accepted]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-tr from-rose-50 via-white to-pink-100 dark:from-[#1c0d12] dark:via-[#0c0608] dark:to-[#1a0a10] px-4 py-8">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Soft pink bubble top left */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-pink-300/40 to-rose-400/10 blur-[100px] animate-float-1 dark:from-pink-900/30 dark:to-rose-800/5"></div>
        {/* Soft peach bubble bottom right */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-rose-200/40 to-amber-200/20 blur-[120px] animate-float-2 dark:from-rose-950/20 dark:to-amber-950/5"></div>
        {/* White glowing bubble center */}
        <div className="absolute top-[30%] left-[25%] w-[45vw] h-[45vw] rounded-full bg-white/30 blur-[80px] animate-float-3 dark:bg-pink-950/10"></div>
        {/* Sparkle background details */}
        <div className="absolute top-[15%] right-[20%] text-rose-300/40 dark:text-rose-500/20 text-4xl animate-pulse-glow">✦</div>
        <div className="absolute bottom-[20%] left-[15%] text-pink-300/50 dark:text-pink-500/20 text-3xl animate-pulse-glow" style={{ animationDelay: "2s" }}>✦</div>
      </div>

      {/* Background celebration canvas when accepted */}
      {accepted && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      )}

      {/* Glassmorphic Container Card (Removed overflow-hidden to let runaway button slide outside card bounds) */}
      <div className="w-full max-w-lg z-20 glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl transition-all duration-700 transform scale-100 hover:shadow-pink-200/30 dark:hover:shadow-pink-950/10 relative">
        
        {/* Cute Sound Toggle Button (using clean SVGs instead of emojis) */}
        <button
          onClick={toggleMusic}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-white/40 dark:bg-white/5 border border-white/20 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
          title={musicPlaying ? "Выключить музыку" : "Включить музыку"}
        >
          {musicPlaying ? (
            <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>

        {/* Phase 1: The Invitation Modal */}
        {!accepted ? (
          <div className="flex flex-col items-center text-center">
            {/* Pulsing Beating Heart Visual */}
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-rose-400/20 rounded-full blur-xl scale-125 animate-pulse-glow"></div>
              <svg
                className="w-16 h-16 text-rose-500 fill-current animate-heartbeat drop-shadow-md cursor-pointer"
                viewBox="0 0 24 24"
                onClick={handleAccept}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            {/* Letter Subtitle */}
            <span className="text-xs tracking-[0.2em] uppercase font-semibold text-rose-500/80 dark:text-rose-400 mb-2 font-montserrat">
              Личное послание
            </span>

            {/* Title Section */}
          {customTitle ? (
            <h1 className="text-3xl sm:text-4xl font-serif text-zinc-900 dark:text-pink-50 leading-tight mb-4 tracking-tight">
              {customTitle}
            </h1>
          ) : (
            <h1 className="text-3xl sm:text-4xl font-serif text-zinc-900 dark:text-pink-50 leading-tight mb-4 tracking-tight">
              {targetName}, я приглашаю тебя на прогулку
            </h1>
          )}
          {customDescription && (
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 font-montserrat font-light leading-relaxed max-w-xs mb-8">
              {customDescription}
            </p>
          )}

            {/* Hint message above decline button (Removed overflow-hidden to prevent cutting slanted letters during bounce) */}
            <div className="h-7 mb-2 transition-all duration-300">
              {showDeclineHint && (
                <span className="text-xs text-rose-500/90 dark:text-rose-400 font-handwritten text-lg tracking-wide animate-bounce inline-block px-2">
                  {showDeclineHint}
                </span>
              )}
            </div>

            {/* Two Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-4 justify-center items-center mt-2 relative min-h-[140px] sm:min-h-0 sm:h-20">
              
              {/* Accept Button */}
              <button
                onClick={handleAccept}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/20 active:scale-95 transition-all duration-300 text-base z-30 cursor-pointer font-montserrat flex items-center justify-center gap-1.5"
              >
                <span>Принять</span>
                <svg className="w-4 h-4 fill-current inline-block" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Decline Button (Escaping smoothly without layout shifts) */}
              <button
                onMouseEnter={handleDeclineInteract}
                onTouchStart={handleDeclineInteract}
                onClick={handleDeclineInteract}
                style={{
                  transform: `translate(${declinePosition.x}px, ${declinePosition.y}px)`,
                  transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
                }}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition-all duration-300 text-base z-20 relative ${
                  declineAttempts >= 6 ? "scale-90 opacity-80" : ""
                }`}
              >
                Отказаться
              </button>

            </div>
          </div>
        ) : (
          /* Phase 2: Acceptance / Preference Form */
          <div className="flex flex-col text-center">
            {!submitted ? (
              <form onSubmit={handleFormSubmit} className="flex flex-col items-center">
                {/* Visual success top (Checkmark badge instead of emojis) */}
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-serif text-zinc-900 dark:text-pink-50 mb-2 leading-snug">
                  Ура! Прогулке быть!
                </h2>
                
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-montserrat mb-6">
                  Давай запланируем нашу прогулку. Выбери свои предпочтения:
                </p>

                <div className="w-full flex flex-col gap-5 text-left mb-6">
                  {/* Activity Radio Groups */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-rose-500/80 dark:text-rose-400 block mb-2 font-montserrat">
                      Чем займемся?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {customActivities.map((activityName) => (
                        <div
                          key={activityName}
                          onClick={() => setSelectedActivity(activityName)}
                          className={`cursor-pointer rounded-xl p-3.5 border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                            selectedActivity === activityName
                              ? "border-rose-400 bg-rose-100/30 dark:border-rose-500 dark:bg-rose-950/20 font-medium scale-98 shadow-sm"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-800 bg-white/30 dark:bg-zinc-950/10"
                          }`}
                        >
                          {getIconForActivity(activityName)}
                          <span className="text-xs sm:text-sm font-medium text-center">{activityName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date & Time Picker */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="date-input" className="text-xs font-semibold uppercase tracking-wider text-rose-500/80 dark:text-rose-400 block mb-1.5 font-montserrat">
                        Какая дата?
                      </label>
                      <input
                          id="date-input"
                          type="date"
                          value="2026-06-22" // Фиксированная дата, которую ты просил
                          readOnly // Запрещает изменение, но сохраняет фокус/стили активного элемента
                          className="w-full rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm focus:outline-none cursor-not-allowed pointer-events-none"
                        />
                    </div>
                    <div>
                      <label htmlFor="time-input" className="text-xs font-semibold uppercase tracking-wider text-rose-500/80 dark:text-rose-400 block mb-1.5 font-montserrat">
                        Какое время?
                      </label>
                      <input
                        id="time-input"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        disabled={!allowTimeSelection}
                        className="w-full rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/30 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>

                  {/* Comment preferences */}
                  <div>
                    <label htmlFor="comment-input" className="text-xs font-semibold uppercase tracking-wider text-rose-500/80 dark:text-rose-400 block mb-1.5 font-montserrat">
                      Твои пожелания 
                    </label>
                    <textarea
                      id="comment-input"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Например: хочу выпить кофе..."
                      rows={2}
                      className="w-full rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/30 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-rose-400 resize-none"
                    />
                  </div>
                </div>

                {/* Submit button (with calendar SVG icon instead of emoji) */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/20 active:scale-95 transition-all duration-300 text-base flex items-center justify-center gap-2"
                >
                  <span>Готово, жду!</span>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </form>
            ) : (
              /* Phase 3: Final confirmation page */
              <div className="flex flex-col items-center py-6">
                {/* Flying hearts SVG */}
                <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center mb-6 animate-bounce">
                  <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif text-zinc-900 dark:text-pink-50 mb-3 leading-snug">
                  План сохранен!
                </h2>

                <div className="glass-card rounded-2xl p-5 text-left w-full mb-6 text-zinc-700 dark:text-zinc-300 text-sm font-montserrat flex flex-col gap-2">
                  <div className="flex justify-between border-b border-rose-100 dark:border-rose-950/30 pb-2">
                    <span className="font-semibold text-rose-500/80 dark:text-rose-400">Формат:</span>
                    <span className="font-medium">{selectedActivity}</span>
                  </div>
                  <div className="flex justify-between border-b border-rose-100 dark:border-rose-950/30 pb-2">
                    <span className="font-semibold text-rose-500/80 dark:text-rose-400">Дата:</span>
                    <span>{new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</span>
                  </div>
                  <div className="flex justify-between border-b border-rose-100 dark:border-rose-950/30 pb-2">
                    <span className="font-semibold text-rose-500/80 dark:text-rose-400">Время:</span>
                    <span>{time}</span>
                  </div>
                  {message.trim() && (
                    <div className="pt-1 flex flex-col gap-1">
                      <span className="font-semibold text-rose-500/80 dark:text-rose-400">Твои пожелания:</span>
                      <span className="italic text-zinc-500 dark:text-zinc-400 block whitespace-pre-wrap">
                        &ldquo;{message}&rdquo;
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mb-4 font-light">
                  Вот такой формат мне нравится и нету никаких "посмотрим" или "напишу если что".
                </p>

                <div className="text-xs text-rose-400/80 font-handwritten text-xl tracking-wide mt-2">
                  Жду с нетерпением!
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
