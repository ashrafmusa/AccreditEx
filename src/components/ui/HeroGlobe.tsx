import React, { useEffect, useState, useMemo } from "react";
import Globe from "@/components/ui/Globe";
import type { GlobeSettings } from "@/types";

/* ─── TYPES ──────────────────────────────────────────────────────────────── */
interface HeroGlobeProps {
  globeSettings?: GlobeSettings | null;
}

/* ─── GCC HEALTHCARE HUB DATA ────────────────────────────────────────────── */
const gccHubs = [
  {
    city: "Abu Dhabi",
    flag: "🇦🇪",
    lat: 24.4539,
    lng: 54.3773,
    label: "DOH HQ",
  },
  { city: "Riyadh", flag: "🇸🇦", lat: 24.7136, lng: 46.6753, label: "CBAHI" },
  { city: "Dubai", flag: "🇦🇪", lat: 25.2048, lng: 55.2708, label: "DHA" },
  { city: "Muscat", flag: "🇴🇲", lat: 23.588, lng: 58.3829, label: "HQ" },
  { city: "Doha", flag: "🇶🇦", lat: 25.2854, lng: 51.531, label: "PHCC" },
  { city: "Kuwait", flag: "🇰🇼", lat: 29.3759, lng: 47.9774, label: "MOH" },
];

/* ─── FLOATING CARD ──────────────────────────────────────────────────────── */
const FloatingCard: React.FC<{
  city: string;
  flag: string;
  label: string;
  position: string;
  delay: number;
}> = ({ city, flag, label, position, delay }) => (
  <div
    className={`absolute ${position} z-20 pointer-events-none`}
    style={{ animation: `heroFloat 6s ease-in-out ${delay}s infinite` }}
  >
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.07] backdrop-blur-md border border-white/[0.12] shadow-lg shadow-black/20">
      <span className="text-sm">{flag}</span>
      <div>
        <div className="text-[11px] font-bold text-white leading-none">
          {city}
        </div>
        <div className="text-[9px] text-teal-300/80 font-medium">{label}</div>
      </div>
      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
    </div>
  </div>
);

/* ─── ORBITING RING ──────────────────────────────────────────────────────── */
const OrbitRing: React.FC<{
  size: number;
  duration: number;
  opacity: number;
  dashArray?: string;
}> = ({ size, duration, opacity, dashArray }) => (
  <div
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      animation: `heroSpin ${duration}s linear infinite`,
      opacity,
    }}
  >
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 1}
        stroke="url(#orbitGradient)"
        strokeWidth="1"
        strokeDasharray={dashArray || "6 4"}
        opacity={0.6}
      />
      <defs>
        <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

/* ─── STATS ORBIT DOT ────────────────────────────────────────────────────── */
const OrbitDot: React.FC<{
  label: string;
  value: string;
  size: number;
  duration: number;
  startAngle: number;
}> = ({ label, value, size, duration, startAngle }) => {
  const [angle, setAngle] = useState(startAngle);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      setAngle(startAngle + (elapsed / duration) * 360);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [duration, startAngle]);

  const radius = size / 2;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <div
      className="absolute left-1/2 top-1/2 z-30 pointer-events-none"
      style={{
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
      }}
    >
      <div className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm border border-teal-500/20 shadow-lg">
        <span className="text-xs font-black text-teal-400 leading-none">
          {value}
        </span>
        <span className="text-[8px] text-white/50 font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
};

/* ─── ANIMATED CONNECTION LINES ──────────────────────────────────────────── */
const ConnectionLines: React.FC = () => (
  <svg
    className="absolute inset-0 w-full h-full z-10 pointer-events-none"
    viewBox="0 0 520 520"
    fill="none"
  >
    {/* Animated arc 1 — Muscat to Abu Dhabi */}
    <path
      d="M310 280 Q 280 200 260 230"
      stroke="url(#arcGrad1)"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.5"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="100"
        to="0"
        dur="3s"
        repeatCount="indefinite"
      />
    </path>
    <defs>
      <linearGradient id="arcGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
        <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* Pulse rings at center */}
    {[0, 1, 2].map((i) => (
      <circle
        key={i}
        cx="260"
        cy="260"
        r="40"
        fill="none"
        stroke="#14b8a6"
        strokeWidth="0.5"
        opacity="0"
      >
        <animate
          attributeName="r"
          from="40"
          to="200"
          dur="4s"
          begin={`${i * 1.3}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from="0.4"
          to="0"
          dur="4s"
          begin={`${i * 1.3}s`}
          repeatCount="indefinite"
        />
      </circle>
    ))}
  </svg>
);

/* ─── PARTICLE FIELD ─────────────────────────────────────────────────────── */
const ParticleField: React.FC = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 5,
        opacity: 0.15 + Math.random() * 0.25,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-teal-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `heroParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

/* ─── MAIN HERO GLOBE ────────────────────────────────────────────────────── */
const HeroGlobe: React.FC<HeroGlobeProps> = ({ globeSettings }) => {
  /* Landing-optimised defaults (teal/blue healthcare palette) */
  const landingDefaults: GlobeSettings = {
    baseColor: "#0f172a",
    markerColor: "#14b8a6",
    glowColor: "#0d9488",
    scale: 2.5,
    darkness: 0.85,
    lightIntensity: 1.5,
    rotationSpeed: 0.003,
  };

  const settings = globeSettings || landingDefaults;

  /* Card positions (clockwise around the globe) */
  const cardPositions = [
    "top-8 left-4",
    "top-24 -right-4",
    "-bottom-2 left-0",
    "bottom-20 -right-6",
    "top-1/2 -left-10 -translate-y-1/2",
    "top-44 -right-12",
  ];

  return (
    <div className="relative w-[520px] h-[520px]">
      {/* Outer ambient glow (multiple layers for depth) */}
      <div className="absolute -inset-16 rounded-full bg-teal-500/[0.04] blur-[80px] pointer-events-none" />
      <div className="absolute -inset-8 rounded-full bg-blue-500/[0.03] blur-[60px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/15 to-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Inner radial glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(20,184,166,0.12) 0%, transparent 60%)",
        }}
      />

      {/* Orbit rings */}
      <OrbitRing size={580} duration={60} opacity={0.3} dashArray="8 6" />
      <OrbitRing size={640} duration={90} opacity={0.15} dashArray="4 8" />

      {/* Particle field */}
      <ParticleField />

      {/* Connection lines & pulse rings */}
      <ConnectionLines />

      {/* The Globe — untouched core component */}
      <div className="absolute inset-0 z-10">
        <Globe
          width={520}
          height={520}
          {...settings}
          userLocation={{ lat: 23.588, long: 58.3829 }}
        />
      </div>

      {/* Orbiting stat badges */}
      <OrbitDot
        label="Standards"
        value="240+"
        size={500}
        duration={45}
        startAngle={0}
      />
      <OrbitDot
        label="AI Tools"
        value="15+"
        size={500}
        duration={45}
        startAngle={120}
      />
      <OrbitDot
        label="GCC Hubs"
        value="6"
        size={500}
        duration={45}
        startAngle={240}
      />

      {/* Floating city cards */}
      {gccHubs.map((hub, i) => (
        <FloatingCard
          key={hub.city}
          city={hub.city}
          flag={hub.flag}
          label={hub.label}
          position={cardPositions[i]}
          delay={i * 0.5}
        />
      ))}

      {/* Gradient border ring */}
      <div
        className="absolute inset-[-2px] rounded-full pointer-events-none z-20"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, rgba(20,184,166,0.3) 25%, transparent 50%, rgba(59,130,246,0.2) 75%, transparent 100%)",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 1.5px), black calc(100% - 1.5px))",
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 1.5px), black calc(100% - 1.5px))",
          animation: "heroSpin 20s linear infinite",
        }}
      />
    </div>
  );
};

export default HeroGlobe;
