"use client";

import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, ContactShadows, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DoubleSide, Group, MathUtils, Mesh, Vector3 } from "three";
import type { BufferGeometry } from "three";
import type { Camera } from "three";
import type { CSSProperties } from "react";
import type { Jacket3DStage, ProductOffer } from "@/lib/baerskin-content";
import { colorOptions, proof } from "@/lib/baerskin-content";

type Jacket3DScrollyProps = {
  stages: Jacket3DStage[];
  offer: ProductOffer;
};

type JacketModelProps = {
  progress: number;
  activeStage: Jacket3DStage;
  stages: Jacket3DStage[];
};

type MeshyModel = {
  scene: Group;
};

const modelPath = "/baerskin/3d/baerskin-rainjacket.glb";
const modelStatusPath = "/baerskin/3d/model-status.json";
const posterPath = "/baerskin/3d/poster.webp";
const raindrops = Array.from({ length: 42 }, (_, index) => index);

type ModelStatus = {
  ready?: boolean;
};

class ModelErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) {
      return null;
    }

    return this.props.children;
  }
}

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

function mixTuple(
  start: [number, number, number],
  end: [number, number, number],
  amount: number,
): [number, number, number] {
  return [
    MathUtils.lerp(start[0], end[0], amount),
    MathUtils.lerp(start[1], end[1], amount),
    MathUtils.lerp(start[2], end[2], amount),
  ];
}

function resolveInterpolatedStage(stages: Jacket3DStage[], progress: number) {
  const exactIndex = MathUtils.clamp(progress, 0, 1) * (stages.length - 1);
  const fromIndex = Math.floor(exactIndex);
  const toIndex = Math.min(stages.length - 1, fromIndex + 1);
  const amount = exactIndex - fromIndex;
  const from = stages[fromIndex] ?? stages[0];
  const to = stages[toIndex] ?? from;

  return {
    cameraPosition: mixTuple(from.camera.position, to.camera.position, amount),
    cameraTarget: mixTuple(from.camera.target, to.camera.target, amount),
    modelPosition: mixTuple(from.model.position, to.model.position, amount),
    modelRotation: mixTuple(from.model.rotation, to.model.rotation, amount),
    modelScale: MathUtils.lerp(from.model.scale, to.model.scale, amount),
  };
}

function JacketModel({ activeStage, progress, stages }: JacketModelProps) {
  const gltf = useGLTF(modelPath) as MeshyModel;
  const modelRef = useRef<Group | null>(null);
  const targetRef = useRef(new Vector3());
  const { size } = useThree();
  const modelGeometry = useMemo(() => {
    const meshes: Mesh[] = [];

    gltf.scene.traverse((child) => {
      if (child instanceof Mesh && child.geometry) {
        meshes.push(child);
      }
    });

    const geometry: BufferGeometry | undefined = meshes[0]?.geometry;

    if (!geometry) {
      return null;
    }

    geometry.computeBoundingBox();

    const box = geometry.boundingBox;
    const size = new Vector3();
    const center = new Vector3();

    if (!box) {
      return null;
    }

    box.getSize(size);
    box.getCenter(center);

    const scale = size.y > 0 ? 2.35 / size.y : 1;

    return {
      geometry,
      position: [-center.x * scale, -box.min.y * scale, -center.z * scale] as [number, number, number],
      scale,
    };
  }, [gltf.scene]);

  useFrame(({ camera }) => {
    const next = resolveInterpolatedStage(stages, progress);
    const compactScene = size.width < 700;
    const cameraPosition = compactScene
      ? ([next.cameraPosition[0] * 0.3, next.cameraPosition[1] + 0.08, next.cameraPosition[2] + 0.48] as [
          number,
          number,
          number,
        ])
      : next.cameraPosition;
    const cameraTarget = compactScene
      ? ([next.cameraTarget[0] * 0.22, next.cameraTarget[1], next.cameraTarget[2]] as [number, number, number])
      : next.cameraTarget;
    const modelPosition = compactScene
      ? ([next.modelPosition[0] * 0.18, next.modelPosition[1] - 0.04, next.modelPosition[2]] as [number, number, number])
      : next.modelPosition;
    const modelScale = next.modelScale * (compactScene ? 0.78 : 1);
    const nextCamera = new Vector3(...cameraPosition);
    const nextTarget = new Vector3(...cameraTarget);
    const group = modelRef.current;

    moveCamera(camera, nextCamera, nextTarget, targetRef.current);

    if (group) {
      group.position.lerp(new Vector3(...modelPosition), 0.11);
      group.rotation.x = MathUtils.lerp(group.rotation.x, next.modelRotation[0], 0.11);
      group.rotation.y = MathUtils.lerp(group.rotation.y, next.modelRotation[1], 0.11);
      group.rotation.z = MathUtils.lerp(group.rotation.z, next.modelRotation[2], 0.11);
      group.scale.lerp(new Vector3(modelScale, modelScale, modelScale), 0.11);
    }
  });

  return (
    <>
      <ambientLight intensity={1.35} />
      <directionalLight castShadow intensity={2.2} position={[2.8, 4.4, 4.2]} shadow-mapSize={[1024, 1024]} />
      <directionalLight intensity={0.7} position={[-3, 2, -2]} />
      <Environment preset="city" environmentIntensity={0.42} />

      <group ref={modelRef}>
        {modelGeometry ? (
          <mesh
            castShadow
            frustumCulled={false}
            geometry={modelGeometry.geometry}
            position={modelGeometry.position}
            receiveShadow
            scale={modelGeometry.scale}
          >
            <meshStandardMaterial color="#22323a" roughness={0.82} metalness={0.02} side={DoubleSide} />
          </mesh>
        ) : null}

        {activeStage.anchors.map((anchor) => (
          <Html
            className={`jacket3d-model-label jacket3d-model-label-${anchor.align ?? "right"}`}
            distanceFactor={4.8}
            key={`${activeStage.id}-${anchor.label}`}
            position={anchor.position}
            zIndexRange={[38, 28]}
          >
            <span>{anchor.label}</span>
          </Html>
        ))}
      </group>

      {activeStage.effect === "layers" ? <StageLayerPanels /> : null}
      {activeStage.effect === "packable" ? <PackableProxy /> : null}

      <ContactShadows opacity={0.32} position={[0, -1.25, 0]} scale={5.5} blur={2.6} far={3.2} />
    </>
  );
}

function moveCamera(camera: Camera, position: Vector3, target: Vector3, currentTarget: Vector3) {
  camera.position.lerp(position, 0.1);
  currentTarget.lerp(target, 0.1);
  camera.lookAt(currentTarget);
}

function StageLayerPanels() {
  return (
    <group position={[0.72, 0.42, 0.12]}>
      {["Outer fabric", "Waterproof coating", "Inner half-layer"].map((label, index) => (
        <group key={label} position={[index * 0.24, 0.3 - index * 0.35, 0]}>
          <mesh rotation={[0, -0.34, 0]}>
            <boxGeometry args={[0.82, 0.045, 0.5]} />
            <meshStandardMaterial color={["#dfe8e1", "#9fb6ab", "#67796f"][index]} roughness={0.78} metalness={0.02} />
          </mesh>
          <Html className="jacket3d-layer-label" position={[0.48, 0.04, 0]}>
            <span>{label}</span>
          </Html>
        </group>
      ))}
    </group>
  );
}

function PackableProxy() {
  return (
    <group position={[1.05, -0.72, 0.16]} rotation={[0.05, -0.4, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.72, 0.86, 0.24]} />
        <meshStandardMaterial color="#17211f" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.32, 0.14]}>
        <boxGeometry args={[0.46, 0.035, 0.035]} />
        <meshStandardMaterial color="#51615a" roughness={0.7} />
      </mesh>
      <Html className="jacket3d-layer-label" position={[0.58, 0.06, 0.18]}>
        <span>Packable pouch</span>
      </Html>
    </group>
  );
}

function JacketStaticFallback({ offer, stages }: Jacket3DScrollyProps) {
  return (
    <section className="jacket3d-static" aria-label="Rain jacket feature summary">
      <div className="jacket3d-static-visual" style={{ position: "relative" }}>
        <Image
          alt="BÆRSkin Heavy-Storm Waterproof Rain Jacket 2.0 product poster."
          fill
          priority
          sizes="(min-width: 900px) 44vw, 92vw"
          src={posterPath}
        />
      </div>
      <div className="jacket3d-static-list">
        <p>Technical proof</p>
        <h2>The shell proof, stacked for fast reading.</h2>
        {stages.slice(1, 6).map((stage) => (
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

export function Jacket3DScrolly({ offer, stages }: Jacket3DScrollyProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const [assetReady, setAssetReady] = useState<boolean | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotionPreference();
  const activeStage = stages[activeIndex] ?? stages[0];

  useEffect(() => {
    let cancelled = false;

    fetch(modelStatusPath, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          return { ready: false };
        }

        return response.json() as Promise<ModelStatus>;
      })
      .then((status) => {
        if (!cancelled) {
          setAssetReady(Boolean(status.ready));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAssetReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (assetReady) {
      useGLTF.preload(modelPath);
    }
  }, [assetReady]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const pin = pinRef.current;

    if (!section || !pin || reducedMotion || !assetReady) {
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${window.innerHeight * (stages.length - 1)}`,
      pin,
      scrub: 0.78,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: {
        snapTo: (value) => Math.round(value * (stages.length - 1)) / (stages.length - 1),
        duration: { min: 0.08, max: 0.22 },
        ease: "power1.inOut",
        inertia: false,
      },
      onUpdate: (self) => {
        const nextIndex = MathUtils.clamp(Math.round(self.progress * (stages.length - 1)), 0, stages.length - 1);
        setProgress(self.progress);
        setActiveIndex(nextIndex);
      },
    });

    setProgress(0);
    setActiveIndex(0);

    return () => trigger.kill();
  }, [assetReady, reducedMotion, stages.length]);

  const stageProgressStyle = useMemo(
    () =>
      ({
        "--stage-index": activeIndex,
        "--stage-progress": progress,
      }) as CSSProperties,
    [activeIndex, progress],
  );

  if (reducedMotion || assetReady === false) {
    return <JacketStaticFallback offer={offer} stages={stages} />;
  }

  return (
    <section className="jacket3d-section" ref={sectionRef} style={stageProgressStyle} aria-label="3D product reveal">
      <div className="jacket3d-pin" ref={pinRef}>
        <div className="jacket3d-background" aria-hidden="true" />
        <div className="jacket3d-canvas-wrap">
          {assetReady ? (
            <ModelErrorBoundary onError={() => setAssetReady(false)}>
              <Canvas
                camera={{ fov: 35, position: [0, 1.3, 5.6], near: 0.1, far: 100 }}
                className="jacket3d-canvas"
                dpr={[1, 1.75]}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
                shadows
              >
                <Suspense fallback={null}>
                  <JacketModel activeStage={activeStage} progress={progress} stages={stages} />
                </Suspense>
              </Canvas>
            </ModelErrorBoundary>
          ) : (
            <div className="jacket3d-loading" style={{ position: "absolute" }}>
              <Image alt="" fill priority sizes="100vw" src={posterPath} />
            </div>
          )}
        </div>

        <div className={`jacket3d-rain ${activeStage.effect === "rain" ? "is-active" : ""}`} aria-hidden="true">
          {raindrops.map((drop) => (
            <span key={drop} style={{ "--drop-index": drop } as CSSProperties} />
          ))}
        </div>

        <article className="jacket3d-copy" aria-live="polite">
          <p>{activeStage.eyebrow}</p>
          {activeStage.stat ? <strong>{activeStage.stat}</strong> : null}
          <h2>{activeStage.headline}</h2>
          <span>{activeStage.body}</span>
          {activeStage.effect === "colors" ? (
            <div className="jacket3d-swatches" aria-label="Available colors">
              {colorOptions.slice(0, 8).map((color) => (
                <i key={color.name} style={{ backgroundColor: color.hex }} title={color.name} />
              ))}
            </div>
          ) : null}
          {activeStage.effect === "offer" ? (
            <a className="jacket3d-final-cta" href={offer.ctaUrl}>
              Shop {offer.salePrice}
            </a>
          ) : null}
        </article>

        <aside className={`jacket3d-offer-card ${activeStage.effect === "offer" ? "is-active" : ""}`} aria-label="Offer details">
          <p>{proof.trustpilotLabel}</p>
          <strong>{offer.salePrice}</strong>
          <del>{offer.compareAtPrice}</del>
          <span>{offer.discountLabel}</span>
          <em>
            {proof.rating} from {proof.reviewCount}
          </em>
          <a href={offer.ctaUrl}>Shop now</a>
        </aside>

        <div className="jacket3d-snapnav" aria-hidden="true">
          {stages.map((stage, index) => (
            <span className={index === activeIndex ? "is-active" : ""} key={stage.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
