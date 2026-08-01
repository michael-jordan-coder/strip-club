export type Codec = "h264" | "hevc";
export type Preset = "slow" | "slower" | "veryslow";
export type AudioMode = "auto" | "reencode" | "none";

export type EncodeSettings = {
  codec: Codec;
  crf: number;
  preset: Preset;
  /** Cap output height; null keeps source resolution. */
  maxHeight: number | null;
  audio: AudioMode;
  /** HEVC only — 10-bit output reduces banding in gradients. */
  tenBit: boolean;
};

export type SourceMeta = {
  durationSec: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  pixFmt: string;
  hasAudio: boolean;
  audioCodec: string | null;
  bitRate: number | null;
};

export type UploadInfo = {
  id: string;
  name: string;
  size: number;
  meta: SourceMeta;
};

export type JobStatus = {
  id: string;
  state: "encoding" | "done" | "error" | "cancelled";
  /** 0..1 */
  progress: number;
  fps: number;
  /** Realtime multiplier, e.g. 0.4 = slower than realtime. */
  speed: number;
  outputSize: number | null;
  elapsedMs: number;
  error: string | null;
};

export const DEFAULT_CRF: Record<Codec, number> = { h264: 16, hevc: 18 };

export function defaultSettings(): EncodeSettings {
  return {
    codec: "h264",
    crf: DEFAULT_CRF.h264,
    preset: "slower",
    maxHeight: null,
    audio: "auto",
    tenBit: false,
  };
}
