import React from "react";
import Globe from "@/components/ui/Globe";
import type { GlobeSettings } from "@/types";

/* ─── TYPES ──────────────────────────────────────────────────────────────── */
interface HeroGlobeProps {
  globeSettings?: GlobeSettings | null;
}

/* ─── GCC HEALTHCARE HUBS (top 4 only — clean layout) ────────────────────── */
const gccHubs = [
  { city: "Abu Dhabi", flag: "🇦🇪", label: "DOH" },
  { city: "Riyadh", flag: "🇸🇦", label: "CBAHI" },
  { city: "Dubai", flag: "🇦🇪", label: "DHA" },
  { city: "Muscat", flag: "🇴🇲", label: "HQ" },
];

/* Card positions — corners, well inside the container */
const cardPositions = [
  { top: "6%", left: "4%" },
  { top: "10%", right: "2%" },
  { bottom: "12%", left: "2%" },
  { bottom: "6%", right: "4%" },
];

/* ─── MAIN HERO GLOBE ────────────────────────────────────────────────────── */
const HeroGlobe: React.FC<HeroGlobeProps> = ({ globeSettings }) => {
  /* Bright, visible globe settings — the globe should POP */
  const landingDefaults: GlobeSettings = {
    baseColor: "#1e3a5f" /* visible blue-slate — NOT invisible dark */,
    markerColor: "#2dd4bf" /* bright teal markers */,
    glowColor: "#14b8a6" /* teal atmospheric glow */,
    scale: 2.2,
    darkness: 0.4 /* much lower = brighter globe */,
    lightIntensity: 2.5 /* stronger light */,
    rotationSpeed: 0.004,
  };

  const settings = globeSettings || landingDefaults;

  return (
    <div className="relative w-[480px] h-[480px]">
      {/* ── Layered glow behind globe ─────────────────────────── */}
      {/* Outermost soft halo */}
      <div
        className="absolute -inset-20 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(20,184,166,0.12) 0%, rgba(20,184,166,0.04) 40%, transparent 70%)",
        }}
      />
      {/* Mid glow — teal/blue blend */}
      <div
        className="absolute -inset-10 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(45,212,191,0.15) 0%, rgba(59,130,246,0.06) 50%, transparent 70%)",
        }}
      />
      {/* Inner bright rim glow */}
      <div
        className="absolute -inset-1 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(20,184,166,0.08) 60%, rgba(20,184,166,0.2) 80%, transparent 100%)",
        }}
      />

      {/* ── Single subtle orbit ring ──────────────────────────── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: 540,
          height: 540,
          animation: "heroSpin 80s linear infinite",
        }}
      >
        <svg width={540} height={540} viewBox="0 0 540 540" fill="none">
          <circle
            cx="270"
            cy="270"
            r="268"
            stroke="url(#heroOrbitGrad)"
            strokeWidth="1"
            strokeDasharray="8 12"
            opacity="0.35"
          />
          <defs>
            <linearGradient
              id="heroOrbitGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── The Globe ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-10">
        <Globe
          width={480}
          height={480}
          {...settings}
          userLocation={{ lat: 23.588, long: 58.3829 }}
        />
      </div>

      {/* ── Floating city cards (4 cards, clean positions) ────── */}
      {gccHubs.map((hub, i) => (
        <div
          key={hub.city}
          className="absolute z-20 pointer-events-none"
          style={{
            ...cardPositions[i],
            animation: `heroFloat 5s ease-in-out ${i * 0.8}s infinite`,
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.08] backdrop-blur-md border border-white/[0.12] shadow-lg shadow-black/30">
            <span className="text-sm leading-none">{hub.flag}</span>
            <div>
              <div className="text-[11px] font-bold text-white leading-tight">
                {hub.city}
              </div>
              <div className="text-[9px] text-teal-300/70 font-medium leading-tight">
                {hub.label}
              </div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse ml-0.5" />
          </div>
        </div>
      ))}

      {/* ── Gradient border ring (thin, rotating) ─────────────── */}
      <div
        className="absolute inset-[-1px] rounded-full pointer-events-none z-20"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, rgba(20,184,166,0.25) 25%, transparent 50%, rgba(59,130,246,0.15) 75%, transparent 100%)",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 1px), black calc(100% - 1px))",
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 1px), black calc(100% - 1px))",
          animation: "heroSpin 25s linear infinite",
        }}
      />
    </div>
  );
};

export default HeroGlobe;
