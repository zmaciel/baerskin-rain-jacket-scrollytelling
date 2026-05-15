import { execFile } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type VideoProbe = {
  streams?: Array<{
    codec_type?: string;
    width?: number;
    height?: number;
    duration?: string;
  }>;
  format?: {
    duration?: string;
  };
};

const args = new Map<string, string>();

for (let index = 2; index < process.argv.length; index += 1) {
  const key = process.argv[index];
  const value = process.argv[index + 1];

  if (key?.startsWith("--") && value && !value.startsWith("--")) {
    args.set(key, value);
    index += 1;
  }
}

const input = args.get("--input") ?? "/Users/lourenco/Downloads/PFV Rain Jacket April Meta 9x16 (1).mp4";
const output = args.get("--output") ?? "public/baerskin/scroll-video";
const fps = args.get("--fps") ?? "4";
const width = args.get("--width") ?? "720";
const quality = args.get("--quality") ?? "4";
const format = args.get("--format") ?? "jpg";
const resolvedInput = resolve(input);
const resolvedOutput = resolve(output);
const frameDir = join(resolvedOutput, "frames");

async function probeVideo() {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=codec_type,width,height,duration",
    "-of",
    "json",
    resolvedInput,
  ]);

  return JSON.parse(stdout) as VideoProbe;
}

async function main() {
  const probe = await probeVideo();
  const videoStream = probe.streams?.find((stream) => stream.codec_type === "video");
  const duration = Number(videoStream?.duration ?? probe.format?.duration ?? 0);

  if (!videoStream?.width || !videoStream.height || !duration) {
    throw new Error(`Could not inspect video metadata for ${resolvedInput}`);
  }

  await rm(frameDir, { force: true, recursive: true });
  await mkdir(frameDir, { recursive: true });

  const outputPattern = join(frameDir, `frame-%04d.${format}`);
  const encodingArgs =
    format === "webp"
      ? ["-c:v", "libwebp", "-compression_level", "6", "-q:v", quality]
      : ["-q:v", quality];

  await execFileAsync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      resolvedInput,
      "-vf",
      `fps=${fps},scale=${width}:-2:flags=lanczos`,
      ...encodingArgs,
      outputPattern,
    ],
    { maxBuffer: 1024 * 1024 * 8 },
  );

  const frames = (await readdir(frameDir)).filter((file) => file.endsWith(`.${format}`)).sort();

  if (frames.length < 24) {
    throw new Error(`Only generated ${frames.length} frames. Check the source video and ffmpeg settings.`);
  }

  const manifest = {
    source: basename(resolvedInput),
    duration,
    sourceWidth: videoStream.width,
    sourceHeight: videoStream.height,
    frameCount: frames.length,
    fps: Number(fps),
    width: Number(width),
    aspectRatio: videoStream.width / videoStream.height,
    format,
    framePattern: `/baerskin/scroll-video/frames/frame-%04d.${format}`,
    poster: `/baerskin/scroll-video/frames/${frames[0]}`,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(join(resolvedOutput, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Generated ${frames.length} frames in ${frameDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
