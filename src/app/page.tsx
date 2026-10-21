"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { geoDistance, geoInterpolate, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryObject, Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-110m.json";
import { giftConfig } from "@/config/gift";
import { getTypewriterDuration, Typewriter } from "@/components/Typewriter";
import roseIcon from "@/images/Rose.svg";
import confettiDay from "@/images/Confetti Day.svg";

const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "delete"] as const;
const highlightedCountries = new Set(["504", "788"]);
const focusCountries = new Set(["12", "434", "478", "504", "732", "788"]);
const atlasTopology = worldAtlas as unknown as Topology;
const atlasCountries = feature(
  atlasTopology,
  atlasTopology.objects.countries as GeometryObject,
) as FeatureCollection<Geometry>;
const northAfricaCollection: FeatureCollection<Geometry> = {
  type: "FeatureCollection",
  features: atlasCountries.features.filter((country) => focusCountries.has(String(country.id))),
};
const mapProjection = geoMercator().fitExtent([[25, 22], [335, 226]], northAfricaCollection);
const mapPath = geoPath(mapProjection);

const monastirCoordinates: [number, number] = [10.83, 35.77];
const casablancaCoordinates: [number, number] = [-7.5898, 33.5731];
const monastirPoint = mapProjection(monastirCoordinates) as [number, number];
const casablancaPoint = mapProjection(casablancaCoordinates) as [number, number];
const routeCoordinates = Array.from({ length: 40 }, (_, index) =>
  geoInterpolate(monastirCoordinates, casablancaCoordinates)(index / 39),
);
const journeyPath = mapPath({ type: "LineString", coordinates: routeCoordinates }) ?? "";
const estimatedDistanceKm = Math.round(geoDistance(monastirCoordinates, casablancaCoordinates) * 6371);
const birthdayFireworkBursts = [
  { left: "12%", top: "21%", delay: 0, color: "#f2a2b5" },
  { left: "87%", top: "18%", delay: 1.15, color: "#f4b56b" },
  { left: "20%", top: "59%", delay: 2.3, color: "#d985a1" },
  { left: "81%", top: "54%", delay: 3.45, color: "#b979a9" },
  { left: "49%", top: "14%", delay: 4.6, color: "#f7c46d" },
  { left: "50%", top: "69%", delay: 5.75, color: "#e7839b" },
  { left: "9%", top: "43%", delay: 6.7, color: "#d8a0c8" },
] as const;
const birthdayFireworkParticles = Array.from({ length: 34 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 34 + (index % 2 ? 0.04 : 0);
  const distance = 66 + (index % 6) * 12;
  return {
    x: `${Math.cos(angle) * distance}px`,
    y: `${Math.sin(angle) * distance + 18}px`,
    size: `${index % 4 === 0 ? 5 : index % 3 === 0 ? 4 : 3}px`,
    delay: `${(index % 5) * 0.025}s`,
    duration: `${1.28 + (index % 4) * 0.1}s`,
  };
});
const LETTER_BLOCK_PAUSE = 320;

type Screen = "journey" | "code" | "unlocked" | "birthday" | "letter" | "final";

function FloatingMagic() {
  return <div className="floating-magic" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i></div>;
}

function RoseIcon({ className }: { className?: string }) {
  return <Image src={roseIcon} alt="" aria-hidden="true" className={className} />;
}

function BirthdayFireworks() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return null;

  return (
    <div className="birthday-fireworks" aria-hidden="true">
      {birthdayFireworkBursts.map((burst) => (
        <span
          className="birthday-firework"
          key={`${burst.left}-${burst.top}`}
          style={{
            left: burst.left,
            top: burst.top,
            "--firework-delay": `${burst.delay}s`,
            "--firework-color": burst.color,
          } as React.CSSProperties}
        >
          {birthdayFireworkParticles.map((particle, index) => (
            <i
              key={index}
              style={{
                "--spark-x": particle.x,
                "--spark-y": particle.y,
                "--spark-size": particle.size,
                "--spark-delay": particle.delay,
                "--spark-duration": particle.duration,
              } as React.CSSProperties}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function getLetterSequenceDuration(message: string, startDelay = 0) {
  return message.split("\n\n").reduce((nextDelay, paragraph) => {
    const visibleText = paragraph.trim().replace(/\*\*/g, "").replace(/\*/g, "");
    return nextDelay + getTypewriterDuration(visibleText) + LETTER_BLOCK_PAUSE;
  }, startDelay);
}

function LetterParagraphs({ message, delay = 0 }: { message: string; delay?: number }) {
  const paragraphs = message.split("\n\n");
  let nextDelay = delay;

  return (
    <div className="letter-message">
      {paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim();
        const visibleText = trimmed.replace(/\*\*/g, "").replace(/\*/g, "");
        const revealDelay = nextDelay;
        nextDelay += getTypewriterDuration(visibleText) + LETTER_BLOCK_PAUSE;

        // Salutation opening (e.g. **À toi, Ghzela,**)
        if (trimmed.startsWith("**À toi,") && trimmed.endsWith("**")) {
          const name = trimmed.slice(2, -2);
          return (
            <motion.div
              key={`salutation-${index}`}
              className="letter-salutation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: revealDelay / 1000 }}
            >
              <Typewriter as="span" className="salutation-text" delay={revealDelay}>{name}</Typewriter>
              <span className="salutation-flourish" aria-hidden="true">🌸</span>
            </motion.div>
          );
        }

        // Highlighted callout quote (full line emphasis like **Nti katstahli...** or **Joyeux anniversaire...**)
        const isFullCallout =
          trimmed.startsWith("**") &&
          trimmed.includes("**") &&
          (trimmed.endsWith("**") ||
            trimmed.endsWith("🤍") ||
            trimmed.endsWith("🌹") ||
            trimmed.endsWith("💜") ||
            trimmed.endsWith("🎂🌹"));

        if (isFullCallout) {
          return (
            <motion.aside
              key={`callout-${index}`}
              className="letter-quote-callout"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, delay: revealDelay / 1000 }}
            >
              <span className="callout-spark" aria-hidden="true">✦</span>
              <div className="callout-body">
                <Typewriter as="span" delay={revealDelay}>{formatInline(trimmed)}</Typewriter>
              </div>
            </motion.aside>
          );
        }

        return (
          <motion.p
            key={`para-${index}`}
            className="letter-body-p"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: revealDelay / 1000 }}
          >
            <Typewriter as="span" delay={revealDelay}>{formatInline(trimmed)}</Typewriter>
          </motion.p>
        );
      })}
    </div>
  );
}

function JourneyMap({ onOpenCode }: { onOpenCode: () => void }) {
  const reducedMotion = useReducedMotion();
  const [remainingDistance, setRemainingDistance] = useState(estimatedDistanceKm);

  useEffect(() => {
    if (reducedMotion) {
      setRemainingDistance(0);
      return;
    }

    setRemainingDistance(estimatedDistanceKm);
    let lastStep = -1;
    const startedAt = performance.now();
    const flightDelay = 800;
    const flightDuration = 5400;
    let frame = 0;
    const update = (now: number) => {
      const elapsed = now - startedAt;
      if (elapsed < flightDelay) {
        frame = requestAnimationFrame(update);
        return;
      }
      const progress = Math.min((elapsed - flightDelay) / flightDuration, 1);
      // Smooth deceleration curve harmonized with the flight path easing
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      const nextDistance = Math.max(0, Math.round(estimatedDistanceKm * (1 - easedProgress)));
      // Text updates are quantised to maintain optimal render performance
      const nextStep = Math.floor(progress * 36);
      if (nextStep !== lastStep || progress === 1) {
        lastStep = nextStep;
        setRemainingDistance(nextDistance);
      }
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  // Synchronized cinematic flight: smooth takeoff, steady cruise, gentle landing
  const flightEase = [0.32, 0.08, 0.24, 1] as const;
  const pathTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 5.4, delay: 0.8, ease: flightEase };
  const flightTransition = reducedMotion
    ? { duration: 0 }
    : {
        offsetDistance: { duration: 5.4, delay: 0.8, ease: flightEase },
        opacity: { duration: 0.5, delay: 0.8, ease: "easeOut" as const },
      };

  return (
    <section className="journey-section" aria-labelledby="journey-title">
      <div className="topline"><span>Un cadeau d&apos;anniversaire</span><span>TN → MA</span></div>
      <div className="map-frame">
        <svg className="journey-map" viewBox="0 0 360 250" role="img" aria-label="Carte symbolique d’un trajet de Monastir vers Casablanca">
          <defs>
            <linearGradient id="journeyGlow" x1="0" x2="1"><stop stopColor="#f3bd77" /><stop offset=".52" stopColor="#de8393" /><stop offset="1" stopColor="#b95c73" /></linearGradient>
            <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {northAfricaCollection.features.map((country: Feature<Geometry>) => (
            <path key={country.id} className={`country ${highlightedCountries.has(String(country.id)) ? `country-${country.id}` : "continent"}`} d={mapPath(country) ?? undefined} />
          ))}
          <path className="flight-shadow" d={journeyPath} />
          <motion.path className="flight-path" d={journeyPath} initial={{ pathLength: reducedMotion ? 1 : 0, opacity: 1 }} animate={{ pathLength: 1 }} transition={pathTransition} />
          
          {!reducedMotion && (
            <>
              {/* Airplane in smooth motion along the path */}
              <motion.g
                className="plane-route"
                initial={{ offsetDistance: "0%", opacity: 0 }}
                animate={{ offsetDistance: "100%", opacity: 1 }}
                transition={flightTransition}
                style={{
                  offsetPath: `path('${journeyPath}')`,
                  offsetRotate: "auto 180deg",
                }}
              >
                {/* Projected altitude shadow beneath the plane */}
                <ellipse cx="-2.5" cy="14" rx="18" ry="4.2" className="plane-shadow" />
                {/* Soft ambient flight illumination */}
                <circle cx="0" cy="0" r="18" className="plane-ambient-glow" />
                {/* Clean, transparent, perfectly oriented aircraft sprite (+30% larger, crisp & balanced) */}
                <image
                  href="/plane_west.png"
                  x="-22"
                  y="-7.6"
                  width="44"
                  height="15.3"
                  preserveAspectRatio="xMidYMid meet"
                />
                {/* Twin jet engine warm exhaust glows */}
                <ellipse cx="7.5" cy="5.2" rx="2.5" ry="1.4" className="plane-engine-glow" />
                <ellipse cx="14" cy="5.2" rx="2.5" ry="1.4" className="plane-engine-glow" />
                {/* Subtle flashing tail beacon */}
                <circle cx="19.5" cy="-6.5" r="1.3" className="plane-beacon" />
              </motion.g>
              {/* Sparkle and star trail trailing from the engines */}
              <motion.g
                className="plane-trail"
                initial={{ offsetDistance: "0%", opacity: 0 }}
                animate={{ offsetDistance: "96%", opacity: [0, 0.95, 0.95, 0] }}
                transition={{
                  offsetDistance: { duration: 5.2, delay: 0.95, ease: flightEase },
                  opacity: { duration: 5.2, delay: 0.95, times: [0, 0.15, 0.85, 1] },
                }}
                style={{
                  offsetPath: `path('${journeyPath}')`,
                  offsetRotate: "auto 180deg",
                }}
              >
                <text x="28" y="3.5">✦ · ✧ · ✦</text>
              </motion.g>
            </>
          )}

          <circle className="place-dot" cx={casablancaPoint[0]} cy={casablancaPoint[1]} r="4" />
          <circle className="place-dot" cx={monastirPoint[0]} cy={monastirPoint[1]} r="4" />
          <text className="map-label" x={casablancaPoint[0]} y={casablancaPoint[1] + 16} textAnchor="middle">CASABLANCA</text>
          <text className="map-label" x={monastirPoint[0] - 28} y={monastirPoint[1] - 13}>MONASTIR</text>
        </svg>
        <p className="distance-counter"><span>Distance estimée restante</span><strong>{remainingDistance.toLocaleString("fr-FR")} km</strong></p>
      </div>
      <div className="journey-copy">
        <Typewriter as="p" className="eyebrow">Route 01 · Un cadeau pour toi</Typewriter>
<Typewriter as="h1" id="journey-title">De Monastir <span>à Casablanca</span></Typewriter>        <Typewriter as="p" className="arabic" dir="rtl">من تونس إلى المغرب</Typewriter>
        <Typewriter as="p" className="subtitle">Un petit cadeau t&apos;attend.</Typewriter>
        <button className="primary-button journey-button" type="button" onClick={onOpenCode}>Ouvrir la surprise <span aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}

const funnyWrongJokes = [
  {
    emoji: "🤨",
    title: "Biiip ! Faux code !",
    sub: "Tu as tapé au pif avoue ? Même un chat qui marche sur l'écran ferait mieux 😂",
  },
  {
    emoji: "🤦‍♀️",
    title: "Attends... sérieusement ?",
    sub: "Ne me dis pas que tu as oublié ta propre date d'anniversaire ?! 😭",
  },
  {
    emoji: "💳",
    title: "C'est pas ta carte bancaire !",
    sub: "Arrête d'essayer ton code de carte bleue, tu vas bloquer la surprise ! 🤣",
  },
  {
    emoji: "🕵️‍♀️",
    title: "Enquête en cours...",
    sub: "Indice secret : c'est le plus beau jour du mois d'octobre 🎂✨",
  },
  {
    emoji: "🇹🇳",
    title: "Allô le Maroc ? Ici Tunis !",
    sub: "Jour (2 chiffres) + Mois (2 chiffres)... Fati voyons, 26 / 10 ! 😂",
  },
  {
    emoji: "🍰",
    title: "Alerte détresse !",
    sub: "Tape 2610 avant que les bougies ne fondent sur le gâteau ! 🕯️🎉",
  },
];

type FinalMemoryPhotoProps = {
  className: string;
  src: string;
  height: number;
  caption: string;
  rotate: number;
  fromX: number;
  fromY: number;
  delay: number;
};

function FinalMemoryPhoto({
  className,
  src,
  height,
  caption,
  rotate,
  fromX,
  fromY,
  delay,
}: FinalMemoryPhotoProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.figure
      className={`memory-photo ${className}`}
      initial={reducedMotion ? false : { opacity: 0, x: fromX, y: fromY, rotate: rotate * 1.9, scale: 0.84 }}
      animate={{ opacity: 1, x: 0, y: 0, rotate, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.82, delay: reducedMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`memory-photo-drift ${className}-drift`}>
        <Image src={src} width={1080} height={height} sizes="150px" alt="" />
        <span>{caption}</span>
      </div>
    </motion.figure>
  );
}

const VOICE_WAVE_BARS = [
  6, 11, 17, 24, 13, 19, 27, 21, 14, 25, 29, 20, 12, 16, 23, 28, 24, 18, 14, 22,
  27, 19, 11, 15, 23, 20, 13, 18, 12, 7,
];

function formatVoiceTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function InstagramVoiceNote({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <motion.div
      className="ig-voice-card"
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.52, delay: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }}
      />

      <div className="ig-voice-header">
        <span className="ig-voice-badge">
          <i className="ig-mic-icon" aria-hidden="true">🎙️</i>
          <span>Message vocal</span>
        </span>
        <span className="ig-voice-track">Happy Birthday 🎂</span>
      </div>

      <div className="ig-voice-bubble">
        {/* Play/Pause Button */}
        <button
          type="button"
          className={`ig-voice-play-btn ${isPlaying ? "is-playing" : ""}`}
          onClick={togglePlay}
          aria-label={isPlaying ? "Mettre en pause le vocal" : "Lancer le vocal d'anniversaire"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="2" />
              <rect x="14" y="5" width="4" height="14" rx="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true" style={{ marginLeft: "2px" }}>
              <path d="M7 4.5v15a1 1 0 0 0 1.54.84l12-7.5a1 1 0 0 0 0-1.68l-12-7.5A1 1 0 0 0 7 4.5z" />
            </svg>
          )}
        </button>

        {/* Audio Waveform */}
        <div
          className="ig-voice-waveform"
          onClick={handleSeek}
          role="slider"
          aria-label="Position audio"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (!audioRef.current || !duration) return;
            if (e.key === "ArrowRight") {
              audioRef.current.currentTime = Math.min(duration, currentTime + 3);
            } else if (e.key === "ArrowLeft") {
              audioRef.current.currentTime = Math.max(0, currentTime - 3);
            } else if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              togglePlay();
            }
          }}
        >
          {VOICE_WAVE_BARS.map((height, index) => {
            const barFraction = index / (VOICE_WAVE_BARS.length - 1);
            const isPlayed = barFraction <= progress;
            return (
              <span
                key={index}
                className={`ig-wave-bar ${isPlayed ? "is-played" : ""} ${isPlaying && isPlayed ? "is-dancing" : ""}`}
                style={{
                  height: `${height}px`,
                  animationDelay: `${(index % 6) * 0.08}s`,
                }}
              />
            );
          })}
        </div>

        {/* Duration / Timer */}
        <div className="ig-voice-timer">
          <span>{formatVoiceTime(isPlaying || currentTime > 0 ? currentTime : duration)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("journey");
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const [activeHint, setActiveHint] = useState<(typeof funnyWrongJokes)[number] | null>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pressedKey, setPressedKey] = useState<string | number | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [wishCardOpen, setWishCardOpen] = useState(false);
  const [showKindnessJoke, setShowKindnessJoke] = useState(true);
  const [letterOpened, setLetterOpened] = useState(false);
  const [letterPage, setLetterPage] = useState<1 | 2>(1);
  const letterScrollRef = useRef<HTMLDivElement>(null);
  const letterActionsRef = useRef<HTMLDivElement>(null);
  const [wishEnvelopeOpened, setWishEnvelopeOpened] = useState(false);
  const closeWishRef = useRef<HTMLButtonElement>(null);
  const validationInProgress = useRef(false);
  const reducedMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const q = new URLSearchParams(window.location.search).get("screen");
    if (q && ["journey", "code", "unlocked", "birthday", "letter", "final"].includes(q)) {
      setScreen(q as Screen);
    }
  }, []);

  const enterKey = useCallback((key: (typeof keys)[number]) => {
    if (screen !== "code" || unlocking || key === "") return;
    setPressedKey(key);
    window.setTimeout(() => setPressedKey(null), 180);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
    if (key === "delete") {
      setCode((current) => current.slice(0, -1));
      setError(false);
      return;
    }
    if (typeof key === "number") {
      setError(false);
      setCode((current) => current.length < 4 ? `${current}${key}` : current);
    }
  }, [screen, unlocking]);

  const validateCode = useCallback(() => {
    if (code.length !== 4 || unlocking || validationInProgress.current) return;
    validationInProgress.current = true;
    if (code === giftConfig.passcode) {
      setUnlocking(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      setActiveHint(null);
      window.setTimeout(() => setScreen("unlocked"), 420);
      return;
    }
    setFailedAttempts((current) => {
      const next = current + 1;
      const joke = funnyWrongJokes[(next - 1) % funnyWrongJokes.length];
      setActiveHint(joke);

      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setActiveHint(null);
      }, 4500);

      return next;
    });
    setError(true);
    setCode("");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([12, 35, 12]);
    window.setTimeout(() => { validationInProgress.current = false; }, 280);
  }, [code, unlocking]);

  useEffect(() => {
    if (code.length === 4) {
      const timer = window.setTimeout(validateCode, 180);
      return () => window.clearTimeout(timer);
    }
  }, [code, validateCode]);

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (screen !== "code" || unlocking) return;
      if (/^\d$/.test(event.key)) { event.preventDefault(); enterKey(Number(event.key) as (typeof keys)[number]); }
      else if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); enterKey("delete"); }
      else if (event.key === "Enter") { event.preventDefault(); validateCode(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enterKey, screen, unlocking, validateCode]);

  useEffect(() => {
    if (!wishCardOpen) return;
    closeWishRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setWishCardOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [wishCardOpen]);

  useEffect(() => {
    if (screen !== "unlocked") return;
    setShowKindnessJoke(true);
    const timer = window.setTimeout(() => setShowKindnessJoke(false), 4200);
    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    if (!wishCardOpen) {
      setWishEnvelopeOpened(false);
      return;
    }
    const timer = window.setTimeout(() => setWishEnvelopeOpened(true), reducedMotion ? 0 : 520);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, wishCardOpen]);

  useEffect(() => {
    if (screen !== "letter") return;
    setLetterOpened(false);
    const timer = window.setTimeout(() => setLetterOpened(true), reducedMotion ? 0 : 900);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, screen]);

  const currentLetter = letterPage === 1 ? giftConfig.letter : giftConfig.secondLetter;
  const letterGreeting = letterPage === 1
    ? "Une lettre d'anniversaire, juste pour toi"
    : "Et une dernière petite pensée";
  const letterBodyDelay = 130 + getTypewriterDuration(letterGreeting) + 240;
  const letterSignatureDelay = getLetterSequenceDuration(currentLetter, letterBodyDelay);

  const handleNextLetterPage = () => {
    setLetterPage(2);
    letterScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevLetterPage = () => {
    setLetterPage(1);
    letterScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const replay = () => {
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    setActiveHint(null);
    setCode(""); setError(false); setFailedAttempts(0); setUnlocking(false); setActivePhoto(0);
    validationInProgress.current = false;
    setWishCardOpen(false); setWishEnvelopeOpened(false); setLetterOpened(false); setLetterPage(1); setScreen("journey");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

return (
  <main
    className={`editorial-shell ${screen === "journey" ? "is-journey" : ""} ${screen === "letter" ? "is-letter" : ""}`}
    style={{
      "--blush": giftConfig.colors.blush,
      "--coral": giftConfig.colors.coral,
      "--plum": giftConfig.colors.plum,
    } as React.CSSProperties}
  >
    {screen === "journey" && <JourneyMap onOpenCode={() => setScreen("code")} />}

    {screen === "code" && (
      <motion.section
        className="passcode-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        aria-labelledby="code-title"
      >
        <div className="card-heading">
          <Typewriter as="p">Un petit secret</Typewriter>
          <Typewriter as="h1" id="code-title" delay={120}>Entre le code à 4 chiffres</Typewriter>
        </div>

        <motion.div
          className={`code-dots ${error ? "has-error" : ""}`}
          animate={error ? { x: [-8, 8, -6, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.32 }}
          aria-label={`${code.length} chiffre${code.length > 1 ? "s" : ""} saisi${code.length > 1 ? "s" : ""} sur 4`}
          aria-live="polite"
        >
          {[0, 1, 2, 3].map((index) => (
            <span
              className={`code-slot ${code.length > index ? "filled" : ""} ${index === code.length - 1 ? "just-filled" : ""}`}
              key={index}
            >
              {code[index] ? "•" : ""}
            </span>
          ))}
        </motion.div>

        <Typewriter as="p" className="code-helper" delay={260}>
          Le code est un petit rituel de surprise, pas un mot de passe.
        </Typewriter>

        <div className="keypad" aria-label="Clavier numérique">
          {keys.map((key, index) =>
            key === "" ? (
              <span key={`spacer-${index}`} />
            ) : (
              <button
                type="button"
                key={`key-${key}-${index}`}
                onClick={() => enterKey(key)}
                aria-label={key === "delete" ? "Effacer le dernier chiffre" : `Saisir le chiffre ${key}`}
                className={`${key === "delete" ? "delete-key" : ""} ${pressedKey === key ? "is-pressed" : ""}`}
                disabled={unlocking}
              >
                <i aria-hidden="true" />
                {key === "delete" ? (
                  <svg
                    className="delete-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22 7H9.5C8.8 7 8.2 7.3 7.7 7.7L2 12L7.7 16.3C8.2 16.7 8.8 17 9.5 17H22V7Z"
                      fill="currentColor"
                      fillOpacity="0.18"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 10L12 13M12 10L15 13"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  key
                )}
              </button>
            ),
          )}
        </div>
      </motion.section>
    )}

    {screen === "unlocked" && (
      <motion.section
        className="story-screen unlock-screen"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <FloatingMagic />
        <div className="rose-mark" aria-hidden="true">
          <RoseIcon className="rose-mark-image" />
        </div>
        <Typewriter as="p" className="story-kicker">Surprise ouverte</Typewriter>
        <Typewriter as="h2" delay={110}>J&apos;ai préparé quelque chose<br />pour toi.</Typewriter>
        {showKindnessJoke && (
          <Typewriter as="p" className="story-copy" delay={260}>
            Analyse de ta gentillesse… 99 %… erreur : niveau trop élevé.
          </Typewriter>
        )}
        <button className="primary-button" type="button" onClick={() => setScreen("birthday")}>
          Découvrir <span aria-hidden="true">→</span>
        </button>

        {/* Signature + tampon */}
        <div className="unlock-signature" aria-label="Signé par Dridi Ghassen">
          <p className="unlock-sig-name">Dridi Ghassen</p>
          <div className="unlock-stamp" aria-hidden="true">
            <svg viewBox="0 0 90 90" className="unlock-stamp-ring">
              <path
                id="stamp-top-arc"
                d="M 10,45 A 35,35 0 0,1 80,45"
                fill="none"
              />
              <path
                id="stamp-bot-arc"
                d="M 10,45 A 35,35 0 0,0 80,45"
                fill="none"
              />
              <text fontSize="9" fontWeight="700" letterSpacing="2.8" fill="currentColor" textAnchor="middle">
                <textPath href="#stamp-top-arc" startOffset="50%">DRIDI GHASSEN</textPath>
              </text>
              <text fontSize="8.5" fontWeight="700" letterSpacing="2.5" fill="currentColor" textAnchor="middle">
                <textPath href="#stamp-bot-arc" startOffset="50%">26 · 10 · 2026</textPath>
              </text>
              <circle cx="45" cy="45" r="3.2" fill="currentColor" />
            </svg>
          </div>
        </div>
      </motion.section>
    )}

    {screen === "birthday" && (
      <motion.section
        className="story-screen birthday-screen"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <FloatingMagic />
        <BirthdayFireworks />
        <Typewriter as="p" className="story-kicker">Aujourd&apos;hui, c&apos;est toi</Typewriter>
        <Typewriter as="h2" delay={110}>Joyeux anniversaire<br /><em>Fatima Ezzahra.</em></Typewriter>
        <Typewriter as="p" className="amazigh-name" lang="zgh-Tfng" aria-label="Fatima Ezzahra en tifinagh" delay={330}>
          <span aria-hidden="true">ⵣ</span> ⴼⴰⵟⵉⵎⴰ ⴻⵣⵣⴰⵀⵔⴰ <span aria-hidden="true">ⵣ</span>
        </Typewriter>
        <Typewriter as="p" className="album-intro" delay={440}>Cheers To You For Another 365 Days Around The Sun! 🌹</Typewriter>

        <div className="birthday-album" aria-label="Album photo d'anniversaire">
          {giftConfig.albumPhotos.map((photo, index) => (
            <motion.button
              className={`album-photo photo-${index} ${activePhoto === index ? "active" : ""}`}
              type="button"
              key={photo}
              onClick={() => setActivePhoto(index)}
              initial={{ opacity: 0, y: 58, rotate: index ? 13 : -15, scale: 0.78 }}
              animate={{
                opacity: 1,
                y: 0,
                rotate: index ? 7 : -8,
                scale: 1,
              }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: 0.1 + index * 0.18, type: "spring", stiffness: 170, damping: 14 }}
              aria-label={`Mettre la photo ${index + 1} au premier plan`}
            >
              <Image
                src={photo}
                width={1080}
                height={index ? 2044 : 985}
                sizes="(max-width: 760px) 42vw, 170px"
                alt={`Portrait d'anniversaire de ${giftConfig.friendName}`}
              />
              <span>{index === 0 ? "un peu de soleil" : "la fêtée"}</span>
            </motion.button>
          ))}
        </div>

        {/* ── Luxury Birthday Cake ── */}
        <motion.div
          className="luxury-cake-wrap"
          role="button"
          tabIndex={0}
          onClick={() => setWishCardOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setWishCardOpen(true);
            }
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          title="Fais ton vœu !"
          aria-label="Gâteau d'anniversaire scintillant - clique pour faire ton vœu"
        >
          <div className="lc-sparkles">
            <span className="lc-spark lc-spark-1">✦</span>
            <span className="lc-spark lc-spark-2">✧</span>
            <span className="lc-spark lc-spark-3">✦</span>
          </div>
          <div className="luxury-cake">
            <div className="lc-candles">
              <div className="lc-candle lc-candle-s"><i>🔥</i></div>
              <div className="lc-candle lc-candle-m"><i>🔥</i></div>
              <div className="lc-candle lc-candle-l"><i>🔥</i></div>
              <div className="lc-candle lc-candle-m"><i>🔥</i></div>
              <div className="lc-candle lc-candle-s"><i>🔥</i></div>
            </div>
            <div className="lc-tier lc-tier-top">
              <span className="lc-tier-rose">🌸</span>
              <span className="lc-tier-rose">🌸</span>
              <span className="lc-tier-rose">🌸</span>
            </div>
            <div className="lc-icing" />
            <div className="lc-tier lc-tier-bot">
              <span className="lc-tier-heart">♡</span>
              <span className="lc-tier-heart">♡</span>
              <span className="lc-tier-heart">♡</span>
              <span className="lc-tier-heart">♡</span>
              <span className="lc-tier-heart">♡</span>
            </div>
            <div className="lc-plate" />
          </div>
        </motion.div>
        <button
          className="wish-button"
          type="button"
          onClick={() => setWishCardOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="wish-button-icon" aria-hidden="true">🕯️</span>
          <span>Fais ton vœu</span>
          <b aria-hidden="true">→</b>
        </button>

        <button
          className="text-button"
          type="button"
          onClick={() => setScreen("letter")}
        >
          Une petite lettre pour toi <span aria-hidden="true">→</span>
        </button>
      </motion.section>
    )}

    {screen === "letter" && (
      <motion.section
        className="story-screen letter-screen"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <FloatingMagic />

        <div className="letter-header">
          <div className="letter-segmented-pager" role="tablist" aria-label="Pages de la lettre">
            <button
              type="button"
              role="tab"
              aria-selected={letterPage === 1}
              className={`pager-tab ${letterPage === 1 ? "is-active" : ""}`}
              onClick={handlePrevLetterPage}
            >
              <span className="pager-dot" />
              <span>1re Lettre</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={letterPage === 2}
              className={`pager-tab ${letterPage === 2 ? "is-active" : ""}`}
              onClick={handleNextLetterPage}
            >
              <span className="pager-dot" />
              <span>2e Pensée</span>
            </button>
          </div>
          <div className="letter-title-lockup">
            <Typewriter as="h2" delay={120}>
              {letterPage === 1 ? (
                <>
                  Pour toi, <em>avec amitié</em>
                </>
              ) : (
                <>
                  Et une dernière <em>petite chose…</em>
                </>
              )}
            </Typewriter>
            {letterPage === 1 && <RoseIcon className="letter-title-rose" />}
          </div>
        </div>

        {!letterOpened ? (
          <motion.div
            className="envelope envelope-opening"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="envelope-flap" />
            <span className="rose-seal" aria-hidden="true"><RoseIcon className="rose-seal-image" /></span>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.article
                key={letterPage}
                className="birthday-letter"
                initial={{ opacity: 0, rotateY: -10, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, rotateY: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 10, y: -10, scale: 0.98 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Artisanal Wax Seal Badge */}
                <div className="wax-seal-ornament" aria-hidden="true">
                  <span className="wax-ribbon ribbon-left" />
                  <span className="wax-ribbon ribbon-right" />
                  <div className="wax-seal-disc">
                    <span className="wax-seal-inner">
                      <RoseIcon className="wax-seal-rose" />
                    </span>
                  </div>
                </div>

                {/* Vintage Postmark Stamp Watermark */}
                <div className="vintage-postmark" aria-hidden="true">
                  <svg viewBox="0 0 100 100" className="postmark-svg">
                    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
                    <circle cx="50" cy="50" r="39" stroke="currentColor" strokeWidth="0.8" fill="none" />
                    <text x="50" y="22" textAnchor="middle" fontSize="6.2" fill="currentColor" letterSpacing="1.6" fontWeight="700">TUNIS · MAROC</text>
                    <text x="50" y="52" textAnchor="middle" fontSize="12" fill="currentColor">✦</text>
                    <text x="50" y="80" textAnchor="middle" fontSize="6.4" fill="currentColor" letterSpacing="1.8" fontWeight="600">26 · 10 · 2026</text>
                  </svg>
                </div>

                <div ref={letterScrollRef} className="letter-scroll-body">
                  <div className="letter-inner-content">
                    <Typewriter as="p" className="card-greeting" delay={130}>
                      {letterGreeting}
                    </Typewriter>

                    <LetterParagraphs
                      message={currentLetter}
                      delay={letterBodyDelay}
                    />

                    <div className="card-signature-block">
                      <span className="signature-flourish" aria-hidden="true">✦ ───── ✦</span>
                      <Typewriter as="p" className="card-signature" delay={letterSignatureDelay}>De Tunisie, avec amitié 🩷</Typewriter>
                    </div>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>

            <div ref={letterActionsRef} className="letter-nav-actions">
              {letterPage === 1 ? (
                <button
                  className="primary-button letter-action-btn"
                  type="button"
                  onClick={handleNextLetterPage}
                >
                  <span>Lire la suite</span>
                  <span className="action-arrow" aria-hidden="true">→</span>
                </button>
              ) : (
                <div className="letter-page2-actions">
                  <button
                    className="ghost-back-btn"
                    type="button"
                    onClick={handlePrevLetterPage}
                  >
                    <span aria-hidden="true">←</span> Relire la première lettre
                  </button>
                  <button
                    className="primary-button letter-action-btn"
                    type="button"
                    onClick={() => {
                      setScreen("final");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <span>Une dernière surprise</span>
                    <span className="action-arrow" aria-hidden="true">→</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </motion.section>
    )}

    {screen === "final" && (
      <motion.section
        className="story-screen final-screen"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <FloatingMagic />
        <div className="final-rose-display" aria-hidden="true">
          <span className="final-rose-orbit">
            <RoseIcon className="final-rose-display-image" />
          </span>
        </div>
        <div className="final-confetti-layer" aria-hidden="true">
          <Image src={confettiDay} alt="" className="final-confetti-art" />
        </div>
        <FinalMemoryPhoto
          className="memory-photo-one"
          src={giftConfig.albumPhotos[0]}
          height={985}
          caption="soleil"
          rotate={-9}
          fromX={-74}
          fromY={46}
          delay={0.32}
        />
        <FinalMemoryPhoto
          className="memory-photo-two"
          src={giftConfig.albumPhotos[1]}
          height={2044}
          caption="la fêtée"
          rotate={9}
          fromX={78}
          fromY={64}
          delay={0.46}
        />
        <motion.div
          className="final-star"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.65, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <RoseIcon className="final-rose-image" />
        </motion.div>
        <motion.p
          className="story-kicker"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        ><Typewriter delay={180}>Un souvenir de Tunisie</Typewriter></motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.65, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        ><Typewriter delay={260}>Joyeux anniversaire,<br /><em>Fatima Ezzahra.</em></Typewriter></motion.h2>
        <motion.div
          className="final-arabic-name"
          dir="rtl"
          lang="ar"
          aria-label="Fatima Ezzahra en calligraphie arabe"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.42 }}
        >
          <span className="arabic-flourish" aria-hidden="true">✦</span>
          <Typewriter delay={520} as="span" className="arabic-calligraphy-text">فاطمة الزهراء</Typewriter>
          <span className="arabic-flourish" aria-hidden="true">✦</span>
        </motion.div>
        <motion.article
          className="memory-postcard"
          initial={{ opacity: 0, y: 18, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          transition={{ duration: 0.58, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <p><Typewriter delay={600}>365 nouvelles petites raisons de sourire.</Typewriter></p>
          <small><Typewriter delay={1100}>Garde ce moment près de toi ✦</Typewriter></small>
        </motion.article>

        {/* ── Instagram Voice Note (Happy Birthday Song) ── */}
        <InstagramVoiceNote src="/audio/HappyBirthday.mpeg" />

        <motion.div
          className="qr-memory"
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.72 }}
        >
          <Image src="/birthday-gift-qr.png" width={80} height={80} alt="QR code du cadeau d'anniversaire" />
          <Typewriter as="span" delay={900}>Un souvenir à scanner</Typewriter>
        </motion.div>
        <motion.button
          className="text-button"
          type="button"
          onClick={replay}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.68 }}
        >
          Revivre la surprise <span aria-hidden="true">↻</span>
        </motion.button>
      </motion.section>
    )}

    {isClient && createPortal(
      <AnimatePresence>
        {wishCardOpen && (
          <motion.div
            className="wish-note-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Mon vœu pour toi"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setWishCardOpen(false)}
          >
            <motion.article
              className={`wish-envelope ${wishEnvelopeOpened ? "is-open" : ""}`}
              initial={{ opacity: 0, y: 25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.94 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                ref={closeWishRef}
                className="wish-note-close"
                type="button"
                onClick={() => setWishCardOpen(false)}
                aria-label="Fermer le vœu"
              >×</button>
              <div className="wish-envelope-letter">
                <Typewriter as="p" className="wish-note-kicker" delay={560}>Mon vœu pour toi 🩷</Typewriter>
                <Typewriter as="p" className="wish-note-message" delay={760}>{giftConfig.wishMessage}</Typewriter>
                <Typewriter as="p" className="wish-note-signature" delay={getTypewriterDuration(giftConfig.wishMessage) + 940}>{giftConfig.wishSignature}</Typewriter>
              </div>
              <div className="wish-envelope-flap" />
              <span className="wish-envelope-seal" aria-hidden="true"><RoseIcon className="wish-envelope-rose" /></span>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

    {isClient &&
      createPortal(
        <div className="passcode-toast-viewport" aria-live="polite">
          <AnimatePresence>
            {screen === "code" && activeHint && (
              <motion.div
                key={activeHint.title}
                className="passcode-hint-toast"
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, y: -20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="hint-toast-badge" aria-hidden="true">
                  {activeHint.emoji}
                </div>
                <div className="hint-toast-content">
                  <Typewriter as="p" className="hint-toast-title">{activeHint.title}</Typewriter>
                  <Typewriter as="p" className="hint-toast-sub" delay={getTypewriterDuration(activeHint.title) + 160}>{activeHint.sub}</Typewriter>
                </div>
                <button
                  type="button"
                  className="hint-toast-dismiss"
                  onClick={() => {
                    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
                    setActiveHint(null);
                  }}
                  aria-label="Fermer l'indice"
                >
                  ×
                </button>
                <div className="hint-toast-timer-bar" aria-hidden="true" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body
      )}
  </main>
);
}
