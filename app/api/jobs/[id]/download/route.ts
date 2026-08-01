import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { jobs } from "@/lib/encoder/store";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/jobs/[id]/download">,
): Promise<Response> {
  const { id } = await ctx.params;
  const job = jobs.get(id);
  if (!job || job.state !== "done") {
    return Response.json({ error: "Output not available" }, { status: 404 });
  }

  let filename = job.outputName;
  const requested = new URL(request.url).searchParams.get("name")?.trim();
  if (requested) {
    const safe = requested.replace(/[/\\:*?"<>|]/g, "_").replace(/\.+$/, "").trim();
    if (safe) filename = safe.toLowerCase().endsWith(".mp4") ? safe : `${safe}.mp4`;
  }
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_");

  const { size } = await stat(job.outputPath);
  const stream = Readable.toWeb(createReadStream(job.outputPath)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
