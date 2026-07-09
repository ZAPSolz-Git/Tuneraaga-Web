import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Music,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  GripVertical,
  User,
  Mail,
  Phone,
  Globe,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  Camera,
  Search,
  Grid3x3,
  List,
  AlertTriangle,
  Loader2,
  Users,
  Calendar,
  Lock,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const API_BASE = "http://localhost:5000/api/artists";

// --- Helper: get the current admin's Supabase access token
const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Aap login nahi hain. Please pehle login karo.");
  }

  return { Authorization: `Bearer ${session.access_token}` };
};

// --- 1. Artist Card Component ---
const ArtistCard = ({
  artist,
  onDragStart,
  onDragOver,
  onDrop,
  onEdit,
  onDelete,
  onToggleVerify,
}) => {
  const isVerified = artist.status === "Verified" || artist.verified === true;
  const isPending = artist.status === "Pending";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, artist.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, artist.id)}
      className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full"
    >
      <div className="absolute top-3 left-3 cursor-move text-gray-300 hover:text-blue-500 z-10 bg-white/80 rounded-full p-1">
        <GripVertical size={20} />
      </div>
      <div className="h-48 w-full bg-gray-100 relative overflow-hidden shrink-0">
        {artist.image ? (
          <img
            src={artist.image}
            alt={artist.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
            <User size={48} />
          </div>
        )}
        {isVerified && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
            <Check size={12} /> VERIFIED
          </div>
        )}
        {isPending && !isVerified && (
          <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
            PENDING
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-800 line-clamp-1">
              {artist.name}
            </h3>
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wide">
              {artist.genre}
            </span>
          </div>
          <button
            onClick={() => onEdit(artist)}
            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
          >
            <Edit size={18} />
          </button>
        </div>
        {artist.followers && (
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Users size={12} /> {artist.followers}
          </div>
        )}
        <div className="border-t border-gray-100 pt-3 flex items-center justify-between mt-auto">
          <button
            onClick={() => onToggleVerify(artist.id)}
            className={`text-xs font-bold py-1.5 px-3 rounded-full flex items-center gap-2 ${isVerified ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
          >
            {isVerified ? <Check size={14} /> : <X size={14} />}
            {isVerified ? "Verified" : "Unverified"}
          </button>
          <button
            onClick={() => onDelete(artist.id)}
            className="text-gray-300 hover:text-red-500 p-1"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 2. Artist Modal Component ---
const ArtistModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: "",
    genre: "Pop",
    image: null,
    email: "",
    phone: "",
    followers: "",
    password: "",
    confirmPassword: "",
    spotifyUrl: "",
    instagramUrl: "",
    profileUrl: "",
    idDocumentUrl: "",
    status: "Pending",
    verified: false,
    born_date: "",
    early_life: "",
    career: "",
    recognition_awards: "",
  });

  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData((prev) => ({
          ...prev,
          ...initialData,
          followers: initialData.followers || "",
          password: "",
          confirmPassword: "",
          born_date: initialData.born_date || "",
          early_life: initialData.early_life || "",
          career: initialData.career || "",
          recognition_awards: initialData.recognition_awards || "",
        }));
      } else {
        setFormData({
          name: "",
          genre: "Pop",
          image: null,
          email: "",
          phone: "",
          followers: "",
          password: "",
          confirmPassword: "",
          spotifyUrl: "",
          instagramUrl: "",
          profileUrl: "",
          idDocumentUrl: "",
          status: "Pending",
          verified: false,
          born_date: "",
          early_life: "",
          career: "",
          recognition_awards: "",
        });
      }
      setPasswordError("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0])
      setFormData({ ...formData, image: e.target.files[0] });
  };

  const validatePassword = () => {
    if (isEditing && !formData.password) {
      return true;
    }

    if (formData.password.length > 0 && formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validatePassword()) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold">
              {isEditing ? "Update Artist" : "Add New Artist"}
            </h2>
            <p className="text-blue-100 text-xs mt-1">
              Manage artist identity, login credentials, and detailed biography.
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:text-gray-200 transition bg-white/10 p-1 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: BASIC PROFILE */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1 flex items-center gap-2">
                <User size={14} /> Basic Profile
              </h3>
              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-all">
                    {formData.image ? (
                      typeof formData.image === "string" ? (
                        <img
                          src={formData.image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={URL.createObjectURL(formData.image)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <User className="text-gray-400 w-10 h-10" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-6 h-6" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click circle to upload photo
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Genre *
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.genre}
                    onChange={(e) =>
                      setFormData({ ...formData, genre: e.target.value })
                    }
                  >
                    <option value="Pop">Pop</option>
                    <option value="Rock">Rock</option>
                    <option value="Bollywood">Bollywood</option>
                    <option value="EDM">EDM</option>
                    <option value="Hip Hop">Hip Hop</option>
                    <option value="Classical">Classical</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
                    <input
                      type="email"
                      required
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="artist@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
                    <input
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Followers
                  </label>
                  <div className="relative">
                    <Users
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. 86M"
                      value={formData.followers}
                      onChange={(e) =>
                        setFormData({ ...formData, followers: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Profile URL
                  </label>
                  <div className="relative">
                    <Globe
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Website Link"
                      value={formData.profileUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, profileUrl: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PASSWORD */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1 flex items-center gap-2">
                <Lock size={14} /> Password Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {isEditing ? "New Password (optional)" : "Password *"}
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
                    <input
                      type="password"
                      required={!isEditing}
                      autoComplete="new-password"
                      className={`w-full border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                        passwordError && formData.password
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder={
                        isEditing
                          ? "Enter new password"
                          : "Enter password (min 8 chars)"
                      }
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setPasswordError("");
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {isEditing ? "Confirm New Password" : "Confirm Password *"}
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
                    <input
                      type="password"
                      required={!isEditing}
                      autoComplete="new-password"
                      className={`w-full border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                        passwordError && formData.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        });
                        setPasswordError("");
                      }}
                    />
                  </div>
                </div>
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertTriangle size={16} /> {passwordError}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {isEditing
                  ? "Leave empty to keep current password. Password must be at least 8 characters if changed."
                  : "Password must be at least 8 characters long."}
              </p>
            </div>

            {/* SECTION 3: DETAILED BIOGRAPHY */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1 flex items-center gap-2">
                <FileText size={14} /> Detailed Biography
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Born
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-2.5 text-blue-500"
                      size={18}
                    />
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. March 1, 1994"
                      value={formData.born_date}
                      onChange={(e) =>
                        setFormData({ ...formData, born_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Early Life
                  </label>
                  <textarea
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Details about childhood..."
                    value={formData.early_life}
                    onChange={(e) =>
                      setFormData({ ...formData, early_life: e.target.value })
                    }
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Career
                  </label>
                  <textarea
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Musical journey..."
                    value={formData.career}
                    onChange={(e) =>
                      setFormData({ ...formData, career: e.target.value })
                    }
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Recognition And Awards
                  </label>
                  <textarea
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Grammys, awards..."
                    value={formData.recognition_awards}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recognition_awards: e.target.value,
                      })
                    }
                  ></textarea>
                </div>
              </div>
            </div>

            {/* SECTION 4: SOCIAL MEDIA */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">
                Social Media Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Spotify URL
                  </label>
                  <div className="relative">
                    <Globe
                      className="absolute left-3 top-2.5 text-green-600"
                      size={18}
                    />
                    <input
                      type="url"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="https://spotify.com/..."
                      value={formData.spotifyUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, spotifyUrl: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Instagram URL
                  </label>
                  <div className="relative">
                    <LinkIcon
                      className="absolute left-3 top-2.5 text-pink-600"
                      size={18}
                    />
                    <input
                      type="url"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                      placeholder="https://instagram.com/..."
                      value={formData.instagramUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          instagramUrl: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: ADMIN */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">
                Admin Settings
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className={`w-full border rounded-lg px-4 py-2 outline-none font-medium ${
                    formData.status === "Verified"
                      ? "bg-green-50 text-green-700 border-green-300"
                      : formData.status === "Rejected"
                        ? "bg-red-50 text-red-700 border-red-300"
                        : "bg-yellow-50 text-yellow-700 border-yellow-300"
                  }`}
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ID Proof URL
                </label>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://example.com/id-proof.pdf"
                  value={formData.idDocumentUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, idDocumentUrl: e.target.value })
                  }
                />
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {isEditing ? "Save Changes" : "Create Artist"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 3. Delete Modal ---
const DeleteModal = ({ isOpen, onClose, onConfirm, artistName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-fade-in-up p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Artist?</h3>
        <p className="text-gray-500 mb-6">
          Are you sure you want to delete <strong>{artistName}</strong>? This
          action cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold shadow-md"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. Main Manager Component ---
const ArtistManager = () => {
  const navigate = useNavigate();

  const [artists, setArtists] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [artistToDelete, setArtistToDelete] = useState(null);
  const [authStatus, setAuthStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (isMounted) setAuthStatus("redirecting");
        navigate("/login", { replace: true });
        return;
      }

      const { data: profile, error } = await supabase
        .from("artists")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error || !profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        if (isMounted) setAuthStatus("redirecting");
        navigate("/login", { replace: true });
        return;
      }

      if (isMounted) setAuthStatus("ok");
    };

    verifyAdmin();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!newSession) {
          navigate("/login", { replace: true });
        }
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    navigate("/login", { replace: true });
  };

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
      alert("Failed to load artists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "ok") {
      fetchArtists();
    }
  }, [authStatus]);

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openAddModal = () => {
    setEditingArtist(null);
    setIsModalOpen(true);
  };

  const openEditModal = (artist) => {
    setEditingArtist(artist);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArtist(null);
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      const data = new FormData();

      // Basic profile fields
      data.append("name", formData.name || "");
      data.append("genre", formData.genre || "");
      data.append("email", formData.email || "");
      data.append("phone", formData.phone || "");
      data.append("followers", formData.followers || "");
      data.append("profileUrl", formData.profileUrl || "");
      data.append("spotifyUrl", formData.spotifyUrl || "");
      data.append("instagramUrl", formData.instagramUrl || "");
      data.append("idDocumentUrl", formData.idDocumentUrl || "");
      data.append("status", formData.status || "Pending");
      data.append("verified", formData.verified || false);
      data.append("born_date", formData.born_date || "");
      data.append("early_life", formData.early_life || "");
      data.append("career", formData.career || "");
      data.append("recognition_awards", formData.recognition_awards || "");

      // Password handling - only send if provided
      if (formData.password && formData.password.trim() !== "") {
        data.append("password", formData.password.trim());
      }

      // Image upload
      if (formData.image instanceof File) {
        data.append("image", formData.image);
      }

      let response;

      if (editingArtist) {
        const authHeaders = await getAuthHeaders();
        response = await fetch(`${API_BASE}/${editingArtist.id}`, {
          method: "PUT",
          headers: authHeaders,
          body: data,
        });
      } else {
        response = await fetch(API_BASE, {
          method: "POST",
          body: data,
        });
      }

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Server error");

      await fetchArtists();
      closeModal();
    } catch (error) {
      console.error("Error saving artist:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    const artist = artists.find((a) => a.id === id);
    if (artist) {
      setArtistToDelete(artist);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!artistToDelete) return;
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/${artistToDelete.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Server error");

      await fetchArtists();
      setIsDeleteModalOpen(false);
      setArtistToDelete(null);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerify = async (id) => {
    const artist = artists.find((a) => a.id === id);
    if (!artist) return;
    const newVerified = !artist.verified;
    const updatedStatus = newVerified ? "Verified" : "Pending";

    setArtists(
      artists.map((a) =>
        a.id === id
          ? { ...a, status: updatedStatus, verified: newVerified }
          : a,
      ),
    );

    try {
      const authHeaders = await getAuthHeaders();
      const data = new FormData();
      data.append("status", updatedStatus);
      data.append("verified", newVerified);

      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: data,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Server error");
    } catch (error) {
      console.error("Error updating:", error);
      alert("Error updating: " + error.message);
      fetchArtists();
    }
  };

  const onDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = (e, targetId) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) return;
    const dragIndex = artists.findIndex((a) => a.id === draggedId);
    const dropIndex = artists.findIndex((a) => a.id === targetId);
    const items = [...artists];
    const draggedItem = items[dragIndex];
    items.splice(dragIndex, 1);
    items.splice(dropIndex, 0, draggedItem);
    setArtists(items);
    setDraggedId(null);
  };

  if (authStatus !== "ok") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex flex-col font-sans text-slate-900">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Music className="w-8 h-8 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">
              Artist Manager
            </h1>
          </div>
          <div className="relative w-full md:max-w-lg">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search artists..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:bg-white/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center bg-white/10 p-1 rounded-full border border-white/20">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-full ${viewMode === "grid" ? "bg-white text-blue-700" : "text-white hover:bg-white/10"}`}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-full ${viewMode === "table" ? "bg-white text-blue-700" : "text-white hover:bg-white/10"}`}
              >
                <List size={18} />
              </button>
            </div>
            <button
              onClick={openAddModal}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-2 px-5 rounded-full shadow-lg hover:scale-105 transition flex items-center gap-2"
            >
              <Plus size={20} /> Add Artist
            </button>
            <button
              onClick={handleLogout}
              title="Logout"
              className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full border border-white/20 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {loading && artists.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <User size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No artists found.</p>
          </div>
        ) : (
          <>
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredArtists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggleVerify={handleToggleVerify}
                  />
                ))}
              </div>
            )}
            {viewMode === "table" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase">
                          S.No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          Artist
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          Genre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          Followers
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredArtists.map((artist, index) => (
                        <tr
                          key={artist.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, artist.id)}
                          onDragOver={onDragOver}
                          onDrop={(e) => onDrop(e, artist.id)}
                          className="hover:bg-blue-50 cursor-move"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            <GripVertical
                              className="text-gray-300 hover:text-blue-500 inline"
                              size={16}
                            />{" "}
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {artist.image ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={artist.image}
                                    alt=""
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User size={16} className="text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {artist.name}
                                </div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {artist.email || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {artist.genre}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                            {artist.followers || "0M"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                artist.verified
                                  ? "bg-green-100 text-green-700"
                                  : artist.status === "Rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {artist.status || "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(artist)}
                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(artist.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <ArtistModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        initialData={editingArtist}
        isLoading={loading}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        artistName={artistToDelete ? artistToDelete.name : ""}
      />
    </div>
  );
};

export default ArtistManager;
