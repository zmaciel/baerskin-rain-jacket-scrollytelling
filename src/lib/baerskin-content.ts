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
];
