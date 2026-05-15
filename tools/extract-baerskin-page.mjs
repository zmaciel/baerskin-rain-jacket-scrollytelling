import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL = "https://baerskintactical.com/us/lp/rainjacket";
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "source-data", "baerskin-rainjacket");
const RAW_DIR = path.join(OUT_DIR, "raw");
const ASSET_DIR = path.join(OUT_DIR, "assets");
const ORIGIN = "https://baerskintactical.com";

const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

function decodeHtml(value = "") {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");
}

function stripTags(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeSensitiveRuntimeData(html) {
  return html.replace(
    /self\.__next_f\.push\(\[1,"2e:\{[\s\S]*?\\n"\]\)<\/script>/,
    'self.__next_f.push([1,"2e:{\\"redacted\\":true,\\"reason\\":\\"request context removed from local source snapshot\\"}\\n"])</script>',
  );
}

function getAttr(tag, attr) {
  const match = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function normalizeUrl(raw) {
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:") || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
    return "";
  }

  let value = decodeHtml(raw).trim();
  if (value.startsWith("//")) {
    value = `https:${value}`;
  }

  try {
    const parsed = new URL(value, ORIGIN);

    if (parsed.pathname === "/_next/image" && parsed.searchParams.has("url")) {
      return new URL(parsed.searchParams.get("url"), ORIGIN).toString();
    }

    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function assetFilename(url) {
  const parsed = new URL(url);
  let ext = path.extname(parsed.pathname).toLowerCase();
  if (!ext || ext.length > 8) {
    ext = ".asset";
  }

  const basename = path
    .basename(parsed.pathname, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "asset";
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 8);

  return `${basename}-${hash}${ext}`;
}

function extractMeta(html) {
  const meta = {};
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) meta.title = stripTags(title[1]);

  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const name = getAttr(tag[0], "name") || getAttr(tag[0], "property");
    const content = getAttr(tag[0], "content");
    if (name && content) {
      meta[name] = content;
    }
  }

  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = getAttr(tag[0], "rel");
    const href = getAttr(tag[0], "href");
    const hrefLang = getAttr(tag[0], "hrefLang");
    if (rel === "canonical") {
      meta.canonical = normalizeUrl(href);
    }
    if (rel === "alternate" && hrefLang) {
      meta.alternates ??= [];
      meta.alternates.push({ hrefLang, href: normalizeUrl(href) });
    }
  }

  return meta;
}

function extractJsonLd(html) {
  const scripts = [];

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = decodeHtml(match[1].trim());
    try {
      scripts.push(JSON.parse(raw));
    } catch {
      scripts.push({ parseError: true, raw });
    }
  }

  return scripts;
}

function extractAssets(html) {
  const urls = new Set();

  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
    const normalized = normalizeUrl(match[1]);
    if (normalized) urls.add(normalized);
  }

  for (const match of html.matchAll(/srcSet=["']([^"']+)["']/gi)) {
    for (const part of decodeHtml(match[1]).split(",")) {
      const candidate = part.trim().split(/\s+/)[0];
      const normalized = normalizeUrl(candidate);
      if (normalized) urls.add(normalized);
    }
  }

  for (const match of html.matchAll(/https?:\/\/[^"'<> )]+/gi)) {
    const normalized = normalizeUrl(match[0]);
    if (normalized) urls.add(normalized);
  }

  return [...urls]
    .sort()
    .map((url) => {
      const parsed = new URL(url);
      const extension = path.extname(parsed.pathname).toLowerCase();
      const type = IMAGE_EXTENSIONS.has(extension)
        ? "image"
        : extension === ".css"
          ? "stylesheet"
          : extension === ".js"
            ? "script"
            : "link";

      return {
        url,
        host: parsed.host,
        path: parsed.pathname,
        extension,
        type,
        localFile: type === "image" ? `assets/${assetFilename(url)}` : null,
      };
    });
}

function textBlocks(html, selectorPattern) {
  const blocks = [];
  for (const match of html.matchAll(selectorPattern)) {
    const text = stripTags(match[1]);
    if (text) blocks.push(text);
  }
  return [...new Set(blocks)];
}

function extractFaq(html) {
  const questions = textBlocks(html, /<button\b[^>]*>(What[\s\S]*?)<\/button>/gi).filter((item) => item.includes("?"));
  const answers = textBlocks(html, /<dd\b[^>]*>([\s\S]*?)<\/dd>/gi);

  return questions.map((question, index) => ({
    question,
    answer: answers[index] || "",
  }));
}

function extractStructuredContent(html) {
  return {
    headings: textBlocks(html, /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi),
    paragraphs: textBlocks(html, /<p\b[^>]*>([\s\S]*?)<\/p>/gi),
    listItems: textBlocks(html, /<li\b[^>]*>([\s\S]*?)<\/li>/gi),
    buttonsAndLinks: textBlocks(html, /<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/gi),
    faq: extractFaq(html),
  };
}

function parseEscapedJsonArray(chunk) {
  const normalized = chunk.replace(/\\"/g, '"').replace(/\\n/g, "\\n");
  const start = normalized.indexOf("[");
  if (start === -1) return [];

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < normalized.length; index += 1) {
    const char = normalized[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(normalized.slice(start, index + 1));
      }
    }
  }

  return [];
}

function extractEmbeddedReviews(html) {
  const start = html.indexOf('\\"reviews\\":[');
  if (start === -1) return [];

  try {
    const reviews = parseEscapedJsonArray(html.slice(start + '\\"reviews\\":'.length, start + 700_000));
    return reviews.map((review) => ({
      id: review.id,
      name: review.name,
      avatar: review.avatar === "$undefined" ? null : review.avatar,
      rating: review.rating,
      content: review.content,
      date: review.date,
      sourceUrl: review.sourceUrl,
    }));
  } catch {
    return [];
  }
}

function summarizeProducts(jsonLd) {
  const productGroup = jsonLd.find((item) => item?.["@type"] === "ProductGroup");
  if (!productGroup) return null;

  const variants = productGroup.hasVariant || [];
  const colors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))].sort();
  const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))];
  const prices = [
    ...new Set(
      variants
        .flatMap((variant) => variant.offers || [])
        .map((offer) => `${offer.price} ${offer.priceCurrency}`)
        .filter(Boolean),
    ),
  ].sort();
  const availability = [
    ...new Set(
      variants
        .flatMap((variant) => variant.offers || [])
        .map((offer) => offer.availability?.replace("https://schema.org/", ""))
        .filter(Boolean),
    ),
  ].sort();

  return {
    productGroupID: productGroup.productGroupID,
    name: productGroup.name,
    description: productGroup.description,
    brand: productGroup.brand?.name,
    variantCount: variants.length,
    colors,
    sizes,
    prices,
    availability,
    imageCount: productGroup.image?.length || 0,
    variants: variants.map((variant) => ({
      sku: variant.sku,
      name: variant.name,
      color: variant.color,
      size: variant.size,
      image: variant.image?.[0] || null,
      availability: variant.offers?.[0]?.availability?.replace("https://schema.org/", "") || null,
      price: variant.offers?.[0]?.price || null,
      priceCurrency: variant.offers?.[0]?.priceCurrency || null,
      priceValidUntil: variant.offers?.[0]?.priceValidUntil || null,
    })),
  };
}

async function loadExpandedFaq() {
  try {
    const raw = await readFile(path.join(OUT_DIR, "faq-expanded.json"), "utf8");
    const faq = JSON.parse(raw);
    return Array.isArray(faq) ? faq : [];
  } catch {
    return [];
  }
}

function writeInventoryMarkdown(data) {
  const features = [
    "20,000mm waterproof rating",
    "2.5-layer fabric construction",
    "BÆR-Tex water-repellent coating",
    "PFAS / forever-chemical-free claim",
    "Taped seams and silicone-sealed zips",
    "Waterproof central zip and storm flap",
    "Adjustable hood, waist, and wrists",
    "Five waterproof pockets",
    "Packs into its own pocket / 4x6-inch pouch claim",
    "Two-zip system for attaching BÆRSkin Hoodie",
    "100% polyester ripstop fabric",
    "Slightly oversized unisex fit for layering",
  ];

  const imageAssets = data.assets.filter((asset) => asset.type === "image");
  const baerskinMedia = imageAssets.filter((asset) => asset.host === "baerskin.media");

  return `# Baerskin Rain Jacket Source Inventory

Source: ${data.source.url}
Captured: ${data.source.capturedAt}

## Page Positioning

- Product: BÆRSkin Heavy-Storm Rain Jacket 2.0.
- Core promise: packable, hiking-grade rain protection for sudden rain across outdoor and daily-use contexts.
- Primary use cases named on the page: fishing, golf, hunting, camping, boating, commuting, cycling, hiking, outdoor work.
- Primary offer observed on capture date: 60% off, $249.88 crossed/compare-at price, $99.95 sale price.
- Promotion observed: chance to win a Jeep Gladiator or $100,000 cash; legal copy says no purchase necessary and ends 2026-06-04.
- Review proof observed: Trustpilot Excellent, 4.5/5, 52,678 reviews; page also claims over 9000 5-star reviews.

## Technical Claims To Carry Forward

${features.map((feature) => `- ${feature}`).join("\n")}

## Source Sections

${data.content.headings.map((heading) => `- ${heading}`).join("\n")}

## FAQ Questions

${data.content.faq.map((item) => `- ${item.question}${item.answer ? ` — ${item.answer}` : ""}`).join("\n")}

## Asset Summary

- Total assets found: ${data.assets.length}
- Image assets found: ${imageAssets.length}
- Baerskin media image assets found: ${baerskinMedia.length}
- Local image copies attempted into: source-data/baerskin-rainjacket/assets/

## Product Data Summary

- Structured variants found: ${data.product?.variantCount ?? 0}
- Colors found: ${(data.product?.colors || []).join(", ")}
- Sizes found: ${(data.product?.sizes || []).join(", ")}
- Prices found: ${(data.product?.prices || []).join(", ")}
- Embedded reviews found: ${data.reviews.length}

## Scrollytelling Notes

- Strongest narrative arc: "caught by sudden rain" -> "sealed waterproof system" -> "packable readiness" -> "3-in-1 layering" -> "proof and offer."
- Best sticky chapter visuals: hero product-in-rain image, 2.5-layer fabric diagram, sealed zipper / taped seams close-up, packable pouch image, hoodie attachment image, PFAS lab-tested image.
- Main conversion pressure points: 60% off, $99.95 sale price, Trustpilot review volume, free shipping / secure-order badges, sweepstakes promo.
`;
}

async function downloadImageAsset(asset) {
  const localPath = path.join(OUT_DIR, asset.localFile);
  const response = await fetch(asset.url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    return { ...asset, downloaded: false, status: response.status };
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(localPath, bytes);
  return { ...asset, downloaded: true, status: response.status, bytes: bytes.length };
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(ASSET_DIR, { recursive: true });

  const response = await fetch(SOURCE_URL, {
    headers: {
      "user-agent": "Mozilla/5.0",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status}`);
  }

  const html = await response.text();
  await writeFile(path.join(RAW_DIR, "source.html"), sanitizeSensitiveRuntimeData(html));

  const jsonLd = extractJsonLd(html);
  const data = {
    source: {
      url: SOURCE_URL,
      fetchedUrl: response.url,
      capturedAt: new Date().toISOString(),
    },
    meta: extractMeta(html),
    jsonLd,
    product: summarizeProducts(jsonLd),
    reviews: extractEmbeddedReviews(html),
    content: extractStructuredContent(html),
    assets: extractAssets(html),
  };

  const expandedFaq = await loadExpandedFaq();
  if (expandedFaq.length > data.content.faq.length) {
    data.content.faq = expandedFaq;
    data.content.faqSource = "Expanded from live page accordions; see raw/dom-snapshot-expanded-faq.txt.";
  }

  const imageAssets = data.assets.filter((asset) => asset.type === "image");
  const downloads = [];
  for (const asset of imageAssets) {
    downloads.push(await downloadImageAsset(asset));
  }

  data.assets = data.assets.map((asset) => downloads.find((item) => item.url === asset.url) || asset);

  await writeFile(path.join(OUT_DIR, "page-data.json"), `${JSON.stringify(data, null, 2)}\n`);
  await writeFile(path.join(OUT_DIR, "assets.json"), `${JSON.stringify(data.assets, null, 2)}\n`);
  await writeFile(path.join(OUT_DIR, "content-inventory.md"), writeInventoryMarkdown(data));

  console.log(
    JSON.stringify(
      {
        sourceBytes: html.length,
        headings: data.content.headings.length,
        paragraphs: data.content.paragraphs.length,
        listItems: data.content.listItems.length,
        faq: data.content.faq.length,
        reviews: data.reviews.length,
        variants: data.product?.variantCount || 0,
        assets: data.assets.length,
        images: imageAssets.length,
        downloadedImages: downloads.filter((asset) => asset.downloaded).length,
        outDir: OUT_DIR,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
