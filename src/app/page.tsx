"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { geoInterpolate, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
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
const northAfricaCountries = atlasCountries.features.filter((country) => focusCountries.has(String(country.id)));
const northAfricaCollection: FeatureCollection<Geometry> = { type: "FeatureCollection", features: northAfricaCountries };
const mapProjection = geoMercator().fitExtent([[25, 22], [335, 226]], northAfricaCollection);
const mapPath = geoPath(mapProjection);
const moroccoCoordinates: [number, number] = [-6.84, 33.97];
const tunisiaCoordinates: [number, number] = [10.18, 36.8];
const moroccoPoint = mapProjection(moroccoCoordinates) as [number, number];
const tunisiaPoint = mapProjection(tunisiaCoordinates) as [number, number];
const routeCoordinates = Array.from({ length: 32 }, (_, index) => geoInterpolate(tunisiaCoordinates, moroccoCoordinates)(index / 31));
const journeyPath = mapPath({ type: "LineString", coordinates: routeCoordinates }) ?? "";
const confetti = Array.from({ length: 22 }, (_, index) => ({
  left: `${(index * 37) % 97}%`,
  delay: (index % 7) * 0.12,
  rotate: (index * 47) % 180,
}));
const wishSparks = Array.from({ length: 18 }, (_, index) => ({
  angle: index * 20,
  delay: (index % 4) * 0.035,
  color: index % 3 === 0 ? "gold" : index % 3 === 1 ? "rose" : "cream",
}));

function FloatingMagic() {
  return <div className="floating-magic" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i></div>;
}

function JourneyMap() {
  return (
    <div className="map-frame">
    <div className="map-status" aria-hidden="true"><i /> Live birthday route</div>
    <div className="map-orbit map-orbit-one" aria-hidden="true" /><div className="map-orbit map-orbit-two" aria-hidden="true" />
    <svg className="journey-map" viewBox="0 0 360 250" role="img" aria-label="A close-up map journey from Tunisia to Morocco">
      <defs>
        <linearGradient id="journeyGlow" x1="0" x2="1">
          <stop stopColor="#ffdb86" />
          <stop offset="0.55" stopColor="#f78a9b" />
          <stop offset="1" stopColor="#e96f7f" />
        </linearGradient>
        <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <motion.g
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "180px 124px" }}
      >
        {northAfricaCountries.map((country: Feature<Geometry>) => <path key={country.id} className={`country ${highlightedCountries.has(String(country.id)) ? `country-${country.id}` : "continent"}`} d={mapPath(country) ?? undefined} />)}
        <path className="flight-shadow" d={journeyPath} />
        <motion.path className="flight-path" d={journeyPath} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }} transition={{ duration: 5.6, delay: 0.35, times: [0, .34, .73, 1], repeat: Infinity, repeatDelay: 1.1, ease: "easeInOut" }} />
        <motion.g initial={{ offsetDistance: "0%", opacity: 0 }} animate={{ offsetDistance: ["0%", "100%", "100%"], opacity: [0, 1, 0] }} transition={{ duration: 4.15, delay: 0.35, times: [0, .48, 1], repeat: Infinity, repeatDelay: 2.55, ease: "easeInOut" }} style={{ offsetPath: `path('${journeyPath}')` }}>
          <circle r="10" fill="#ffc75c" opacity=".25" filter="url(#softGlow)" />
          <circle r="4.5" fill="#fff7d6" filter="url(#softGlow)" />
        </motion.g>
        <motion.circle cx={moroccoPoint[0]} cy={moroccoPoint[1]} r="25" fill="#ffc9cf" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.55, 1.55], opacity: [0, .62, 0] }} transition={{ duration: 4.15, delay: 1.85, times: [0, .18, 1], repeat: Infinity, repeatDelay: 2.55 }} />
        <motion.circle cx={tunisiaPoint[0]} cy={tunisiaPoint[1]} r="18" className="departure-pulse" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.7, 1.7], opacity: [0, .48, 0] }} transition={{ duration: 4.15, delay: .48, times: [0, .2, 1], repeat: Infinity, repeatDelay: 2.55 }} />
        <circle className="place-dot" cx={moroccoPoint[0]} cy={moroccoPoint[1]} r="4" />
        <circle className="place-dot" cx={tunisiaPoint[0]} cy={tunisiaPoint[1]} r="4" />
        <text className="map-label" x={moroccoPoint[0] - 57} y={moroccoPoint[1] - 13}>MOROCCO</text>
        <text className="map-label" x={tunisiaPoint[0] - 22} y={tunisiaPoint[1] - 13}>TUNISIA</text>
      </motion.g>
    </svg>
    <div className="map-place map-place-start"><span>01</span><strong>Tunisia</strong><small>sending love</small></div>
    <div className="map-place map-place-end"><span>02</span><strong>Morocco</strong><small>birthday stop</small></div>
    </div>
  );
}

export default function Home() {
  const [introComplete, setIntroComplete] = useState(false);
  const [screen, setScreen] = useState<"journey" | "unlocked" | "birthday" | "letter" | "final">("journey");
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | number | null>(null);
  const [letterPage, setLetterPage] = useState<1 | 2>(1);
  const [activePhoto, setActivePhoto] = useState(0);
  const [wishMade, setWishMade] = useState(false);
  const [wishCardOpen, setWishCardOpen] = useState(false);
  const music = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroComplete(true), 2900);
    return () => window.clearTimeout(timer);
  }, []);

  function enterKey(key: (typeof keys)[number]) {
    if (error || screen !== "journey") return;
    setPressedKey(key);
    window.setTimeout(() => setPressedKey(null), 320);
    if (key === "delete") setCode((current) => current.slice(0, -1));
    else if (typeof key === "number" && code.length < 4) setCode((current) => current + key);
  }

  useEffect(() => {
    if (code.length !== 4) return;
    const timer = window.setTimeout(() => {
      if (code === giftConfig.passcode) {
        setUnlocking(true);
        window.setTimeout(() => setScreen("unlocked"), 480);
      }
      else setError(true);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [code]);

  function tryAgain() { setCode(""); setError(false); setUnlocking(false); }

  function startBirthday() {
    setScreen("birthday");
    if (giftConfig.musicPath) {
      music.current = new Audio(giftConfig.musicPath);
      music.current.loop = true;
      void music.current.play().catch(() => undefined);
    }
  }

  function replay() {
    music.current?.pause();
    music.current = null;
    setCode("");
    setError(false);
    setUnlocking(false);
    setLetterPage(1);
    setActivePhoto(0);
    setWishMade(false);
    setWishCardOpen(false);
    setIntroComplete(false);
    setScreen("journey");
    window.setTimeout(() => setIntroComplete(true), 2900);
  }

  return (
    <main className="editorial-shell" style={{ "--blush": giftConfig.colors.blush, "--coral": giftConfig.colors.coral, "--plum": giftConfig.colors.plum } as React.CSSProperties}>
      {screen === "journey" && <section className="journey-section">
        <div className="topline"><span>Birthday transmission</span><span>TN → MA</span></div>
        <JourneyMap />
        <AnimatePresence>
          {introComplete && (
            <motion.div className="journey-copy" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <p className="eyebrow">Route 01 · North Africa</p>
              <h1>From Tunisia <span>to Morocco.</span></h1>
              <p className="arabic" dir="rtl">من تونس إلى المغرب</p>
              <p className="subtitle">There&apos;s something waiting for you.</p>
              <div className="scroll-cue" aria-hidden="true"><span /> Scroll to unlock</div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>}

      <AnimatePresence>
        {introComplete && screen === "journey" && (
          <motion.section className={`passcode-card ${unlocking ? "is-unlocking" : ""}`} initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.28 }}>
            {!error && <>
              <div className="card-heading"><span className="lock-icon" aria-hidden="true">✦</span><div><p>Private access · {giftConfig.friendName}</p><h2>Enter the secret code</h2></div></div>
              <div className="code-dots" aria-label={`${code.length} of 4 digits entered`}>
                {[0, 1, 2, 3].map((index) => <span className={`code-slot ${code.length > index ? "filled" : ""} ${index === code.length - 1 ? "just-filled" : ""}`} key={index}>{code[index] ? "•" : ""}</span>)}
              </div>
              <div className="keypad">
                {keys.map((key, index) => key === "" ? <span key={`spacer-${index}`} /> : <button type="button" key={`key-${key}-${index}`} onClick={() => enterKey(key)} aria-label={key === "delete" ? "Delete last number" : `Enter ${key}`} className={`${key === "delete" ? "delete-key" : ""} ${pressedKey === key ? "is-pressed" : ""}`}><i aria-hidden="true" />{key === "delete" ? <svg className="delete-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 5.5H6.7L2.8 12l3.9 6.5h10.7a3.8 3.8 0 0 0 0-7.6H16" /><path d="m10 9 6 6m0-6-6 6" /></svg> : key}</button>)}
              </div>
            </>}
            {error && <motion.div className="result-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><motion.div className="pouty-cat" animate={{ x: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: .7 }}>😾</motion.div><h2>Wrong passcode!!</h2><p>That secret is not the one.</p><button className="try-again" type="button" onClick={tryAgain}>Try again</button></motion.div>}
          </motion.section>
        )}
      </AnimatePresence>
      {screen === "unlocked" && <motion.section className="story-screen unlock-screen" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>
        <FloatingMagic />
        <motion.div className="butterfly-mark" animate={{ y: [0, -9, 0], rotate: [-4, 4, -4] }} transition={{ duration: 2, repeat: Infinity }}>🦋</motion.div>
        <p className="story-kicker">Secret unlocked</p><h2>I made something<br />for you.</h2><p className="story-copy">A little birthday moment, all the way from Tunisia.</p>
        <button className="primary-button" type="button" onClick={startBirthday}>YES!! <span>→</span></button>
      </motion.section>}
      {screen === "birthday" && <motion.section className="story-screen birthday-screen" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}>
        <FloatingMagic />
        <p className="story-kicker">Today is all about you</p><h2>Happy Birthday<br /><em>Fatima Ezzahra.</em></h2>
        <p className="amazigh-name" lang="zgh-Tfng" aria-label="Fatima Ezzahra in Tifinagh"><span aria-hidden="true">ⵣ</span> ⴼⴰⵟⵉⵎⴰ ⴻⵣⵣⴰⵀⵔⴰ <span aria-hidden="true">ⵣ</span></p>
        <div className="birthday-album" aria-label="A birthday photo album">
          <span className="album-stamp">birthday<br />edition</span><span className="album-spark one">✦</span><span className="album-spark two">✦</span>
          {giftConfig.albumPhotos.map((photo, index) => <motion.button className={`album-photo photo-${index} ${activePhoto === index ? "active" : ""}`} type="button" key={photo} onClick={() => setActivePhoto(index)} initial={{ opacity: 0, y: 35, rotate: index ? 7 : -8 }} animate={{ opacity: 1, y: 0, rotate: index ? 7 : -8, scale: activePhoto === index ? 1.04 : .94 }} whileTap={{ scale: .98 }} transition={{ delay: .22 + index * .15, type: "spring", stiffness: 150, damping: 15 }} aria-label={`View photo ${index + 1}`}>
            <img src={photo} alt={`Birthday portrait of ${giftConfig.friendName}`} /><span>{index === 0 ? "a little sunshine" : "the birthday girl"}</span>
          </motion.button>)}
        </div>
        <p className="story-copy">Cheers to you for another 365 days around the sun!</p>
        <motion.button className={`wish-button ${wishMade ? "is-made" : ""}`} type="button" onClick={() => { setWishMade(true); setWishCardOpen(true); }} whileTap={{ scale: .95 }} aria-haspopup="dialog">
          <b className="wish-hand" aria-hidden="true">☝</b><span>{wishMade ? "Your wish is on its way" : "Click here"}</span><b aria-hidden="true">{wishMade ? "✦" : "✧"}</b>
          {wishMade && <span className="wish-sparks" aria-hidden="true">{wishSparks.map((spark, index) => <i key={index} className={spark.color} style={{ "--angle": `${spark.angle}deg`, animationDelay: `${spark.delay}s` } as React.CSSProperties} />)}</span>}
        </motion.button>
        <button className="text-button" type="button" onClick={() => setScreen("letter")}>A little note for you <span>→</span></button>
        <AnimatePresence>
          {wishCardOpen && <motion.div className="wish-note-overlay" role="dialog" aria-modal="true" aria-label="A birthday wish" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWishCardOpen(false)}>
            <motion.article className="wish-note-card" initial={{ opacity: 0, y: 24, scale: .9, rotate: -3 }} animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }} exit={{ opacity: 0, y: 14, scale: .94 }} transition={{ type: "spring", stiffness: 240, damping: 20 }} onClick={(event) => event.stopPropagation()}>
              <button className="wish-note-close" type="button" onClick={() => setWishCardOpen(false)} aria-label="Close card">×</button><span className="wish-note-star" aria-hidden="true">✦</span>
              <p className="wish-note-kicker">A wish for you</p><p className="wish-note-message">{giftConfig.wishMessage}</p><p className="wish-note-signature">With all my love &amp; warm wishes</p>
            </motion.article>
          </motion.div>}
        </AnimatePresence>
      </motion.section>}
      {screen === "letter" && <motion.section className="story-screen letter-screen" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <FloatingMagic />
        <p className="story-kicker">A note for you</p><h2>For you <em>&lt;3</em></h2>
        <AnimatePresence mode="wait">
          <motion.article key={letterPage} className="birthday-letter" initial={{ opacity: 0, rotateY: -12, y: 14 }} animate={{ opacity: 1, rotateY: 0, y: 0 }} exit={{ opacity: 0, rotateY: 12, y: -10 }} transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}>
            <span className="card-bow" aria-hidden="true">✦</span><span className="card-spark spark-left" aria-hidden="true">✦</span><span className="card-spark spark-right" aria-hidden="true">✦</span>
            <p className="card-greeting">{letterPage === 1 ? "A birthday note, just for you" : "One last little thing"}</p>
            <p className="letter-message">{letterPage === 1 ? giftConfig.letter : giftConfig.secondLetter}</p>
            <p className="card-signature">From Tunisia, with friendship</p>
          </motion.article>
        </AnimatePresence>
        {letterPage === 1 ? <button className="primary-button" type="button" onClick={() => setLetterPage(2)}>Continue <span>→</span></button> : <button className="primary-button" type="button" onClick={() => setScreen("final")}>Make a wish <span>→</span></button>}
      </motion.section>}
      {screen === "final" && <motion.section className="story-screen final-screen" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }}>
        <FloatingMagic />
        <div className="confetti-field" aria-hidden="true">{confetti.map((piece, index) => <i key={index} style={{ left: piece.left, animationDelay: `${piece.delay}s`, transform: `rotate(${piece.rotate}deg)` }} />)}</div>
        <div className="memory-photo memory-photo-one" aria-hidden="true"><img src={giftConfig.albumPhotos[0]} alt="" /><span>sunshine</span></div>
        <div className="memory-photo memory-photo-two" aria-hidden="true"><img src={giftConfig.albumPhotos[1]} alt="" /><span>birthday girl</span></div>
        <div className="final-star">🦋</div><p className="story-kicker">A little memory from Tunisia</p><h2>Happy Birthday,<br /><em>Fatima.</em></h2>
        <p className="final-amazigh" lang="zgh-Tfng">ⴼⴰⵟⵉⵎⴰ ⴻⵣⵣⴰⵀⵔⴰ</p>
        <article className="memory-postcard"><span className="postcard-stamp">TN<br />→<br />MA</span><p>365 new little reasons to smile.</p><small>Keep this moment close ✦</small></article>
        <p className="story-copy">Keep being the warm, wonderful person you are.</p>
        <button className="text-button" type="button" onClick={replay}>Replay our little story <span>↻</span></button>
      </motion.section>}
    </main>
  );
}
