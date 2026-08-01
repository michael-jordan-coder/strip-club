"use client";

import { useState } from "react";
import type { JobStatus, UploadInfo } from "@/lib/encoder/types";
import { formatBytes, formatDuration } from "@/lib/format";

export type ItemStatus =
  | "uploading"
  | "ready"
  | "queued"
  | "encoding"
  | "done"
  | "error";

export type QueueItem = {
  key: string;
  name: string;
  size: number;
  previewUrl: string | null;
  uploadPct: number;
  upload: UploadInfo | null;
  status: ItemStatus;
  jobId: string | null;
  job: JobStatus | null;
  error: string | null;
};

function Thumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="h-12 w-20 shrink-0 rounded-md bg-zinc-800" />;
  return (
    <video
      src={src}
      muted
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      className="h-12 w-20 shrink-0 rounded-md bg-black object-cover"
    />
  );
}

function Status({ item }: { item: QueueItem }) {
  if (item.status === "ready") {
    return (
      <span className="font-mono text-xs text-zinc-500">{formatBytes(item.size)}</span>
    );
  }
  if (item.status === "queued") {
    return <span className="font-mono text-xs text-zinc-600">queued</span>;
  }
  if (item.status === "encoding") {
    return (
      <span className="font-mono text-xs tabular-nums text-zinc-200">
        {Math.floor((item.job?.progress ?? 0) * 100)}%
      </span>
    );
  }
  if (item.status === "done" && item.job?.outputSize != null) {
    const delta = Math.round(((item.job.outputSize - item.size) / item.size) * 100);
    return (
      <>
        <span className="font-mono text-xs text-zinc-300">
          {delta <= 0 ? "−" : "+"}
          {Math.abs(delta)}%
        </span>
        <a
          href={`/api/jobs/${item.jobId}/download`}
          aria-label="Download"
          className="text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 4v12m0 0 4-4m-4 4-4-4" />
            <path d="M4 19h16" />
          </svg>
        </a>
      </>
    );
  }
  if (item.status === "error") {
    return <span className="text-xs text-red-400/90">failed</span>;
  }
  return null;
}

type Props = {
  item: QueueItem;
  locked: boolean;
  onRemove: () => void;
};

export function QueueRow({ item, locked, onRemove }: Props) {
  const meta = item.upload?.meta;
  const sub =
    item.status === "uploading"
      ? `uploading ${Math.round(item.uploadPct * 100)}%`
      : item.status === "error"
        ? (item.error ?? "failed")
        : meta
          ? `${meta.width}×${meta.height} · ${formatDuration(meta.durationSec)}`
          : "";

  return (
    <div className="flex items-center gap-3 py-2">
      {item.previewUrl ? (
        <Thumb src={item.previewUrl} />
      ) : (
        <div className="h-12 w-20 shrink-0 rounded-md bg-zinc-800" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-200">{item.name}</p>
        <p className="truncate font-mono text-xs text-zinc-600">{sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Status item={item} />
        {!locked && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove file"
            className="-m-1 p-1 text-zinc-600 transition-colors duration-150 hover:text-zinc-200"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
