import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { supabase, API_BASE_URL, getAuthHeader } from "../lib/supabaseClient";
import Swal from "sweetalert2";

const LIST_NAME = "top10_india";

const Top10IndiaAdmin = () => {
  const navigate = useNavigate();
  const [listItems, setListItems] = useState([]);
  const [allReleases, setAllReleases] = useState([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [loading, setLoading] = useState(true);

  // ─── HANDLE 401 ───
  const handle401 = async () => {
    Swal.fire("Session Expired", "Please log in again.", "warning");
    await supabase.auth.signOut();
    navigate("/login");
  };

  // ─── CHECK AUTH ON MOUNT ───
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        Swal.fire(
          "Login Required",
          "Please log in to access this page.",
          "warning",
        );
        navigate("/login");
        return;
      }

      console.log("✅ Top10India: Session found for", session.user.email);
      fetchData();
    };

    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();

      if (!authHeader.Authorization) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const listRes = await fetch(
        `${API_BASE_URL}/content/lists/${LIST_NAME}`,
        {
          headers: { ...authHeader },
        },
      );

      if (listRes.status === 401) {
        await handle401();
        return;
      }

      const listData = await listRes.json();
      if (!listRes.ok) {
        throw new Error(
          listData.error || listData.message || "Failed to load list.",
        );
      }

      const { data: releasesData, error: releasesError } = await supabase
        .from("releases")
        .select("id, title");
      if (releasesError) throw releasesError;

      setListItems(listData || []);
      setAllReleases(releasesData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      Swal.fire("Error", "Failed to load data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedReleaseId) {
      return Swal.fire("Required", "Please select a song.", "warning");
    }

    try {
      const authHeader = await getAuthHeader();

      if (!authHeader.Authorization) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/content/lists/${LIST_NAME}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({ release_id: selectedReleaseId }),
        },
      );

      if (response.status === 401) {
        await handle401();
        return;
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to add song.",
        );
      }

      setSelectedReleaseId("");
      await fetchData();
      Swal.fire("Success", "Song added!", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Remove this song from the list?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, remove it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const authHeader = await getAuthHeader();

      if (!authHeader.Authorization) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/content/lists/${LIST_NAME}/${id}`,
        {
          method: "DELETE",
          headers: { ...authHeader },
        },
      );

      if (response.status === 401) {
        await handle401();
        return;
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to delete song.",
        );
      }

      await fetchData();
      Swal.fire("Removed!", "Song removed successfully.", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Manage Top 10 in India</h2>

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
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Add to List
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-600" />
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
                      className="w-12 h-12 rounded object-cover border border-slate-200"
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
                  <td colSpan="3" className="p-8 text-center text-slate-500">
                    No songs added yet.
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

export default Top10IndiaAdmin;
