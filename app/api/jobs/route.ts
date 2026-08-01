import path from "node:path";
import { jobs, uploads, type Job } from "@/lib/encoder/store";
import { runEncode } from "@/lib/encoder/encode";
import type { EncodeSettings } from "@/lib/encoder/types";

type StartRequest = { uploadId: string; settings: EncodeSettings };

export async function POST(request: Request): Promise<Response> {
  const { uploadId, settings } = (await request.json()) as StartRequest;
  const upload = uploads.get(uploadId);
  if (!upload) {
    return Response.json({ error: "Upload not found" }, { status: 404 });
  }

  const id = crypto.randomUUID();
  const stem = upload.name.replace(/\.[^.]+$/, "");
  const job: Job = {
    id,
    uploadId,
    settings,
    state: "encoding",
    proc: null,
    progress: 0,
    fps: 0,
    speed: 0,
    outputPath: path.join(upload.dir, `${id}.mp4`),
    outputName: `${stem}-encoded.mp4`,
    outputSize: null,
    startedAt: Date.now(),
    finishedAt: null,
    error: null,
  };
  jobs.set(id, job);
  runEncode(upload, job);

  return Response.json({ id });
}
