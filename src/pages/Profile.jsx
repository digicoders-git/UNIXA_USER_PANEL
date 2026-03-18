import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Swal from "sweetalert2";
import { User, Lock, Save, LogOut, Package, CreditCard, ShieldCheck, Phone, Mail, Camera, Edit2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [stats, setStats] = useState({ orders: 0, spent: 0, plan: "None" });

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [ordersRes, amcRes] = await Promise.all([
        api.get("/user-orders"),
        api.get("/my-amcs?status=Active").catch(() => ({ data: { amcs: [] } })),
      ]);
      const orders = ordersRes.data.orders || [];
      const validOrders = orders.filter((o) => !["cancelled", "returned", "failed"].includes(o.status));
      const totalSpent = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
      const activeAmcs = amcRes.data?.amcs || [];
      setStats({
        orders: orders.length,
        spent: totalSpent,
        plan: activeAmcs.length > 0 ? `${activeAmcs.length} Active` : "No Active Plan",
      });
    } catch (e) {
      console.error("Stats fetch error", e);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Error", "Please select an image smaller than 5MB", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      Swal.fire("Error", "Please select an image file", "error");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Upload pic first if selected
      if (selectedFile) {
        const fd = new FormData();
        fd.append("profilePicture", selectedFile);
        const picRes = await api.put(`/users/${user.id || user._id}/profile-picture`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updateUser({ ...user, profilePicture: picRes.data.profilePicture });
      }

      // Update profile text data
      const { data } = await api.put("/users/profile", {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
      });
      const latestUser = JSON.parse(localStorage.getItem('userData') || '{}');
      updateUser({ ...latestUser, ...data.user });

      Swal.fire({ icon: "success", title: "Profile Updated", timer: 1500, showConfirmButton: false });
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsEditing(false);
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return Swal.fire("Error", "Passwords do not match", "error");
    }
    setLoading(true);
    try {
      await api.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      Swal.fire("Success", "Password changed successfully", "success");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Change failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0f172a",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate("/login");
      }
    });
  };

  const avatarSrc = previewUrl || getImageUrl(user?.profilePicture);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">

      {/* Profile Header Card */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-32"></div>
          <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl -ml-10 -mt-10"></div>
        </div>

        <div className="px-8 pb-8 flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1.5 shadow-xl ring-4 ring-slate-50/50">
              {avatarSrc ? (
                <img src={avatarSrc} alt="profile" className="w-full h-full rounded-full object-cover shadow-inner" />
              ) : (
                <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-3xl md:text-4xl font-black text-white uppercase shadow-inner">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
            </div>
            {isEditing && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all hover:scale-110"
                >
                  <Camera size={14} />
                </button>
              </>
            )}
          </div>

          {/* Name & Email */}
          <div className="flex-1 pt-2 md:pt-0 pb-2">
            {isEditing ? (
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  placeholder="First Name"
                  className="px-3 py-2 bg-white border-2 border-indigo-300 rounded-xl font-bold text-slate-900 text-lg focus:outline-none focus:border-indigo-500 w-36"
                />
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  placeholder="Last Name"
                  className="px-3 py-2 bg-white border-2 border-indigo-300 rounded-xl font-bold text-slate-900 text-lg focus:outline-none focus:border-indigo-500 w-36"
                />
              </div>
            ) : (
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                {user?.firstName} {user?.lastName}
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wider">verified</span>
              </h1>
            )}
            <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
              <Mail size={14} /> {user?.email}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-xs uppercase tracking-widest border border-slate-200"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg disabled:opacity-60"
                >
                  <Save size={14} /> {loading ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 text-xs uppercase tracking-widest border border-indigo-100"
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 text-xs uppercase tracking-widest border border-red-100"
                >
                  <LogOut size={14} /> Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Quick Stats Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100/50 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-indigo-500" /> Account Overview
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:border-slate-200 transition-all">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                  <p className="text-xl font-black text-slate-900">{stats.orders}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:border-slate-200 transition-all">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Spent</p>
                  <p className="text-xl font-black text-slate-900">₹{stats.spent.toLocaleString()}</p>
                </div>
              </div>
              <div
                className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-4 text-white hover:bg-black transition-all cursor-pointer"
                onClick={() => navigate("/amc-plans")}
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400 shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Plan</p>
                  <p className="text-lg font-bold truncate max-w-[150px]">{stats.plan}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
            <div className="flex border-b border-slate-100 mb-8">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-8 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === "details" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                <User size={16} /> Personal Details
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`px-8 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === "password" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                <Lock size={16} /> Security
              </button>
            </div>

            {activeTab === "details" ? (
              <div className="space-y-6 animate-fade-in">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-xl font-bold text-slate-700 transition-all ${isEditing ? "bg-white border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" : "bg-slate-50 border-slate-200 cursor-not-allowed text-slate-500"}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-xl font-bold text-slate-700 transition-all ${isEditing ? "bg-white border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" : "bg-slate-50 border-slate-200 cursor-not-allowed text-slate-500"}`}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl font-bold text-slate-700 transition-all ${isEditing ? "bg-white border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" : "bg-slate-50 border-slate-200 cursor-not-allowed text-slate-500"}`}
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-4 disabled:opacity-60"
                  >
                    {loading ? "Saving..." : <><Save size={16} /> Save Changes</>}
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-6 animate-fade-in max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-4 disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
