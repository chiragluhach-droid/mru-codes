/** Browser helper: upload a file straight to Cloudinary with a server-issued signature. */

export interface UploadedAsset {
  publicId: string;
  secureUrl: string;
  duration?: number;
}

interface SignedUpload {
  uploadUrl: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  allowed_formats: string;
  maxBytes: number;
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export interface UploadHandle {
  promise: Promise<UploadedAsset>;
  cancel: () => void;
}

export function uploadToCloudinary(
  moduleId: string,
  kind: "video" | "image",
  file: File,
  onProgress: (percent: number) => void
): UploadHandle {
  let xhr: XMLHttpRequest | null = null;
  let cancelled = false;

  const promise = (async () => {
    const signResponse = await fetch(`/api/modules/${moduleId}/upload-signature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const signed = (await signResponse.json()) as SignedUpload & { error?: string };
    if (!signResponse.ok) throw new Error(signed.error || "Could not start the upload");
    if (file.size > signed.maxBytes) {
      throw new Error(`File is ${formatBytes(file.size)}; the limit is ${formatBytes(signed.maxBytes)}.`);
    }
    if (cancelled) throw new Error("Upload cancelled");

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signed.apiKey);
    form.append("timestamp", String(signed.timestamp));
    form.append("signature", signed.signature);
    form.append("folder", signed.folder);
    form.append("allowed_formats", signed.allowed_formats);

    return new Promise<UploadedAsset>((resolve, reject) => {
      xhr = new XMLHttpRequest();
      xhr.open("POST", signed.uploadUrl);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        let body: { public_id?: string; secure_url?: string; duration?: number; error?: { message?: string } } = {};
        try {
          body = JSON.parse(xhr!.responseText);
        } catch {
          // fall through to the error below
        }
        if (xhr!.status >= 200 && xhr!.status < 300 && body.public_id && body.secure_url) {
          resolve({ publicId: body.public_id, secureUrl: body.secure_url, duration: body.duration });
        } else {
          reject(new Error(body.error?.message || "Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.onabort = () => reject(new Error("Upload cancelled"));
      xhr.send(form);
    });
  })();

  return {
    promise,
    cancel: () => {
      cancelled = true;
      xhr?.abort();
    },
  };
}
