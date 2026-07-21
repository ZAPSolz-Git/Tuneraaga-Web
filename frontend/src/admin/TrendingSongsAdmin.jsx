import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  TrendingUp,
} from "lucide-react";
import { supabase, API_BASE_URL, getAuthHeader } from "../lib/supabaseClient";
import Swal from "sweetalert2";

// ─── CONFIGURATION ───
const LIST_NAME = "trending_songs";

// ─── SEARCHABLE SELECT COMPONENT ───
const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.id == value);
  const displayValue = selectedOption
    ? `${selectedOption.title} - ${selectedOption.primary_artist}`
    : "";

  const filteredOptions = options.filter(
    (opt) =>
      opt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.primary_artist.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm flex justify-between items-center focus:ring-2 focus:ring-blue-500 outline-none hover:border-blue-400 transition-colors"
      >
        <span className="truncate text-gray-700">
          {displayValue || placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-500 ml-2 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2 top-2.5 text-gray-400"
              />
              <input
                type="text"
                className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-blue-500"
                placeholder="Search songs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-slate-50 last:border-0 transition-colors"
                >
                  <div className="font-medium text-slate-800 truncate">
                    {opt.title}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {opt.primary_artist}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No matching songs found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───
const TrendingSongsAdmin = () => {
  const navigate = useNavigate();
  const [trendingList, setTrendingList] = useState([]);
  const [allReleases, setAllReleases] = useState([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ─── HANDLE 401 — redirect to login ───
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
        console.warn("⚠️ No session — redirecting to login");
        Swal.fire(
          "Login Required",
          "Please log in to access this page.",
          "warning",
        );
        navigate("/login");
        return;
      }

      console.log("✅ Session found for:", session.user.email);
      fetchTrending();
      fetchReleases();
    };

    checkAuth();
  }, [navigate]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();

      if (!authHeader.Authorization) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/content/lists/${LIST_NAME}`,
        {
          headers: { ...authHeader },
        },
      );
      const data = await response.json();

      if (response.status === 401) {
        await handle401();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to load trending songs.",
        );
      }

      setTrendingList(data || []);
    } catch (err) {
      console.error("Error fetching trending:", err);
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchReleases = async () => {
    try {
      const { data, error } = await supabase
        .from("releases")
        .select("id, title, primary_artist, cover_url")
        .eq("status", "Published");
      if (error) throw error;
      setAllReleases(data || []);
    } catch (err) {
      console.error("Error fetching releases:", err);
    }
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!selectedReleaseId)
      return Swal.fire("Required", "Please select a song.", "warning");

    const exists = trendingList.find((t) => t.release_id == selectedReleaseId);
    if (exists)
      return Swal.fire(
        "Duplicate",
        "This song is already in Trending Now.",
        "info",
      );

    setSubmitting(true);
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
      const result = await response.json();

      if (response.status === 401) {
        await handle401();
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to add song.",
        );
      }

      await fetchTrending();
      setSelectedReleaseId("");
      Swal.fire("Success", "Song added to Trending Now!", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSong = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Remove this song from Trending Now?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, remove it!",
    });

    if (result.isConfirmed) {
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

        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error || data.message || "Failed to remove song.",
          );
        }

        await fetchTrending();
        Swal.fire("Removed!", "Song removed successfully.", "success");
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to remove song", "error");
      }
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = trendingList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(trendingList.length / itemsPerPage);

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="text-blue-600" /> Manage Trending Now
        </h2>
        <p className="text-slate-500 text-sm">
          Select songs from your library to feature on the homepage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-600" /> Add New Song
            </h3>
            <form onSubmit={handleAddSong} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Select from Library
                </label>
                <SearchableSelect
                  options={allReleases}
                  value={selectedReleaseId}
                  onChange={setSelectedReleaseId}
                  placeholder="Search title or artist..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <ListMusic size={18} />
                )}
                {submitting ? "Adding..." : "Add to Trending"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">
                Current List ({trendingList.length})
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={40} />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Song
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Artist
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Added On
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {currentItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={
                                    item.releases?.cover_url ||
                                    "https://via.placeholder.com/40"
                                  }
                                  alt=""
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">
                                  {item.releases?.title || "Unknown"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-500">
                              {item.releases?.primary_artist || "Unknown"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteSong(item.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {currentItems.length === 0 && (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-6 py-10 text-center text-slate-500"
                          >
                            No songs trending yet. Add one from the left!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200">
                    <div className="text-sm text-slate-700">
                      Showing{" "}
                      <span className="font-bold">{indexOfFirstItem + 1}</span>{" "}
                      to{" "}
                      <span className="font-bold">
                        {Math.min(indexOfLastItem, trendingList.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold">{trendingList.length}</span>{" "}
                      results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => p - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-slate-300 rounded bg-white text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium text-slate-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-slate-300 rounded bg-white text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingSongsAdmin;
