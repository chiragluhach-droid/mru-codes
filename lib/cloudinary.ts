import { createHash } from "crypto";

/**
 * Minimal server-side Cloudinary client for module videos (import only from
 * API routes / server components; it reads the API secret). Browsers upload
 * straight to Cloudinary with a signature from us (Vercel functions cannot
 * accept large request bodies), so the API secret never leaves the server.
 */

export type CloudinaryResourceType = "video" | "image";

/** Free-plan upload limits (per file). */
export const MAX_UPLOAD_BYTES: Record<CloudinaryResourceType, number> = {
  video: 100 * 1024 * 1024,
  image: 10 * 1024 * 1024,
};

export const ALLOWED_FORMATS: Record<CloudinaryResourceType, string> = {
  video: "mp4,mov,webm,mkv,m4v",
  image: "jpg,jpeg,png,webp",
};

function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)");
  }
  return { cloudName, apiKey, apiSecret };
}

/** Cloudinary signature: sha1 of the sorted `k=v` pairs joined by `&`, plus the secret. */
function sign(params: Record<string, string | number>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

/** Folder that every asset of a module is uploaded into. */
export function moduleFolder(moduleId: string) {
  return `c-programming/modules/${moduleId}`;
}

/** Parameters the browser needs to upload one file directly to Cloudinary. */
export function createSignedUpload(resourceType: CloudinaryResourceType, folder: string) {
  const { cloudName, apiKey, apiSecret } = getConfig();
  const params = {
    allowed_formats: ALLOWED_FORMATS[resourceType],
    folder,
    timestamp: Math.floor(Date.now() / 1000),
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    apiKey,
    signature: sign(params, apiSecret),
    maxBytes: MAX_UPLOAD_BYTES[resourceType],
    ...params,
  };
}

/** Looks up an uploaded asset so we never trust URLs or durations sent by the browser. */
export async function getUploadedAsset(resourceType: CloudinaryResourceType, publicId: string) {
  const { cloudName, apiKey, apiSecret } = getConfig();
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload/${publicId
    .split("/")
    .map(encodeURIComponent)
    .join("/")}?media_metadata=true`; // media_metadata is needed for a video's duration
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const asset = (await response.json()) as {
    public_id: string;
    secure_url: string;
    duration?: number;
    bytes?: number;
  };
  return asset;
}

/** Deletes an asset; failures are logged, not thrown, so DB cleanup still happens. */
export async function destroyAsset(resourceType: CloudinaryResourceType, publicId: string) {
  try {
    const { cloudName, apiKey, apiSecret } = getConfig();
    const params = { invalidate: "true", public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
    const body = new URLSearchParams({
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      api_key: apiKey,
      signature: sign(params, apiSecret),
    });
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      { method: "POST", body }
    );
    if (!response.ok) {
      console.error("Cloudinary destroy failed", publicId, await response.text());
    }
  } catch (error) {
    console.error("Cloudinary destroy failed", publicId, error);
  }
}

/** Poster frame for a video, taken 2 seconds in. */
export function videoThumbnailUrl(publicId: string) {
  const { cloudName } = getConfig();
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_2,w_640,h_360,c_fill,q_auto,f_jpg/${publicId}.jpg`;
}
