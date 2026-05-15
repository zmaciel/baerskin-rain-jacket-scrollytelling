"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ProductOffer, ScrollVideoConfig, ScrollVideoStage } from "@/lib/baerskin-content";
import { proof } from "@/lib/baerskin-content";

type ScrollVideoStoryProps = {
  config: ScrollVideoConfig;
  offer: ProductOffer;
  stages: ScrollVideoStage[];
  videoOnly?: boolean;
};

type DrawMode = "cover" | "portrait";

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

function frameSrc(pattern: string, index: number) {
  return pattern.replace("%04d", String(index + 1).padStart(4, "0"));
}

function coverRect(canvasWidth: number, canvasHeight: number, imageWidth: number, imageHeight: number) {
  const canvasRatio = canvasWidth / canvasHeight;
  const imageRatio = imageWidth / imageHeight;
  const width = imageRatio > canvasRatio ? canvasHeight * imageRatio : canvasWidth;
  const height = imageRatio > canvasRatio ? canvasHeight : canvasWidth / imageRatio;

  return {
    height,
    width,
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
  };
}

function containPortraitRect(canvasWidth: number, canvasHeight: number, imageWidth: number, imageHeight: number) {
  const imageRatio = imageWidth / imageHeight;
  const height = canvasHeight * 0.96;
  const width = height * imageRatio;
  const x = Math.min(canvasWidth - width - canvasWidth * 0.035, canvasWidth * 0.52);

  return {
    height,
    width,
    x: Math.max(canvasWidth * 0.38, x),
    y: (canvasHeight - height) / 2,
  };
}

function drawImageFrame(canvas: HTMLCanvasElement, image: HTMLImageElement, mode: DrawMode) {
  const context = canvas.getContext("2d");

  if (!context || !image.naturalWidth || !image.naturalHeight) {
    return;
  }

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const background = coverRect(canvasWidth, canvasHeight, image.naturalWidth, image.naturalHeight);

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "#e9f0e8";
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  if (mode === "portrait") {
    context.save();
    context.filter = "blur(24px)";
    context.globalAlpha = 0.58;
    context.drawImage(
      image,
      background.x - 56,
      background.y - 56,
      background.width + 112,
      background.height + 112,
    );
    context.restore();

    context.fillStyle = "rgba(245, 248, 242, 0.48)";
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    const portrait = containPortraitRect(canvasWidth, canvasHeight, image.naturalWidth, image.naturalHeight);
    context.save();
    context.shadowColor = "rgba(17, 21, 17, 0.22)";
    context.shadowBlur = 42;
    context.shadowOffsetY = 20;
    context.drawImage(image, portrait.x, portrait.y, portrait.width, portrait.height);
    context.restore();
    return;
  }

  context.drawImage(image, background.x, background.y, background.width, background.height);
}

function ScrollVideoFallback({ config, offer, stages, videoOnly }: ScrollVideoStoryProps) {
  if (videoOnly) {
    return (
      <section className="scroll-video-fallback scroll-video-fallback-video-only" aria-label="Rain jacket film poster">
        <div className="scroll-video-fallback-visual">
          <Image alt="BÆRSkin rain jacket film poster." fill priority sizes="100vw" src={config.poster} />
        </div>
      </section>
    );
  }

  return (
    <section className="scroll-video-fallback" aria-label="Rain jacket film summary">
      <div className="scroll-video-fallback-visual">
        <Image alt="BÆRSkin rain jacket film poster." height={1280} sizes="(min-width: 900px) 34vw, 92vw" src={config.poster} width={720} />
      </div>
      <div className="scroll-video-fallback-copy">
        <p>{stages[0]?.eyebrow}</p>
        <h2>{stages[0]?.headline}</h2>
        {stages.slice(1).map((stage) => (
          <article key={`${stage.id}-fallback`}>
            <strong>{stage.stat ?? stage.eyebrow}</strong>
            <span>{stage.headline}</span>
          </article>
        ))}
        <a href={offer.ctaUrl}>Shop {offer.salePrice}</a>
      </div>
    </section>
  );
}

export function ScrollVideoStory({ config, offer, stages, videoOnly = false }: ScrollVideoStoryProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRefs = useRef<HTMLImageElement[]>([]);
  const loadedFramesRef = useRef<Set<number>>(new Set());
  const currentFrameRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const reducedMotion = useReducedMotionPreference();
  const activeStage = stages[activeIndex] ?? stages[0];
  const frameSources = useMemo(
    () => Array.from({ length: config.frameCount }, (_, index) => frameSrc(config.framePattern, index)),
    [config.frameCount, config.framePattern],
  );
  const snapPoints = useMemo(
    () => stages.map((stage) => stage.frame / Math.max(1, config.frameCount - 1)),
    [config.frameCount, stages],
  );

  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      const image = imageRefs.current[frameIndex] ?? imageRefs.current[currentFrameRef.current] ?? imageRefs.current[0];

      if (!canvas || !image?.complete) {
        return;
      }

      currentFrameRef.current = frameIndex;
      drawImageFrame(canvas, image, videoOnly || window.innerWidth < 820 ? "cover" : "portrait");
    },
    [videoOnly],
  );

  useEffect(() => {
    let cancelled = false;
    const loaded = new Set<number>();

    imageRefs.current = frameSources.map((src, index) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = src;
      image.onload = () => {
        if (cancelled) {
          return;
        }

        loaded.add(index);
        loadedFramesRef.current = loaded;
        setLoadedCount(loaded.size);

        if (index === 0 || index === currentFrameRef.current) {
          drawFrame(currentFrameRef.current);
        }
      };

      return image;
    });

    return () => {
      cancelled = true;
      imageRefs.current.forEach((image) => {
        image.onload = null;
      });
    };
  }, [drawFrame, frameSources]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      drawFrame(currentFrameRef.current);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [drawFrame]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const pin = pinRef.current;

    if (!section || !pin || reducedMotion) {
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${window.innerHeight * Math.max(4.8, stages.length * 0.92)}`,
      pin,
      scrub: 0.38,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: {
        snapTo: snapPoints,
        duration: { min: 0.08, max: 0.2 },
        ease: "power1.inOut",
        inertia: false,
      },
      onUpdate: (self) => {
        const frameIndex = Math.min(config.frameCount - 1, Math.max(0, Math.round(self.progress * (config.frameCount - 1))));
        const nextStageIndex = stages.reduce((active, stage, index) => (frameIndex >= stage.frame ? index : active), 0);

        drawFrame(frameIndex);
        setActiveIndex(nextStageIndex);
      },
    });

    return () => trigger.kill();
  }, [config.frameCount, drawFrame, reducedMotion, snapPoints, stages]);

  const progressStyle = {
    "--scroll-video-progress": Math.min(1, loadedCount / config.frameCount),
  } as CSSProperties;

  if (reducedMotion) {
    return <ScrollVideoFallback config={config} offer={offer} stages={stages} videoOnly={videoOnly} />;
  }

  return (
    <section
      className={`scroll-video-section ${videoOnly ? "is-video-only" : ""}`}
      ref={sectionRef}
      style={progressStyle}
      aria-label="Scroll-controlled product film"
    >
      <div className={`scroll-video-pin ${videoOnly ? "is-video-only" : ""}`} ref={pinRef}>
        <canvas className="scroll-video-canvas" ref={canvasRef} aria-hidden="true" />

        {videoOnly ? null : <div className="scroll-video-vignette" aria-hidden="true" />}

        {videoOnly ? null : (
          <article className="scroll-video-copy" aria-live="polite">
            <p>{activeStage.eyebrow}</p>
            {activeStage.stat ? <strong>{activeStage.stat}</strong> : null}
            <h2>{activeStage.headline}</h2>
            <span>{activeStage.body}</span>
            {activeStage.id === "offer" ? (
              <a className="scroll-video-main-cta" href={offer.ctaUrl}>
                Shop {offer.salePrice}
              </a>
            ) : null}
          </article>
        )}

        {videoOnly ? null : (
          <aside className={`scroll-video-offer ${activeStage.id === "offer" ? "is-active" : ""}`} aria-label="Offer details">
            <p>{proof.trustpilotLabel}</p>
            <strong>{offer.salePrice}</strong>
            <del>{offer.compareAtPrice}</del>
            <span>{offer.discountLabel}</span>
            <em>
              {proof.rating} from {proof.reviewCount}
            </em>
            <a href={offer.ctaUrl}>Shop now</a>
          </aside>
        )}

        {videoOnly ? null : (
          <div className="scroll-video-loader" aria-hidden="true">
            <span />
          </div>
        )}

        {videoOnly ? null : (
          <div className="scroll-video-nav" aria-hidden="true">
            {stages.map((stage, index) => (
              <i className={index === activeIndex ? "is-active" : ""} key={stage.id} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
