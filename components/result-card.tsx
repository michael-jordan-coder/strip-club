"use client";

import { useState } from "react";
import type { JobStatus, UploadInfo } from "@/lib/encoder/types";
import { formatBytes, formatDuration } from "@/lib/format";
import { SaveDialog } from "./save-dialog";

type Props = {
  job: JobStatus;
  upload: UploadInfo;
  onAdjust: () => void;
  onReset: () => void;
};

export function ResultCard({ job, upload, onAdjust, onReset }: Props) {
  const [saving, setSaving] = useState(false);
  const outSize = job.outputSize ?? 0;
  const delta = ((outSize - upload.size) / upload.size) * 100;

  return (
    <div>
      <p className="font-mono text-xs text-zinc-500">
        {formatBytes(upload.size)} → {formatBytes(outSize)}{" "}
        <span className="text-zinc-300">
          {delta <= 0 ? "−" : "+"}
          {Math.abs(delta).toFixed(0)}%
        </span>{" "}
        · {formatDuration(job.elapsedMs / 1000)}
      </p>

      <button
        type="button"
        onClick={() => setSaving(true)}
        className="mt-8 block w-full rounded-lg bg-zinc-100 py-3 text-center text-sm font-medium text-zinc-900 transition-colors duration-150 hover:bg-white"
      >
        Download MP4
      </button>

      <SaveDialog
        open={saving}
        onOpenChange={setSaving}
        defaultName={`${upload.name.replace(/\.[^.]+$/, "")}-encoded`}
        jobId={job.id}
      />

      <div className="mt-4 flex justify-center gap-6">
        <button
          type="button"
          onClick={onAdjust}
          className="text-xs text-zinc-500 transition-colors duration-150 hover:text-zinc-300"
        >
          Adjust settings
        </button>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-zinc-500 transition-colors duration-150 hover:text-zinc-300"
        >
          New file
        </button>
      </div>
    </div>
  );
}
