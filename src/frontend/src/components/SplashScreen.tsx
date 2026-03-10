import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [logoVisible, setLogoVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Fade in the logo shortly after mount
    const fadeInTimer = setTimeout(() => setLogoVisible(true), 100);

    // Start fade-out after 2.2s
    const fadeOutTimer = setTimeout(() => setFadingOut(true), 2200);

    // Unmount after fade-out completes (2.2s + 0.6s transition)
    const doneTimer = setTimeout(() => onComplete(), 2800);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      data-ocid="splash.panel"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(160deg, #EEF6FF 0%, #F0F8FF 50%, #E8F4FF 100%)",
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 0.6s ease-in-out",
        pointerEvents: fadingOut ? "none" : "all",
      }}
    >
      {/* Subtle ambient glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(91,200,245,0.18) 0%, rgba(255,64,129,0.07) 60%, transparent 100%)",
          opacity: logoVisible ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* Logo */}
      <img
        src="/assets/uploads/6fcf29bb-9597-4445-8644-a3a4e0ecf0e8_removalai_preview-1.png"
        alt="Arvis"
        style={{
          width: 200,
          height: 200,
          objectFit: "contain",
          opacity: logoVisible ? 1 : 0,
          transform: logoVisible
            ? "scale(1) translateY(0)"
            : "scale(0.88) translateY(8px)",
          transition:
            "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
          position: "relative",
          zIndex: 1,
          filter:
            "drop-shadow(0 8px 32px rgba(91,200,245,0.25)) drop-shadow(0 2px 8px rgba(255,64,129,0.12))",
        }}
      />
    </div>
  );
}
