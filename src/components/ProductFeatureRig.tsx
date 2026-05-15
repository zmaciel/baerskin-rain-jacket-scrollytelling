"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CSSProperties } from "react";
import type { ProductOffer, ProductRigFeature, ProductRigImage } from "@/lib/baerskin-content";
import { colorOptions } from "@/lib/baerskin-content";

type ProductFeatureRigProps = {
  features: ProductRigFeature[];
  images: ProductRigImage[];
  offer: ProductOffer;
};

const raindrops = Array.from({ length: 34 }, (_, index) => index);

export function ProductFeatureRig({ features, images, offer }: ProductFeatureRigProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const stage = stageRef.current;

    if (!section || !stage) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const context = gsap.context(() => {
      if (reduceMotion) {
        return;
      }

      const panels = gsap.utils.toArray<HTMLElement>(".rig-feature-panel");
      const products = gsap.utils.toArray<HTMLElement>(".product-layer");
      const dots = gsap.utils.toArray<HTMLElement>(".rig-step-dot");
      const jacket = stage.querySelector<HTMLElement>(".jacket-rig");
      const rain = stage.querySelector<HTMLElement>(".rain-field");
      const layerStack = stage.querySelector<HTMLElement>(".layer-stack");
      const packPouch = stage.querySelector<HTMLElement>(".pack-pouch");
      const isCompact = window.matchMedia("(max-width: 900px)").matches;

      if (!jacket) {
        return;
      }

      const getVisual = (feature: ProductRigFeature) => ({
        xPercent: isCompact ? feature.visual.x * 0.38 : feature.visual.x,
        yPercent: isCompact ? feature.visual.y * 0.42 : feature.visual.y,
        scale: isCompact ? Math.min(feature.visual.scale, 1.08) : feature.visual.scale,
        rotationY: isCompact ? feature.visual.rotateY * 0.62 : feature.visual.rotateY,
        rotationZ: feature.visual.rotateZ,
      });

      let activeIndex = -1;

      const activateFeature = (nextIndex: number) => {
        if (nextIndex === activeIndex) {
          return;
        }

        activeIndex = nextIndex;

        panels.forEach((panel, panelIndex) => {
          gsap.to(panel, {
            autoAlpha: panelIndex === nextIndex ? 1 : 0,
            y: panelIndex === nextIndex ? 0 : -18,
            duration: panelIndex === nextIndex ? 0.24 : 0.16,
            ease: "power2.out",
            overwrite: "auto",
          });
        });

        products.forEach((product) => {
          gsap.to(product, {
            autoAlpha: product.dataset.product === features[nextIndex]?.visual.product ? 1 : 0,
            duration: 0.28,
            ease: "power2.inOut",
            overwrite: "auto",
          });
        });

        dots.forEach((dot, dotIndex) => {
          gsap.to(dot, {
            autoAlpha: dotIndex === nextIndex ? 1 : 0.35,
            scale: dotIndex === nextIndex ? 1.28 : 1,
            duration: 0.18,
            overwrite: "auto",
          });
        });

        const nextFeature = features[nextIndex];
        gsap.to(rain, { autoAlpha: nextFeature?.id === "waterproof-shell" ? 1 : 0, duration: 0.24, overwrite: "auto" });
        gsap.to(layerStack, { autoAlpha: nextFeature?.id === "layer-system" ? 1 : 0, duration: 0.24, overwrite: "auto" });
        gsap.to(packPouch, {
          autoAlpha: nextFeature?.id === "packable-shell" ? 1 : 0,
          scale: nextFeature?.id === "packable-shell" ? 1 : 0.84,
          duration: 0.28,
          overwrite: "auto",
        });

        const panel = panels[nextIndex];
        if (panel) {
          gsap.fromTo(
            panel.querySelectorAll(".rig-line"),
            { strokeDashoffset: 280 },
            { strokeDashoffset: 0, duration: 0.42, stagger: 0.04, ease: "power2.out", overwrite: "auto" },
          );
          gsap.fromTo(
            panel.querySelectorAll(".rig-pin, .rig-callout-label"),
            { autoAlpha: 0, scale: 0.86 },
            { autoAlpha: 1, scale: 1, duration: 0.22, stagger: 0.035, ease: "back.out(1.4)", overwrite: "auto" },
          );
        }
      };

      gsap.set(products, { autoAlpha: 0 });
      gsap.set(panels, { autoAlpha: 0, y: 36 });
      gsap.set(dots, { autoAlpha: 0.35, scale: 1 });
      gsap.set([rain, layerStack, packPouch], { autoAlpha: 0 });
      gsap.set(jacket, {
        ...(features[0]
          ? getVisual(features[0])
          : {
              xPercent: 0,
              yPercent: 0,
              scale: 1,
              rotationY: 0,
              rotationZ: 0,
            }),
        transformPerspective: 1200,
      });
      gsap.set(stage, {
        "--stage-wash": features[0]?.visual.wash ?? "#f4f7f2",
        "--stage-tint": features[0]?.visual.tint ?? "#dbe7dd",
      });
      activateFeature(0);

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * (features.length - 1)}`,
          pin: stage,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: (progress) => Math.round(progress * (features.length - 1)) / (features.length - 1),
            duration: { min: 0.08, max: 0.24 },
            ease: "power1.inOut",
            inertia: false,
          },
          onUpdate: (self) => {
            const nextIndex = Math.round(self.progress * (features.length - 1));
            activateFeature(gsap.utils.clamp(0, features.length - 1, nextIndex));
          },
        },
      });

      features.forEach((feature, index) => {
        const transformDuration = 0.72;
        const at = index === 0 ? 0 : index - transformDuration;

        timeline.to(
          jacket,
          {
            ...getVisual(feature),
            duration: transformDuration,
          },
          at,
        );

        timeline.to(
          stage,
          {
            "--stage-wash": feature.visual.wash,
            "--stage-tint": feature.visual.tint,
            duration: transformDuration,
          },
          at,
        );
      });
    }, section);

    return () => context.revert();
  }, [features]);

  return (
    <section className="product-rig-section" ref={sectionRef} aria-label="Animated product feature reveal">
      <div className="rig-stage" ref={stageRef}>
        <div className="rig-grid" aria-hidden="true" />
        <div className="rain-field" aria-hidden="true">
          {raindrops.map((drop) => (
            <span key={drop} style={{ "--drop-index": drop } as CSSProperties} />
          ))}
        </div>

        <div className="rig-kicker" aria-hidden="true">
          Scroll product rig
        </div>

        <div className="jacket-perspective" aria-hidden="true">
          <div className="jacket-rig">
            {images.map((image) => (
              <div className="product-layer" data-product={image.id} key={image.id} style={{ position: "absolute" }}>
                <Image
                  src={image.src}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1000px) 48vw, 92vw"
                />
              </div>
            ))}
            <div className="layer-stack">
              <span>Outer fabric</span>
              <span>Waterproof coating</span>
              <span>Protective layer</span>
            </div>
            <div className="pack-pouch">
              <span />
              <strong>Packs down</strong>
            </div>
          </div>
        </div>

        {features.map((feature, index) => (
          <article className={`rig-feature-panel rig-feature-panel-${feature.layout}`} key={feature.id}>
            <div className="rig-copy-block">
              <p>{feature.eyebrow}</p>
              {feature.stat ? <strong>{feature.stat}</strong> : null}
              <h2>{feature.headline}</h2>
              <span>{feature.body}</span>
              {feature.id === "color-fit" ? (
                <div className="rig-swatches" aria-label="Available colors">
                  {colorOptions.slice(0, 8).map((color) => (
                    <i key={color.name} style={{ backgroundColor: color.hex }} title={color.name} />
                  ))}
                </div>
              ) : null}
              {feature.layout === "final" ? (
                <a className="rig-final-cta" href={offer.ctaUrl}>
                  Shop {offer.salePrice}
                </a>
              ) : null}
            </div>

            <svg className="rig-annotation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {feature.callouts.map((callout) => (
                <line
                  className="rig-line"
                  key={`${feature.id}-${callout.label}-line`}
                  x1={callout.x}
                  y1={callout.y}
                  x2={callout.labelX}
                  y2={callout.labelY}
                />
              ))}
            </svg>
            {feature.callouts.map((callout) => (
              <span
                className="rig-pin"
                key={`${feature.id}-${callout.label}-pin`}
                style={{ "--x": `${callout.x}%`, "--y": `${callout.y}%` } as CSSProperties}
              />
            ))}
            {feature.callouts.map((callout) => (
              <span
                className="rig-callout-label"
                key={`${feature.id}-${callout.label}-label`}
                style={{ "--x": `${callout.labelX}%`, "--y": `${callout.labelY}%` } as CSSProperties}
              >
                {callout.label}
              </span>
            ))}
            <span className="rig-scene-count" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
          </article>
        ))}

        <div className="rig-progress" aria-hidden="true">
          {features.map((feature) => (
            <span className="rig-step-dot" key={feature.id} />
          ))}
        </div>
      </div>

      <div className="reduced-feature-list">
        {features.map((feature) => (
          <article key={`${feature.id}-reduced`}>
            <p>{feature.eyebrow}</p>
            <h2>{feature.headline}</h2>
            <span>{feature.body}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
