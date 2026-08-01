"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JobStatus, SourceMeta, UploadInfo } from "@/lib/encoder/types";
import { defaultSettings } from "@/lib/encoder/types";
import { Dropzone } from "@/components/dropzone";
import { SourceCard } from "@/components/source-card";
import { SettingsForm } from "@/components/settings-form";
import { SettingsSummary } from "@/components/settings-summary";
import { EncodeProgress } from "@/components/encode-progress";
import { ResultCard } from "@/components/result-card";
import { VideoPreview } from "@/components/video-preview";
import { QueueRow, type QueueItem } from "@/components/queue-row";

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const itemsRef = useRef<QueueItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const [settings, setSettings] = useState(defaultSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);
  const [winDrag, setWinDrag] = useState(false);

  const patch = useCallback((key: string, p: Partial<QueueItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it)));
  }, []);

  const addFiles = useCallback(
    (files: File[]) => {
      const newItems: QueueItem[] = files.map((file) => ({
        key: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
        uploadPct: 0,
        upload: null,
        status: "uploading",
        jobId: null,
        job: null,
        error: null,
      }));
      setItems((prev) => [...prev, ...newItems]);
      newItems.forEach((it, i) => {
        void uploadFile(files[i], (f) => patch(it.key, { uploadPct: f }))
          .then((info) => patch(it.key, { upload: info, status: "ready" }))
          .catch((e) =>
            patch(it.key, {
              status: "error",
              error: e instanceof Error ? e.message : "Upload failed",
            }),
          );
      });
    },
    [patch],
  );

  const removeItem = useCallback((key: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.key === key);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((x) => x.key !== key);
    });
  }, []);

  // Window-wide drag & drop, any time.
  useEffect(() => {
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
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) addFiles(files);
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
    };
  }, [addFiles]);

  // Serial queue: one ffmpeg at a time gets all the cores.
  const runQueue = async () => {
    setRunning(true);
    cancelRef.current = false;
    const batch = itemsRef.current
      .filter((it) => it.status === "ready" && it.upload)
      .map((it) => ({ key: it.key, uploadId: it.upload?.id ?? "" }));
    for (const { key } of batch) {
      patch(key, { status: "queued", job: null, jobId: null });
    }

    for (const { key, uploadId } of batch) {
      if (cancelRef.current) break;
      if (!itemsRef.current.some((it) => it.key === key)) continue;

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, settings }),
      });
      if (!res.ok) {
        patch(key, { status: "error", error: "Could not start encode" });
        continue;
      }
      const { id } = (await res.json()) as { id: string };
      patch(key, { status: "encoding", jobId: id });

      while (true) {
        await sleep(500);
        if (cancelRef.current) {
          await fetch(`/api/jobs/${id}`, { method: "DELETE" });
          patch(key, { status: "ready", job: null, jobId: null });
          break;
        }
        const poll = await fetch(`/api/jobs/${id}`);
        if (!poll.ok) continue;
        const status = (await poll.json()) as JobStatus;
        if (status.state === "cancelled") {
          patch(key, { status: "ready", job: null, jobId: null });
          break;
        }
        if (status.state === "done") {
          patch(key, { status: "done", job: status });
          break;
        }
        if (status.state === "error") {
          patch(key, { status: "error", error: status.error ?? "Encode failed", job: null });
          break;
        }
        patch(key, { job: status });
      }
    }

    setItems((prev) =>
      prev.map((it) => (it.status === "queued" ? { ...it, status: "ready" } : it)),
    );
    setRunning(false);
  };

  const single = items.length === 1 ? items[0] : null;
  const readyCount = items.filter((it) => it.status === "ready" && it.upload).length;

  const metas = items.flatMap((it) => (it.upload ? [it.upload.meta] : []));
  const aggMeta: SourceMeta | null =
    metas.length > 0
      ? {
          ...metas[0],
          height: Math.max(...metas.map((m) => m.height)),
          hasAudio: metas.some((m) => m.hasAudio),
        }
      : null;

  const actionButton = running ? (
    <button
      type="button"
      onClick={() => {
        cancelRef.current = true;
      }}
      className="mt-6 w-full rounded-lg bg-zinc-800 py-3 text-sm text-zinc-300 transition-colors duration-150 hover:bg-zinc-700"
    >
      Cancel
    </button>
  ) : readyCount > 0 ? (
    <button
      type="button"
      onClick={runQueue}
      className="mt-6 w-full rounded-lg bg-zinc-100 py-3 text-sm font-medium text-zinc-900 transition-colors duration-150 hover:bg-white"
    >
      {items.length > 1 ? `Encode ${readyCount}` : "Encode"}
    </button>
  ) : null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      {winDrag && (
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
          <p className="text-sm text-zinc-200">Drop to add</p>
        </div>
      )}

      {items.length === 0 && <Dropzone onFiles={addFiles} />}

      {single && single.status === "uploading" && (
        <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-100 transition-[width] duration-300 ease-out"
            style={{ width: `${single.uploadPct * 100}%` }}
          />
        </div>
      )}

      {single && single.status === "error" && (
        <div>
          <p className="text-sm text-red-400/90">Failed</p>
          {single.error && (
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-900 p-4 font-mono text-xs text-zinc-500">
              {single.error}
            </pre>
          )}
          <button
            type="button"
            onClick={() =>
              single.upload
                ? patch(single.key, { status: "ready", error: null })
                : removeItem(single.key)
            }
            className="mt-6 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-200"
          >
            {single.upload ? "Back to settings" : "Start over"}
          </button>
        </div>
      )}

      {single &&
        single.upload &&
        single.status !== "uploading" &&
        single.status !== "error" && (
          <div>
            <div className="overflow-hidden rounded-xl bg-zinc-900">
              {single.previewUrl && (
                <VideoPreview key={single.previewUrl} src={single.previewUrl} />
              )}
              <div className="px-4 py-3.5">
                <SourceCard
                  upload={single.upload}
                  onRemove={
                    single.status === "encoding" || single.status === "queued"
                      ? undefined
                      : () => removeItem(single.key)
                  }
                />
                {single.status === "ready" && (
                  <>
                    <div className="mt-3">
                      <SettingsSummary
                        settings={settings}
                        hasAudio={single.upload.meta.hasAudio}
                        open={showSettings}
                        onToggle={() => setShowSettings((v) => !v)}
                      />
                    </div>
                    {showSettings && (
                      <div className="mt-6">
                        <SettingsForm
                          settings={settings}
                          meta={single.upload.meta}
                          onChange={setSettings}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {(single.status === "encoding" || single.status === "queued") && (
              <div className="mt-8">
                {single.job ? (
                  <EncodeProgress job={single.job} meta={single.upload.meta} />
                ) : (
                  <div className="h-1 rounded-full bg-zinc-800" />
                )}
              </div>
            )}

            {single.status === "done" && single.job && (
              <div className="mt-8">
                <ResultCard
                  job={single.job}
                  upload={single.upload}
                  onAdjust={() =>
                    patch(single.key, { status: "ready", job: null, jobId: null })
                  }
                  onReset={() => removeItem(single.key)}
                />
              </div>
            )}
          </div>
        )}

      {items.length > 1 && (
        <div>
          <div>
            {items.map((it) => (
              <QueueRow
                key={it.key}
                item={it}
                locked={it.status === "encoding" || (running && it.status === "queued")}
                onRemove={() => removeItem(it.key)}
              />
            ))}
          </div>

          {readyCount > 0 && aggMeta && (
            <div className="mt-6 rounded-xl bg-zinc-900 px-4 py-3.5">
              <SettingsSummary
                settings={settings}
                hasAudio={aggMeta.hasAudio}
                open={showSettings}
                onToggle={() => setShowSettings((v) => !v)}
              />
              {showSettings && (
                <div className="mt-6">
                  <SettingsForm
                    settings={settings}
                    meta={aggMeta}
                    onChange={setSettings}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(items.length > 1 || single?.status === "ready" || (single && running)) &&
        actionButton}
    </main>
  );
}
