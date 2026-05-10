import createGlobe from "cobe";
import { useSpring } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface GlobeProps {
  width: number;
  height: number;
  baseColor: string;
  markerColor: string;
  glowColor: string;
  scale: number;
  darkness: number;
  lightIntensity: number;
  rotationSpeed: number;
  userLocation?: { lat: number; long: number };
}

type CustomMarker = {
  location: [number, number];
  size: number;
  isUser?: boolean;
  offset: number;
};

const hexToRgb = (hex: string): [number, number, number] => {
  if (!hex) return [0, 0, 0];
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};

const Globe: React.FC<GlobeProps> = ({
  width,
  height,
  baseColor,
  markerColor,
  glowColor,
  scale,
  darkness,
  lightIntensity,
  rotationSpeed,
  userLocation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasOpacity, setCanvasOpacity] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // Live-update ref — onRender reads from here, so NO globe recreate on visual prop changes
  const liveProps = useRef({
    baseColor: hexToRgb(baseColor),
    markerColor: hexToRgb(markerColor),
    glowColor: hexToRgb(glowColor),
    scale,
    darkness,
    lightIntensity,
    rotationSpeed,
    prefersReducedMotion,
  });

  // Keep liveProps in sync on every render (no effect needed)
  liveProps.current = {
    baseColor: hexToRgb(baseColor),
    markerColor: hexToRgb(markerColor),
    glowColor: hexToRgb(glowColor),
    scale,
    darkness,
    lightIntensity,
    rotationSpeed,
    prefersReducedMotion,
  };

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const locationToAngles = (lat: number, long: number): [number, number] => {
    return [(Math.PI / 180) * lat, (Math.PI / 180) * long];
  };
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  const r = useSpring(0, {
    mass: 1,
    stiffness: 280,
    damping: 40,
  });

  // Globe is created ONCE (or when userLocation changes) — visual props update live via liveProps ref
  useEffect(() => {
    let phi = 0;
    let canvasWidth = 0;
    const onResize = () =>
      canvasRef.current &&
      (canvasWidth = canvasRef.current.offsetWidth || width);
    window.addEventListener("resize", onResize);
    onResize();
    if (canvasWidth === 0) canvasWidth = width;

    if (!canvasRef.current) return;

    let initialPhi = 0;
    let initialTheta = 0.3;

    const baseMarkers: Omit<CustomMarker, "offset">[] = [
      { location: [37.7595, -122.4367], size: 0.03 },
      { location: [40.7128, -74.006], size: 0.1 },
      { location: [51.5074, -0.1278], size: 0.1 },
      { location: [25.2048, 55.2708], size: 0.1 },
      { location: [35.6762, 139.6503], size: 0.1 },
      { location: [-33.8688, 151.2093], size: 0.05 },
    ];

    const markers: CustomMarker[] = baseMarkers.map((m) => ({
      ...m,
      offset: Math.random() * Math.PI * 2,
    }));

    if (userLocation) {
      const [theta, phi] = locationToAngles(
        userLocation.lat,
        userLocation.long,
      );
      initialPhi = phi;
      initialTheta = theta;
      markers.push({
        location: [userLocation.lat, userLocation.long],
        size: 0.1,
        isUser: true,
        offset: 0,
      });
    }

    const props = liveProps.current;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: canvasWidth * 2,
      height: canvasWidth * 2,
      phi: initialPhi,
      theta: initialTheta,
      dark: props.darkness,
      diffuse: props.lightIntensity,
      mapSamples: 16000,
      mapBrightness: 3,
      baseColor: props.baseColor,
      markerColor: props.markerColor,
      glowColor: props.glowColor,
      markers,
      scale: props.scale,
      onRender: (state) => {
        // Read all visual props from liveProps ref — updates without recreating globe
        const live = liveProps.current;
        state.phi = phi + r.get();
        phi += live.prefersReducedMotion ? 0 : live.rotationSpeed;
        state.width = canvasWidth * 2;
        state.height = canvasWidth * 2;
        state.dark = live.darkness;
        state.diffuse = live.lightIntensity;
        state.baseColor = live.baseColor;
        state.markerColor = live.markerColor;
        state.glowColor = live.glowColor;
        state.scale = live.scale;

        if (!live.prefersReducedMotion) {
          const t = Date.now() / 1500;
          markers.forEach((marker: CustomMarker) => {
            if (marker.isUser) {
              marker.size = 0.1 + Math.abs(Math.sin(t * 3)) * 0.08;
            } else {
              marker.size = 0.05 + Math.sin(t * 2 + marker.offset) * 0.02;
            }
          });
        }
      },
    });

    setTimeout(() => setCanvasOpacity(1));

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
    // Only recreate when userLocation changes — all visual props update via liveProps ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  return (
    <div
      style={{
        width,
        height,
        aspectRatio: 1,
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current =
            e.clientX - pointerInteractionMovement.current;
          canvasRef.current && (canvasRef.current.style.cursor = "grabbing");
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          canvasRef.current && (canvasRef.current.style.cursor = "grab");
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          canvasRef.current && (canvasRef.current.style.cursor = "grab");
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            r.set(delta / 200);
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            r.set(delta / 100);
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          contain: "layout paint size",
          opacity: canvasOpacity,
          transition: "opacity 1s ease",
        }}
      />
    </div>
  );
};

export default Globe;
