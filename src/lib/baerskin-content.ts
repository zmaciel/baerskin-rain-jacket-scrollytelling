export type ProductOffer = {
  productName: string;
  salePrice: string;
  compareAtPrice: string;
  discountLabel: string;
  ctaUrl: string;
};

export type ChapterVideoConfig = {
  src: string;
  poster: string;
  duration: number;
};

export type ChapterVideoStage = {
  id: string;
  time: number;
  panel?: "reviews" | "faq";
};

export type ProductReview = {
  name: string;
  date: string;
  summary: string;
  tag: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const productOffer: ProductOffer = {
  productName: "BÆRSkin Heavy-Storm Waterproof Rain Jacket 2.0",
  salePrice: "$99.95",
  compareAtPrice: "$249.88",
  discountLabel: "60% off",
  ctaUrl: "https://baerskintactical.com/us/lp/rainjacket",
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
  { id: "customer-proof", time: 22.7, panel: "reviews" },
  { id: "faq", time: 22.7, panel: "faq" },
];

export const productReviews: ProductReview[] = [
  {
    name: "Brice Hughes",
    date: "May 4, 2026",
    summary: "Called out the heavy-duty materials, construction details, pocket capacity, and zip-in hoodie system.",
    tag: "Build quality",
  },
  {
    name: "Ormond Elam",
    date: "May 5, 2026",
    summary: "Bought the rain jacket with the fleece hoodie and pointed to Alabama rainstorms as the use case.",
    tag: "Storm use",
  },
  {
    name: "Jerry Agbay",
    date: "May 3, 2026",
    summary: "Highlighted comfort, easy carry, on-time delivery, and the jacket feeling worth the price.",
    tag: "Daily carry",
  },
  {
    name: "Matthew Lamb",
    date: "May 3, 2026",
    summary: "Owns multiple BÆRSkin pieces and said the rain jacket arrived quickly and matched what he wanted.",
    tag: "Repeat buyer",
  },
];

export const productFaqs: FaqItem[] = [
  {
    question: "What size should I get?",
    answer:
      "The jacket is intentionally oversized for layering. If you wear an XL hoodie, an XL rain jacket is built to fit over it. If you do not plan to layer, size down.",
  },
  {
    question: "What is a 20,000mm waterproof rating?",
    answer:
      "It is the storm-proofing proof point: the shell is built for heavier rain with a 20k rating, taped seams, and a water-repellent BÆR-Tex coating.",
  },
  {
    question: "What is RAIN-SULATION Design?",
    answer:
      "It is the seal system: adjustable wrists, waist, and hood work with the waterproof zip and storm flap to block wind-driven rain.",
  },
  {
    question: "What does the 2.5-layer feature mean?",
    answer:
      "The jacket combines a protective outer shell, waterproof membrane construction, and a lightweight inner finish so it stays packable without feeling flimsy.",
  },
  {
    question: "How many pockets does it have?",
    answer:
      "Five waterproof storage zones: two waist pockets, one shoulder pocket, and two interior pockets for dry carry.",
  },
  {
    question: "Can I return my product?",
    answer:
      "The product page lists a 60-day return window with free returns and full refund policy details for US orders.",
  },
];
