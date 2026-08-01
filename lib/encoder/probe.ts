import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { SourceMeta } from "./types";

const run = promisify(execFile);

type ProbeStream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  pix_fmt?: string;
  avg_frame_rate?: string;
};

type ProbeResult = {
  streams?: ProbeStream[];
  format?: { duration?: string; bit_rate?: string };
};

function parseFps(rate: string | undefined): number {
  if (!rate) return 0;
  const [num, den] = rate.split("/").map(Number);
  if (!num || !den) return 0;
  return num / den;
}

/** Throws if the file has no decodable video stream. */
export async function probe(inputPath: string): Promise<SourceMeta> {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    inputPath,
  ]);
  const data = JSON.parse(stdout) as ProbeResult;
  const video = data.streams?.find((s) => s.codec_type === "video");
  const audio = data.streams?.find((s) => s.codec_type === "audio");
  if (!video?.width || !video.height) {
    throw new Error("No video stream found in file");
  }
  return {
    durationSec: Number(data.format?.duration ?? 0),
    width: video.width,
    height: video.height,
    fps: parseFps(video.avg_frame_rate),
    videoCodec: video.codec_name ?? "unknown",
    pixFmt: video.pix_fmt ?? "unknown",
    hasAudio: Boolean(audio),
    audioCodec: audio?.codec_name ?? null,
    bitRate: data.format?.bit_rate ? Number(data.format.bit_rate) : null,
  };
}
