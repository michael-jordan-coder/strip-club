import { jobs } from "@/lib/encoder/store";
import type { JobStatus } from "@/lib/encoder/types";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/jobs/[id]">,
): Promise<Response> {
  const { id } = await ctx.params;
  const job = jobs.get(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const status: JobStatus = {
    id: job.id,
    state: job.state,
    progress: job.progress,
    fps: job.fps,
    speed: job.speed,
    outputSize: job.outputSize,
    elapsedMs: (job.finishedAt ?? Date.now()) - job.startedAt,
    error: job.error,
  };
  return Response.json(status);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/jobs/[id]">,
): Promise<Response> {
  const { id } = await ctx.params;
  const job = jobs.get(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.state === "encoding" && job.proc) {
    job.state = "cancelled";
    job.proc.kill("SIGKILL");
  }
  return Response.json({ ok: true });
}
