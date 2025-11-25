
import React, { useEffect, useRef, useMemo } from 'react';
import createGlobe from 'cobe';
import { useSpring } from 'framer-motion';

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
  offset: number; // For asynchronous blinking
};

const hexToRgb = (hex: string): [number, number, number] => {
    if (!hex) return [0, 0, 0]; // Fallback to black if hex is undefined
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
};

const Globe: React.FC<GlobeProps> = ({ width, height, baseColor, markerColor, glowColor, scale, darkness, lightIntensity, rotationSpeed, userLocation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const locationToAngles = (lat: number, long: number): [number, number] => {
    return [Math.PI / 180 * lat, Math.PI / 180 * long];
  }
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  
  const r = useSpring(0, {
    mass: 1,
    stiffness: 280,
    damping: 40,
  });

  const rgbBaseColor = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const rgbMarkerColor = useMemo(() => hexToRgb(markerColor), [markerColor]);
  const rgbGlowColor = useMemo(() => hexToRgb(glowColor), [glowColor]);


  useEffect(() => {
    let phi = 0;
    let canvasWidth = 0;
    const onResize = () => canvasRef.current && (canvasWidth = canvasRef.current.offsetWidth)
    window.addEventListener('resize', onResize)
    onResize()

    if (!canvasRef.current) return;
    
    let initialPhi = 0;
    let initialTheta = 0.3;

    const baseMarkers: Omit<CustomMarker, 'offset'>[] = [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.0060], size: 0.1 },
        { location: [51.5074, -0.1278], size: 0.1 },
        { location: [25.2048, 55.2708], size: 0.1 },
        { location: [35.6762, 139.6503], size: 0.1 },
        { location: [-33.8688, 151.2093], size: 0.05 },
    ];

    const markers: CustomMarker[] = baseMarkers.map(m => ({ ...m, offset: Math.random() * Math.PI * 2 }));
    
    if (userLocation) {
        const [theta, phi] = locationToAngles(userLocation.lat, userLocation.long);
        initialPhi = phi;
        initialTheta = theta;
        markers.push({ location: [userLocation.lat, userLocation.long], size: 0.1, isUser: true, offset: 0 });
    }

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: canvasWidth * 2,
      height: canvasWidth * 2,
      phi: initialPhi,
      theta: initialTheta,
      dark: darkness,
      diffuse: lightIntensity,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: rgbBaseColor,
      markerColor: rgbMarkerColor,
      glowColor: rgbGlowColor,
      markers: markers,
      scale: scale,
      onRender: (state) => {
        state.phi = phi + r.get();
        phi += rotationSpeed;
        state.width = canvasWidth * 2;
        state.height = canvasWidth * 2;
        
        const t = Date.now() / 1500;
        markers.forEach((marker: CustomMarker) => {
            if (marker.isUser) {
                // Prominent pulse for user's location to create a "glow"
                marker.size = 0.1 + Math.abs(Math.sin(t * 3)) * 0.08;
            } else {
                // Subtle twinkle for other locations
                marker.size = 0.05 + Math.sin(t * 2 + marker.offset) * 0.02;
            }
        });
      }
    });

    setTimeout(() => canvasRef.current && (canvasRef.current.style.opacity = '1'));

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    }
  }, [rgbBaseColor, rgbMarkerColor, rgbGlowColor, scale, darkness, lightIntensity, rotationSpeed, r, userLocation]);

  return (
    <div style={{ width, height, aspectRatio: 1, maxWidth: '100%', maxHeight: '100%' }}>
        <canvas
            ref={canvasRef}
            onPointerDown={(e) => {
              pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
              canvasRef.current && (canvasRef.current.style.cursor = 'grabbing');
            }}
            onPointerUp={() => {
              pointerInteracting.current = null;
              canvasRef.current && (canvasRef.current.style.cursor = 'grab');
            }}
            onPointerOut={() => {
              pointerInteracting.current = null;
              canvasRef.current && (canvasRef.current.style.cursor = 'grab');
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
                width: '100%',
                height: '100%',
                cursor: 'grab',
                contain: 'layout paint size',
                opacity: 0,
                transition: 'opacity 1s ease',
            }}
        />
    </div>
  );
};

export default Globe;