import type { JobStatus, SourceMeta } from "@/lib/encoder/types";
import { formatDuration } from "@/lib/format";

type Props = {
  job: JobStatus;
  meta: SourceMeta;
};

export function EncodeProgress({ job, meta }: Props) {
  const pct = Math.floor(job.progress * 100);
  const remaining =
    job.speed > 0 ? (meta.durationSec * (1 - job.progress)) / job.speed : null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-4xl font-semibold tabular-nums text-zinc-100">
          {pct}
          <span className="text-xl text-zinc-500">%</span>
        </span>
        <span className="font-mono text-xs text-zinc-500">
          {remaining !== null ? `~${formatDuration(remaining)} left` : "starting…"}
        </span>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-100 transition-[width] duration-500 ease-out"
          style={{ width: `${job.progress * 100}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between font-mono text-xs text-zinc-600">
        <span>{job.fps > 0 ? `${Math.round(job.fps)} fps` : ""}</span>
        <span>{job.speed > 0 ? `${job.speed.toFixed(2)}× realtime` : ""}</span>
      </div>
    </div>
  );
}
