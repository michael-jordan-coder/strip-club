import { spawn } from "node:child_process";
import { stat, unlink } from "node:fs/promises";
import type { Job, Upload } from "./store";

/**
 * Quality-first ffmpeg invocation:
 * - CRF rate control (constant quality, no bitrate guessing)
 * - aq-mode=3 for better bit allocation in dark/flat regions
 * - Lanczos scaling when downsizing
 * - Apple AudioToolbox AAC (higher quality than ffmpeg's native aac)
 * - +faststart so the mp4 streams before fully downloaded
 */
export function buildArgs(upload: Upload, job: Job): string[] {
  const { meta } = upload;
  const s = job.settings;
  const args = [
    "-y", "-hide_banner", "-loglevel", "error",
    "-progress", "pipe:1", "-nostats",
    "-i", upload.inputPath,
    "-map", "0:v:0",
    "-map", "0:a:0?",
    "-map_metadata", "0",
  ];

  const filters: string[] = [];
  if (s.maxHeight && meta.height > s.maxHeight) {
    filters.push(`scale=-2:${s.maxHeight}:flags=lanczos+accurate_rnd+full_chroma_int`);
  } else if (meta.width % 2 !== 0 || meta.height % 2 !== 0) {
    // 4:2:0 output needs even dimensions; trim at most 1px instead of resampling.
    filters.push("crop=trunc(iw/2)*2:trunc(ih/2)*2");
  }
  if (filters.length > 0) args.push("-vf", filters.join(","));

  if (s.codec === "h264") {
    args.push(
      "-c:v", "libx264",
      "-preset", s.preset,
      "-crf", String(s.crf),
      "-profile:v", "high",
      "-pix_fmt", "yuv420p",
      "-x264-params", "aq-mode=3",
    );
  } else {
    args.push(
      "-c:v", "libx265",
      "-preset", s.preset,
      "-crf", String(s.crf),
      "-tag:v", "hvc1",
      "-pix_fmt", s.tenBit ? "yuv420p10le" : "yuv420p",
      "-x265-params", "log-level=error:aq-mode=3",
    );
  }

  if (!meta.hasAudio || s.audio === "none") {
    args.push("-an");
  } else if (s.audio === "auto" && meta.audioCodec === "aac") {
    args.push("-c:a", "copy");
  } else {
    args.push("-c:a", "aac_at", "-b:a", "256k");
  }

  args.push("-movflags", "+faststart", job.outputPath);
  return args;
}

/** Fire-and-forget: mutates `job` in the store as ffmpeg reports progress. */
export function runEncode(upload: Upload, job: Job): void {
  const durationUs = upload.meta.durationSec * 1_000_000;
  const proc = spawn("ffmpeg", buildArgs(upload, job));
  job.proc = proc;

  let stdoutBuf = "";
  proc.stdout.on("data", (chunk: Buffer) => {
    stdoutBuf += chunk.toString();
    const lines = stdoutBuf.split("\n");
    stdoutBuf = lines.pop() ?? "";
    for (const line of lines) {
      const [key, value] = line.split("=");
      if (key === "out_time_us" && durationUs > 0) {
        const t = Number(value);
        if (Number.isFinite(t)) job.progress = Math.min(t / durationUs, 1);
      } else if (key === "fps") {
        const f = Number(value);
        if (Number.isFinite(f)) job.fps = f;
      } else if (key === "speed") {
        const sp = Number(value.replace("x", "").trim());
        if (Number.isFinite(sp)) job.speed = sp;
      }
    }
  });

  let stderrTail = "";
  proc.stderr.on("data", (chunk: Buffer) => {
    stderrTail = (stderrTail + chunk.toString()).slice(-4000);
  });

  proc.on("error", (err) => {
    if (job.state === "cancelled") return;
    job.state = "error";
    job.error = err.message;
    job.finishedAt = Date.now();
  });

  proc.on("close", (code) => {
    void (async () => {
      job.finishedAt = Date.now();
      if (job.state === "cancelled") {
        await unlink(job.outputPath).catch(() => {});
      } else if (code === 0) {
        try {
          const { size } = await stat(job.outputPath);
          job.outputSize = size;
          job.progress = 1;
          job.state = "done";
        } catch {
          job.state = "error";
          job.error = "Encode finished but output file is missing";
        }
      } else {
        job.state = "error";
        job.error = stderrTail.trim() || `ffmpeg exited with code ${code}`;
      }
    })();
  });
}
