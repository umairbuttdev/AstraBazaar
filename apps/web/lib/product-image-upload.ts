import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

function extensionFor(type: string, filename: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";

  const fromName = path.extname(filename).replace(".", "").toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  return "jpg";
}

export async function saveProductImage(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Please choose an image file");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Image must be JPG, PNG, WEBP, or GIF");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller");
  }

  const ext = extensionFor(file.type, file.name);
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

  await mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return `/uploads/products/${filename}`;
}
