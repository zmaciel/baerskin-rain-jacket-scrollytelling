export type ProductOffer = {
  productName: string;
  salePrice: string;
  compareAtPrice: string;
  discountLabel: string;
  ctaUrl: string;
};

export type FilmScene = {
  id: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
  kicker?: string;
  lines: Array<{
    text: string;
    accent?: boolean;
  }>;
  caption?: string;
  tone?: "bottom" | "top" | "center";
  contrast?: "light" | "dark";
};

export type ProductRigImage = {
  id: string;
  src: string;
  alt: string;
};

export type RigCallout = {
  label: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
};

export type ProductRigFeature = {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  stat?: string;
  layout: "left" | "right" | "bottom" | "final";
  visual: {
    product: string;
    x: number;
    y: number;
    scale: number;
    rotateY: number;
    rotateZ: number;
    wash: string;
    tint: string;
  };
  callouts: RigCallout[];
};

export type Jacket3DAnchor = {
  label: string;
  position: [number, number, number];
  align?: "left" | "right";
};

export type Jacket3DStage = {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  stat?: string;
  effect?: "rain" | "hood" | "pockets" | "layers" | "packable" | "colors" | "offer";
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  model: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
  };
  anchors: Jacket3DAnchor[];
};

export type ScrollVideoStage = {
  id: string;
  frame: number;
  eyebrow: string;
  headline: string;
  body: string;
  stat?: string;
};

export type ScrollVideoConfig = {
  frameCount: number;
  framePattern: string;
  poster: string;
};

export type ChapterVideoConfig = {
  src: string;
  poster: string;
  duration: number;
};

export type ChapterVideoStage = {
  id: string;
  time: number;
};

export const productOffer: ProductOffer = {
  productName: "BÆRSkin Heavy-Storm Waterproof Rain Jacket 2.0",
  salePrice: "$99.95",
  compareAtPrice: "$249.88",
  discountLabel: "60% off",
  ctaUrl: "https://baerskintactical.com/us/lp/rainjacket",
};

export const scrollVideoConfig: ScrollVideoConfig = {
  frameCount: 93,
  framePattern: "/baerskin/scroll-video/frames/frame-%04d.jpg",
  poster: "/baerskin/scroll-video/frames/frame-0001.jpg",
};

export const chapterVideoConfig: ChapterVideoConfig = {
  src: "/baerskin/chapter-video/rainjacket.mp4",
  poster: "/baerskin/scroll-video/frames/frame-0001.jpg",
  duration: 23.291667,
};

export const chapterVideoStages: ChapterVideoStage[] = [
  { id: "open", time: 0 },
  { id: "product-logo", time: 2.15 },
  { id: "engineered-cold", time: 3.45 },
  { id: "engineered-proof", time: 4.35 },
  { id: "zip-layer", time: 6.3 },
  { id: "waterproof-zips", time: 10.45 },
  { id: "adjustable-wrists", time: 12.15 },
  { id: "adjustable-hood", time: 14.05 },
  { id: "shoulder-pocket", time: 16.2 },
  { id: "packable", time: 18.2 },
  { id: "end-state", time: 22.7 },
];

export const scrollVideoStages: ScrollVideoStage[] = [
  {
    id: "storm-open",
    frame: 0,
    eyebrow: "Scroll-Controlled Product Film",
    headline: "A real jacket film, scrubbed by the page.",
    body: "This test trades generated 3D for a cinematic frame sequence that can pause on the exact product proof we want.",
    stat: "93 frames",
  },
  {
    id: "product-reveal",
    frame: 10,
    eyebrow: "Heavy-Storm Rain Jacket 2.0",
    headline: "Show the shell before asking for the click.",
    body: "The first scroll beat establishes the product in weather, then moves into feature evidence instead of static product cards.",
  },
  {
    id: "weather-shell",
    frame: 25,
    eyebrow: "BÆRShield System",
    headline: "Water beads, zips seal, fabric carries the proof.",
    body: "Macro frames give us an inspectable reason-why path: surface, zipper, hood, wrist, shoulder pocket, and packability.",
    stat: "2.5-layer",
  },
  {
    id: "hood-pocket",
    frame: 49,
    eyebrow: "Feature Close-Ups",
    headline: "Each pause becomes an infographic beat.",
    body: "The scroll can stop on a hood, zip, wrist, or pocket frame while HTML copy and CTA remain sharp above the video.",
  },
  {
    id: "packable",
    frame: 69,
    eyebrow: "Carry Ready",
    headline: "The proof moves from storm protection to daily use.",
    body: "Packability gives the buyer a practical reason to keep the jacket in a bag, truck, commute, or hike kit.",
  },
  {
    id: "offer",
    frame: 88,
    eyebrow: "Sale Live Now",
    headline: "$99.95 today. 60% off.",
    body: "Finish on product state, Trustpilot proof, 60-day returns, and a direct handoff to the live Baerskin product page.",
    stat: "4.5/5",
  },
];

export const jacket3DStages: Jacket3DStage[] = [
  {
    id: "full-reveal",
    eyebrow: "Heavy-Storm Rain Jacket 2.0",
    headline: "A technical shell you can inspect in motion.",
    body: "The page now treats the jacket as one product system: shell, hood, zips, layer stack, packability, fit, and offer.",
    stat: "3D reveal",
    camera: { position: [0, 1.18, 5.8], target: [0.3, 0.48, 0] },
    model: { position: [0.92, -1.18, 0], rotation: [0, -0.14, 0], scale: 0.86 },
    anchors: [
      { label: "Matte waterproof ripstop shell", position: [0.85, 1.3, 0.12], align: "right" },
      { label: "Full-front storm zip", position: [0.06, 0.6, 0.34], align: "right" },
    ],
  },
  {
    id: "waterproof-shell",
    eyebrow: "Rain Pressure",
    headline: "Waterproof protection without a stiff shell.",
    body: "BÆR-Tex is positioned for heavy rain and snow while staying light enough for daily wear.",
    stat: "20,000mm",
    effect: "rain",
    camera: { position: [-0.86, 1.16, 4.75], target: [0.38, 0.46, 0] },
    model: { position: [0.92, -1.18, 0], rotation: [0.04, 0.42, 0.01], scale: 0.96 },
    anchors: [
      { label: "Water beads off the face fabric", position: [0.7, 1.25, 0.28], align: "right" },
      { label: "Sealed surface resists soak-through", position: [-0.36, 0.86, 0.34], align: "left" },
    ],
  },
  {
    id: "hood-drawcord",
    eyebrow: "Hood Seal",
    headline: "Coverage tightens around the storm.",
    body: "The adjustable hood, cuffs, and waist help close the gaps when weather turns sideways.",
    effect: "hood",
    camera: { position: [-0.46, 1.95, 3.02], target: [0.54, 1.34, 0.1] },
    model: { position: [0.82, -1.34, 0], rotation: [0.06, 0.16, -0.02], scale: 1.26 },
    anchors: [
      { label: "Structured hood coverage", position: [0, 2.38, 0.26], align: "right" },
      { label: "Adjustable drawcord zone", position: [-0.36, 1.72, 0.34], align: "left" },
    ],
  },
  {
    id: "zip-pocket",
    eyebrow: "Dry Carry",
    headline: "Waterproof zips protect what you actually carry.",
    body: "Five waterproof pockets give phone, keys, wallet, and small tools a dry place to ride.",
    stat: "5 pockets",
    effect: "pockets",
    camera: { position: [1.05, 1.14, 3.08], target: [0.58, 0.5, 0.12] },
    model: { position: [0.58, -1.2, 0], rotation: [0.02, -0.62, 0.02], scale: 1.12 },
    anchors: [
      { label: "Bonded waterproof zip", position: [0.26, 0.74, 0.38], align: "right" },
      { label: "Shoulder pocket access", position: [-0.7, 1.18, 0.24], align: "left" },
    ],
  },
  {
    id: "layer-system",
    eyebrow: "2.5-Layer BÆR-Tex",
    headline: "The waterproofing is built as a layered system.",
    body: "Outer fabric, waterproof coating, and protective inner layer work together without adding bulky insulation.",
    stat: "2.5-layer",
    effect: "layers",
    camera: { position: [1.54, 1.08, 4.08], target: [0.5, 0.42, 0] },
    model: { position: [0.32, -1.16, 0], rotation: [0.02, -0.9, 0.01], scale: 0.9 },
    anchors: [],
  },
  {
    id: "packable-shell",
    eyebrow: "Packs Down",
    headline: "Carry it before the weather asks for it.",
    body: "The shell is built for a bag, truck, commute, or hike, with a small pouch proxy shown in the scene.",
    effect: "packable",
    camera: { position: [0.25, 1.02, 5.25], target: [0.38, 0.18, 0] },
    model: { position: [0.66, -0.96, 0], rotation: [0, 0.26, -0.04], scale: 0.58 },
    anchors: [
      { label: "Compressible shell", position: [0.48, 0.8, 0.32], align: "right" },
      { label: "Packable pouch proxy", position: [1.12, -0.55, 0.12], align: "right" },
    ],
  },
  {
    id: "color-fit",
    eyebrow: "Color And Fit",
    headline: "Same spec across practical colors and sizes.",
    body: "Choose everyday colors and sizes S through 4XL, with an oversized fit note for layering.",
    stat: "S-4XL",
    effect: "colors",
    camera: { position: [-0.46, 1.16, 4.85], target: [0.34, 0.44, 0] },
    model: { position: [0.9, -1.18, 0], rotation: [0.02, 0.18, 0], scale: 0.82 },
    anchors: [
      { label: "Layering room through torso", position: [0.46, 0.78, 0.28], align: "right" },
      { label: "Adjustable waist seal", position: [-0.34, 0.44, 0.28], align: "left" },
    ],
  },
  {
    id: "final-offer",
    eyebrow: "Sale Live Now",
    headline: "$99.95 today. 60% off.",
    body: "Excellent on Trustpilot, 4.5/5 from 52,678 reviews, and 60-day returns through the live Baerskin page.",
    effect: "offer",
    camera: { position: [0, 1.16, 5.4], target: [0.28, 0.46, 0] },
    model: { position: [0.72, -1.16, 0], rotation: [0, -0.08, 0], scale: 0.8 },
    anchors: [],
  },
];

export const productRigImages: ProductRigImage[] = [
  {
    id: "navy",
    src: "/baerskin/rig/navy-cutout.png",
    alt: "Navy BÆRSkin Heavy-Storm Waterproof Rain Jacket 2.0 front view.",
  },
  {
    id: "green",
    src: "/baerskin/rig/green-cutout.png",
    alt: "Green BÆRSkin Heavy-Storm Waterproof Rain Jacket 2.0 front view.",
  },
  {
    id: "yellow",
    src: "/baerskin/rig/yellow-cutout.png",
    alt: "Yellow BÆRSkin Heavy-Storm Waterproof Rain Jacket 2.0 front view.",
  },
  {
    id: "teal",
    src: "/baerskin/rig/teal-cutout.png",
    alt: "Teal BÆRSkin Heavy-Storm Waterproof Rain Jacket 2.0 front view.",
  },
  {
    id: "black",
    src: "/baerskin/rig/black-cutout.png",
    alt: "Black BÆRSkin Heavy-Storm Waterproof Rain Jacket 2.0 front view.",
  },
];

export const productRigFeatures: ProductRigFeature[] = [
  {
    id: "hero-rig",
    eyebrow: "Heavy-Storm Rain Jacket 2.0",
    headline: "A waterproof shell that moves like daily gear.",
    body: "Scroll to inspect the jacket as a built system: shell, hood, zips, pockets, layer construction, packability, and fit.",
    stat: "20,000mm",
    layout: "left",
    visual: {
      product: "navy",
      x: 0,
      y: 4,
      scale: 0.94,
      rotateY: -6,
      rotateZ: 0,
      wash: "#f4f7f2",
      tint: "#dbe7dd",
    },
    callouts: [
      { label: "BÆR-Tex waterproof shell", x: 55, y: 42, labelX: 73, labelY: 34 },
      { label: "Full-front storm zip", x: 50, y: 58, labelX: 68, labelY: 64 },
    ],
  },
  {
    id: "waterproof-shell",
    eyebrow: "Rain Pressure",
    headline: "Water beads off before it soaks in.",
    body: "BÆR-Tex is positioned for sustained wet weather with a 20,000mm waterproof rating.",
    stat: "20,000mm",
    layout: "right",
    visual: {
      product: "navy",
      x: -42,
      y: 0,
      scale: 1.02,
      rotateY: 12,
      rotateZ: -1.2,
      wash: "#edf5f7",
      tint: "#b9d6dd",
    },
    callouts: [
      { label: "Water-repellent face fabric", x: 49, y: 42, labelX: 23, labelY: 34 },
      { label: "Sealed surface", x: 59, y: 55, labelX: 24, labelY: 60 },
    ],
  },
  {
    id: "hood-seal",
    eyebrow: "Adjustable Hood",
    headline: "Coverage tightens around the weather.",
    body: "The hood, cuffs, and waist are adjustable so the shell can seal without feeling rigid.",
    layout: "left",
    visual: {
      product: "yellow",
      x: 42,
      y: 10,
      scale: 1.24,
      rotateY: -18,
      rotateZ: 1.4,
      wash: "#fbf7df",
      tint: "#eadb8c",
    },
    callouts: [
      { label: "Extended hood peak", x: 51, y: 25, labelX: 23, labelY: 23 },
      { label: "Adjustable drawcord", x: 43, y: 42, labelX: 22, labelY: 48 },
    ],
  },
  {
    id: "waterproof-zips",
    eyebrow: "Dry Carry",
    headline: "Protect the essentials.",
    body: "Five waterproof pockets give phone, keys, wallet, and small tools a dry place to ride.",
    stat: "5 pockets",
    layout: "right",
    visual: {
      product: "yellow",
      x: -48,
      y: 10,
      scale: 1.2,
      rotateY: 21,
      rotateZ: -1,
      wash: "#fbf4dd",
      tint: "#f0ca58",
    },
    callouts: [
      { label: "Shoulder pocket", x: 63, y: 47, labelX: 24, labelY: 38 },
      { label: "Bonded waterproof zipper", x: 56, y: 57, labelX: 24, labelY: 64 },
    ],
  },
  {
    id: "layer-system",
    eyebrow: "2.5-Layer BÆR-Tex",
    headline: "A light shell with real structure.",
    body: "Outer fabric, waterproof coating, and protective inner layer work together without adding bulk.",
    stat: "2.5-layer",
    layout: "left",
    visual: {
      product: "green",
      x: 36,
      y: 2,
      scale: 1,
      rotateY: -16,
      rotateZ: 0.8,
      wash: "#eef3e9",
      tint: "#cbd8c4",
    },
    callouts: [
      { label: "Outer ripstop fabric", x: 55, y: 48, labelX: 75, labelY: 38 },
      { label: "Waterproof coating", x: 52, y: 58, labelX: 75, labelY: 60 },
      { label: "Protective inner layer", x: 49, y: 70, labelX: 72, labelY: 75 },
    ],
  },
  {
    id: "packable-shell",
    eyebrow: "Packs Down",
    headline: "Built for the bag, not the closet.",
    body: "The lightweight shell packs into a small pouch so it can stay close until weather turns.",
    layout: "bottom",
    visual: {
      product: "teal",
      x: 0,
      y: 7,
      scale: 0.72,
      rotateY: 0,
      rotateZ: 0,
      wash: "#eff6f3",
      tint: "#b9dcd6",
    },
    callouts: [
      { label: "Compressible shell", x: 50, y: 50, labelX: 70, labelY: 39 },
      { label: "Travel-ready pouch", x: 50, y: 70, labelX: 68, labelY: 72 },
    ],
  },
  {
    id: "color-fit",
    eyebrow: "Color And Fit",
    headline: "Same technical shell across practical colors.",
    body: "Choose from everyday colors and sizes S through 4XL, with room to layer underneath.",
    stat: "S-4XL",
    layout: "right",
    visual: {
      product: "teal",
      x: -36,
      y: 4,
      scale: 0.94,
      rotateY: 8,
      rotateZ: 0,
      wash: "#eef8f4",
      tint: "#b7dbd3",
    },
    callouts: [
      { label: "Layering fit", x: 54, y: 46, labelX: 25, labelY: 34 },
      { label: "Adjustable waist", x: 50, y: 75, labelX: 25, labelY: 76 },
    ],
  },
  {
    id: "final-infographic",
    eyebrow: "Sale Live Now",
    headline: "$99.95 today. 60% off.",
    body: "The live Baerskin page handles colors, sizing, checkout, and current delivery terms.",
    stat: "4.5/5",
    layout: "final",
    visual: {
      product: "black",
      x: -36,
      y: 2,
      scale: 0.92,
      rotateY: 0,
      rotateZ: 0,
      wash: "#f5f5f1",
      tint: "#deded7",
    },
    callouts: [
      { label: "Adjustable hood", x: 50, y: 27, labelX: 24, labelY: 23 },
      { label: "Waterproof zips", x: 50, y: 50, labelX: 22, labelY: 48 },
      { label: "Sealed seams", x: 48, y: 60, labelX: 25, labelY: 66 },
      { label: "5 waterproof pockets", x: 57, y: 56, labelX: 88, labelY: 38 },
      { label: "2.5-layer shell", x: 53, y: 72, labelX: 88, labelY: 78 },
    ],
  },
];

export const filmScenes: FilmScene[] = [
  {
    id: "field-hero",
    image: "/baerskin/realistic/hero-harbor.jpg",
    imageAlt: "Model wearing the BÆRSkin waterproof rain jacket outdoors near a harbor.",
    imagePosition: "54% center",
    kicker: "Heavy-Storm Rain Jacket 2.0",
    lines: [
      { text: "Real Rain." },
      { text: "Real Jacket.", accent: true },
    ],
    caption: "A lightweight shell built for wet commutes, hikes, travel, and daily wear.",
    tone: "bottom",
  },
  {
    id: "rain-proof",
    image: "/baerskin/realistic/hood-rain.jpg",
    imageAlt: "Close-up of the rain jacket hood and chest covered in water beads.",
    imagePosition: "42% center",
    kicker: "20,000mm Waterproof Rating",
    lines: [
      { text: "Water Beads." },
      { text: "Fabric Stays Dry.", accent: true },
    ],
    caption: "The BÆR-Tex coating is designed to shed heavy rain before it soaks in.",
    tone: "bottom",
  },
  {
    id: "freedom-to-move",
    image: "/baerskin/realistic/field-fullbody.jpg",
    imageAlt: "Model wearing the BÆRSkin rain jacket in wet outdoor weather.",
    imagePosition: "50% center",
    kicker: "Built To Move",
    lines: [
      { text: "Lightweight." },
      { text: "Not Fragile.", accent: true },
    ],
    caption: "The 2.5-layer shell keeps the jacket flexible while blocking wet weather.",
    tone: "bottom",
  },
  {
    id: "system-proof",
    image: "/baerskin/realistic/product-navy.jpg",
    imageAlt: "Studio product photo of the BÆRSkin waterproof rain jacket in navy.",
    imagePosition: "50% top",
    kicker: "Full System Proof",
    lines: [
      { text: "Hood. Seams." },
      { text: "Zips. Pockets.", accent: true },
    ],
    caption: "Adjustable hood, waterproof zips, sealed seams, and five waterproof pockets.",
    tone: "bottom",
  },
  {
    id: "dry-pockets",
    image: "/baerskin/realistic/pocket-zip-clean.jpg",
    imageAlt: "Close-up of the waterproof pocket zipper on the BÆRSkin rain jacket.",
    imagePosition: "50% center",
    kicker: "Waterproof Pocket Zips",
    lines: [
      { text: "Zip It Closed." },
      { text: "Keep It Dry.", accent: true },
    ],
    caption: "Bonded waterproof zips help protect the phone, keys, and wallet you actually carry.",
    tone: "bottom",
  },
  {
    id: "layer-design",
    image: "/baerskin/realistic/product-green.jpg",
    imageAlt: "Studio product photo of the green BÆRSkin waterproof rain jacket.",
    imagePosition: "50% top",
    kicker: "2.5-Layer BÆR-Tex",
    lines: [
      { text: "Blocks Rain." },
      { text: "Stays Light.", accent: true },
    ],
    caption: "Outer fabric, waterproof coating, and protective layer work as one flexible shell.",
    tone: "bottom",
  },
  {
    id: "choice",
    image: "/baerskin/realistic/product-teal.jpg",
    imageAlt: "Studio product photo of the teal BÆRSkin waterproof rain jacket.",
    imagePosition: "50% top",
    kicker: "Color And Fit",
    lines: [
      { text: "Pick A Color." },
      { text: "Keep The Spec.", accent: true },
    ],
    caption: "Available across practical colors and sizes from S through 4XL.",
    tone: "bottom",
  },
  {
    id: "hoodie-system",
    image: "/baerskin/realistic/product-black.jpg",
    imageAlt: "Studio product photo of the black BÆRSkin waterproof rain jacket.",
    imagePosition: "50% top",
    kicker: "Final Offer",
    lines: [
      { text: "$99.95 Today." },
      { text: "60% Off.", accent: true },
    ],
    caption: "Shop the live Baerskin page for colors, sizes, and current checkout terms.",
    tone: "bottom",
  },
];

export const systemProof = [
  {
    stat: "20,000mm",
    label: "Waterproof rating",
    body: "Hydrostatic head rating positioned for heavy sustained rain and snow.",
  },
  {
    stat: "2.5-layer",
    label: "BÆRShield construction",
    body: "Outer fabric, waterproof coating, and protective half-layer keep the shell light and flexible.",
  },
  {
    stat: "5 pockets",
    label: "Waterproof carry",
    body: "Waist, shoulder, and internal storage for essentials that should stay dry.",
  },
  {
    stat: "PFAS-free",
    label: "Lab-tested coating",
    body: "The source page positions the jacket as free from PFAS and forever chemicals.",
  },
];

export const colorOptions = [
  { name: "Stealth Black", hex: "#111412" },
  { name: "Hunter Green", hex: "#253225" },
  { name: "Alpine Green", hex: "#1f5b52" },
  { name: "Ocean Teal", hex: "#087481" },
  { name: "Navy Blue", hex: "#182b42" },
  { name: "Hi Viz Orange", hex: "#f26b2f" },
  { name: "Hunting Camo", hex: "#5f6245" },
  { name: "Military Camo", hex: "#353829" },
];

export const sizeOptions = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];

export const proof = {
  trustpilotLabel: "Excellent on Trustpilot",
  rating: "4.5/5",
  reviewCount: "52,678 reviews",
  fiveStarClaim: "Over 9000 5-star reviews",
  returns: "60-day returns",
  shipping: "Ships from Kentucky and New Jersey for US orders",
};

export const customerImages = [
  { src: "/baerskin/ugc-01.jpg", alt: "Customer wearing the rain jacket outdoors." },
  { src: "/baerskin/ugc-02.jpg", alt: "Customer photo of the BÆRSkin rain jacket." },
  { src: "/baerskin/ugc-03.jpg", alt: "Customer wearing the rain jacket in wet weather." },
  { src: "/baerskin/ugc-04.jpg", alt: "Customer wearing the rain jacket in an outdoor setting." },
];
