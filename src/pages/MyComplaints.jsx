import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Swal from "sweetalert2";
import {
  AlertTriangle, CheckCircle, Clock, Wrench, XCircle,
  Package, Calendar, RefreshCw, Loader2, Bell,
  Ticket, TrendingUp, ChevronDown, BadgeCheck, Hourglass, TicketCheck
} from "lucide-react";
import { FaUserTie } from "react-icons/fa";
import { MdBugReport } from "react-icons/md";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";

const COMPLAINT_TYPES = [
  { value: "Product Issue",   label: "Product Issue",   icon: MdBugReport,    color: "red"    },
  { value: "Service Request", label: "Service Request", icon: Wrench,         color: "blue"   },
  { value: "Billing Issue",   label: "Billing Issue",   icon: TrendingUp,     color: "orange" },
  { value: "AMC Issue",       label: "AMC Issue",       icon: BadgeCheck,     color: "purple" },
  { value: "Other",           label: "Other",           icon: AlertTriangle,  color: "slate"  },
];

const PRIORITY_CONFIG = {
  Low:    { active: "bg-slate-700 border-slate-700 text-white shadow-slate-200",   idle: "border-slate-200 text-slate-500 hover:border-slate-400",   dot: "bg-slate-400"   },
  Medium: { active: "bg-amber-500 border-amber-500 text-white shadow-amber-200",   idle: "border-slate-200 text-slate-500 hover:border-amber-300",   dot: "bg-amber-400"   },
  High:   { active: "bg-red-600 border-red-600 text-white shadow-red-200",         idle: "border-slate-200 text-slate-500 hover:border-red-300",     dot: "bg-red-500"     },
};

const COLOR_MAP = {
  red:    { bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200",    active: "bg-red-600 border-red-600 text-white shadow-red-500/30"       },
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200",   active: "bg-blue-600 border-blue-600 text-white shadow-blue-500/30"     },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", active: "bg-orange-600 border-orange-600 text-white shadow-orange-500/30"},
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", active: "bg-purple-600 border-purple-600 text-white shadow-purple-500/30"},
  slate:  { bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-200",  active: "bg-slate-700 border-slate-700 text-white shadow-slate-500/30"  },
};

const STATUS_STEPS = ["Open", "In Progress", "Resolved"];

const STATUS_STYLE = {
  resolved:      "text-emerald-600 bg-emerald-50 border-emerald-200",
  "in progress": "text-blue-600 bg-blue-50 border-blue-200",
  cancelled:     "text-red-600 bg-red-50 border-red-200",
  open:          "text-amber-600 bg-amber-50 border-amber-200",
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

const TrackingBar = ({ status }) => {
  const cancelled = status?.toLowerCase() === "cancelled";
  const currentStep = cancelled ? -1 : STATUS_STEPS.findIndex(s => s.toLowerCase() === status?.toLowerCase());

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 mt-4 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
        <XCircle size={14} className="text-red-400 shrink-0" />
        <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Complaint Cancelled</span>
      </div>
    );
  }

  return (
    <div className="mt-4 px-1">
      <div className="flex items-start">
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= currentStep;
          const active = idx === currentStep;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all
                  ${done ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white border-slate-200 text-slate-300"}
                  ${active ? "ring-4 ring-indigo-100 scale-110" : ""}`}>
                  {done ? <CheckCircle size={13} /> : <span className="text-[9px] font-black">{idx + 1}</span>}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${done ? "text-indigo-600" : "text-slate-300"}`}>{step}</span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all ${idx < currentStep ? "bg-gradient-to-r from-indigo-600 to-indigo-400" : "bg-slate-100"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${COLOR_MAP[color]?.bg} ${COLOR_MAP[color]?.text}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

const MyComplaints = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab]     = useState("new");
  const [complaintType, setComplaintType] = useState("");
  const [priority, setPriority]       = useState("Medium");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [message, setMessage]         = useState("");
  const [products, setProducts]       = useState([]);
  const [complaints, setComplaints]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newResolvedIds, setNewResolvedIds] = useState(new Set());

  const fetchComplaints = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get("/complaints");
      const incoming = data.complaints || [];

      setComplaints(prev => {
        const prevMap = Object.fromEntries(prev.map(t => [t._id, t.status]));
        incoming.forEach(t => {
          const prevStatus = prevMap[t._id];
          if (prevStatus && prevStatus !== t.status) {
            if (t.status?.toLowerCase() === "resolved") {
              setNewResolvedIds(ids => new Set([...ids, t._id]));
              if (Notification.permission === "granted") {
                new Notification("Complaint Resolved ✅", { body: `Your complaint ${t.complaintId} has been resolved!` });
              }
            } else if (t.status?.toLowerCase() === "in progress") {
              setNewResolvedIds(ids => new Set([...ids, t._id]));
              if (Notification.permission === "granted") {
                new Notification("Technician On The Way 🔧", { body: `Your complaint ${t.complaintId} is now In Progress!` });
              }
            }
          }
        });
        return incoming;
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("fetchComplaints error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get("/complaints/items");
      setProducts(data.items || []);
    } catch (err) {
      console.error("fetchProducts error", err);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
    fetchProducts();
    if (Notification.permission === "default") Notification.requestPermission();
    const interval = setInterval(() => fetchComplaints(true), 30000);
    return () => clearInterval(interval);
  }, [fetchComplaints, fetchProducts]);

  const stats = {
    total:    complaints.length,
    pending:  complaints.filter(c => ["open", "in progress"].includes(c.status?.toLowerCase())).length,
    resolved: complaints.filter(c => c.status?.toLowerCase() === "resolved").length,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaintType) return Swal.fire({ icon: "warning", title: "Select Complaint Type", text: "Please select the type of complaint.", confirmButtonColor: "#4f46e5" });
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const selectedProductObj = products.find(p => p.id === selectedProduct);
      await api.post("/complaints", {
        type: complaintType,
        description: message,
        priority,
        relatedItemType: selectedProductObj?.type || "General",
        relatedItemId:   selectedProduct || null,
        relatedItemName: selectedProductObj?.name || null,
      });

      Swal.fire({
        icon: "success",
        title: "Complaint Submitted!",
        html: `<p style="color:#374151">Your <b>${complaintType}</b> complaint has been received.<br/>Our team will get back to you shortly.</p>`,
        confirmButtonColor: "#4f46e5",
        timer: 2500,
        showConfirmButton: false,
      });

      setComplaintType("");
      setPriority("Medium");
      setSelectedProduct("");
      setMessage("");
      fetchComplaints();
      setActiveTab("track");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Please try again.", confirmButtonColor: "#ef4444" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Complaints</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Hello <span className="text-slate-900 font-bold">{user?.firstName || "User"}</span>, raise & track your complaints here.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {[
            { key: "new",   label: "New Complaint" },
            { key: "track", label: "Track Tickets", badge: stats.pending },
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Raised"  value={stats.total}    icon={Ticket}      color="blue"   />
        <StatCard label="Pending"       value={stats.pending}  icon={Hourglass}   color="orange" />
        <StatCard label="Resolved"      value={stats.resolved} icon={CheckCircle} color="purple" />
      </div>

      {/* New Complaint Form */}
      {activeTab === "new" && (
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Complaint Type */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Select Complaint Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {COMPLAINT_TYPES.map(({ value, label, icon: Icon, color }) => {
                  const isActive = complaintType === value;
                  const c = COLOR_MAP[color];
                  return (
                    <button
                      key={value} type="button"
                      onClick={() => setComplaintType(value)}
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
                Related Product <span className="text-slate-400 normal-case font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Package className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                <select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 appearance-none"
                >
                  <option value="">-- Select a product / AMC --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Priority Level</label>
              <div className="flex gap-3">
                {Object.entries(PRIORITY_CONFIG).map(([p, cfg]) => (
                  <button
                    key={p} type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-3 rounded-2xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2
                      ${priority === p ? `${cfg.active} shadow-lg scale-[1.02]` : `bg-white ${cfg.idle}`}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span> {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Describe the Issue *</label>
              <textarea
                required rows={4}
                placeholder="Describe your complaint in detail..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 placeholder:text-slate-400 resize-none"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <p className="text-right text-[10px] text-slate-300 font-bold mt-1">{message.length} chars</p>
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
              {submitting ? <Loader2 size={20} className="animate-spin" /> : <><AlertTriangle size={18} /> Submit Complaint</>}
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
              onClick={() => fetchComplaints()}
              className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-300">
              <Loader2 size={36} className="animate-spin" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200">
              <TicketCheck size={40} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No Complaints Yet</h3>
              <p className="text-slate-400 mt-1 text-sm">Raise a complaint to get started.</p>
              <button onClick={() => setActiveTab("new")} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">
                Create New Complaint
              </button>
            </div>
          ) : (
            complaints.map(req => {
              const isNew = newResolvedIds.has(req._id);
              const pc = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.Low;
              return (
                <div
                  key={req._id}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
                    isNew && req.status?.toLowerCase() === 'resolved' ? "border-emerald-300 ring-2 ring-emerald-100" :
                    isNew && req.status?.toLowerCase() === 'in progress' ? "border-blue-300 ring-2 ring-blue-100" :
                    "border-slate-100"
                  }`}
                >
                  {/* top accent bar */}
                  <div className={`h-1 w-full ${
                    req.status?.toLowerCase() === "resolved"    ? "bg-gradient-to-r from-emerald-400 to-green-500" :
                    req.status?.toLowerCase() === "in progress" ? "bg-gradient-to-r from-indigo-400 to-blue-500"  :
                    req.status?.toLowerCase() === "cancelled"   ? "bg-gradient-to-r from-red-400 to-rose-500"     :
                    "bg-gradient-to-r from-amber-400 to-orange-400"
                  }`} />

                  <div className="p-6">
                    {isNew && req.status?.toLowerCase() === 'resolved' && (
                      <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mb-3 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                        <Bell size={12} /> Complaint Resolved!
                      </div>
                    )}
                    {isNew && req.status?.toLowerCase() === 'in progress' && (
                      <div className="flex items-center gap-2 text-blue-600 text-xs font-bold mb-3 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                        <Bell size={12} /> Technician is on the way!
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-slate-900">{req.type}</h3>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border flex items-center gap-1
                              ${req.priority === "High" ? "text-red-600 bg-red-50 border-red-200" : req.priority === "Medium" ? "text-amber-600 bg-amber-50 border-amber-200" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`}></span> {req.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">#{req.complaintId}</p>
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    {req.relatedItemName && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-3 bg-slate-50 px-3 py-2 rounded-lg">
                        <Package size={13} /> {req.relatedItemName}
                      </div>
                    )}

                    <TrackingBar status={req.status} />

                    {req.description && (
                      <p className="text-sm text-slate-600 bg-slate-50 px-4 py-3 rounded-xl mt-4 leading-relaxed">{req.description}</p>
                    )}

                    {req.assignedTechnician && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
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
                      <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(req.createdAt), "dd MMM yyyy")}</span>
                      {req.priority && (
                        <span className={`flex items-center gap-1 ${req.priority === "High" ? "text-red-400" : req.priority === "Medium" ? "text-amber-400" : "text-slate-400"}`}>
                          <TrendingUp size={12} /> {req.priority}
                        </span>
                      )}
                    </div>
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

export default MyComplaints;
