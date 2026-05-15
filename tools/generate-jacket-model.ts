import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadLocalEnv } from "./env";

loadLocalEnv();

type MeshyCreateResponse = {
  result?: string;
  message?: string;
};

type MeshyTask = {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";
  progress?: number;
  model_urls?: {
    glb?: string;
    pre_remeshed_glb?: string;
  };
  thumbnail_url?: string;
  task_error?: {
    message?: string;
  };
  consumed_credits?: number;
};

const meshyBaseUrl = "https://api.meshy.ai/openapi/v1";
const referenceDir = path.resolve("source-data/generated-jacket/references");
const modelOutputPath = path.resolve("public/baerskin/3d/baerskin-rainjacket.glb");
const posterOutputPath = path.resolve("public/baerskin/3d/poster.webp");
const modelStatusPath = path.resolve("public/baerskin/3d/model-status.json");
const taskSnapshotPath = path.resolve("source-data/generated-jacket/meshy-task.json");
const rawModelOutputPath = path.resolve("source-data/generated-jacket/raw/baerskin-rainjacket-raw.glb");
const maxModelBytes = 10 * 1024 * 1024;
const requiredReferenceIds = ["front", "back", "left", "right"];
const execFileAsync = promisify(execFile);

function requireEnv(name: "MESHY_API_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Export it in the shell before running this generator.`);
  }

  return value;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function imageToDataUri(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing reference image: ${path.relative(process.cwd(), filePath)}. Run npm run generate:references first.`);
  }

  const bytes = await readFile(filePath);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

async function createMeshyTask(apiKey: string, imageUrls: string[]) {
  const response = await fetch(`${meshyBaseUrl}/multi-image-to-3d`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_urls: imageUrls,
      ai_model: process.env.MESHY_MODEL ?? "latest",
      should_texture: true,
      enable_pbr: true,
      hd_texture: false,
      should_remesh: true,
      topology: "triangle",
      target_polycount: 30000,
      target_formats: ["glb"],
      auto_size: true,
      origin_at: "bottom",
      image_enhancement: true,
      remove_lighting: true,
      moderation: true,
      texture_prompt:
        "matte dark navy charcoal waterproof ripstop technical rain jacket fabric, subtle sealed seams, black waterproof zipper tape, realistic outdoor shell material",
    }),
  });

  const payload = (await response.json()) as MeshyCreateResponse;

  if (!response.ok || !payload.result) {
    throw new Error(`Meshy task creation failed: ${response.status} ${payload.message ?? response.statusText}`);
  }

  return payload.result;
}

async function getMeshyTask(apiKey: string, taskId: string) {
  const response = await fetch(`${meshyBaseUrl}/multi-image-to-3d/${taskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const payload = (await response.json()) as MeshyTask;

  if (!response.ok) {
    throw new Error(`Meshy task lookup failed: ${response.status} ${payload.task_error?.message ?? response.statusText}`);
  }

  return payload;
}

async function waitForTask(apiKey: string, taskId: string) {
  const timeoutMs = Number(process.env.MESHY_TIMEOUT_MS ?? 18 * 60 * 1000);
  const pollMs = Number(process.env.MESHY_POLL_MS ?? 10 * 1000);
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const task = await getMeshyTask(apiKey, taskId);
    const progress = typeof task.progress === "number" ? `${task.progress}%` : "progress pending";

    console.log(`Meshy ${task.status}: ${progress}`);

    if (task.status === "SUCCEEDED") {
      return task;
    }

    if (task.status === "FAILED" || task.status === "CANCELED") {
      throw new Error(`Meshy task ${task.status.toLowerCase()}: ${task.task_error?.message ?? "No error message returned."}`);
    }

    await sleep(pollMs);
  }

  throw new Error(`Meshy task timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
}

async function downloadBinary(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function maybeSaveThumbnail(task: MeshyTask) {
  if (!task.thumbnail_url) {
    return;
  }

  const response = await fetch(task.thumbnail_url);

  if (!response.ok) {
    console.warn(`Skipping Meshy thumbnail download: ${response.status} ${response.statusText}`);
    return;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("image/webp")) {
    await writeFile(posterOutputPath, bytes);
    console.log(`Updated ${path.relative(process.cwd(), posterOutputPath)} from Meshy thumbnail.`);
    return;
  }

  await writeFile(path.resolve("source-data/generated-jacket/meshy-thumbnail"), bytes);
  console.log("Meshy thumbnail saved for review; existing poster.webp was kept because thumbnail was not WebP.");
}

async function validateGlb(filePath: string) {
  const bytes = await readFile(filePath);
  const header = bytes.subarray(0, 4).toString("utf8");

  if (header !== "glTF") {
    throw new Error(`Downloaded file is not a binary GLB. Header was ${JSON.stringify(header)}.`);
  }

  const fileStat = await stat(filePath);

  if (fileStat.size > maxModelBytes) {
    throw new Error(
      `Generated GLB is ${(fileStat.size / 1024 / 1024).toFixed(2)}MB, above the 10MB quality gate. Regenerate or optimize before shipping.`,
    );
  }

  console.log(`GLB quality gate passed: ${(fileStat.size / 1024 / 1024).toFixed(2)}MB.`);
}

async function optimizeGlbIfNeeded(filePath: string) {
  const fileStat = await stat(filePath);

  if (fileStat.size <= maxModelBytes) {
    return;
  }

  await mkdir(path.dirname(rawModelOutputPath), { recursive: true });
  await writeFile(rawModelOutputPath, await readFile(filePath));

  console.log(
    `Generated GLB is ${(fileStat.size / 1024 / 1024).toFixed(2)}MB. Running gltfpack mesh compression before final validation.`,
  );

  await execFileAsync("npx", [
    "gltfpack",
    "-i",
    rawModelOutputPath,
    "-o",
    filePath,
    "-cf",
  ]);
}

async function writeTaskSnapshot(task: MeshyTask) {
  await mkdir(path.dirname(taskSnapshotPath), { recursive: true });
  await writeFile(
    taskSnapshotPath,
    `${JSON.stringify(
      {
        id: task.id,
        status: task.status,
        progress: task.progress,
        consumed_credits: task.consumed_credits,
        has_glb: Boolean(task.model_urls?.glb),
        has_thumbnail: Boolean(task.thumbnail_url),
        task_error: task.task_error,
        capturedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
}

async function writeModelStatus(task: MeshyTask) {
  await writeFile(
    modelStatusPath,
    `${JSON.stringify(
      {
        ready: true,
        model: "/baerskin/3d/baerskin-rainjacket.glb",
        poster: "/baerskin/3d/poster.webp",
        sourceTaskId: task.id,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const apiKey = dryRun ? "" : requireEnv("MESHY_API_KEY");
  const referencePaths = requiredReferenceIds.map((id) => path.join(referenceDir, `${id}.png`));

  await mkdir(path.dirname(modelOutputPath), { recursive: true });
  await mkdir(path.dirname(taskSnapshotPath), { recursive: true });

  if (dryRun) {
    for (const referencePath of referencePaths) {
      console.log(`Would submit ${path.relative(process.cwd(), referencePath)}`);
    }
    console.log(`Would download GLB to ${path.relative(process.cwd(), modelOutputPath)}.`);
    return;
  }

  const imageUrls = await Promise.all(referencePaths.map(imageToDataUri));

  console.log("Creating Meshy multi-image-to-3D task from front/back/left/right references.");
  const taskId = await createMeshyTask(apiKey, imageUrls);
  console.log(`Meshy task created: ${taskId}`);

  const task = await waitForTask(apiKey, taskId);
  await writeTaskSnapshot(task);

  const glbUrl = task.model_urls?.glb;

  if (!glbUrl) {
    throw new Error("Meshy task succeeded but did not return a GLB URL.");
  }

  const modelBytes = await downloadBinary(glbUrl);
  await writeFile(modelOutputPath, modelBytes);
  await optimizeGlbIfNeeded(modelOutputPath);
  await validateGlb(modelOutputPath);
  await maybeSaveThumbnail(task);
  await writeModelStatus(task);

  console.log(`Model ready at ${path.relative(process.cwd(), modelOutputPath)}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
