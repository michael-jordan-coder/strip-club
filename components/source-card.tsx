import type { UploadInfo } from "@/lib/encoder/types";
import { formatBytes, formatDuration } from "@/lib/format";

type Props = {
  upload: UploadInfo;
  onRemove?: () => void;
};

export function SourceCard({ upload, onRemove }: Props) {
  const { meta } = upload;
  const parts = [
    `${meta.width}×${meta.height}`,
    meta.fps > 0 ? `${Math.round(meta.fps)} fps` : null,
    meta.videoCodec,
    meta.hasAudio ? meta.audioCodec : "no audio",
    formatDuration(meta.durationSec),
  ].filter(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-sm text-zinc-200">{upload.name}</p>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-xs text-zinc-500">
            {formatBytes(upload.size)}
          </span>
          {onRemove && (
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
      <p className="mt-1 truncate font-mono text-xs text-zinc-600">
        {parts.join(" · ")}
      </p>
    </div>
  );
}
