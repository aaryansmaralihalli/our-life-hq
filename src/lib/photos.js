// Unified photo handling for both backends.
// - Cloud mode (Supabase): upload to the "photos" storage bucket, store the path.
// - Local mode: store a base64 data URL inline.
// A "ref" is whatever we persist in a row's `photos: []` array.

import { supabase, SUPABASE_READY } from "./supabase";

const BUCKET = "photos";
const MAX_DIM = 1400; // longest edge after downscale

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);

/* Downscale an image File to a <canvas>; resolves null on failure. */
function downscale(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas);
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/* Upload one file, return a storable ref (path or data URL) or null. */
export async function uploadPhoto(file, folder = "misc") {
  if (!file.type.startsWith("image/")) return null;
  const canvas = await downscale(file);
  if (!canvas) return null;

  if (!SUPABASE_READY) {
    return canvas.toDataURL("image/jpeg", 0.82);
  }

  const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  const path = `${folder}/${uid()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) {
    alert("Photo upload failed: " + error.message);
    return null;
  }
  return path;
}

/* Delete the underlying storage object for a ref (no-op for data URLs). */
export async function removePhoto(ref) {
  if (SUPABASE_READY && ref && !ref.startsWith("data:")) {
    await supabase.storage.from(BUCKET).remove([ref]);
  }
}

/* Resolve a ref to a displayable URL. */
export async function photoUrl(ref) {
  if (!ref) return "";
  if (ref.startsWith("data:")) return ref;
  if (!SUPABASE_READY) return ref;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(ref, 3600);
  return data?.signedUrl || "";
}
