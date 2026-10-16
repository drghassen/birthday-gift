"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { geoDistance, geoInterpolate, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryObject, Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-110m.json";
import { giftConfig } from "@/config/gift";

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
// A neutral reference point inside Morocco, selected only to make the symbolic distance estimate.
// It is deliberately not presented to the recipient as a destination city or live location.
const moroccoReferenceCoordinates: [number, number] = [-6.4, 31.5];
const monastirPoint = mapProjection(monastirCoordinates) as [number, number];
const moroccoPoint = mapProjection(moroccoReferenceCoordinates) as [number, number];
const routeCoordinates = Array.from({ length: 40 }, (_, index) =>
  geoInterpolate(monastirCoordinates, moroccoReferenceCoordinates)(index / 39),
);
const journeyPath = mapPath({ type: "LineString", coordinates: routeCoordinates }) ?? "";
const estimatedDistanceKm = Math.round(geoDistance(monastirCoordinates, moroccoReferenceCoordinates) * 6371);
const confetti = Array.from({ length: 26 }, (_, index) => ({
  left: `${(index * 37) % 97}%`,
  delay: (index % 8) * 0.08,
  rotate: (index * 47) % 180,
}));

type Screen = "journey" | "code" | "unlocked" | "birthday" | "letter" | "final";

function FloatingMagic() {
  return <div className="floating-magic" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i></div>;
}

function FormattedInline({ text }: { text: string }) {
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

function LetterParagraphs({ message }: { message: string }) {
  const paragraphs = message.split("\n\n");
  return (
    <div className="letter-message">
      {paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim();

        // Salutation opening (e.g. **À toi, Ghzela,**)
        if (trimmed.startsWith("**À toi,") && trimmed.endsWith("**")) {
          const name = trimmed.slice(2, -2);
          return (
            <motion.div
              key={`salutation-${index}`}
              className="letter-salutation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: index * 0.04 }}
            >
              <span className="salutation-text">{name}</span>
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
            trimmed.endsWith("🦋") ||
            trimmed.endsWith("💜") ||
            trimmed.endsWith("🎂🦋"));

        if (isFullCallout) {
          return (
            <motion.aside
              key={`callout-${index}`}
              className="letter-quote-callout"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <span className="callout-spark" aria-hidden="true">✦</span>
              <div className="callout-body">
                <FormattedInline text={trimmed} />
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
            transition={{ duration: 0.28, delay: index * 0.04 }}
          >
            <FormattedInline text={trimmed} />
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
    const duration = 4600;
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const nextDistance = Math.max(0, Math.round(estimatedDistanceKm * (1 - progress)));
      // Text updates are deliberately quantised: React does not render on every animation frame.
      const nextStep = Math.floor(progress * 24);
      if (nextStep !== lastStep || progress === 1) {
        lastStep = nextStep;
        setRemainingDistance(nextDistance);
      }
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const pathTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 1.8, ease: [0.22, 1, 0.36, 1] as const };
  const flightTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 3.1, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] as const };

  return (
    <section className="journey-section" aria-labelledby="journey-title">
      <div className="topline"><span>Un cadeau d&apos;anniversaire</span><span>TN → MA</span></div>
      <div className="map-frame">
        <svg className="journey-map" viewBox="0 0 360 250" role="img" aria-label="Carte symbolique d’un trajet de Monastir vers le Maroc">
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
                <ellipse cx="-2" cy="11" rx="14" ry="3.5" className="plane-shadow" />
                {/* Soft ambient flight illumination */}
                <circle cx="0" cy="0" r="15" className="plane-ambient-glow" />
                {/* Clean, transparent, perfectly oriented aircraft sprite */}
                <image
                  href="/plane_west.png"
                  x="-17"
                  y="-6"
                  width="34"
                  height="11.8"
                  preserveAspectRatio="xMidYMid meet"
                />
                {/* Twin jet engine warm exhaust glows */}
                <ellipse cx="6" cy="4" rx="2" ry="1.2" className="plane-engine-glow" />
                <ellipse cx="11" cy="4" rx="2" ry="1.2" className="plane-engine-glow" />
                {/* Subtle flashing tail beacon */}
                <circle cx="15" cy="-5" r="1.1" className="plane-beacon" />
              </motion.g>
              {/* Sparkle and star trail trailing from the engines */}
              <motion.g
                className="plane-trail"
                initial={{ offsetDistance: "0%", opacity: 0 }}
                animate={{ offsetDistance: "96%", opacity: [0, 1, 0] }}
                transition={{ duration: 2.9, delay: 1.0, ease: "easeInOut" }}
                style={{
                  offsetPath: `path('${journeyPath}')`,
                  offsetRotate: "auto 180deg",
                }}
              >
                <text x="24" y="3">✦ · ✧ · ✦</text>
              </motion.g>
            </>
          )}

          <circle className="place-dot" cx={moroccoPoint[0]} cy={moroccoPoint[1]} r="4" />
          <circle className="place-dot" cx={monastirPoint[0]} cy={monastirPoint[1]} r="4" />
          <text className="map-label" x={moroccoPoint[0] - 20} y={moroccoPoint[1] + 18}>MAROC</text>
          <text className="map-label" x={monastirPoint[0] - 28} y={monastirPoint[1] - 13}>MONASTIR</text>
        </svg>
        <p className="distance-counter"><span>Distance estimée restante</span><strong>{remainingDistance.toLocaleString("fr-FR")} km</strong></p>
      </div>
      <div className="journey-copy">
        <p className="eyebrow">Route 01 · Un cadeau pour toi</p>
        <h1 id="journey-title">De Monastir <span>au Maroc</span></h1>
        <p className="arabic" dir="rtl">من تونس إلى المغرب</p>
        <p className="subtitle">Un petit cadeau t&apos;attend.</p>
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

export default function Home() {
  const [screen, setScreen] = useState<Screen>("journey");
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | number | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [wishCardOpen, setWishCardOpen] = useState(false);
  const [showKindnessJoke, setShowKindnessJoke] = useState(true);
  const [letterOpened, setLetterOpened] = useState(false);
  const [letterPage, setLetterPage] = useState<1 | 2>(1);
  const [showScrollPrompt, setShowScrollPrompt] = useState(false);
  const letterActionsRef = useRef<HTMLDivElement>(null);
  const [wishEnvelopeOpened, setWishEnvelopeOpened] = useState(false);
  const closeWishRef = useRef<HTMLButtonElement>(null);
  const validationInProgress = useRef(false);
  const reducedMotion = useReducedMotion();

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
      window.setTimeout(() => setScreen("unlocked"), 420);
      return;
    }
    setFailedAttempts((current) => current + 1);
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

  useEffect(() => {
    if (screen !== "letter" || !letterOpened) {
      setShowScrollPrompt(false);
      return;
    }

    const checkVisibility = () => {
      if (!letterActionsRef.current) return;
      const rect = letterActionsRef.current.getBoundingClientRect();
      // If button is below the viewport, show the floating hint
      const isBelowViewport = rect.top > window.innerHeight - 20;
      setShowScrollPrompt(isBelowViewport);
    };

    const timer = window.setTimeout(checkVisibility, 400);
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
    };
  }, [screen, letterOpened, letterPage]);

  const scrollToLetterActions = () => {
    letterActionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleNextLetterPage = () => {
    setLetterPage(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevLetterPage = () => {
    setLetterPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const replay = () => {
    setCode(""); setError(false); setFailedAttempts(0); setUnlocking(false); setActivePhoto(0);
    validationInProgress.current = false;
    setWishCardOpen(false); setWishEnvelopeOpened(false); setLetterOpened(false); setLetterPage(1); setScreen("journey");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

return (
  <main
    className={`editorial-shell ${screen === "journey" ? "is-journey" : ""}`}
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
          <p>Un petit secret</p>
          <h1 id="code-title">Entre le code à 4 chiffres</h1>
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

        <p className="code-helper">
          Le code est un petit rituel de surprise, pas un mot de passe.
        </p>

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

        <div className="code-feedback" aria-live="assertive">
          <AnimatePresence mode="wait">
            {failedAttempts > 0 && (
              <motion.div
                key={`funny-feedback-${failedAttempts}`}
                className="funny-feedback-bubble"
                initial={{ opacity: 0, y: 12, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
              >
                <span className="funny-feedback-emoji" aria-hidden="true">
                  {funnyWrongJokes[(failedAttempts - 1) % funnyWrongJokes.length].emoji}
                </span>
                <p className="funny-feedback-title">
                  {funnyWrongJokes[(failedAttempts - 1) % funnyWrongJokes.length].title}
                </p>
                <p className="funny-feedback-sub">
                  {funnyWrongJokes[(failedAttempts - 1) % funnyWrongJokes.length].sub}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
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
        <div className="butterfly-mark" aria-hidden="true">🦋</div>
        <p className="story-kicker">Surprise ouverte</p>
        <h2>J&apos;ai préparé quelque chose<br />pour toi.</h2>
        {showKindnessJoke && (
          <p className="story-copy">
            Analyse de ta gentillesse… 99 %… erreur : niveau trop élevé.
          </p>
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
        <p className="story-kicker">Aujourd&apos;hui, c&apos;est toi</p>
        <h2>Joyeux anniversaire<br /><em>Fatima Ezzahra.</em></h2>
        <p className="amazigh-name" lang="zgh-Tfng" aria-label="Fatima Ezzahra en tifinagh">
          <span aria-hidden="true">ⵣ</span> ⴼⴰⵟⵉⵎⴰ ⴻⵣⵣⴰⵀⵔⴰ <span aria-hidden="true">ⵣ</span>
        </p>
        <p className="album-intro">Cheers To You For Another 365 Days Around The Sun! 🦋</p>

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
        <div className="luxury-cake-wrap" aria-hidden="true">
          <div className="lc-sparkles">
            <span className="lc-spark lc-spark-1">✦</span>
            <span className="lc-spark lc-spark-2">✧</span>
            <span className="lc-spark lc-spark-3">✦</span>
          </div>
          <div className="lc-gems">
            <span className="lc-gem">💎</span>
            <span className="lc-gem lc-gem-r">💎</span>
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
        </div>
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
                  <p className="wish-note-kicker">Mon vœu pour toi 🩷</p>
                  <p className="wish-note-message">{giftConfig.wishMessage}</p>
                  <p className="wish-note-signature">{giftConfig.wishSignature}</p>
                </div>
                <div className="wish-envelope-flap" />
                <span className="wish-envelope-seal" aria-hidden="true">🦋</span>
              </motion.article>
            </motion.div>
          )}
        </AnimatePresence>
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
          <h2>
            {letterPage === 1 ? (
              <>
                Pour toi, <em>avec amitié 🦋</em>
              </>
            ) : (
              <>
                Et une dernière <em>petite chose…</em>
              </>
            )}
          </h2>
        </div>

        {!letterOpened ? (
          <motion.div
            className="envelope envelope-opening"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="envelope-flap" />
            <span className="butterfly-seal" aria-hidden="true">🦋</span>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.article
                key={letterPage}
                className="birthday-letter"
                initial={{ opacity: 0, rotateY: -14, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, rotateY: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 14, y: -12, scale: 0.98 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Artisanal Wax Seal Badge */}
                <div className="wax-seal-ornament" aria-hidden="true">
                  <span className="wax-ribbon ribbon-left" />
                  <span className="wax-ribbon ribbon-right" />
                  <div className="wax-seal-disc">
                    <span className="wax-seal-inner">
                      <i>🦋</i>
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

                <div className="letter-inner-content">
                  <p className="card-greeting">
                    {letterPage === 1
                      ? "Une lettre d'anniversaire, juste pour toi"
                      : "Et une dernière petite pensée"}
                  </p>

                  <LetterParagraphs
                    message={letterPage === 1 ? giftConfig.letter : giftConfig.secondLetter}
                  />

                  <div className="card-signature-block">
                    <span className="signature-flourish" aria-hidden="true">✦ ───── ✦</span>
                    <p className="card-signature">De Tunisie, avec amitié 🩷</p>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>

            {/* Floating modern reading cue when button is below the screen */}
            <AnimatePresence>
              {showScrollPrompt && (
                <motion.button
                  type="button"
                  className="floating-letter-scroll-prompt"
                  onClick={scrollToLetterActions}
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  aria-label="Faire défiler vers la suite"
                >
                  <span className="scroll-prompt-icon" aria-hidden="true">📜</span>
                  <span>Faire défiler la lettre</span>
                  <span className="scroll-prompt-chevron" aria-hidden="true">↓</span>
                </motion.button>
              )}
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
        <div className="confetti-field" aria-hidden="true">
          {confetti.map((piece, index) => (
            <i
              key={index}
              style={{
                left: piece.left,
                animationDelay: `${piece.delay}s`,
                transform: `rotate(${piece.rotate}deg)`,
              }}
            />
          ))}
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
        >🦋</motion.div>
        <motion.p
          className="story-kicker"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >Un souvenir de Tunisie</motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.65, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >Joyeux anniversaire,<br /><em>Fatima.</em></motion.h2>
        <motion.p
          className="final-amazigh"
          lang="zgh-Tfng"
          initial={{ opacity: 0, y: 9 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.42 }}
        >ⴼⴰⵟⵉⵎⴰ ⴻⵣⵣⴰⵀⵔⴰ</motion.p>
        <motion.article
          className="memory-postcard"
          initial={{ opacity: 0, y: 18, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          transition={{ duration: 0.58, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <p>365 nouvelles petites raisons de sourire.</p>
          <small>Garde ce moment près de toi ✦</small>
        </motion.article>
        <motion.div
          className="qr-memory"
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.72 }}
        >
          <Image src="/birthday-gift-qr.png" width={80} height={80} alt="QR code du cadeau d'anniversaire" />
          <span>Un souvenir à scanner</span>
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
  </main>
);
}
