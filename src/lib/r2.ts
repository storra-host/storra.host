import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Config } from "./env";

let client: S3Client | null = null;

export function getR2Client() {
  if (client) return client;
  const cfg = getR2Config();
  client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    credentials: cfg.credentials,
    forcePathStyle: cfg.forcePathStyle,
  });
  return client;
}

export async function putObjectBuffer(
  key: string,
  body: Buffer,
  contentType = "application/octet-stream"
) {
  const cfg = getR2Config();
  const c = getR2Client();
  await c.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentLength: body.length,
      ContentType: contentType,
    })
  );
}

export async function getObjectBuffer(
  key: string,
  maxBytes: number
): Promise<Buffer> {
  const { stream, contentLength } = await getObjectWebStream(key);
  if (contentLength != null && contentLength > maxBytes) {
    throw new Error("R2 object exceeds size limit");
  }
  const chunks: Buffer[] = [];
  let total = 0;
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.length) continue;
    total += value.length;
    if (total > maxBytes) {
      throw new Error("R2 object exceeds size limit");
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function bodyToWebStream(body: unknown): ReadableStream<Uint8Array> {
  if (
    !body ||
    typeof (body as { transformToWebStream?: () => ReadableStream }).transformToWebStream !==
      "function"
  ) {
    throw new Error("R2 response body missing stream");
  }
  return (
    body as { transformToWebStream: () => ReadableStream<Uint8Array> }
  ).transformToWebStream();
}

export async function getObjectWebStream(
  key: string,
  range?: { start: number; end: number }
): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentLength?: number;
  contentRange?: string;
  statusCode: 200 | 206;
}> {
  const cfg = getR2Config();
  const c = getR2Client();
  const res = await c.send(
    new GetObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ...(range
        ? { Range: `bytes=${range.start}-${range.end}` }
        : {}),
    })
  );
  const len = res.ContentLength;
  const statusCode = res.$metadata.httpStatusCode === 206 ? 206 : 200;
  return {
    stream: bodyToWebStream(res.Body),
    contentLength: len ?? undefined,
    contentRange: res.ContentRange,
    statusCode,
  };
}

export async function getObjectRange(
  key: string,
  start: number,
  end: number
): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentLength: number;
  contentRange?: string;
}> {
  const { stream, contentLength, contentRange } = await getObjectWebStream(key, {
    start,
    end,
  });
  if (contentLength == null) {
    throw new Error("R2 range response missing length");
  }
  return { stream, contentLength, contentRange };
}

export async function deleteObject(key: string) {
  const cfg = getR2Config();
  const c = getR2Client();
  await c.send(
    new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key })
  );
}

const PRESIGN_TTL_SEC = 15 * 60;

export async function presignedPutObjectUrl(
  key: string,
  contentType = "application/octet-stream"
): Promise<string> {
  const cfg = getR2Config();
  const c = getR2Client();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(c, command, { expiresIn: PRESIGN_TTL_SEC });
}

export function playbackStorageKey(fileId: string): string {
  return `obj/${fileId}/playback.mp4`;
}

export function posterStorageKey(fileId: string): string {
  return `obj/${fileId}/poster.jpg`;
}

export async function headObjectContentLength(
  key: string
): Promise<number | undefined> {
  const cfg = getR2Config();
  const c = getR2Client();
  const res = await c.send(
    new HeadObjectCommand({ Bucket: cfg.bucket, Key: key })
  );
  return res.ContentLength ?? undefined;
}
