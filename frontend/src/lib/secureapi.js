import { supabase } from "./supabaseClient";

// Base URL of the secure backend built in /backend.
export const API_BASE = "http://localhost:5000/api/content";

async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("You must be signed in to do that.");
  }
  return `Bearer ${session.access_token}`;
}

/**
 * apiRequest — call a JSON endpoint on the secure backend.
 * All insert/update/delete operations should go through this instead of
 * calling supabase.from(...).insert/update/delete directly.
 */
export async function apiRequest(path, { method = "GET", body } = {}) {
  const authHeader = await getAuthHeader();

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status})`);
  }
  return result;
}

/**
 * uploadFileSecure — upload an image/audio file via the secure backend
 * instead of calling supabase.storage.from(...).upload directly.
 * `folder` must match one of the ALLOWED_FOLDERS in backend/routes/upload.js
 */
export async function uploadFileSecure(file, folder) {
  const authHeader = await getAuthHeader();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { Authorization: authHeader },
    body: formData,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Upload failed");
  }
  return result.url;
}
