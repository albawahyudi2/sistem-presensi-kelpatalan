import { v2 as cloudinary } from "cloudinary";

export type PhotoRef = {
  type: "upload" | "authenticated";
  publicId: string;
  version?: string;
  format?: string;
};

export function parsePhotoUrl(url: string): PhotoRef | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.hostname !== "res.cloudinary.com") return null;
  const m = u.pathname.match(/^\/[^/]+\/image\/(upload|authenticated)\/(.+)$/);
  if (!m) return null;

  const parts = m[2].split("/").filter(Boolean);
  if (parts[0]?.startsWith("s--")) parts.shift();
  let version: string | undefined;
  if (parts[0] && /^v\d+$/.test(parts[0])) version = parts.shift()!.slice(1);
  if (parts.length === 0) return null;

  const joined = decodeURIComponent(parts.join("/"));
  const ext = joined.match(/\.([A-Za-z0-9]{2,5})$/);
  return {
    type: m[1] as PhotoRef["type"],
    publicId: ext ? joined.slice(0, -ext[0].length) : joined,
    version,
    format: ext?.[1],
  };
}

export function isTrustedPhotoUrl(
  url: string,
  userId: string,
  cloudName: string,
): boolean {
  if (!cloudName) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  const ref = parsePhotoUrl(url);
  return (
    u.protocol === "https:" &&
    ref?.type === "authenticated" &&
    u.pathname.startsWith(`/${cloudName}/image/authenticated/`) &&
    ref.publicId.startsWith(`presensi/${userId}/`)
  );
}

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export type PhotoVariant = "thumb" | "full";

export function deliveryUrl(
  ref: PhotoRef,
  variant: PhotoVariant,
  faceCrop: boolean,
): string {
  const c = configureCloudinary();
  const transformation =
    variant === "thumb"
      ? [
          faceCrop
            ? { width: 240, height: 240, crop: "thumb", gravity: "face" }
            : { width: 240, height: 240, crop: "fill", gravity: "auto" },
          { quality: "auto" },
        ]
      : [{ width: 1280, crop: "limit" }, { quality: "auto" }];

  return c.url(ref.publicId, {
    type: ref.type,
    sign_url: ref.type === "authenticated",
    secure: true,
    version: ref.version,
    format: ref.format,
    transformation,
  });
}
