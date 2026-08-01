import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { jobs } from "@/lib/encoder/store";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/jobs/[id]/download">,
): Promise<Response> {
  const { id } = await ctx.params;
  const job = jobs.get(id);
  if (!job || job.state !== "done") {
    return Response.json({ error: "Output not available" }, { status: 404 });
  }

  const { size } = await stat(job.outputPath);
  const stream = Readable.toWeb(createReadStream(job.outputPath)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${job.outputName}"`,
    },
  });
}
