import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Swal from "sweetalert2";
import {
  Wrench, Phone, Calendar, CheckCircle, Clock, XCircle,
  AlertTriangle, RefreshCw, Package, ChevronDown, Ticket,
  TrendingUp, Loader2, Bell
} from "lucide-react";
import { FaUserTie, FaRecycle, FaFlask, FaTools } from "react-icons/fa";
import { MdInstallDesktop } from "react-icons/md";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";

const SERVICE_TYPES = [
  { value: "Re-Installation", label: "Re-Installation", icon: MdInstallDesktop, color: "purple" },
  { value: "Renew AMC", label: "Renew AMC", icon: FaRecycle, color: "blue" },
  { value: "Filter Change", label: "Filter Change", icon: FaTools, color: "orange" },
  { value: "Water Testing", label: "Water Testing", icon: FaFlask, color: "teal" },
  { value: "Others", label: "Others", icon: AlertTriangle, color: "slate" },
];

const COLOR_MAP = {
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", active: "bg-purple-600 border-purple-600 text-white shadow-purple-500/30" },
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200",   active: "bg-blue-600 border-blue-600 text-white shadow-blue-500/30" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", active: "bg-orange-600 border-orange-600 text-white shadow-orange-500/30" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-600",   border: "border-teal-200",   active: "bg-teal-600 border-teal-600 text-white shadow-teal-500/30" },
  slate:  { bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-200",  active: "bg-slate-700 border-slate-700 text-white shadow-slate-500/30" },
};

const STATUS_STYLE = {
  resolved:    "text-emerald-600 bg-emerald-50 border-emerald-200",
  "in progress": "text-blue-600 bg-blue-50 border-blue-200",
  cancelled:   "text-red-600 bg-red-50 border-red-200",
  open:        "text-amber-600 bg-amber-50 border-amber-200",
};

const StatusBadge = ({ status }) => {
  const key = status?.toLowerCase();
  const cls = STATUS_STYLE[key] || STATUS_STYLE.open;
  const icons = { resolved: <CheckCircle size={12} />, "in progress": <Wrench size={12} />, cancelled: <XCircle size={12} />, open: <Clock size={12} /> };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${cls}`}>
      {icons[key] || icons.open} {status}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${COLOR_MAP[color]?.bg} ${COLOR_MAP[color]?.text}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

const ServiceSupport = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("new");
  const [serviceType, setServiceType] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ phone: "", preferredDate: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newTicketIds, setNewTicketIds] = useState(new Set());

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setTicketsLoading(true);
    try {
      const { data } = await api.get("/service-requests");
      const incoming = data.requests || [];

      // Detect newly resolved tickets for notification
      setTickets(prev => {
        const prevMap = Object.fromEntries(prev.map(t => [t._id, t.status]));
        incoming.forEach(t => {
          if (prevMap[t._id] && prevMap[t._id] !== t.status && t.status?.toLowerCase() === "resolved") {
            setNewTicketIds(ids => new Set([...ids, t._id]));
            if (Notification.permission === "granted") {
              new Notification("Ticket Resolved ✅", { body: `Your ticket ${t.ticketId} has been resolved!` });
            }
          }
        });
        return incoming;
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("fetchTickets error", err);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get("/service-requests/complaint-items");
      setProducts(data.items || []);
    } catch (err) {
      console.error("fetchProducts error", err);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchProducts();
    if (user?.phone) setFormData(prev => ({ ...prev, phone: user.phone }));
    // Request browser notification permission
    if (Notification.permission === "default") Notification.requestPermission();
    // Live polling every 30s
    const interval = setInterval(() => fetchTickets(true), 30000);
    return () => clearInterval(interval);
  }, [user, fetchTickets, fetchProducts]);

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => ["open", "in progress"].includes(t.status?.toLowerCase())).length,
    resolved: tickets.filter(t => t.status?.toLowerCase() === "resolved").length,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceType) return Swal.fire({ icon: "warning", title: "Select Service Type", text: "Please select what service you need.", confirmButtonColor: "#4f46e5" });

    setLoading(true);
    try {
      const selectedProductObj = products.find(p => p.id === selectedProduct);
      await api.post("/service-requests", {
        type: serviceType,
        description: formData.message || `${serviceType} request`,
        date: new Date(),
        priority: "Medium",
        relatedItemType: selectedProductObj?.type || "General",
        relatedItemId: selectedProduct || null,
        relatedItemName: selectedProductObj?.name || null,
      });

      Swal.fire({
        icon: "success",
        title: "Request Submitted!",
        html: `<p style="color:#374151">Your <b>${serviceType}</b> request has been received.<br/>Our team will contact you at <b>${formData.phone}</b> shortly.</p>`,
        confirmButtonColor: "#4f46e5",
      });

      setServiceType("");
      setSelectedProduct("");
      setFormData(prev => ({ ...prev, message: "", preferredDate: "" }));
      fetchTickets();
      setActiveTab("track");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Please try again.", confirmButtonColor: "#ef4444" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Service & Support</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Hello <span className="text-slate-900 font-bold">{user?.firstName || "User"}</span>, how can we help you?
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {[
            { key: "new", label: "New Request" },
            { key: "track", label: `Track Tickets`, badge: stats.pending },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Raised" value={stats.total} icon={Ticket} color="blue" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="orange" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle} color="teal" />
      </div>

      {/* New Request Form */}
      {activeTab === "new" && (
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Service Type */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Select Service Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {SERVICE_TYPES.map(({ value, label, icon: Icon, color }) => {
                  const isActive = serviceType === value;
                  const c = COLOR_MAP[color];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setServiceType(value)}
                      className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-2 text-center
                        ${isActive ? `${c.active} shadow-lg transform scale-105` : `bg-white ${c.border} ${c.text} hover:${c.bg}`}`}
                    >
                      <Icon size={22} />
                      <span className="text-xs leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Your Product <span className="text-slate-400 normal-case font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Package className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                <select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 appearance-none"
                >
                  <option value="">-- Select a product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone + Date */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="tel" required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Preferred Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="date"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                    value={formData.preferredDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setFormData(p => ({ ...p, preferredDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Additional Details</label>
              <textarea
                rows={3}
                placeholder="Describe the issue or any special instructions..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 resize-none"
                value={formData.message}
                onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><Wrench size={18} /> Submit Service Request</>}
            </button>
          </form>
        </div>
      )}

      {/* Track Tickets */}
      {activeTab === "track" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
              Live Tracking
              {lastUpdated && <span className="normal-case font-normal text-slate-300">· Updated {format(lastUpdated, "hh:mm a")}</span>}
            </p>
            <button
              onClick={() => fetchTickets()}
              className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <RefreshCw size={14} className={ticketsLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {ticketsLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-300">
              <Loader2 size={36} className="animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200">
              <Ticket size={40} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No Tickets Yet</h3>
              <p className="text-slate-400 mt-1 text-sm">Raise a service request to get started.</p>
              <button onClick={() => setActiveTab("new")} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">
                Create New Request
              </button>
            </div>
          ) : (
            tickets.map(req => {
              const isNew = newTicketIds.has(req._id);
              return (
                <div
                  key={req._id}
                  className={`bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all ${isNew ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-100"}`}
                >
                  {isNew && (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mb-3 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                      <Bell size={12} /> Ticket Resolved!
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Wrench size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900">{req.type}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">#{req.ticketId}</p>
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  {req.relatedItemName && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-3 bg-slate-50 px-3 py-2 rounded-lg">
                      <Package size={13} /> {req.relatedItemName}
                    </div>
                  )}

                  {req.description && (
                    <p className="text-sm text-slate-600 bg-slate-50 px-4 py-3 rounded-xl mb-3 leading-relaxed">{req.description}</p>
                  )}

                  {req.assignedTechnician && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <FaUserTie size={12} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technician</p>
                        <p className="text-sm font-bold text-slate-900">{req.assignedTechnician}</p>
                      </div>
                    </div>
                  )}

                  {req.resolutionNotes && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Resolution Notes</p>
                      <p className="text-sm text-slate-600 italic">"{req.resolutionNotes}"</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(req.date), "MMM dd, yyyy")}</span>
                    {req.priority && <span className="flex items-center gap-1 text-orange-400"><TrendingUp size={12} /> {req.priority}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceSupport;
