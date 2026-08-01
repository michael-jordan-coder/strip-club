import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { uploads } from "@/lib/encoder/store";
import { probe } from "@/lib/encoder/probe";
import type { UploadInfo } from "@/lib/encoder/types";

export async function POST(request: Request): Promise<Response> {
  if (!request.body) {
    return Response.json({ error: "Empty request body" }, { status: 400 });
  }

  const rawName = decodeURIComponent(request.headers.get("x-file-name") ?? "video");
  const name = rawName.replace(/[^\w.\- ]/g, "_") || "video";
  const id = crypto.randomUUID();
  const dir = path.join(os.tmpdir(), "mp4-encoder", id);
  await mkdir(dir, { recursive: true });
  const inputPath = path.join(dir, name);

  await pipeline(
    Readable.fromWeb(request.body as WebReadableStream<Uint8Array>),
    createWriteStream(inputPath),
  );

  let meta;
  try {
    meta = await probe(inputPath);
  } catch {
    return Response.json(
      { error: "Not a decodable video file" },
      { status: 415 },
    );
  }

  const { size } = await stat(inputPath);
  uploads.set(id, { id, name, size, inputPath, dir, meta });

  const info: UploadInfo = { id, name, size, meta };
  return Response.json(info);
}
