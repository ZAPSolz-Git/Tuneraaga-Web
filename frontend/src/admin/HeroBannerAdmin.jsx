import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, UploadCloud, Save, Music } from "lucide-react";
import { toastEvents } from "../utils/toastEvents";
import { useNavigate } from "react-router-dom";

// ─── Supabase project (same one used for auth + DB) ───
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Fail loudly in dev instead of silently breaking every request
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file.",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket used for hero banner assets.
// Create this bucket in Supabase Dashboard → Storage → "New bucket" → name it exactly "hero-assets".
// Mark it Public (so <img>/<audio> tags can load the returned URL directly),
// or keep it private and swap getPublicUrl() for createSignedUrl() below.
const BUCKET = "hero-assets";

// Must match the event name AdminLayout.jsx listens for. Firing this after
// a successful save lets the sidebar logo / top-bar text update immediately
// — without it, AdminLayout only re-fetches on mount, so navigating to
// "/admin" (same layout, no remount) would leave the old logo/text showing
// until a manual page refresh.
const ADMIN_BRANDING_EVENT = "admin-branding-updated";

const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const emptyForm = {
  id: null,
  title: "",
  description: "",
  logo_url: "",
  background_image_url: "",
  rating: "",
  year: "",
  audio_url: "",
  site_logo_url: "",
  admin_panel_logo_url: "",
  admin_panel_top_text: "",
};

const HeroBannerAdmin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingSiteLogo, setUploadingSiteLogo] = useState(false);
  const [uploadingAdminLogo, setUploadingAdminLogo] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Tracks admin_panel_logo_url and admin_panel_top_text exactly as last
  // loaded from the DB. Used only to decide where to redirect after a
  // successful save: if EITHER the admin logo or the admin top-bar text
  // changed in this save, we send the admin back to /admin (so they see the
  // update immediately); otherwise the normal hero-banner save still goes to
  // the public home dashboard "/".
  const lastSavedAdminLogoRef = useRef("");
  const lastSavedAdminTopTextRef = useRef("");

  useEffect(() => {
    fetchExisting();
  }, []);

  const fetchExisting = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hero_banner")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setForm({
          id: data.id,
          title: data.title || "",
          description: data.description || "",
          logo_url: data.logo_url || "",
          background_image_url: data.background_image_url || "",
          rating: data.rating || "",
          year: data.year || "",
          audio_url: data.audio_url || "",
          site_logo_url: data.site_logo_url || "",
          admin_panel_logo_url: data.admin_panel_logo_url || "",
          admin_panel_top_text: data.admin_panel_top_text || "",
        });
        lastSavedAdminLogoRef.current = data.admin_panel_logo_url || "";
        lastSavedAdminTopTextRef.current = data.admin_panel_top_text || "";
      }
    } catch (err) {
      console.error("fetchExisting failed:", err);
      setErrorMsg(
        "Could not load existing banner: " + (err.message || "unknown error"),
      );
      toastEvents.show("Could not load existing banner.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Upload a file straight to Supabase Storage and return its public URL.
  //
  // NOTE: We intentionally do NOT block on supabase.auth.getSession() here.
  // In this project login is done via a custom profiles/role flow (see LoginPage),
  // so there may not be a Supabase Auth session even though the user is "logged in".
  //
  // If your bucket is PUBLIC or has an RLS policy allowing anon inserts, this works
  // with the anon key. If the upload gets rejected, you'll see the REAL storage
  // error (e.g. "new row violates row-level security policy" or "Bucket not found").
  const uploadFile = async (file, folder) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      // Common causes: bucket doesn't exist, or storage RLS policy blocks insert.
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Upload succeeded but no public URL was returned.");
    }

    return publicUrlData.publicUrl;
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setErrorMsg("");
    try {
      const url = await uploadFile(file, "logo");
      setForm((prev) => ({ ...prev, logo_url: url }));
      toastEvents.show("Logo uploaded.", "success");
    } catch (err) {
      console.error("Logo upload error:", err);
      setErrorMsg("Logo upload failed: " + err.message);
      toastEvents.show("Logo upload failed: " + err.message, "error");
    } finally {
      setUploadingLogo(false);
      e.target.value = ""; // allow re-selecting the same file
    }
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    setErrorMsg("");
    try {
      const url = await uploadFile(file, "background");
      setForm((prev) => ({ ...prev, background_image_url: url }));
      toastEvents.show("Background image uploaded.", "success");
    } catch (err) {
      console.error("Background upload error:", err);
      setErrorMsg("Background image upload failed: " + err.message);
      toastEvents.show("Background upload failed: " + err.message, "error");
    } finally {
      setUploadingBg(false);
      e.target.value = "";
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    setErrorMsg("");
    try {
      const url = await uploadFile(file, "audio");
      setForm((prev) => ({ ...prev, audio_url: url }));
      toastEvents.show("Audio uploaded.", "success");
    } catch (err) {
      console.error("Audio upload error:", err);
      setErrorMsg("Audio upload failed: " + err.message);
      toastEvents.show("Audio upload failed: " + err.message, "error");
    } finally {
      setUploadingAudio(false);
      e.target.value = "";
    }
  };

  // Website-wide logo (used in Layout.jsx sidebar/header — separate from the
  // hero-section logo above, which only shows inside the banner itself).
  const handleSiteLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSiteLogo(true);
    setErrorMsg("");
    try {
      const url = await uploadFile(file, "site-logo");
      setForm((prev) => ({ ...prev, site_logo_url: url }));
      toastEvents.show("Website logo uploaded.", "success");
    } catch (err) {
      console.error("Site logo upload error:", err);
      setErrorMsg("Website logo upload failed: " + err.message);
      toastEvents.show("Website logo upload failed: " + err.message, "error");
    } finally {
      setUploadingSiteLogo(false);
      e.target.value = "";
    }
  };

  // Admin Panel sidebar logo — replaces the static "Admin Panel" text at the
  // top of AdminLayout.jsx's sidebar. Separate from the public website logo,
  // since admin branding is often different from the public-facing one.
  const handleAdminLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAdminLogo(true);
    setErrorMsg("");
    try {
      const url = await uploadFile(file, "admin-logo");
      setForm((prev) => ({ ...prev, admin_panel_logo_url: url }));
      toastEvents.show("Admin panel logo uploaded.", "success");
    } catch (err) {
      console.error("Admin logo upload error:", err);
      setErrorMsg("Admin panel logo upload failed: " + err.message);
      toastEvents.show(
        "Admin panel logo upload failed: " + err.message,
        "error",
      );
    } finally {
      setUploadingAdminLogo(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        title: form.title,
        description: form.description,
        logo_url: form.logo_url,
        background_image_url: form.background_image_url,
        rating: form.rating,
        year: form.year,
        audio_url: form.audio_url,
        site_logo_url: form.site_logo_url,
        admin_panel_logo_url: form.admin_panel_logo_url,
        admin_panel_top_text: form.admin_panel_top_text,
        updated_at: new Date().toISOString(),
      };

      let error;
      let savedRow;

      if (form.id) {
        const res = await supabase
          .from("hero_banner")
          .update(payload)
          .eq("id", form.id)
          .select()
          .maybeSingle();
        error = res.error;
        savedRow = res.data;

        if (error) throw error;

        // ── KEY FIX ──
        // If Postgrest returns no error AND no row, it almost always means
        // RLS silently filtered the update to 0 affected rows (or the row
        // no longer exists). Previously this case was NOT checked, so the
        // UI showed "success" even though nothing was actually saved.
        if (!savedRow) {
          throw new Error(
            "Update did not affect any row. This usually means a Row Level " +
              "Security (RLS) policy on 'hero_banner' is blocking UPDATE for " +
              "the anon role, or the row with this id no longer exists. " +
              "Check Supabase → Authentication → Policies for this table.",
          );
        }
      } else {
        const res = await supabase
          .from("hero_banner")
          .insert(payload)
          .select()
          .single();
        error = res.error;
        savedRow = res.data;

        if (error) throw error;

        if (!savedRow) {
          // Insert/update "succeeded" but returned nothing — almost always an RLS
          // policy silently filtering the row back out. Surface this clearly
          // instead of pretending it worked.
          throw new Error(
            "Save returned no row back — this usually means a Row Level Security " +
              "policy on 'hero_banner' is blocking select-after-write. Check " +
              "Supabase → Authentication → Policies for this table.",
          );
        }
      }

      // Only reached if we actually have a confirmed saved row back from the DB.
      const adminLogoChanged =
        (savedRow.admin_panel_logo_url || "") !== lastSavedAdminLogoRef.current;
      const adminTopTextChanged =
        (savedRow.admin_panel_top_text || "") !==
        lastSavedAdminTopTextRef.current;
      const isAdminOnlyChange = adminLogoChanged || adminTopTextChanged;

      setForm((prev) => ({ ...prev, id: savedRow.id }));
      toastEvents.show("Hero banner updated successfully.", "success");

      // Re-fetch from DB to make 100% sure what's on screen matches what's saved.
      await fetchExisting();

      // ── LIVE SIDEBAR UPDATE ──
      // Tell AdminLayout.jsx to re-fetch the admin logo / top-bar text right
      // now. Without this, navigating to "/admin" doesn't remount the
      // layout (it's the shared parent route), so the sidebar kept showing
      // stale branding until the page was manually refreshed.
      if (isAdminOnlyChange) {
        window.dispatchEvent(new CustomEvent(ADMIN_BRANDING_EVENT));
      }

      // ── CONDITIONAL REDIRECT ──
      // If EITHER the admin panel logo or the admin top-bar text changed in
      // this save, stay in the admin area (redirect to /admin) so the admin
      // immediately sees the update. Otherwise (normal hero-banner content
      // changes — title, description, hero logo, bg image, audio, website
      // logo) redirect to the public home dashboard "/" as before.
      if (isAdminOnlyChange) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Save error:", err);
      setErrorMsg("Save failed: " + (err.message || "unknown error"));
      toastEvents.show(
        "Save failed: " + (err.message || "unknown error"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Hero Banner</h2>
      <p className="text-sm text-slate-500 mb-6">
        Changes here update the homepage banner (image, logo, title, text) live.
      </p>

      {errorMsg && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* ── WEBSITE LOGO (site-wide, shows in sidebar/header via Layout.jsx) ── */}
      <div className="mb-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Website Logo (Header / Sidebar)
        </label>
        <p className="text-xs text-slate-500 mb-3">
          This logo appears across the whole site's sidebar and mobile header —
          separate from the hero banner logo below.
        </p>
        <div className="flex items-center gap-4">
          {form.site_logo_url && (
            <img
              src={form.site_logo_url}
              alt="website logo preview"
              className="h-14 object-contain border rounded-md bg-slate-50 p-1"
            />
          )}
          <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 text-sm cursor-pointer hover:bg-slate-50">
            {uploadingSiteLogo ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <UploadCloud size={16} />
            )}
            Upload website logo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSiteLogoUpload}
            />
          </label>
        </div>
        <input
          type="text"
          value={form.site_logo_url}
          onChange={handleChange("site_logo_url")}
          placeholder="Or paste a website logo URL directly"
          className="w-full mt-2 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* ── ADMIN PANEL LOGO (replaces static "Admin Panel" text in AdminLayout.jsx sidebar) ── */}
      <div className="mb-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Admin Panel Logo
        </label>
        <p className="text-xs text-slate-500 mb-3">
          Replaces the "Admin Panel" text at the top of the admin sidebar. If
          left empty, the sidebar will keep showing the "Admin Panel" text.
        </p>
        <div className="flex items-center gap-4">
          {form.admin_panel_logo_url && (
            <img
              src={form.admin_panel_logo_url}
              alt="admin panel logo preview"
              className="h-14 object-contain border rounded-md bg-slate-50 p-1"
            />
          )}
          <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 text-sm cursor-pointer hover:bg-slate-50">
            {uploadingAdminLogo ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <UploadCloud size={16} />
            )}
            Upload admin panel logo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAdminLogoUpload}
            />
          </label>
        </div>
        <input
          type="text"
          value={form.admin_panel_logo_url}
          onChange={handleChange("admin_panel_logo_url")}
          placeholder="Or paste an admin panel logo URL directly"
          className="w-full mt-2 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Top Bar Text (next to search bar)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Shows next to the search bar at the top of the admin dashboard
            (AdminLayout.jsx). Leave empty to show nothing there.
          </p>
          <input
            type="text"
            value={form.admin_panel_top_text}
            onChange={handleChange("admin_panel_top_text")}
            placeholder="e.g. Tune Raaga Admin"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="space-y-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={handleChange("title")}
            placeholder="e.g. The Tune Raaga"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={handleChange("description")}
            rows={3}
            placeholder="Short description shown under the title"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Rating + Year */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Rating tag
            </label>
            <input
              type="text"
              value={form.rating}
              onChange={handleChange("rating")}
              placeholder="e.g. U/A 13+"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Year
            </label>
            <input
              type="text"
              value={form.year}
              onChange={handleChange("year")}
              placeholder="e.g. 2024"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Logo upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Logo image
          </label>
          <div className="flex items-center gap-4">
            {form.logo_url && (
              <img
                src={form.logo_url}
                alt="logo preview"
                className="h-16 object-contain border rounded-md bg-slate-50 p-1"
              />
            )}
            <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 text-sm cursor-pointer hover:bg-slate-50">
              {uploadingLogo ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <UploadCloud size={16} />
              )}
              Upload logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </label>
          </div>
          <input
            type="text"
            value={form.logo_url}
            onChange={handleChange("logo_url")}
            placeholder="Or paste a logo image URL directly"
            className="w-full mt-2 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Background image upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Background banner image
          </label>
          <div className="flex items-center gap-4">
            {form.background_image_url && (
              <img
                src={form.background_image_url}
                alt="background preview"
                className="h-16 w-28 object-cover border rounded-md"
              />
            )}
            <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 text-sm cursor-pointer hover:bg-slate-50">
              {uploadingBg ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <UploadCloud size={16} />
              )}
              Upload background
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBgUpload}
              />
            </label>
          </div>
          <input
            type="text"
            value={form.background_image_url}
            onChange={handleChange("background_image_url")}
            placeholder="Or paste a background image URL directly"
            className="w-full mt-2 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Audio upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Hero audio (played when the Play button is clicked)
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 text-sm cursor-pointer hover:bg-slate-50">
              {uploadingAudio ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Music size={16} />
              )}
              Upload audio
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleAudioUpload}
              />
            </label>
            {form.audio_url && !uploadingAudio && (
              <span className="text-xs text-slate-500 truncate max-w-[200px]">
                {form.audio_url.split("/").pop()}
              </span>
            )}
          </div>
          {form.audio_url && (
            <audio controls src={form.audio_url} className="w-full mt-2" />
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-md font-semibold text-white shadow-sm hover:opacity-90 transition-all disabled:opacity-60"
          style={{ background: BLUE_GRADIENT }}
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
};

export default HeroBannerAdmin;
