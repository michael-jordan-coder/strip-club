import { jobs, jobStatus } from "@/lib/encoder/store";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/jobs/[id]">,
): Promise<Response> {
  const { id } = await ctx.params;
  const job = jobs.get(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }
  return Response.json(jobStatus(job));
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
