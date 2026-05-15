"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { FilmScene } from "@/lib/baerskin-content";

type ScrollFilmProps = {
  scenes: FilmScene[];
};

export function ScrollFilm({ scenes }: ScrollFilmProps) {
  return (
    <section className="scroll-film" aria-label="Rain jacket scroll film">
      {scenes.map((scene, index) => (
        <motion.article
          className={`film-scene film-scene-${scene.tone ?? "bottom"} film-scene-${scene.contrast ?? "light"}`}
          id={`scene-${index}`}
          key={scene.id}
          initial={{ opacity: 0.84, scale: 0.992 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ amount: 0.62 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
        >
          <Image
            className="film-scene-image"
            src={scene.image}
            alt={scene.imageAlt}
            fill
            priority={index === 0}
            sizes="(min-width: 900px) 520px, 100vw"
            style={{ objectPosition: scene.imagePosition ?? "center" }}
          />
          <div className="film-noise" aria-hidden="true" />
          <div className="film-shade" aria-hidden="true" />
          <div className="film-copy">
            {scene.kicker ? <p>{scene.kicker}</p> : null}
            <h2>
              {scene.lines.map((line) => (
                <span className={line.accent ? "accent" : undefined} key={`${scene.id}-${line.text}`}>
                  {line.text}
                </span>
              ))}
            </h2>
            {scene.caption ? <small>{scene.caption}</small> : null}
          </div>
          <span className="scene-count" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
        </motion.article>
      ))}
    </section>
  );
}
