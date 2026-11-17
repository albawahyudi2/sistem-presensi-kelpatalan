export async function uploadToCloudinary(blob: Blob): Promise<string> {
  const signRes = await fetch("/api/upload/sign", { method: "POST" });
  if (!signRes.ok) {
    const j = await signRes.json().catch(() => ({}));
    throw new Error(j.error ?? "Gagal menyiapkan unggahan foto.");
  }
  const s = await signRes.json();
  const form = new FormData();
  form.append("file", blob);
  form.append("api_key", s.apiKey);
  form.append("timestamp", String(s.timestamp));
  form.append("folder", s.folder);
  form.append("type", s.type);
  form.append("signature", s.signature);
  const up = await fetch(
    `https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    },
  );
  if (!up.ok) throw new Error("Unggah foto gagal. Periksa koneksi internet.");
  const data = await up.json();
  return data.secure_url as string;
}
