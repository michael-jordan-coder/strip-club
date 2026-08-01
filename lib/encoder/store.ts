import type { ChildProcess } from "node:child_process";
import type { EncodeSettings, JobStatus, SourceMeta } from "./types";

export type Upload = {
  id: string;
  name: string;
  size: number;
  inputPath: string;
  dir: string;
  meta: SourceMeta;
};

export type Job = {
  id: string;
  uploadId: string;
  settings: EncodeSettings;
  state: "encoding" | "done" | "error" | "cancelled";
  proc: ChildProcess | null;
  progress: number;
  fps: number;
  speed: number;
  outputPath: string;
  outputName: string;
  outputSize: number | null;
  startedAt: number;
  finishedAt: number | null;
  error: string | null;
};

// Survives dev-server HMR by living on globalThis.
const g = globalThis as unknown as {
  __mp4encUploads?: Map<string, Upload>;
  __mp4encJobs?: Map<string, Job>;
};

export const uploads: Map<string, Upload> = (g.__mp4encUploads ??= new Map());
export const jobs: Map<string, Job> = (g.__mp4encJobs ??= new Map());

export function jobStatus(job: Job): JobStatus {
  return {
    id: job.id,
    state: job.state,
    progress: job.progress,
    fps: job.fps,
    speed: job.speed,
    outputSize: job.outputSize,
    elapsedMs: (job.finishedAt ?? Date.now()) - job.startedAt,
    error: job.error,
  };
}
