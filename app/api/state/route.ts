import { jobs, jobStatus, uploads } from "@/lib/encoder/store";
import type { UploadInfo } from "@/lib/encoder/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const ups: UploadInfo[] = [...uploads.values()].map(
    ({ id, name, size, meta }) => ({ id, name, size, meta }),
  );
  const js = [...jobs.values()].map((j) => ({
    uploadId: j.uploadId,
    ...jobStatus(j),
  }));
  return Response.json({ uploads: ups, jobs: js });
}
