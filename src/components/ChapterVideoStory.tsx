"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { ChapterVideoConfig, ChapterVideoStage, ProductOffer } from "@/lib/baerskin-content";
import { publicAssetPath } from "@/lib/public-asset-path";

type ChapterVideoStoryProps = {
  config: ChapterVideoConfig;
  offer: ProductOffer;
  stages: ChapterVideoStage[];
};

const wheelThreshold = 14;
const touchThreshold = 38;
const chapterPlaybackRate = 1.25;
const pausePadding = 0.035;

function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return reducedMotion;
}

function clampIndex(index: number, stages: ChapterVideoStage[]) {
  return Math.min(stages.length - 1, Math.max(0, index));
}

function getRailProgress(currentTime: number, stages: ChapterVideoStage[]) {
  if (stages.length <= 1) {
    return 0;
  }

  if (currentTime <= (stages[0]?.time ?? 0)) {
    return 0;
  }

  for (let index = 0; index < stages.length - 1; index += 1) {
    const startTime = stages[index]?.time ?? 0;
    const endTime = stages[index + 1]?.time ?? startTime;

    if (currentTime <= endTime) {
      const span = Math.max(0.001, endTime - startTime);
      const segmentProgress = Math.min(1, Math.max(0, (currentTime - startTime) / span));

      return (index + segmentProgress) / (stages.length - 1);
    }
  }

  return 1;
}

function getTimeForRailProgress(progress: number, stages: ChapterVideoStage[]) {
  if (stages.length <= 1) {
    return stages[0]?.time ?? 0;
  }

  const boundedProgress = Math.min(1, Math.max(0, progress));
  const exactIndex = boundedProgress * (stages.length - 1);
  const startIndex = Math.min(stages.length - 2, Math.floor(exactIndex));
  const segmentProgress = exactIndex - startIndex;
  const startTime = stages[startIndex]?.time ?? 0;
  const endTime = stages[startIndex + 1]?.time ?? startTime;

  return startTime + (endTime - startTime) * segmentProgress;
}

function formatStageId(id: string) {
  return id.replaceAll("-", " ");
}

function getChapterLabel(id: string) {
  const labels: Record<string, string> = {
    open: "Open",
    "product-logo": "Reveal",
    "engineered-cold": "Wet Cold",
    "engineered-proof": "Proof",
    "zip-layer": "Layers",
    "waterproof-zips": "Zips",
    "adjustable-wrists": "Wrists",
    "adjustable-hood": "Hood",
    "shoulder-pocket": "Pocket",
    packable: "Packable",
    "end-state": "Offer",
  };

  return labels[id] ?? formatStageId(id);
}

export function ChapterVideoStory({ config, offer, stages }: ChapterVideoStoryProps) {
  const videoSrc = publicAssetPath(config.src);
  const posterSrc = publicAssetPath(config.poster);
  const logoSrc = publicAssetPath("/baerskin/baerskin-logo.svg");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const activeIndexRef = useRef(0);
  const playingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const railDragRef = useRef<{ pointerId: number; progress: number } | null>(null);
  const autoIntroStartedRef = useRef(false);
  const userInteractedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [railProgress, setRailProgress] = useState(0);
  const [isRailDragging, setIsRailDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const reducedMotion = useReducedMotionPreference();
  const isFinalChapter = activeIndex === stages.length - 1 && railProgress >= 0.995 && !isPlaying;
  const progressStyle = {
    "--chapter-progress": railProgress,
  } as CSSProperties;

  const syncRailProgress = useCallback((progress: number) => {
    const nextProgress = Math.min(1, Math.max(0, progress));

    railRef.current?.style.setProperty("--chapter-progress", String(nextProgress));
    setRailProgress(nextProgress);
  }, []);

  const markUserInteraction = useCallback(() => {
    userInteractedRef.current = true;
  }, []);

  const getProgressFromRailPointer = useCallback((clientY: number) => {
    const rail = railRef.current;

    if (!rail) {
      return null;
    }

    const railRect = rail.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(rail);
    const railEndcap = Number.parseFloat(computedStyle.getPropertyValue("--rail-endcap")) || 0;
    const railStart = railRect.top + railEndcap;
    const railSpan = Math.max(1, railRect.height - railEndcap * 2);

    return Math.min(1, Math.max(0, (clientY - railStart) / railSpan));
  }, []);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const settleAt = useCallback(
    (index: number) => {
      const video = videoRef.current;
      const nextIndex = clampIndex(index, stages);
      const nextTime = stages[nextIndex]?.time ?? 0;

      stopAnimation();
      playingRef.current = false;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      syncRailProgress(stages.length > 1 ? nextIndex / (stages.length - 1) : 0);
      setIsPlaying(false);

      if (video) {
        video.pause();
        video.playbackRate = 1;
        video.currentTime = Math.min(config.duration - 0.05, nextTime);
      }
    },
    [config.duration, stages, stopAnimation, syncRailProgress],
  );

  const scrubToProgress = useCallback(
    (progress: number) => {
      const video = videoRef.current;
      const boundedProgress = Math.min(1, Math.max(0, progress));
      const nearestIndex = clampIndex(Math.round(boundedProgress * (stages.length - 1)), stages);

      stopAnimation();
      playingRef.current = false;
      activeIndexRef.current = nearestIndex;
      setActiveIndex(nearestIndex);
      setIsPlaying(false);
      syncRailProgress(boundedProgress);

      if (video) {
        video.pause();
        video.playbackRate = 1;
        video.currentTime = Math.min(config.duration - 0.05, getTimeForRailProgress(boundedProgress, stages));
      }
    },
    [config.duration, stages, stopAnimation, syncRailProgress],
  );

  const animateBackward = useCallback(
    (nextIndex: number) => {
      const video = videoRef.current;
      const targetTime = stages[nextIndex]?.time ?? 0;

      if (!video) {
        return;
      }

      const fromTime = video.currentTime;
      const startedAt = performance.now();

      const tick = (now: number) => {
        const elapsed = ((now - startedAt) / 1000) * chapterPlaybackRate;
        const nextTime = Math.max(targetTime, fromTime - elapsed);
        video.currentTime = nextTime;
        syncRailProgress(getRailProgress(nextTime, stages));

        if (nextTime <= targetTime + pausePadding) {
          settleAt(nextIndex);
          return;
        }

        rafRef.current = window.requestAnimationFrame(tick);
      };

      rafRef.current = window.requestAnimationFrame(tick);
    },
    [settleAt, stages, syncRailProgress],
  );

  const playForward = useCallback(
    async (nextIndex: number) => {
      const video = videoRef.current;
      const targetTime = stages[nextIndex]?.time ?? 0;

      if (!video) {
        return;
      }

      const tick = () => {
        syncRailProgress(getRailProgress(video.currentTime, stages));

        if (video.currentTime >= targetTime - pausePadding || video.ended) {
          settleAt(nextIndex);
          return;
        }

        rafRef.current = window.requestAnimationFrame(tick);
      };

      try {
        video.muted = true;
        video.playbackRate = chapterPlaybackRate;
        await video.play();
        rafRef.current = window.requestAnimationFrame(tick);
      } catch {
        video.playbackRate = 1;
        settleAt(nextIndex);
      }
    },
    [settleAt, stages, syncRailProgress],
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      const video = videoRef.current;
      const clampedIndex = clampIndex(nextIndex, stages);
      const targetTime = stages[clampedIndex]?.time ?? 0;

      if (!video || reducedMotion) {
        return;
      }

      if (
        !playingRef.current &&
        clampedIndex === activeIndexRef.current &&
        Math.abs(video.currentTime - targetTime) <= pausePadding
      ) {
        return;
      }

      stopAnimation();
      video.pause();
      video.playbackRate = 1;
      playingRef.current = false;
      setIsPlaying(false);

      if (Math.abs(video.currentTime - targetTime) <= pausePadding) {
        settleAt(clampedIndex);
        return;
      }

      playingRef.current = true;
      setIsPlaying(true);

      if (targetTime > video.currentTime) {
        void playForward(clampedIndex);
        return;
      }

      animateBackward(clampedIndex);
    },
    [animateBackward, playForward, reducedMotion, settleAt, stages, stopAnimation],
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      goTo(activeIndexRef.current + direction);
    },
    [goTo],
  );

  const handleRailPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (reducedMotion || (event.pointerType === "mouse" && event.button !== 0)) {
        return;
      }

      markUserInteraction();

      const nextProgress = getProgressFromRailPointer(event.clientY);

      if (nextProgress === null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      railDragRef.current = { pointerId: event.pointerId, progress: nextProgress };
      setIsRailDragging(true);
      scrubToProgress(nextProgress);
    },
    [getProgressFromRailPointer, markUserInteraction, reducedMotion, scrubToProgress],
  );

  const handleRailPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = railDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      const nextProgress = getProgressFromRailPointer(event.clientY);

      if (nextProgress === null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      drag.progress = nextProgress;
      scrubToProgress(nextProgress);
    },
    [getProgressFromRailPointer, scrubToProgress],
  );

  const handleRailPointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = railDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      railDragRef.current = null;
      setIsRailDragging(false);
    },
    [],
  );

  const handleRailKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (reducedMotion) {
        return;
      }

      markUserInteraction();

      const currentStep = railProgress * (stages.length - 1);
      let nextIndex: number | null = null;

      if (["ArrowDown", "ArrowRight", "PageDown"].includes(event.key)) {
        nextIndex = Math.min(stages.length - 1, Math.floor(currentStep) + 1);
      }

      if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
        nextIndex = Math.max(0, Math.ceil(currentStep) - 1);
      }

      if (event.key === "Home") {
        nextIndex = 0;
      }

      if (event.key === "End") {
        nextIndex = stages.length - 1;
      }

      if (nextIndex === null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      scrubToProgress(stages.length > 1 ? nextIndex / (stages.length - 1) : 0);
    },
    [markUserInteraction, railProgress, reducedMotion, scrubToProgress, stages.length],
  );

  useEffect(() => {
    const video = videoRef.current;

    if (!video || reducedMotion) {
      return;
    }

    const syncInitialFrame = () => {
      video.currentTime = stages[0]?.time ?? 0;
    };

    if (video.readyState >= 1) {
      syncInitialFrame();
      return;
    }

    video.addEventListener("loadedmetadata", syncInitialFrame, { once: true });

    return () => video.removeEventListener("loadedmetadata", syncInitialFrame);
  }, [reducedMotion, stages]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || reducedMotion) {
      return;
    }

    const syncFromPlaybackClock = () => {
      if (playingRef.current) {
        syncRailProgress(getRailProgress(video.currentTime, stages));
      }
    };

    video.addEventListener("timeupdate", syncFromPlaybackClock);

    return () => video.removeEventListener("timeupdate", syncFromPlaybackClock);
  }, [reducedMotion, stages, syncRailProgress]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || reducedMotion || stages.length < 2) {
      return;
    }

    let introTimer: number | null = null;

    const startIntro = () => {
      if (introTimer !== null || autoIntroStartedRef.current || userInteractedRef.current) {
        return;
      }

      introTimer = window.setTimeout(() => {
        if (autoIntroStartedRef.current || userInteractedRef.current || activeIndexRef.current !== 0 || playingRef.current) {
          return;
        }

        autoIntroStartedRef.current = true;
        goTo(1);
      }, 200);
    };

    if (video.readyState >= 1) {
      startIntro();
    } else {
      video.addEventListener("loadedmetadata", startIntro, { once: true });
    }

    return () => {
      video.removeEventListener("loadedmetadata", startIntro);

      if (introTimer !== null) {
        window.clearTimeout(introTimer);
      }
    };
  }, [goTo, reducedMotion, stages.length]);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < wheelThreshold) {
        return;
      }

      event.preventDefault();
      markUserInteraction();
      step(event.deltaY > 0 ? 1 : -1);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const nextKeys = new Set(["ArrowDown", "PageDown", " ", "Enter"]);
      const previousKeys = new Set(["ArrowUp", "PageUp"]);

      if (nextKeys.has(event.key)) {
        event.preventDefault();
        markUserInteraction();
        step(1);
      }

      if (previousKeys.has(event.key)) {
        event.preventDefault();
        markUserInteraction();
        step(-1);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.target instanceof Element && event.target.closest(".chapter-video-rail")) {
        return;
      }

      markUserInteraction();
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.target instanceof Element && event.target.closest(".chapter-video-rail")) {
        touchStartYRef.current = null;
        return;
      }

      const startY = touchStartYRef.current;
      const endY = event.changedTouches[0]?.clientY;
      touchStartYRef.current = null;

      if (startY === null || endY === undefined || Math.abs(startY - endY) < touchThreshold) {
        return;
      }

      event.preventDefault();
      step(startY > endY ? 1 : -1);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      stopAnimation();
    };
  }, [markUserInteraction, reducedMotion, step, stopAnimation]);

  if (reducedMotion) {
    return (
      <section className="chapter-video-shell" aria-label="Rain jacket film poster">
        <Image alt="BÆRSkin rain jacket video poster." fill priority sizes="100vw" src={posterSrc} />
        <div className="chapter-commerce-top">
          <span className="chapter-brand-logo">
            <Image alt="BÆRSkin" height={18} priority src={logoSrc} width={132} />
          </span>
        </div>
        <div className="chapter-final-offer is-visible">
          <p>{offer.discountLabel}</p>
          <strong>{offer.salePrice}</strong>
          <span>{offer.compareAtPrice} · 4.5/5 Trustpilot</span>
          <a href={offer.ctaUrl}>Shop Rain Jacket</a>
        </div>
      </section>
    );
  }

  return (
    <section className={`chapter-video-shell ${isPlaying ? "is-playing" : ""}`} aria-label="Chaptered rain jacket product film">
      <Image
        alt=""
        className={`chapter-video-poster ${hasFrame ? "is-hidden" : ""}`}
        fill
        priority
        sizes="100vw"
        src={posterSrc}
      />
      <video
        ref={videoRef}
        className="chapter-video"
        muted
        onLoadedData={() => setHasFrame(true)}
        playsInline
        preload="auto"
        poster={posterSrc}
        src={videoSrc}
      />
      <div
        className="chapter-video-hit-area"
        onClick={() => {
          markUserInteraction();
          step(1);
        }}
      />
      <div className="chapter-commerce-top">
        <span className="chapter-brand-logo">
          <Image alt="BÆRSkin" height={18} priority src={logoSrc} width={132} />
        </span>
      </div>
      <div
        ref={railRef}
        className={`chapter-video-rail ${isRailDragging ? "is-dragging" : ""}`}
        aria-label="Video timeline"
        aria-orientation="vertical"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(railProgress * 100)}
        aria-valuetext={`${getChapterLabel(stages[activeIndex]?.id ?? "")}, ${Math.round(railProgress * 100)} percent`}
        onPointerCancel={handleRailPointerEnd}
        onPointerDown={handleRailPointerDown}
        onPointerMove={handleRailPointerMove}
        onPointerUp={handleRailPointerEnd}
        onKeyDown={handleRailKeyDown}
        role="slider"
        style={progressStyle}
        tabIndex={0}
      >
        <span className="chapter-video-thumb" aria-hidden="true" />
        {stages.map((stage, index) => (
          <span
            key={stage.id}
            aria-current={index === activeIndex ? "step" : undefined}
            className={`chapter-video-dot ${index < activeIndex ? "is-complete" : ""} ${
              index === activeIndex ? "is-active" : ""
            }`}
          >
            <span className="chapter-video-label">{getChapterLabel(stage.id)}</span>
          </span>
        ))}
      </div>
      <button
        aria-label="Go to next video chapter"
        className={`chapter-next-cue ${isFinalChapter ? "is-hidden" : ""}`}
        onClick={() => {
          markUserInteraction();
          step(1);
        }}
        type="button"
      >
        <span aria-hidden="true" />
      </button>
      <a className={`chapter-sticky-cta ${isFinalChapter ? "is-hidden" : ""}`} href={offer.ctaUrl}>
        <span>Shop now</span>
        <strong>{offer.salePrice}</strong>
      </a>
      <div className={`chapter-final-offer ${isFinalChapter ? "is-visible" : ""}`} aria-hidden={!isFinalChapter}>
        <p>{offer.discountLabel}</p>
        <strong>{offer.salePrice}</strong>
        <span>
          {offer.compareAtPrice} · 4.5/5 · 52,678 reviews
        </span>
        <a href={offer.ctaUrl}>Shop Rain Jacket</a>
      </div>
    </section>
  );
}
