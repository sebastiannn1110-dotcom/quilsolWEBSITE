"use client";

import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/constants";

const mediaVersion = "20260729-performance-audit";
const mobileVideoSource = `/videos/quicksol-home-hero-mobile.mp4?v=${mediaVersion}`;
const desktopVideoSource = `/videos/quicksol-home-hero.mp4?v=${mediaVersion}`;
const mobilePosterSource = `/videos/quicksol-home-hero-mobile-poster.webp?v=${mediaVersion}`;
const desktopPosterSource = `/videos/quicksol-home-hero-poster.webp?v=${mediaVersion}`;

const playLabels: Record<Locale, string> = {
  en: "Play video",
  es: "Reproducir video",
  zh: "播放视频",
  fr: "Lire la vidéo",
  de: "Video abspielen",
  ja: "動画を再生",
  ko: "동영상 재생",
};

export function HeroVideo({
  label,
  locale,
}: {
  label: string;
  locale: Locale;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const mobileViewport = window.matchMedia("(max-width: 767px)");
    let retryCount = 0;
    let retryTimer: number | undefined;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playVideo = async () => {
      if (document.hidden) return;

      try {
        await video.play();
        retryCount = 0;
        window.clearTimeout(retryTimer);
        setVideoPlaying(true);
        setPlaybackBlocked(false);
      } catch {
        retryCount += 1;

        if (retryCount <= 3) {
          window.clearTimeout(retryTimer);
          retryTimer = window.setTimeout(() => {
            void playVideo();
          }, retryCount * 350);
        } else {
          setPlaybackBlocked(true);
        }
      }
    };

    const revealPlayingVideo = () => {
      retryCount = 0;
      window.clearTimeout(retryTimer);
      setVideoPlaying(true);
      setPlaybackBlocked(false);
    };

    const reloadResponsiveSource = () => {
      setVideoPlaying(false);
      video.load();
      void playVideo();
    };

    const markPlaybackBlocked = () => setPlaybackBlocked(true);
    const resumeWhenVisible = () => {
      if (!document.hidden) void playVideo();
    };
    const resumeAfterInteraction = () => void playVideo();

    video.addEventListener("canplay", playVideo);
    video.addEventListener("playing", revealPlayingVideo);
    video.addEventListener("error", markPlaybackBlocked);
    mobileViewport.addEventListener("change", reloadResponsiveSource);
    document.addEventListener("visibilitychange", resumeWhenVisible);
    window.addEventListener("pageshow", resumeWhenVisible);
    window.addEventListener("pointerdown", resumeAfterInteraction, {
      once: true,
      passive: true,
    });
    window.addEventListener("touchstart", resumeAfterInteraction, {
      once: true,
      passive: true,
    });

    void playVideo();

    return () => {
      window.clearTimeout(retryTimer);
      video.pause();
      video.removeEventListener("canplay", playVideo);
      video.removeEventListener("playing", revealPlayingVideo);
      video.removeEventListener("error", markPlaybackBlocked);
      mobileViewport.removeEventListener("change", reloadResponsiveSource);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
      window.removeEventListener("pageshow", resumeWhenVisible);
      window.removeEventListener("pointerdown", resumeAfterInteraction);
      window.removeEventListener("touchstart", resumeAfterInteraction);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <picture
        className="absolute inset-0 block h-full w-full"
      >
        <source media="(max-width: 767px)" srcSet={mobilePosterSource} />
        {/* A native picture selects the correct poster before React hydrates. */}
        <img
          src={desktopPosterSource}
          alt=""
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
      </picture>
      <video
        ref={videoRef}
        className={`relative h-full w-full object-cover object-center transition-opacity duration-200 ${
          videoPlaying ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        disablePictureInPicture
      >
        <source
          media="(max-width: 767px)"
          src={mobileVideoSource}
          type="video/mp4"
        />
        <source
          media="(min-width: 768px)"
          src={desktopVideoSource}
          type="video/mp4"
        />
        <source src={desktopVideoSource} type="video/mp4" />
      </video>
      {playbackBlocked ? (
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
          {playLabels[locale]}
        </button>
      ) : null}
    </div>
  );
}
