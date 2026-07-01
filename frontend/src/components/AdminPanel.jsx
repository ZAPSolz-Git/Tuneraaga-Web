import React, { useState, useEffect } from "react";
import { supabase, apiCall } from "../lib/supabaseClient";
import {
  Users,
  Shield,
  User,
  Loader2,
  Search,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  X,
  Trash2,
  Crown,
} from "lucide-react";
import Auth from "./Auth";

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingRole, setUpdatingRole] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    };
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserRole(null);
        setUsers([]);
        setStats(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && userRole === "admin") {
      fetchUsers();
      fetchStats();
    }
  }, [user, userRole]);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setUserRole(data.role);
      } else {
        setUserRole("user");
      }
      setLoading(false);
    } catch (err) {
      console.error("Fetch role error:", err);
      setUserRole("user");
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const result = await apiCall("/auth/users");
      if (result.success) {
        setUsers(result.data);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch users");
    }
  };

  const fetchStats = async () => {
    try {
      const result = await apiCall("/auth/users/stats");
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(userId);
    setError("");
    setSuccess("");

    try {
      const result = await apiCall(`/auth/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });

      if (result.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
        setSuccess(`User role updated to ${newRole}`);
        fetchStats();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setDeletingUser(userId);
    setError("");
    setSuccess("");

    try {
      const result = await apiCall(`/auth/users/${userId}`, {
        method: "DELETE",
      });

      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setSuccess("User deleted successfully");
        fetchStats();
        setShowDeleteConfirm(null);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to delete user");
    } finally {
      setDeletingUser(null);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Not logged in - show login required
  if (!user && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Shield size={48} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-slate-900">
          Login Required
        </h2>
        <p className="text-slate-500 mb-6 text-center">
          Please login to access admin panel.
        </p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-700"
        >
          Login / Sign Up
        </button>
        {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  // Not admin - show access denied
  if (!loading && user && userRole !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Shield size={48} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-slate-900">
          Access Denied
        </h2>
        <p className="text-slate-500 mb-6 text-center">
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-slate-900 pb-8 bg-gradient-to-br from-slate-50 via-purple-50/40 to-slate-50">
      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}

      <div className="px-4 md:px-8 pt-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-1">
            <span className="text-purple-600">Admin</span> Panel
          </h1>
          <p className="text-slate-500 text-sm">Manage users and their roles</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Crown size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Admins</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.adminCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <User size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Regular Users</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.userCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertTriangle size={20} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")}>
              <X size={18} />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
            <CheckCircle size={20} />
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess("")}>
              <X size={18} />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-purple-600" size={40} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">
                No Users Found
              </h3>
              <p className="text-slate-500">
                {searchQuery
                  ? "Try a different search term"
                  : "No users registered yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                      User
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                      Role
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                      Joined
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              u.role === "admin"
                                ? "bg-purple-500"
                                : "bg-slate-400"
                            }`}
                          >
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {u.email}
                            </p>
                            {u.id === user?.id && (
                              <span className="text-xs text-purple-600 font-medium">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        {u.id === user?.id ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            <Shield size={12} />
                            Admin
                          </span>
                        ) : (
                          <div className="relative">
                            <select
                              value={u.role}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value)
                              }
                              disabled={updatingRole === u.id}
                              className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold border cursor-pointer focus:ring-2 focus:ring-purple-500 outline-none ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-700 border-purple-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              } ${updatingRole === u.id ? "opacity-50" : ""}`}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <ChevronDown
                              size={14}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                            {updatingRole === u.id && (
                              <Loader2
                                size={14}
                                className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-purple-600"
                              />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-slate-500">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        {u.id !== user?.id ? (
                          showDeleteConfirm === u.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={deletingUser === u.id}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingUser === u.id
                                  ? "Deleting..."
                                  : "Confirm"}
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(u.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
