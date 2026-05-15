import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadLocalEnv } from "./env";

loadLocalEnv();

type ImageGenerationResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

type JacketView = {
  id: string;
  label: string;
  promptDetail: string;
};

const outputDir = path.resolve("source-data/generated-jacket/references");
const imageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
const views: JacketView[] = [
  {
    id: "front",
    label: "Front",
    promptDetail: "strict front orthographic view, centered, arms relaxed, zipper visible from hood to hem",
  },
  {
    id: "back",
    label: "Back",
    promptDetail: "strict back orthographic view, centered, hood shape and rear seam structure visible",
  },
  {
    id: "left",
    label: "Left side",
    promptDetail: "strict left side orthographic view, sleeve profile and side seam visible",
  },
  {
    id: "right",
    label: "Right side",
    promptDetail: "strict right side orthographic view, shoulder pocket and waterproof zipper details visible",
  },
  {
    id: "front-three-quarter",
    label: "Front three-quarter",
    promptDetail: "front three-quarter product view turned 35 degrees, depth and pocket placement visible",
  },
  {
    id: "rear-three-quarter",
    label: "Rear three-quarter",
    promptDetail: "rear three-quarter product view turned 35 degrees, hood volume and back panel seams visible",
  },
];

function requireEnv(name: "OPENAI_API_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Export it in the shell before running this generator.`);
  }

  return value;
}

function buildPrompt(view: JacketView) {
  return [
    "Create a clean product reference image for the same premium technical waterproof rain jacket.",
    "No human model, no mannequin, no text, no logo, no UI labels, no background clutter.",
    "Garment details: hood up, full front waterproof zipper, shoulder pocket, sealed seams, matte dark navy charcoal ripstop waterproof fabric, adjustable cuffs, adjustable waist, realistic technical apparel construction.",
    "The jacket must look identical across the full turnaround set: same proportions, same pocket placement, same seam layout, same fabric texture, same charcoal navy color.",
    `Required view: ${view.promptDetail}.`,
    "Plain light gray studio background, soft realistic lighting, complete garment in frame, no cropping, no dramatic fashion pose.",
  ].join(" ");
}

async function fetchImageFromUrl(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenAI returned an image URL that could not be downloaded: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function generateReference(view: JacketView, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: imageModel,
      prompt: buildPrompt(view),
      size: "1024x1024",
      quality: "high",
      output_format: "png",
      background: "opaque",
      n: 1,
    }),
  });

  const payload = (await response.json()) as ImageGenerationResponse;

  if (!response.ok) {
    const message = payload.error?.message ?? response.statusText;
    throw new Error(`OpenAI image generation failed for ${view.id}: ${response.status} ${message}`);
  }

  const image = payload.data?.[0];

  if (image?.b64_json) {
    return Buffer.from(image.b64_json, "base64");
  }

  if (image?.url) {
    return fetchImageFromUrl(image.url);
  }

  throw new Error(`OpenAI image generation for ${view.id} did not return image bytes.`);
}

async function readExistingBytes(filePath: string) {
  if (!existsSync(filePath)) {
    return null;
  }

  return readFile(filePath);
}

async function main() {
  const force = process.argv.includes("--force");
  const dryRun = process.argv.includes("--dry-run");
  const apiKey = dryRun ? "" : requireEnv("OPENAI_API_KEY");

  await mkdir(outputDir, { recursive: true });

  const manifestEntries: Array<{ id: string; label: string; file: string; prompt: string; reused: boolean }> = [];

  for (const view of views) {
    const filePath = path.join(outputDir, `${view.id}.png`);
    const existing = force ? null : await readExistingBytes(filePath);
    const reused = Boolean(existing);

    if (dryRun) {
      console.log(`Would generate ${view.id} -> ${path.relative(process.cwd(), filePath)}`);
    } else if (existing) {
      console.log(`Keeping existing ${view.id} reference. Use --force to regenerate.`);
    } else {
      console.log(`Generating ${view.id} reference with ${imageModel}.`);
      const imageBytes = await generateReference(view, apiKey);
      await writeFile(filePath, imageBytes);
    }

    manifestEntries.push({
      id: view.id,
      label: view.label,
      file: path.relative(process.cwd(), filePath),
      prompt: buildPrompt(view),
      reused,
    });
  }

  if (dryRun) {
    return;
  }

  await writeFile(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model: imageModel,
        notes: "Meshy multi-image generation uses the front/back/left/right references from this set.",
        views: manifestEntries,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Reference set ready in ${path.relative(process.cwd(), outputDir)}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
