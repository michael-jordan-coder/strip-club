"use client";

import { useEffect, useState } from "react";
import type { EncodeSettings, JobStatus, UploadInfo } from "@/lib/encoder/types";
import { defaultSettings } from "@/lib/encoder/types";
import { Dropzone } from "@/components/dropzone";
import { SourceCard } from "@/components/source-card";
import { SettingsForm } from "@/components/settings-form";
import { SettingsSummary } from "@/components/settings-summary";
import { EncodeProgress } from "@/components/encode-progress";
import { ResultCard } from "@/components/result-card";
import { VideoPreview } from "@/components/video-preview";

type Phase = "idle" | "uploading" | "ready" | "encoding" | "done" | "error";

function uploadFile(
  file: File,
  onProgress: (fraction: number) => void,
): Promise<UploadInfo> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText) as UploadInfo);
      } else {
        let message = "Upload failed";
        try {
          message = (JSON.parse(xhr.responseText) as { error: string }).error;
        } catch {}
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [upload, setUpload] = useState<UploadInfo | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [settings, setSettings] = useState<EncodeSettings>(defaultSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [winDrag, setWinDrag] = useState(false);

  useEffect(() => {
    if (phase !== "encoding" || !jobId) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) return;
      const status = (await res.json()) as JobStatus;
      if (status.state === "cancelled") {
        setJob(null);
        setPhase("ready");
        return;
      }
      setJob(status);
      if (status.state === "done") setPhase("done");
      if (status.state === "error") {
        setError(status.error ?? "Encode failed");
        setPhase("error");
      }
    }, 500);
    return () => clearInterval(timer);
  }, [phase, jobId]);

  const handleFile = async (file: File) => {
    setPhase("uploading");
    setUploadPct(0);
    setError(null);
    setJob(null);
    setShowSettings(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    try {
      const info = await uploadFile(file, setUploadPct);
      setUpload(info);
      setSettings(defaultSettings());
      setPhase("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setPhase("error");
    }
  };

  // Window-wide drag & drop: drop a file anywhere except mid-upload/mid-encode.
  useEffect(() => {
    if (phase === "uploading" || phase === "encoding") return;
    let depth = 0;
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth += 1;
      setWinDrag(true);
    };
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setWinDrag(false);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setWinDrag(false);
      const file = e.dataTransfer?.files[0];
      if (file) void handleFile(file);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
      setWinDrag(false);
    };
  }, [phase]);

  const startEncode = async () => {
    if (!upload) return;
    setJob(null);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId: upload.id, settings }),
    });
    if (!res.ok) {
      setError("Could not start encode");
      setPhase("error");
      return;
    }
    const { id } = (await res.json()) as { id: string };
    setJobId(id);
    setPhase("encoding");
  };

  const cancelEncode = async () => {
    if (!jobId) return;
    await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    setJob(null);
    setPhase("ready");
  };

  const reset = () => {
    setPhase("idle");
    setUpload(null);
    setJobId(null);
    setJob(null);
    setError(null);
    setShowSettings(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      {winDrag && (
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
          <p className="text-sm text-zinc-200">Drop to load</p>
        </div>
      )}

      <div>
        {phase === "idle" && <Dropzone onFile={handleFile} />}

        {phase === "uploading" && (
          <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-100 transition-[width] duration-300 ease-out"
              style={{ width: `${uploadPct * 100}%` }}
            />
          </div>
        )}

        {(phase === "ready" || phase === "encoding" || phase === "done") && upload && (
          <div>
            <div className="overflow-hidden rounded-xl bg-zinc-900">
              {previewUrl && <VideoPreview key={previewUrl} src={previewUrl} />}
              <div className="px-4 py-3.5">
                <SourceCard
                  upload={upload}
                  onRemove={phase !== "encoding" ? reset : undefined}
                />
                {phase === "ready" && (
                  <>
                    <div className="mt-3">
                      <SettingsSummary
                        settings={settings}
                        hasAudio={upload.meta.hasAudio}
                        open={showSettings}
                        onToggle={() => setShowSettings((v) => !v)}
                      />
                    </div>
                    {showSettings && (
                      <div className="mt-6">
                        <SettingsForm
                          settings={settings}
                          meta={upload.meta}
                          onChange={setSettings}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {phase === "ready" && (
              <button
                type="button"
                onClick={startEncode}
                className="mt-6 w-full rounded-lg bg-zinc-100 py-3 text-sm font-medium text-zinc-900 transition-colors duration-150 hover:bg-white"
              >
                Encode
              </button>
            )}

            {phase === "encoding" && (
              <div className="mt-8">
                {job ? (
                  <EncodeProgress job={job} meta={upload.meta} />
                ) : (
                  <div className="h-1 rounded-full bg-zinc-800" />
                )}
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={cancelEncode}
                    className="text-xs text-zinc-500 transition-colors duration-150 hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {phase === "done" && job && (
              <div className="mt-8">
                <ResultCard
                  job={job}
                  upload={upload}
                  onAdjust={() => setPhase("ready")}
                  onReset={reset}
                />
              </div>
            )}
          </div>
        )}

        {phase === "error" && (
          <div>
            <p className="text-sm text-red-400/90">Failed</p>
            {error && (
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-900 p-4 font-mono text-xs text-zinc-500">
                {error}
              </pre>
            )}
            <button
              type="button"
              onClick={upload ? () => setPhase("ready") : reset}
              className="mt-6 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-200"
            >
              {upload ? "Back to settings" : "Start over"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
