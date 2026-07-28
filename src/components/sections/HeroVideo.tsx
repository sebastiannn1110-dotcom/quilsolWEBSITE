"use client";

import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const mobileVideoSource = "/videos/quicksol-home-hero-mobile.mp4";
const desktopVideoSource = "/videos/quicksol-home-hero.mp4";

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

export function HeroVideo({ label }: { label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mobileViewport = window.matchMedia("(max-width: 767px)");
    let activeSource = "";
    let usingFallback = false;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playVideo = async () => {
      if (reducedMotion || document.hidden) return;

      try {
        await video.play();
        setPlaybackBlocked(false);
      } catch {
        setPlaybackBlocked(true);
      }
    };

    const loadVideoSource = () => {
      const nextSource =
        mobileViewport.matches && !usingFallback
          ? mobileVideoSource
          : desktopVideoSource;

      if (activeSource === nextSource) {
        void playVideo();
        return;
      }

      activeSource = nextSource;
      video.pause();
      video.src = nextSource;
      video.load();
    };

    const recoverFromSourceError = () => {
      if (activeSource === mobileVideoSource && !usingFallback) {
        usingFallback = true;
        loadVideoSource();
      } else {
        setPlaybackBlocked(true);
      }
    };

    const resumeWhenVisible = () => void playVideo();
    const resumeAfterInteraction = () => void playVideo();

    video.addEventListener("loadeddata", playVideo);
    video.addEventListener("canplay", playVideo);
    video.addEventListener("error", recoverFromSourceError);
    const legacyMobileViewport = mobileViewport as LegacyMediaQueryList;

    if (typeof mobileViewport.addEventListener === "function") {
      mobileViewport.addEventListener("change", loadVideoSource);
    } else {
      legacyMobileViewport.addListener?.(loadVideoSource);
    }
    document.addEventListener("visibilitychange", resumeWhenVisible);
    window.addEventListener("pointerdown", resumeAfterInteraction, {
      once: true,
      passive: true,
    });
    window.addEventListener("touchstart", resumeAfterInteraction, {
      once: true,
      passive: true,
    });

    loadVideoSource();

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.removeEventListener("loadeddata", playVideo);
      video.removeEventListener("canplay", playVideo);
      video.removeEventListener("error", recoverFromSourceError);
      if (typeof mobileViewport.removeEventListener === "function") {
        mobileViewport.removeEventListener("change", loadVideoSource);
      } else {
        legacyMobileViewport.removeListener?.(loadVideoSource);
      }
      document.removeEventListener("visibilitychange", resumeWhenVisible);
      window.removeEventListener("pointerdown", resumeAfterInteraction);
      window.removeEventListener("touchstart", resumeAfterInteraction);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        className="h-full w-full object-cover object-center"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/videos/quicksol-home-hero-poster.webp"
        aria-label={label}
        disablePictureInPicture
      />
      {playbackBlocked && !reducedMotionEnabled() ? (
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;

            if (!video) return;

            video.muted = true;
            void video
              .play()
              .then(() => setPlaybackBlocked(false))
              .catch(() => setPlaybackBlocked(true));
          }}
          className="focus-ring absolute bottom-5 right-5 z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/35 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur"
        >
          <Play aria-hidden="true" className="h-4 w-4 fill-current" />
          Play video
        </button>
      ) : null}
    </div>
  );
}

function reducedMotionEnabled() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
