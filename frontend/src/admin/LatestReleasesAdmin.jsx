import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Trash2, Plus, Loader2 } from "lucide-react";

// SECURE BACKEND API — writes no longer go straight to Supabase with the
// anon key. See backend/controllers/listController.js and
// backend/routes/contentRoutes.js for the matching /lists/:listName routes.
const API_BASE = "http://localhost:5000/api/content";
const LIST_NAME = "latest_releases";

const getAuthHeader = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const LatestReleasesAdmin = () => {
  const [listItems, setListItems] = useState([]);
  const [allReleases, setAllReleases] = useState([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();

      // 1. Get current items in this list — via the secure backend endpoint
      // (joins to `releases` server-side using the service-role client).
      const listRes = await fetch(`${API_BASE}/lists/${LIST_NAME}`, {
        headers: { ...authHeader },
      });
      const listData = await listRes.json();
      if (!listRes.ok) {
        throw new Error(listData.error || "Failed to load list.");
      }

      // 2. Get ALL releases for the dropdown. This is a read-only SELECT,
      // so it's left on the anon client — just make sure RLS on
      // "releases" only permits SELECT (never INSERT/UPDATE/DELETE) for
      // the anon role.
      const { data: releasesData, error: releasesError } = await supabase
        .from("releases")
        .select("id, title")
        .limit(500);

      if (releasesError) throw releasesError;

      setListItems(listData || []);
      setAllReleases(releasesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedReleaseId) return;

    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(`${API_BASE}/lists/${LIST_NAME}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ release_id: selectedReleaseId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to add song.");
      }

      setSelectedReleaseId("");
      await fetchData();
    } catch (error) {
      alert("Error adding song: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this song?")) return;

    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(`${API_BASE}/lists/${LIST_NAME}/${id}`, {
        method: "DELETE",
        headers: { ...authHeader },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete song.");
      }

      await fetchData();
    } catch (error) {
      alert("Error deleting song: " + error.message);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Manage Latest Top 10 Releases</h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> Add New Song
        </h3>
        <form onSubmit={handleAdd} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Select Song
            </label>
            <select
              value={selectedReleaseId}
              onChange={(e) => setSelectedReleaseId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">-- Choose a song --</option>
              {allReleases.map((rel) => (
                <option key={rel.id} value={rel.id}>
                  {rel.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            <Plus size={18} /> Add to List
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                <th className="p-4">Cover</th>
                <th className="p-4">Song Title</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4">
                    <img
                      src={
                        item.releases?.cover_url ||
                        "https://via.placeholder.com/50"
                      }
                      alt="cover"
                      className="w-12 h-12 rounded object-cover border border-slate-200 bg-gray-100"
                    />
                  </td>
                  <td className="p-4 font-medium text-slate-900">
                    {item.releases?.title || "Unknown Title"}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {listItems.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-12 text-center text-slate-500">
                    No songs added to the latest list yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LatestReleasesAdmin;
