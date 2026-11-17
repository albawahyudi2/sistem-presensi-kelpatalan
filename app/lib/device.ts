import { createHash } from "node:crypto";

export function deviceSignatureFrom(headers: Headers): string {
  const raw = [
    headers.get("user-agent") ?? "",
    headers.get("accept-language") ?? "",
    headers.get("sec-ch-ua-platform") ?? "",
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || headers.get("x-real-ip")?.trim() || "";
  return candidate && candidate.length <= 45 ? candidate : null;
}
