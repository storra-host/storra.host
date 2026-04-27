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

export async function putObjectBuffer(key: string, body: Buffer) {
  const cfg = getR2Config();
  const c = getR2Client();
  await c.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentLength: body.length,
      ContentType: "application/octet-stream",
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

export async function getObjectWebStream(
  key: string
): Promise<{ stream: ReadableStream<Uint8Array>; contentLength?: number }> {
  const cfg = getR2Config();
  const c = getR2Client();
  const res = await c.send(
    new GetObjectCommand({ Bucket: cfg.bucket, Key: key })
  );
  const len = res.ContentLength;
  const body = res.Body;
  if (!body || typeof (body as { transformToWebStream?: () => ReadableStream }).transformToWebStream !== "function") {
    throw new Error("R2 response body missing stream");
  }
  const stream = (
    body as { transformToWebStream: () => ReadableStream<Uint8Array> }
  ).transformToWebStream();
  return {
    stream,
    contentLength: len ?? undefined,
  };
}

export async function deleteObject(key: string) {
  const cfg = getR2Config();
  const c = getR2Client();
  await c.send(
    new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key })
  );
}

const PRESIGN_TTL_SEC = 15 * 60;

export async function presignedPutObjectUrl(key: string): Promise<string> {
  const cfg = getR2Config();
  const c = getR2Client();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: "application/octet-stream",
  });
  return getSignedUrl(c, command, { expiresIn: PRESIGN_TTL_SEC });
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
